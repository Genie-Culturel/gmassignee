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
  gameOnlyShortcutScope,
  gamePlusVrCenterShortcutScope,
  nettoyageGame,
  nettoyageShortcutScope,
  toggleId,
  vrCenterLocationId,
} from '@/lib/ficheScope';
import { isVrCircuitGame } from '@/lib/competenceFilter';
import { VenueCatalog, gamesGroupedByLocation } from '@/lib/venues';
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
  const vrId = vrCenterLocationId(catalog);
  const nettoyage = nettoyageGame(catalog);
  const dominantId = dominantGameId(catalog, filterGameId, gameIds);
  const dominant = dominantId ? catalog.games.find((game) => game.id === dominantId) : undefined;
  const circuitPreset = circuitShortcutScope(catalog);
  const nettoyagePreset = nettoyageShortcutScope(catalog);
  const everyone = locationIds.length === 0 && gameIds.length === 0;
  const circuitActive =
    Boolean(vrId) && arraysEqualAsSets(locationIds, circuitPreset.locationIds) && gameIds.length === 0;
  const gameOnlyActive =
    Boolean(dominantId) && arraysEqualAsSets(gameIds, dominantId ? [dominantId] : []) && locationIds.length === 0;
  const gamePlusVrPreset = dominantId ? gamePlusVrCenterShortcutScope(catalog, dominantId) : null;
  const gamePlusVrActive =
    Boolean(dominant && isVrCircuitGame(dominant, catalog) && gamePlusVrPreset) &&
    arraysEqualAsSets(locationIds, gamePlusVrPreset!.locationIds) &&
    arraysEqualAsSets(gameIds, gamePlusVrPreset!.gameIds);
  const nettoyageActive =
    Boolean(nettoyage) &&
    arraysEqualAsSets(gameIds, nettoyagePreset.gameIds) &&
    locationIds.length === 0;

  const setScope = (next: { locationIds: string[]; gameIds: string[] }) => onChange(next);

  return (
    <div className="space-y-3 rounded-md border p-3" data-testid="fiche-scope-editor">
      <div>
        <p className="text-sm font-medium">Qui voit cette fiche ?</p>
        <p className="text-xs text-muted-foreground">
          Lieux et jeux se cochent ensemble. Un jeu coché limite aux GM de ce jeu (le lieu VR Center
          est un tag, il n’ouvre pas le circuit aux autres). Un lieu seul ouvre le parcours / circuit.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={circuitActive ? 'default' : 'outline'}
          className="h-8 text-xs"
          disabled={!vrId}
          onClick={() => setScope(circuitPreset)}
        >
          Circuit VR Center
        </Button>
        {dominant && (
          <Button
            type="button"
            size="sm"
            variant={gameOnlyActive ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setScope(gameOnlyShortcutScope(dominant.id))}
          >
            Ce jeu seulement
            <span className="ml-1 font-normal opacity-80">({dominant.name})</span>
          </Button>
        )}
        {dominant && isVrCircuitGame(dominant, catalog) && gamePlusVrPreset && (
          <Button
            type="button"
            size="sm"
            variant={gamePlusVrActive ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setScope(gamePlusVrPreset)}
          >
            Ce jeu + VR Center
          </Button>
        )}
        {nettoyage && (
          <Button
            type="button"
            size="sm"
            variant={nettoyageActive ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setScope(nettoyagePreset)}
          >
            Nettoyage
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
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lieux</p>
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
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Jeux</p>
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
