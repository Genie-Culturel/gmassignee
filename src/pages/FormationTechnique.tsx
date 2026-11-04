import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Search } from 'lucide-react';
import { useProcedureFiches } from '@/hooks/useProcedureFiches';
import { useVenueCatalog } from '@/hooks/useVenueCatalog';
import { FicheViewer } from '@/components/FicheViewer';
import { FicheValidationPanel } from '@/components/FicheValidationPanel';
import { TrainingAdmin } from '@/components/TrainingAdmin';
import { GameScopeSelect } from '@/components/GameScopeSelect';
import { FicheValidation, ProcedureFiche, FicheCategory } from '@/lib/database.types';
import { FICHE_CATEGORY_LABELS, FORMATION_PAGE_CATEGORIES } from '@/lib/constants';
import { groupFichesBySubGroup } from '@/lib/ficheSubGroups';
import { listMyValidations } from '@/lib/trainingRepository';
import { ficheStatus, progressFor, sortFichesByOrder, TRAINING_STATUS_LABELS } from '@/lib/training';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_GM_ID } from '@/lib/assignedSessions';
import { cn } from '@/lib/utils';
import {
  ALL_GAMES_VALUE,
  ficheScopeBadgeLabel,
  filterFichesForGame,
  readStoredGameId,
  writeStoredGameId,
} from '@/lib/venues';

const SHORT_CATEGORY_LABELS: Partial<Record<FicheCategory, string>> = {
  procedure_deroulement: 'Procédure',
  depannage_bugs: 'Dépannage',
};

function statusVariant(status: 'todo' | 'done' | 'revalidate') {
  if (status === 'done') return 'success' as const;
  if (status === 'revalidate') return 'warning' as const;
  return 'secondary' as const;
}

export function FormationTechnique() {
  const { user, isAdmin } = useAuth();
  const { fiches, isLoading, reload } = useProcedureFiches({ includeInactive: isAdmin });
  const { catalog, isLoading: catalogLoading } = useVenueCatalog();
  const gmId = user?.id || DEMO_GM_ID;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiche, setSelectedFiche] = useState<ProcedureFiche | null>(null);
  const [validations, setValidations] = useState<FicheValidation[]>([]);
  const [gameId, setGameId] = useState(ALL_GAMES_VALUE);

  useEffect(() => {
    const stored = readStoredGameId();
    if (stored === ALL_GAMES_VALUE || catalog.games.some((game) => game.id === stored)) {
      setGameId(stored);
    }
  }, [catalog]);

  const loadValidations = useCallback(() => {
    listMyValidations(gmId).then(setValidations).catch(() => setValidations([]));
  }, [gmId]);

  useEffect(() => {
    loadValidations();
  }, [loadValidations]);

  const categories: FicheCategory[] = FORMATION_PAGE_CATEGORIES;
  const scopedFiches = useMemo(
    () => filterFichesForGame(fiches, catalog, gameId),
    [fiches, catalog, gameId]
  );
  const global = progressFor(scopedFiches, validations);

  const onGameChange = (next: string) => {
    setGameId(next);
    writeStoredGameId(next);
  };

  const filteredFiches = scopedFiches.filter((fiche) => {
    if (!fiche.is_active || fiche.deleted_at) return false;
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return true;
    return (
      fiche.title.toLowerCase().includes(searchLower) ||
      fiche.summary?.toLowerCase().includes(searchLower) ||
      fiche.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading || catalogLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const openFiche = (fiche: ProcedureFiche) => setSelectedFiche(fiche);
  const validationFor = (fiche: ProcedureFiche) => validations.find((row) => row.fiche_id === fiche.id);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Formations & Procédures</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Progression globale{' '}
          <span
            className={cn(
              'font-semibold',
              global.total > 0 && global.done === global.total ? 'text-emerald-700' : 'text-red-600'
            )}
          >
            {global.done}/{global.total}
          </span>
          {global.revalidate > 0 ? ` · ${global.revalidate} à revalider` : ''}
        </p>
      </div>

      <GameScopeSelect catalog={catalog} value={gameId} onChange={onGameChange} />

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          {categories.map((cat) => {
            const stats = progressFor(scopedFiches, validations, cat);
            const complete = stats.total > 0 && stats.done === stats.total;
            const short = SHORT_CATEGORY_LABELS[cat];
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                aria-label={
                  stats.total > 0
                    ? `${FICHE_CATEGORY_LABELS[cat]} ${stats.done} sur ${stats.total}`
                    : FICHE_CATEGORY_LABELS[cat]
                }
                className="h-auto min-h-11 min-w-[calc(50%-0.25rem)] flex-1 flex-col gap-1 whitespace-normal px-1.5 py-2 text-[11px] leading-snug sm:min-w-0 sm:flex-row sm:text-sm"
              >
                <span>
                  {short ? (
                    <>
                      <span className="sm:hidden">{short}</span>
                      <span className="hidden sm:inline">{FICHE_CATEGORY_LABELS[cat]}</span>
                    </>
                  ) : (
                    FICHE_CATEGORY_LABELS[cat]
                  )}
                </span>
                {stats.total > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:text-xs',
                      complete ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    )}
                  >
                    {stats.done}/{stats.total}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
          {isAdmin && (
            <TabsTrigger
              value="admin"
              className="h-auto min-h-11 min-w-[calc(50%-0.25rem)] flex-1 whitespace-normal px-1.5 py-2 text-[11px] sm:min-w-0 sm:text-sm"
            >
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        {categories.map((category) => {
          const categoryFiches = sortFichesByOrder(
            filteredFiches.filter((fiche) => fiche.category === category)
          );
          return (
            <TabsContent key={category} value={category} className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher une fiche..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {categoryFiches.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {searchTerm
                      ? 'Aucune fiche ne correspond à votre recherche.'
                      : 'Aucune fiche dans cette catégorie.'}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {groupFichesBySubGroup(categoryFiches).map((group) => (
                    <section key={group.value ?? 'general'} className="space-y-2">
                      <h3 className="border-l-4 border-primary pl-2.5 text-base font-bold leading-tight text-foreground">
                        {group.label}
                      </h3>
                      <ul className="divide-y rounded-lg border bg-card">
                        {group.fiches.map((fiche) => {
                          const required = fiche.is_required !== false;
                          const status = ficheStatus(fiche, validationFor(fiche));
                          return (
                            <li key={fiche.id}>
                              <button
                                type="button"
                                onClick={() => openFiche(fiche)}
                                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/50"
                              >
                                <span className="min-w-0">
                                  <span className="block font-medium leading-snug">{fiche.title}</span>
                                  <span className="mt-1 inline-flex">
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                      {ficheScopeBadgeLabel(fiche, catalog)}
                                    </Badge>
                                  </span>
                                  {fiche.summary && (
                                    <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                                      {fiche.summary}
                                    </span>
                                  )}
                                  {required && status === 'revalidate' && (
                                    <span className="mt-0.5 block text-xs text-amber-700">
                                      Procédure mise à jour — à relire
                                    </span>
                                  )}
                                </span>
                                <span className="flex shrink-0 flex-col items-end gap-1">
                                  {required ? (
                                    <Badge variant={statusVariant(status)}>
                                      {TRAINING_STATUS_LABELS[status]}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Facultative</Badge>
                                  )}
                                  {fiche.is_placeholder && (
                                    <Badge variant="warning" className="text-[10px]">
                                      À compléter
                                    </Badge>
                                  )}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}

        {isAdmin && (
          <TabsContent value="admin" className="mt-4">
            <TrainingAdmin
              fiches={fiches}
              catalog={catalog}
              gmId={gmId}
              myValidations={validations}
              onFichesChanged={reload}
            />
          </TabsContent>
        )}
      </Tabs>

      <Sheet open={!!selectedFiche} onOpenChange={() => setSelectedFiche(null)}>
        <SheetContent
          side="right"
          className="w-full max-w-full bg-background sm:max-w-lg overflow-y-auto pb-0"
        >
          {selectedFiche && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedFiche.title}</SheetTitle>
                {selectedFiche.summary && (
                  <SheetDescription>{selectedFiche.summary}</SheetDescription>
                )}
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <FicheViewer fiche={selectedFiche} compact />
                {selectedFiche.is_required !== false && (
                  <FicheValidationPanel
                    fiche={selectedFiche}
                    gmId={gmId}
                    validation={validationFor(selectedFiche)}
                    onValidated={() => {
                      loadValidations();
                    }}
                  />
                )}
              </div>
              <div className="sticky bottom-0 -mx-6 mt-6 border-t bg-background/95 px-6 py-3 backdrop-blur">
                <SheetClose asChild>
                  <Button variant="outline" className="w-full">
                    Fermer
                  </Button>
                </SheetClose>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
