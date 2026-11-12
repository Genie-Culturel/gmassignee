// Test navigateur (Chromium headless, locale fr-CH) de l'écran Ventes, en mode démo.
// Lancer : npm run test:e2e   (CHROME_PATH=/chemin/vers/chrome si Chrome n'est pas trouvé)
// Aucun appel réseau vers Supabase : toutes les requêtes *.supabase.co sont bloquées.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

let server;
let browser;
let baseUrl;
const consoleErrors = [];

before(async () => {
  server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
  await server.listen();
  const address = server.httpServer.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

/** Ouvre une session démo, ajoute une ligne de vente et renvoie ses champs. */
async function openSalesLine(productLabel, { mobile = false } = {}) {
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport: { width: 420, height: 900 },
    ...(mobile ? { hasTouch: true, isMobile: true } : {}),
  });
  await context.route(/supabase\.co/, (route) => route.abort());
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  await page.goto(`${baseUrl}/?demo=1#/suivi-parties`);
  await page.getByRole('button', { name: 'Démarrer la session' }).first().click();
  const card = page.locator('div.rounded-lg', { has: page.getByText('Ventes & encaissement') }).last();
  await card.getByRole('button', { name: 'Ajouter' }).click();
  const product = card.locator('select[id^="product-"]').last();
  if (productLabel) await product.selectOption({ label: productLabel });
  return {
    page,
    context,
    card,
    price: card.locator('input[id^="price-"]').last(),
    qty: card.locator('input[id^="qty-"]').last(),
    offert: card.getByRole('button', { name: 'Offert' }).last(),
  };
}

/** Clique dans le champ (comme un doigt / une souris), tape touche par touche, relève chaque valeur. */
async function typeInto(page, input, text) {
  await input.click();
  const seen = [];
  for (const ch of text) {
    await page.keyboard.type(ch);
    seen.push(await input.inputValue());
  }
  return seen;
}

test('prix « Autre » : taper 34,4 → 34.40 (jamais 4.00, 344, 034,4)', async () => {
  const { page, context, price, card } = await openSalesLine('Autre - CHF 0.00');
  const seen = await typeInto(page, price, '34,4');
  await page.keyboard.press('Tab');
  const final = await price.inputValue();
  for (const v of seen) {
    assert.ok(!/^0\d/.test(v), `zéro devant pendant la saisie: ${JSON.stringify(seen)}`);
  }
  assert.equal(final, '34.40', `valeurs pendant la saisie: ${JSON.stringify(seen)}`);
  await assert.doesNotReject(card.getByText('CHF 34.40').first().waitFor({ timeout: 2000 }));
  await context.close();
});

test('prix Coca-Cola : remplacer par 3,5 → 3.50', async () => {
  const { page, context, price } = await openSalesLine('Coca-Cola - CHF 3.50');
  await typeInto(page, price, '3,5');
  await page.keyboard.press('Tab');
  assert.equal(await price.inputValue(), '3.50');
  await typeInto(page, price, '12,8');
  await page.keyboard.press('Tab');
  assert.equal(await price.inputValue(), '12.80');
  await context.close();
});

test('prix : taper 34.4 (point) → 34.40', async () => {
  const { page, context, price } = await openSalesLine('Autre - CHF 0.00');
  await typeInto(page, price, '34.4');
  await page.keyboard.press('Tab');
  assert.equal(await price.inputValue(), '34.40');
  await context.close();
});

test('prix : virgule sans événement clavier (coller / clavier mobile) 34,4 → 34.40', async () => {
  const { page, context, price } = await openSalesLine('Autre - CHF 0.00');
  await price.click();
  await page.keyboard.insertText('34,4');
  await page.keyboard.press('Tab');
  assert.equal(await price.inputValue(), '34.40');
  await context.close();
});

test('stepper : flèches ±0.10 (3.50 → 3.60 → 3.40)', async () => {
  const { page, context, price } = await openSalesLine('Coca-Cola - CHF 3.50');
  await price.click();
  await page.keyboard.press('ArrowUp');
  assert.equal(await price.inputValue(), '3.60');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  assert.equal(await price.inputValue(), '3.40');
  await page.keyboard.press('Tab');
  assert.equal(await price.inputValue(), '3.40');
  await context.close();
});

test('Offert : prix verrouillé à 0, 2e clic restaure le prix précédent', async () => {
  const { page, context, price, offert, card } = await openSalesLine('Autre - CHF 0.00');
  await typeInto(page, price, '12,5');
  await page.keyboard.press('Tab');
  assert.equal(await price.inputValue(), '12.50');
  await offert.click();
  assert.equal(await price.inputValue(), '0.00');
  assert.equal(await price.isDisabled(), true);
  await assert.doesNotReject(card.getByText('CHF 12.50').first().waitFor({ timeout: 2000 }));
  await offert.click();
  assert.equal(await price.isDisabled(), false);
  assert.equal(await price.inputValue(), '12.50');
  await context.close();
});

test('quantité : vider le champ puis taper 3 → 3 (pas 13)', async () => {
  const { page, context, qty, card } = await openSalesLine('Coca-Cola - CHF 3.50');
  assert.equal(await qty.inputValue(), '1');
  // Vider avec Backspace en fin de champ, puis taper 3.
  await qty.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Backspace');
  assert.equal(await qty.inputValue(), '', 'le champ doit pouvoir rester vide pendant la saisie');
  await page.keyboard.type('3');
  assert.equal(await qty.inputValue(), '3');
  await page.keyboard.press('Tab');
  assert.equal(await qty.inputValue(), '3');
  await assert.doesNotReject(card.getByText('CHF 10.50').first().waitFor({ timeout: 2000 }));
  // Remplacer 3 par 5 directement.
  await qty.click();
  await page.keyboard.type('5');
  await page.keyboard.press('Tab');
  assert.equal(await qty.inputValue(), '5');
  // Champ laissé vide → revient à 1 à la sortie.
  await qty.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Tab');
  assert.equal(await qty.inputValue(), '1');
  await context.close();
});

test('mobile (tap tactile) : prix 3,5 et quantité 1 → 3', async () => {
  const { page, context, price, qty, card } = await openSalesLine('Coca-Cola - CHF 3.50', { mobile: true });
  await price.tap();
  await page.keyboard.type('3,5');
  await qty.tap();
  assert.equal(await price.inputValue(), '3.50');
  await page.keyboard.type('3');
  assert.equal(await qty.inputValue(), '3');
  await price.tap();
  await page.keyboard.insertText('4,2');
  await qty.tap();
  assert.equal(await price.inputValue(), '4.20');
  await assert.doesNotReject(card.getByText('CHF 12.60').first().waitFor({ timeout: 2000 }));
  await context.close();
});

test('aucune erreur console (ex. setSelectionRange sur input number)', () => {
  const relevant = consoleErrors.filter((e) => /setSelectionRange|Uncaught|TypeError/.test(e));
  assert.deepEqual(relevant, []);
});
