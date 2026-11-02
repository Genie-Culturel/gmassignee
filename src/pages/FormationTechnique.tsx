import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, FileText } from 'lucide-react';
import { useProcedureFiches } from '@/hooks/useProcedureFiches';
import { FicheViewer } from '@/components/FicheViewer';
import { MaFormation } from '@/components/MaFormation';
import { FicheValidationPanel } from '@/components/FicheValidationPanel';
import { TrainingAdmin } from '@/components/TrainingAdmin';
import { FicheValidation, ProcedureFiche, FicheCategory } from '@/lib/database.types';
import { FICHE_CATEGORY_LABELS, FICHE_CATEGORY_ICONS, FORMATION_PAGE_CATEGORIES } from '@/lib/constants';
import { listMyValidations } from '@/lib/trainingRepository';
import { ficheStatus, TRAINING_STATUS_LABELS } from '@/lib/training';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_GM_ID } from '@/lib/assignedSessions';

export function FormationTechnique() {
  const { user, isAdmin } = useAuth();
  const { fiches, isLoading, reload } = useProcedureFiches({ includeInactive: isAdmin });
  const gmId = user?.id || DEMO_GM_ID;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiche, setSelectedFiche] = useState<ProcedureFiche | null>(null);
  const [validations, setValidations] = useState<FicheValidation[]>([]);

  const loadValidations = useCallback(() => {
    listMyValidations(gmId).then(setValidations).catch(() => setValidations([]));
  }, [gmId]);

  useEffect(() => {
    loadValidations();
  }, [loadValidations]);

  const categories: FicheCategory[] = FORMATION_PAGE_CATEGORIES;

  const filteredFiches = fiches.filter((fiche) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fiche.title.toLowerCase().includes(searchLower) ||
      fiche.summary?.toLowerCase().includes(searchLower) ||
      fiche.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const getFichesByCategory = (category: FicheCategory) => {
    return filteredFiches.filter((f) => f.category === category);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const openFiche = (fiche: ProcedureFiche) => setSelectedFiche(fiche);
  const validationFor = (fiche: ProcedureFiche) => validations.find((row) => row.fiche_id === fiche.id);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Formations & Procédures</h1>
        <p className="text-muted-foreground mt-2">
          Valide tes modules, puis consulte la bibliothèque des fiches.
        </p>
      </div>

      <Tabs defaultValue="ma-formation" className="w-full">
        <TabsList className={`grid w-full h-auto ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="ma-formation" className="text-xs sm:text-sm whitespace-normal py-2">
            Ma formation
          </TabsTrigger>
          <TabsTrigger value="bibliotheque" className="text-xs sm:text-sm whitespace-normal py-2">
            Bibliothèque
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="text-xs sm:text-sm whitespace-normal py-2">
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ma-formation" className="mt-6">
          <MaFormation fiches={fiches} validations={validations} onOpenFiche={openFiche} />
        </TabsContent>

        <TabsContent value="bibliotheque" className="mt-6 space-y-6">
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

          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm whitespace-normal py-2">
                  <span className="mr-1 sm:mr-2">{FICHE_CATEGORY_ICONS[cat]}</span>
                  <span>{FICHE_CATEGORY_LABELS[cat]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => {
              const categoryFiches = getFichesByCategory(category);
              return (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span>{FICHE_CATEGORY_ICONS[category]}</span>
                      {FICHE_CATEGORY_LABELS[category]}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryFiches.length} fiche{categoryFiches.length > 1 ? 's' : ''}
                    </p>
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
                    <div className="grid gap-4 md:grid-cols-2">
                      {categoryFiches.map((fiche) => {
                        const status = ficheStatus(fiche, validationFor(fiche));
                        return (
                          <Card
                            key={fiche.id}
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => openFiche(fiche)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base leading-snug">
                                  {fiche.title}
                                </CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              </div>
                              {fiche.summary && (
                                <CardDescription className="text-xs">
                                  {fiche.summary}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-1">
                                <Badge
                                  variant={
                                    status === 'done'
                                      ? 'success'
                                      : status === 'revalidate'
                                        ? 'warning'
                                        : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {TRAINING_STATUS_LABELS[status]}
                                </Badge>
                                {fiche.is_placeholder && (
                                  <Badge variant="warning" className="text-xs">
                                    🚧 À compléter
                                  </Badge>
                                )}
                                {fiche.tags?.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {fiche.content_steps.length} étape
                                {fiche.content_steps.length > 1 ? 's' : ''}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <TrainingAdmin
              fiches={fiches}
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
          className="w-full max-w-full bg-background sm:max-w-lg overflow-y-auto"
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
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
