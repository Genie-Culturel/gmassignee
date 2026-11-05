import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProcedureFiche } from '@/lib/database.types';
import {
  arraysEqualAsSets,
  circuitShortcutScope,
  describeFicheVisibility,
  dominantGameId,
  everyoneShortcutScope,
  ficheScopeBadgeItems,
  toggleId,
} from '@/lib/ficheScope';
import { circuitIdForGame } from '@/lib/competenceFilter';
import { VenueCatalog, findGame, gamesGroupedByLocation } from '@/lib/venues';
import { cn } from '@/lib/utils';

export function FicheScopeEditor({
  catalog,
  locationIds,
  gameIds,
  filterGameId,
  onChange,
}: {
  catalog: VenueCatalog;
  locationIds: string[];
  gameIds: string[];
  filterGameId?: string;
  onChange: (next: { locationIds: string[]; gameIds: string[] }) => void;
}) {
  const dominantId = dominantGameId(catalog, filterGameId, gameIds);
  const dominant = dominantId ? findGame(catalog, dominantId) : undefined;
  const dominantCircuitId = dominant ? circuitIdForGame(dominant, catalog) : undefined;
  const circuitPreset = circuitShortcutScope(catalog, dominantCircuitId);
  const everyone = locationIds.length === 0 && gameIds.length === 0;
  const circuitActive =
    circuitPreset.locationIds.length > 0 &&
    arraysEqualAsSets(locationIds, circuitPreset.locationIds) &&
    gameIds.length === 0;

  const setScope = (next: { locationIds: string[]; gameIds: string[] }) => onChange(next);
  const circuitLabel =
    (dominantCircuitId && catalog.locations.find((location) => location.id === dominantCircuitId)?.short_name) ||
    'Ce circuit';

  return (
    <div className="space-y-3 rounded-md border p-3" data-testid="fiche-scope-editor">
      <div>
        <p className="text-sm font-medium">Qui voit cette fiche ?</p>
        <p className="text-xs text-muted-foreground">
          Une compétence RH sur un jeu ouvre tout le circuit (lieu) de ce jeu, plus les fiches « Tout
          le monde ». Taguer un jeu ou son lieu revient au même pour la visibilité.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {circuitPreset.locationIds.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant={circuitActive ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setScope(circuitPreset)}
          >
            Circuit {circuitLabel}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant={everyone ? 'default' : 'outline'}
          className="h-8 text-xs"
          onClick={() => setScope(everyoneShortcutScope())}
        >
          Tout le monde
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Circuits</p>
        <div className="flex flex-wrap gap-1.5">
          {catalog.locations.map((location) => (
            <ScopeChip
              key={location.id}
              label={location.short_name || location.name}
              checked={locationIds.includes(location.id)}
              onToggle={(on) =>
                setScope({ locationIds: toggleId(locationIds, location.id, on), gameIds })
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Jeux (libellé — le circuit entier reste ouvert)
        </p>
        {gamesGroupedByLocation(catalog).map((group) => (
          <div key={group.location.id} className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">{group.location.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.games.map((game) => (
                <ScopeChip
                  key={game.id}
                  label={game.name}
                  checked={gameIds.includes(game.id)}
                  onToggle={(on) =>
                    setScope({ locationIds, gameIds: toggleId(gameIds, game.id, on) })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground" data-testid="scope-preview">
        {describeFicheVisibility(catalog, locationIds, gameIds)}
      </p>
    </div>
  );
}

function ScopeChip({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onToggle(!checked)}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  );
}

export function FicheScopeBadges({
  fiche,
  catalog,
  className,
}: {
  fiche: ProcedureFiche;
  catalog: VenueCatalog;
  className?: string;
}) {
  const items = ficheScopeBadgeItems(fiche, catalog);
  return (
    <span className={cn('flex min-w-0 flex-wrap gap-1', className)}>
      {items.map((item) => (
        <Badge key={item.key} variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
          {item.label}
        </Badge>
      ))}
    </span>
  );
}
