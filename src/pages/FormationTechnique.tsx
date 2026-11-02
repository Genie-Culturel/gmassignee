import { useState } from 'react';
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
import { ProcedureFiche, FicheCategory } from '@/lib/database.types';
import { FICHE_CATEGORY_LABELS, FICHE_CATEGORY_ICONS, FORMATION_PAGE_CATEGORIES } from '@/lib/constants';

export function FormationTechnique() {
  const { fiches, isLoading } = useProcedureFiches();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiche, setSelectedFiche] = useState<ProcedureFiche | null>(null);

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

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Formations & Procédures</h1>
        <p className="text-muted-foreground mt-2">
          Bibliothèque de fiches procédurales pour le VR Center
        </p>
      </div>

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
                  {categoryFiches.map((fiche) => (
                    <Card
                      key={fiche.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedFiche(fiche)}
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
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Sheet open={!!selectedFiche} onOpenChange={() => setSelectedFiche(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedFiche && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedFiche.title}</SheetTitle>
                {selectedFiche.summary && (
                  <SheetDescription>{selectedFiche.summary}</SheetDescription>
                )}
              </SheetHeader>
              <div className="mt-6">
                <FicheViewer fiche={selectedFiche} compact />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
