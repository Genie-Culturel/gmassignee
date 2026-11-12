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
