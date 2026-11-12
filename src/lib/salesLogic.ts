import type { SalesProduct } from './database.types';
import type { SaleItem } from './sessionRepository';

/** Libellés des groupes de la liste « Produit » (ordre = ordre d'apparition dans le catalogue). */
export const SALES_CATEGORY_LABELS: Record<string, string> = {
  boisson: 'Boissons',
  alcool: 'Alcool',
  snack: 'Snacks',
  option: 'Options',
  autre: 'Autre',
};

export interface SalesProductGroup {
  category: string;
  label: string;
  products: SalesProduct[];
}

/** Regroupe les produits par catégorie en gardant l'ordre du catalogue (order_index). */
export function groupSalesProducts(products: SalesProduct[]): SalesProductGroup[] {
  const groups: SalesProductGroup[] = [];
  const byCategory = new Map<string, SalesProductGroup>();
  for (const product of products) {
    const category = product.category || 'autre';
    let group = byCategory.get(category);
    if (!group) {
      group = { category, label: SALES_CATEGORY_LABELS[category] || category, products: [] };
      byCategory.set(category, group);
      groups.push(group);
    }
    group.products.push(product);
  }
  return groups;
}

/** Montant réellement facturé d'une ligne (0 si offerte). */
export function saleLineTotal(item: Pick<SaleItem, 'quantity' | 'unitPrice' | 'isOffered'>): number {
  if (item.isOffered) return 0;
  return item.quantity * item.unitPrice;
}

/** Totaux : encaissé sur place / à facturer. Les lignes offertes ne comptent dans aucun des deux. */
export function computeSalesTotals(items: SaleItem[]) {
  return items.reduce(
    (acc, item) => {
      const line = saleLineTotal(item);
      if (item.isOffered) {
        acc.offeredQuantity += item.quantity;
        acc.offeredValue += item.quantity * (item.catalogUnitPrice ?? 0);
      } else if (item.paymentMethod === 'facture') {
        acc.toInvoice += line;
      } else {
        acc.collected += line;
      }
      return acc;
    },
    { collected: 0, toInvoice: 0, offeredQuantity: 0, offeredValue: 0 }
  );
}

/** Bascule « Offert » : prix à 0 (prix catalogue gardé en référence) ou retour au prix catalogue. */
export function toggleSaleOffered(item: SaleItem, products: SalesProduct[]): SaleItem {
  const product = products.find((p) => p.name === item.productName);
  if (item.isOffered) {
    const restored = item.catalogUnitPrice ?? (product ? Number(product.unit_price) : item.unitPrice);
    return { ...item, isOffered: false, unitPrice: restored, catalogUnitPrice: restored };
  }
  const reference = item.unitPrice > 0 ? item.unitPrice : product ? Number(product.unit_price) : 0;
  return { ...item, isOffered: true, unitPrice: 0, catalogUnitPrice: reference };
}

/** Pas du stepper prix unitaire (flèches ↑↓ du clavier). */
export const UNIT_PRICE_STEP = 0.1;

/** Brouillons autorisés pendant la saisie (vide, virgule ou point, décimale en cours). */
const PRICE_DRAFT_RE = /^\d*([.,]\d*)?$/;

export function normalizePriceInput(raw: string): string {
  return raw.trim().replace(/\s/g, '').replace(',', '.');
}

/** True tant que le texte est un brouillon de prix acceptable (pas encore forcément un nombre). */
export function isAllowedPriceDraft(raw: string): boolean {
  return PRICE_DRAFT_RE.test(raw.trim());
}

/**
 * Parse un brouillon complet. Retourne null si la saisie est incomplète
 * (vide, séparateur seul, point/virgule final) — ne pas forcer 0 pendant l'édition.
 */
export function parseUnitPriceInput(raw: string): number | null {
  const s = normalizePriceInput(raw);
  if (s === '' || s === '.' || s.endsWith('.')) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** Arrondit au centime, jamais négatif. */
export function clampUnitPrice(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Valide le prix à la sortie du champ (blur) ou au stepper.
 * Vide / invalide → 0. « 34. » → 34. « 3,5 » / « 34,4 » acceptés.
 */
export function commitUnitPrice(raw: string): number {
  const s = normalizePriceInput(raw);
  if (s === '' || s === '.') return 0;
  const n = Number(s.endsWith('.') ? s.slice(0, -1) : s);
  return clampUnitPrice(n);
}

/** Affichage hors édition : toujours 2 décimales (CHF 3.50). */
export function formatUnitPrice(value: number): string {
  return clampUnitPrice(value).toFixed(2);
}

/** Incrémente / décrémente par pas de 0.10, plancher à 0. */
export function stepUnitPrice(current: number, direction: 1 | -1, step = UNIT_PRICE_STEP): number {
  const cents = Math.round(clampUnitPrice(current) * 100);
  const delta = Math.round(step * 100) * direction;
  return clampUnitPrice((cents + delta) / 100);
}


/**
 * Nettoie un brouillon de prix tapé dans le champ texte (virgule ou point acceptés tels quels).
 * Retourne null si la frappe doit être refusée (lettres, 2 séparateurs…).
 * Supprime les zéros de tête (« 034,4 » → « 34,4 », « 00,5 » → « 0,5 »).
 */
export function sanitizePriceDraft(raw: string): string | null {
  const s = raw.replace(/\s/g, '');
  if (!isAllowedPriceDraft(s)) return null;
  return s.replace(/^0+(?=\d)/, '');
}

/** Brouillon quantité : chiffres seulement, vide autorisé pendant la saisie, pas de zéro de tête. */
export function sanitizeQuantityDraft(raw: string): string | null {
  const s = raw.replace(/\s/g, '');
  if (!/^\d*$/.test(s)) return null;
  return s.replace(/^0+(?=\d)/, '');
}

/** Quantité en cours de saisie : nombre ≥ 1, ou null si vide / 0 (ne pas forcer 1 pendant l'édition). */
export function parseQuantityDraft(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  return n >= 1 ? n : null;
}

/** Quantité validée à la sortie du champ : vide / 0 / invalide → 1. */
export function commitQuantity(raw: string): number {
  return parseQuantityDraft(raw) ?? 1;
}

/** Flèches clavier sur la quantité : ±1, plancher 1. */
export function stepQuantity(current: number, direction: 1 | -1): number {
  const base = Number.isFinite(current) && current >= 1 ? Math.floor(current) : 1;
  return Math.max(1, base + direction);
}

/** Origine du catalogue affiché dans Ventes. */
export type SalesCatalogStatus = 'live' | 'demo' | 'fallback';

export interface SalesCatalog {
  products: SalesProduct[];
  /** live = liste officielle chargée ; demo = mode démo voulu ; fallback = échec du chargement live. */
  status: SalesCatalogStatus;
  /** Raison de l'échec (fallback seulement). */
  error?: string;
}

/**
 * Décide quel catalogue montrer. En mode live, une erreur ou une liste vide n'est JAMAIS
 * présentée comme un succès : status « fallback » → avertissement visible pour le GM.
 */
export function resolveSalesCatalog(
  input: { mockMode: boolean; data?: SalesProduct[] | null; error?: { message?: string } | string | null },
  demoProducts: SalesProduct[]
): SalesCatalog {
  if (input.mockMode) return { products: demoProducts, status: 'demo' };
  if (input.error) {
    const message = typeof input.error === 'string' ? input.error : input.error.message || 'erreur inconnue';
    return { products: demoProducts, status: 'fallback', error: message };
  }
  if (!input.data?.length) {
    return { products: demoProducts, status: 'fallback', error: 'aucun produit actif reçu' };
  }
  return { products: input.data, status: 'live' };
}
