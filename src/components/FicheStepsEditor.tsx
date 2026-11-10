import { useRef, useState, useMemo } from 'react';
import { FicheStep } from '@/lib/database.types';
import { displayFicheImageSrc, uploadFicheImage } from '@/lib/ficheImages';
import { useFicheImageUrls } from '@/hooks/useFicheImageUrls';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';

interface Props {
  ficheId: string;
  steps: FicheStep[];
  onChange: (steps: FicheStep[]) => void;
  disabled?: boolean;
}

/** One textarea per point (line breaks kept) + optional images per point. */
export function FicheStepsEditor({ ficheId, steps, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<number, HTMLInputElement | null>>({});
  const allPaths = useMemo(() => steps.flatMap((s) => s.images || []), [steps]);
  const imageUrls = useFicheImageUrls(allPaths);

  const update = (index: number, patch: Partial<FicheStep>) =>
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  };
  const remove = (index: number) =>
    onChange(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  const add = () => onChange([...steps, { order: steps.length + 1, text: '' }]);

  const upload = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(index);
    try {
      const keys: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        keys.push(await uploadFicheImage(ficheId, file));
      }
      const current = steps[index]?.images ?? [];
      update(index, { images: [...current, ...keys] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi de l'image impossible");
    } finally {
      setUploading(null);
      const input = inputs.current[index];
      if (input) input.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="rounded-md border p-2 space-y-2">
          <div className="flex items-start gap-2">
            <div className="mt-2 flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
            <Textarea
              rows={2}
              value={step.text}
              disabled={disabled}
              onChange={(e) => update(index, { text: e.target.value })}
              className="flex-1"
            />
          </div>
          {step.images && step.images.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-8">
              {step.images.map((path, i) => {
                const url = displayFicheImageSrc(path, imageUrls);
                return (
                  <div key={path + i} className="relative">
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="h-20 w-auto max-w-[140px] rounded border object-cover"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    ) : (
                      <div className="h-20 w-24 rounded border bg-muted" />
                    )}
                    <button
                      type="button"
                      aria-label="Retirer l'image"
                      disabled={disabled}
                      onClick={() => update(index, { images: step.images!.filter((_, j) => j !== i) })}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-1 pl-8">
            <input
              ref={(el) => (inputs.current[index] = el)}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => upload(index, e.target.files)}
            />
            <Button type="button" size="sm" variant="outline" disabled={disabled || uploading !== null}
              onClick={() => inputs.current[index]?.click()}>
              {uploading === index ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-1" />}
              Photo / capture
            </Button>
            <Button type="button" size="icon" variant="ghost" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label="Monter">
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" disabled={disabled || index === steps.length - 1} onClick={() => move(index, 1)} aria-label="Descendre">
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" disabled={disabled} onClick={() => remove(index)} aria-label="Supprimer le point">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={add} disabled={disabled}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter un point
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Images optionnelles : sur mobile, « Photo / capture » propose l'appareil photo ou la galerie. Les photos sont réduites automatiquement. Pense à enregistrer la fiche.
      </p>
    </div>
  );
}
