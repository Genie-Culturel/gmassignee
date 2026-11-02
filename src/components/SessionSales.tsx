import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Banknote } from 'lucide-react';
import { PaymentMethod, SalesProduct } from '@/lib/database.types';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: PaymentMethod;
}

interface SessionSalesProps {
  products: SalesProduct[];
  groupName?: string;
  playerCount?: number;
  game?: string;
  onSalesChange?: (items: SaleItem[], comment: string) => void;
}

export function SessionSales({ products, groupName, playerCount, game, onSalesChange }: SessionSalesProps) {
  const [salesItems, setSalesItems] = useState<SaleItem[]>([]);
  const [salesComment, setSalesComment] = useState('');

  const addSaleItem = () => {
    const defaultProduct = products.find(p => p.name === 'Autre') || products[0];
    if (!defaultProduct) return;

    const newItem: SaleItem = {
      id: `sale-${Date.now()}`,
      productName: defaultProduct.name,
      quantity: 1,
      unitPrice: defaultProduct.unit_price,
      paymentMethod: 'twint',
    };
    
    const updated = [...salesItems, newItem];
    setSalesItems(updated);
    onSalesChange?.(updated, salesComment);
  };

  const updateSaleItem = (id: string, field: keyof SaleItem, value: any) => {
    const updated = salesItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setSalesItems(updated);
    onSalesChange?.(updated, salesComment);
  };

  const removeSaleItem = (id: string) => {
    const updated = salesItems.filter(item => item.id !== id);
    setSalesItems(updated);
    onSalesChange?.(updated, salesComment);
  };

  const handleProductChange = (id: string, productName: string) => {
    const product = products.find(p => p.name === productName);
    if (!product) return;

    const updated = salesItems.map(item =>
      item.id === id 
        ? { ...item, productName: product.name, unitPrice: product.unit_price }
        : item
    );
    setSalesItems(updated);
    onSalesChange?.(updated, salesComment);
  };

  const updateComment = (comment: string) => {
    setSalesComment(comment);
    onSalesChange?.(salesItems, comment);
  };

  // Calculate totals
  const totals = salesItems.reduce(
    (acc, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      if (item.paymentMethod === 'facture') {
        acc.toInvoice += lineTotal;
      } else {
        acc.collected += lineTotal;
      }
      return acc;
    },
    { collected: 0, toInvoice: 0 }
  );

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
                    {products.map((product) => (
                      <option key={product.id} value={product.name}>
                        {product.name} - CHF {product.unit_price.toFixed(2)}
                        {product.min_quantity && ` (min ${product.min_quantity})`}
                      </option>
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
                    <input
                      id={`price-${item.id}`}
                      type="number"
                      step="0.50"
                      min="0"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateSaleItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                    />
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
                      CHF {(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
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
