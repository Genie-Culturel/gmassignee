import { useState, type KeyboardEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Banknote, Gift } from 'lucide-react';
import { PaymentMethod, SalesProduct } from '@/lib/database.types';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { SaleItem } from '@/lib/sessionRepository';
import { computeSalesTotals, groupSalesProducts, saleLineTotal, toggleSaleOffered, UNIT_PRICE_STEP, isAllowedPriceDraft, commitUnitPrice, formatUnitPrice, stepUnitPrice, insertPriceDecimalSeparator } from '@/lib/salesLogic';

export type { SaleItem };

interface SessionSalesProps {
  products: SalesProduct[];
  groupName?: string;
  playerCount?: number;
  game?: string;
  initialItems?: SaleItem[];
  initialComment?: string;
  onSalesChange?: (items: SaleItem[], comment: string) => void;
}

export function SessionSales({
  products,
  groupName,
  playerCount,
  game,
  initialItems = [],
  initialComment = '',
  onSalesChange,
}: SessionSalesProps) {
  const [salesItems, setSalesItems] = useState<SaleItem[]>(initialItems);
  const [salesComment, setSalesComment] = useState(initialComment);
  // Brouillon texte par ligne, seulement pendant que le prix est focus (virgule, « 34. », vide…).
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const addSaleItem = () => {
    const defaultProduct = products.find(p => p.name === 'Autre') || products[0];
    if (!defaultProduct) return;

    const newItem: SaleItem = {
      id: `sale-${Date.now()}`,
      productName: defaultProduct.name,
      quantity: 1,
      unitPrice: Number(defaultProduct.unit_price),
      paymentMethod: 'twint',
      isOffered: false,
      catalogUnitPrice: Number(defaultProduct.unit_price),
    };
    
    const updated = [...salesItems, newItem];
    setSalesItems(updated);
    onSalesChange?.(updated, salesComment);
  };

  const updateSaleItem = (id: string, field: keyof SaleItem, value: SaleItem[keyof SaleItem]) => {
    const updated = salesItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setSalesItems(updated);
    onSalesChange?.(updated, salesComment);
  };

  const removeSaleItem = (id: string) => {
    const updated = salesItems.filter(item => item.id !== id);
    setSalesItems(updated);
    setPriceDrafts((drafts) => {
      if (!(id in drafts)) return drafts;
      const { [id]: _, ...rest } = drafts;
      return rest;
    });
    onSalesChange?.(updated, salesComment);
  };

  const handleProductChange = (id: string, productName: string) => {
    const product = products.find(p => p.name === productName);
    if (!product) return;

    const price = Number(product.unit_price);
    const updated = salesItems.map(item =>
      item.id === id
        ? {
            ...item,
            productName: product.name,
            productId: product.id,
            // Offert : reste à 0, seul le prix de référence change.
            unitPrice: item.isOffered ? 0 : price,
            catalogUnitPrice: price,
          }
        : item
    );
    setSalesItems(updated);
    setPriceDrafts((drafts) => {
      if (!(id in drafts)) return drafts;
      const { [id]: _, ...rest } = drafts;
      return rest;
    });
    onSalesChange?.(updated, salesComment);
  };

  const toggleOffered = (id: string) => {
    const updated = salesItems.map(item =>
      item.id === id ? toggleSaleOffered(item, products) : item
    );
    setSalesItems(updated);
    setPriceDrafts((drafts) => {
      if (!(id in drafts)) return drafts;
      const { [id]: _, ...rest } = drafts;
      return rest;
    });
    onSalesChange?.(updated, salesComment);
  };

  const clearPriceDraft = (id: string) => {
    setPriceDrafts((drafts) => {
      if (!(id in drafts)) return drafts;
      const { [id]: _, ...rest } = drafts;
      return rest;
    });
  };

  const priceInputValue = (item: SaleItem) => {
    if (item.isOffered) return formatUnitPrice(0);
    if (item.id in priceDrafts) return priceDrafts[item.id];
    return formatUnitPrice(item.unitPrice);
  };

  const handlePriceFocus = (item: SaleItem, el: HTMLInputElement) => {
    if (item.isOffered) return;
    setPriceDrafts((drafts) =>
      item.id in drafts ? drafts : { ...drafts, [item.id]: formatUnitPrice(item.unitPrice) }
    );
    // Sélectionner tout : on peut retaper 34,4 par-dessus 0.00 sans rester coincé avec un 0 devant.
    el.select();
  };

  const handlePriceChange = (item: SaleItem, raw: string, inputType?: string) => {
    if (item.isOffered) return;
    if (!isAllowedPriceDraft(raw)) return;
    setPriceDrafts((drafts) => ({ ...drafts, [item.id]: raw }));
    // Stepper natif : pas de inputType de saisie → on valide tout de suite.
    const typingTypes = new Set([
      'insertText',
      'insertCompositionText',
      'insertFromPaste',
      'insertFromDrop',
      'insertReplacementText',
      'deleteContentBackward',
      'deleteContentForward',
      'deleteByCut',
      'deleteByDrag',
      'deleteContent',
      'deleteWordBackward',
      'deleteWordForward',
    ]);
    if (!inputType || !typingTypes.has(inputType)) {
      updateSaleItem(item.id, 'unitPrice', commitUnitPrice(raw));
    }
  };

  const handlePriceBlur = (item: SaleItem) => {
    if (item.isOffered) {
      clearPriceDraft(item.id);
      return;
    }
    const raw = item.id in priceDrafts ? priceDrafts[item.id] : formatUnitPrice(item.unitPrice);
    updateSaleItem(item.id, 'unitPrice', commitUnitPrice(raw));
    clearPriceDraft(item.id);
  };

  const handlePriceKeyDown = (item: SaleItem, e: KeyboardEvent<HTMLInputElement>) => {
    if (item.isOffered) return;
    const el = e.currentTarget;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const base = item.id in priceDrafts ? commitUnitPrice(priceDrafts[item.id]) : item.unitPrice;
      const next = stepUnitPrice(base, e.key === 'ArrowUp' ? 1 : -1);
      const formatted = formatUnitPrice(next);
      setPriceDrafts((drafts) => ({ ...drafts, [item.id]: formatted }));
      updateSaleItem(item.id, 'unitPrice', next);
      return;
    }
    if (e.key === ',') {
      e.preventDefault();
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const next = insertPriceDecimalSeparator(el.value, start, end);
      if (next == null) return;
      setPriceDrafts((drafts) => ({ ...drafts, [item.id]: next }));
      requestAnimationFrame(() => {
        const caret = start + 1;
        el.setSelectionRange(caret, caret);
      });
    }
  };

  const productGroups = groupSalesProducts(products);

  const updateComment = (comment: string) => {
    setSalesComment(comment);
    onSalesChange?.(salesItems, comment);
  };

  // Calculate totals (les lignes offertes ne comptent ni dans encaissé ni dans à facturer)
  const totals = computeSalesTotals(salesItems);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Ventes & encaissement
            </CardTitle>
            <CardDescription>
              Enregistre les ventes et paiements pour ce groupe
              {(groupName || playerCount || game) && (
                <span className="block mt-1">
                  {[game, groupName, playerCount != null ? `${playerCount} joueur${playerCount > 1 ? 's' : ''}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
            </CardDescription>
          </div>
          <Button onClick={addSaleItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {salesItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune vente enregistrée. Clique sur "Ajouter" pour commencer.
          </p>
        ) : (
          <div className="space-y-3">
            {salesItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 space-y-3 bg-muted/30"
              >
                {/* Product selection */}
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor={`product-${item.id}`} className="text-xs">
                    Produit
                  </Label>
                  <select
                    id={`product-${item.id}`}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={item.productName}
                    onChange={(e) => handleProductChange(item.id, e.target.value)}
                  >
                    {!products.some((p) => p.name === item.productName) && (
                      <option value={item.productName}>{item.productName}</option>
                    )}
                    {productGroups.map((group) => (
                      <optgroup key={group.category} label={group.label}>
                        {group.products.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name} - CHF {Number(product.unit_price).toFixed(2)}
                            {product.min_quantity ? ` (min ${product.min_quantity})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`qty-${item.id}`} className="text-xs">
                      Quantité
                    </Label>
                    <input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={item.quantity}
                      onChange={(e) =>
                        updateSaleItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${item.id}`} className="text-xs">
                      Prix unit. CHF
                    </Label>
                    <div className="flex gap-1">
                      <input
                        id={`price-${item.id}`}
                        type="number"
                        inputMode="decimal"
                        step={UNIT_PRICE_STEP}
                        min="0"
                        disabled={item.isOffered}
                        className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-60"
                        value={priceInputValue(item)}
                        onFocus={(e) => handlePriceFocus(item, e.currentTarget)}
                        onChange={(e) =>
                          handlePriceChange(item, e.target.value, (e.nativeEvent as InputEvent).inputType)
                        }
                        onBlur={() => handlePriceBlur(item)}
                        onKeyDown={(e) => handlePriceKeyDown(item, e)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant={item.isOffered ? 'default' : 'outline'}
                        aria-pressed={!!item.isOffered}
                        onClick={() => toggleOffered(item.id)}
                        className="h-9 shrink-0 px-2"
                        title={item.isOffered ? 'Annuler « Offert » (remet le prix catalogue)' : 'Offrir : prix à CHF 0, quantité gardée'}
                      >
                        <Gift className="h-4 w-4 sm:mr-1" />
                        <span className="text-xs">Offert</span>
                      </Button>
                    </div>
                    {item.isOffered && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Offert
                        {item.catalogUnitPrice ? (
                          <>
                            {' · '}
                            <span className="line-through">CHF {Number(item.catalogUnitPrice).toFixed(2)}</span>
                          </>
                        ) : null}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor={`payment-${item.id}`} className="text-xs">
                    Mode de paiement
                  </Label>
                  <select
                    id={`payment-${item.id}`}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={item.paymentMethod}
                    onChange={(e) =>
                      updateSaleItem(item.id, 'paymentMethod', e.target.value as PaymentMethod)
                    }
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {item.paymentMethod === 'facture' && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Demander au responsable du groupe
                    </p>
                  )}
                </div>

                {/* Line total and remove button */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total ligne : </span>
                    <span className="font-semibold">
                      CHF {saleLineTotal(item).toFixed(2)}
                    </span>
                    {item.isOffered && (
                      <Badge variant="secondary" className="ml-2">
                        Offert
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSaleItem(item.id)}
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals summary */}
        {salesItems.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Encaissé sur place :</span>
              <Badge variant="success" className="text-base">
                CHF {totals.collected.toFixed(2)}
              </Badge>
            </div>
            {totals.toInvoice > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">À facturer :</span>
                <Badge variant="secondary" className="text-base">
                  CHF {totals.toInvoice.toFixed(2)}
                </Badge>
              </div>
            )}
            {totals.offeredQuantity > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Offert ({totals.offeredQuantity} article{totals.offeredQuantity > 1 ? 's' : ''}) :</span>
                <span>valeur CHF {totals.offeredValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-semibold">Total général :</span>
              <span className="text-lg font-bold">
                CHF {(totals.collected + totals.toInvoice).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="sales-comment" className="text-xs">
            Commentaire (optionnel)
          </Label>
          <Textarea
            id="sales-comment"
            placeholder="Notes sur les ventes ou paiements..."
            value={salesComment}
            onChange={(e) => updateComment(e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
