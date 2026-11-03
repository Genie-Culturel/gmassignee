import { Label } from '@/components/ui/label';
import {
  ALL_GAMES_VALUE,
  VenueCatalog,
  gamesGroupedByLocation,
  selectedGameLabel,
} from '@/lib/venues';

export function GameScopeSelect({
  catalog,
  value,
  onChange,
  id = 'game-scope',
  label = 'Jeu',
}: {
  catalog: VenueCatalog;
  value: string;
  onChange: (gameId: string) => void;
  id?: string;
  label?: string;
}) {
  const groups = gamesGroupedByLocation(catalog);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={ALL_GAMES_VALUE}>Tous</option>
        {groups.map((group) => (
          <optgroup key={group.location.id} label={group.location.name}>
            {group.games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-sm text-muted-foreground">{selectedGameLabel(catalog, value)}</p>
    </div>
  );
}
