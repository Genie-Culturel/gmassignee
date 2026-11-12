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

/** Pas du stepper prix unitaire (flèches du navigateur). */
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

/** Insère un point décimal à la place de la sélection (virgule frappée → point). */
export function insertPriceDecimalSeparator(raw: string, start: number, end: number): string | null {
  const next = `${raw.slice(0, start)}.${raw.slice(end)}`;
  return isAllowedPriceDraft(next) ? next : null;
}
