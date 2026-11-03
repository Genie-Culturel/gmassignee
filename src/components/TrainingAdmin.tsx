import { useEffect, useState } from 'react';
import { FicheCategory, FicheValidation, ProcedureFiche, QuizQuestionAdmin } from '@/lib/database.types';
import { FORMATION_PAGE_CATEGORIES, FICHE_CATEGORY_LABELS } from '@/lib/constants';
import {
  deleteFiche,
  deleteQuizQuestion,
  demoTrackingRows,
  listAdminValidations,
  listGmProfiles,
  listQuizQuestionsAdmin,
  saveFiche,
  saveQuizQuestion,
  clearSkipVersionBump,
  buildTrackingRows,
  GmTrainingRow,
} from '@/lib/trainingRepository';
import { isMockMode } from '@/lib/supabase';
import { GameScopeSelect } from '@/components/GameScopeSelect';
import { FicheOrderList } from '@/components/FicheOrderList';
import { ParcoursAdmin } from '@/components/ParcoursAdmin';
import {
  ALL_GAMES_VALUE,
  FicheScopeKind,
  VenueCatalog,
  defaultScopeForNewFiche,
  filterFichesForGame,
  gamesGroupedByLocation,
} from '@/lib/venues';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TrainingAdminProps {
  fiches: ProcedureFiche[];
  catalog: VenueCatalog;
  gmId: string;
  myValidations: FicheValidation[];
  onFichesChanged: () => void;
}

export function TrainingAdmin({ fiches, catalog, gmId, myValidations, onFichesChanged }: TrainingAdminProps) {
  const [filterGameId, setFilterGameId] = useState(ALL_GAMES_VALUE);
  const visible = filterFichesForGame(fiches, catalog, filterGameId);
  return (
    <div className="space-y-4">
      <GameScopeSelect
        id="admin-game-filter"
        label="Filtrer par jeu"
        catalog={catalog}
        value={filterGameId}
        onChange={setFilterGameId}
      />
      <Tabs defaultValue="fiches" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fiches" className="px-1 text-xs sm:text-sm">Éditer les fiches</TabsTrigger>
          <TabsTrigger value="parcours" className="px-1 text-xs sm:text-sm">Parcours</TabsTrigger>
          <TabsTrigger value="suivi" className="px-1 text-xs sm:text-sm">Suivi des GM</TabsTrigger>
        </TabsList>
        <TabsContent value="parcours" className="mt-4">
          <ParcoursAdmin catalog={catalog} filterGameId={filterGameId} />
        </TabsContent>
        <TabsContent value="suivi" className="mt-4">
          <AdminTracking fiches={visible} gmId={gmId} myValidations={myValidations} />
        </TabsContent>
        <TabsContent value="fiches" className="mt-4">
          <AdminFicheEditor
            fiches={visible}
            catalog={catalog}
            filterGameId={filterGameId}
            onFichesChanged={onFichesChanged}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminTracking({
  fiches,
  gmId,
  myValidations,
}: {
  fiches: ProcedureFiche[];
  gmId: string;
  myValidations: FicheValidation[];
}) {
  const [rows, setRows] = useState<GmTrainingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isMockMode) {
          if (!cancelled) setRows(demoTrackingRows(gmId, fiches, myValidations));
          return;
        }
        const [profiles, validations] = await Promise.all([listGmProfiles(), listAdminValidations()]);
        if (!cancelled) setRows(buildTrackingRows(profiles, fiches, validations));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Suivi indisponible');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fiches, gmId, myValidations]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Suivi des validations</CardTitle>
        <CardDescription>Progression de chaque GM sur les fiches requises</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-6 sm:pt-0">
        <div className="space-y-3 sm:hidden">
          {rows.map((row) => (
            <div key={row.gm_id} className="rounded-lg border p-3">
              <p className="font-medium">{row.display_name}</p>
              <p className="text-xs text-muted-foreground">{row.email}</p>
              <p className="mt-2 text-lg font-semibold">
                {row.done}/{row.total}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">Manquantes</p>
              <p className="text-sm leading-snug">
                {row.missing.length ? row.missing.slice(0, 3).join(', ') : '—'}
                {row.missing.length > 3 ? ` +${row.missing.length - 3}` : ''}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">À revalider</p>
              <p className="text-sm leading-snug">
                {row.revalidate.length ? row.revalidate.join(', ') : '—'}
              </p>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">GM</th>
                <th className="px-3 py-2 font-medium">Progression</th>
                <th className="px-3 py-2 font-medium">Manquantes</th>
                <th className="px-3 py-2 font-medium">À revalider</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.gm_id} className="border-b align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.display_name}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    {row.done}/{row.total}
                  </td>
                  <td className="px-3 py-2">
                    {row.missing.length ? (
                      <ul className="space-y-0.5 text-xs">
                        {row.missing.slice(0, 4).map((title) => (
                          <li key={title}>{title}</li>
                        ))}
                        {row.missing.length > 4 && <li>+{row.missing.length - 4}</li>}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.revalidate.length ? (
                      <ul className="space-y-0.5 text-xs">
                        {row.revalidate.map((title) => (
                          <li key={title}>{title}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminFicheEditor({
  fiches,
  catalog,
  filterGameId,
  onFichesChanged,
}: {
  fiches: ProcedureFiche[];
  catalog: VenueCatalog;
  filterGameId: string;
  onFichesChanged: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(fiches[0]?.id || '');
  const selected = fiches.find((fiche) => fiche.id === selectedId) || null;
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<FicheCategory>('formation_technique');
  const [stepsText, setStepsText] = useState('');
  const [required, setRequired] = useState(true);
  const [active, setActive] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [minor, setMinor] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionAdmin[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scopeKind, setScopeKind] = useState<FicheScopeKind>('locations');
  const [scopeLocationIds, setScopeLocationIds] = useState<string[]>([]);
  const [scopeGameIds, setScopeGameIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedId(fiches[0]?.id || '');
    // Reset only when the admin game filter changes; keep the current fiche after save/create.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGameId]);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setSummary(selected.summary || '');
    setCategory(selected.category);
    setStepsText(selected.content_steps.map((step) => step.text).join('\n'));
    setRequired(selected.is_required !== false);
    setActive(selected.is_active);
    setPlaceholder(Boolean(selected.is_placeholder));
    setMinor(false);
    setMessage(null);
    setError(null);
    setConfirmDelete(false);
    setScopeKind(selected.scope_kind || 'all');
    setScopeLocationIds(selected.scope_location_ids || []);
    setScopeGameIds(selected.scope_game_ids || []);
    listQuizQuestionsAdmin(selected.id).then(setQuestions).catch(() => setQuestions([]));
  }, [selected]);

  const save = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const steps = stepsText
        .split('\n')
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text, index) => ({ order: index + 1, text }));
      const cleanedQuestions = questions.map((question) => {
        const choices = question.choices.filter((choice) => choice.text.trim());
        return {
          ...question,
          prompt: question.prompt.trim(),
          choices,
          correct_choice_ids: question.correct_choice_ids.filter((id) =>
            choices.some((choice) => choice.id === id)
          ),
        };
      });
      if (cleanedQuestions.some((q) => !q.prompt || q.choices.length < 2 || q.correct_choice_ids.length < 1)) {
        throw new Error('Chaque question doit avoir un intitulé, au moins 2 réponses et une bonne réponse.');
      }
      if (scopeKind === 'locations' && scopeLocationIds.length === 0) {
        throw new Error('Choisis au moins un lieu, ou passe la portée à « Tous les lieux ».');
      }
      if (scopeKind === 'games' && scopeGameIds.length === 0) {
        throw new Error('Choisis au moins un jeu, ou passe la portée à « Tous les lieux ».');
      }
      await saveFiche({
        fiche: {
          ...selected,
          title,
          summary,
          category,
          content_steps: steps,
          is_required: required,
          is_active: active,
          is_placeholder: placeholder,
        },
        minorCorrection: minor,
        scope: { kind: scopeKind, locationIds: scopeLocationIds, gameIds: scopeGameIds },
      });
      for (const question of cleanedQuestions) {
        await saveQuizQuestion({ ...question, fiche_id: selected.id }, { skipBump: minor });
      }
      if (minor) await clearSkipVersionBump(selected.id);
      setMessage(minor ? 'Enregistré sans revalidation.' : 'Enregistré — version incrémentée si le contenu a changé.');
      onFichesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const removeFiche = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const nextId = fiches.find((fiche) => fiche.id !== selected.id)?.id || '';
      await deleteFiche(selected.id);
      setConfirmDelete(false);
      setSelectedId(nextId);
      onFichesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible');
    } finally {
      setBusy(false);
    }
  };

  const addQuestion = () => {
    if (!selected) return;
    setQuestions((rows) => [
      ...rows,
      {
        id: `new-${Date.now()}`,
        fiche_id: selected.id,
        prompt: '',
        choices: [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
        ],
        correct_choice_ids: ['a'],
        order_index: rows.length + 1,
        is_example: false,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <FicheOrderList
        fiches={fiches}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onReordered={onFichesChanged}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          disabled={!isMockMode && catalog.locations.length === 0}
          onClick={async () => {
            const created = await saveFiche({
              fiche: {
                title: 'Nouvelle fiche',
                category: 'formation_technique',
                summary: '',
                content_steps: [{ order: 1, text: 'À compléter' }],
                is_required: true,
                is_active: true,
                is_placeholder: false,
                tags: [],
              },
              minorCorrection: true,
              scope: (() => {
                const next = defaultScopeForNewFiche(catalog, filterGameId);
                return {
                  kind: next.scope_kind,
                  locationIds: next.scope_location_ids,
                  gameIds: next.scope_game_ids,
                };
              })(),
            });
            await clearSkipVersionBump(created.id);
            onFichesChanged();
            setSelectedId(created.id);
          }}
        >
          Nouvelle fiche
        </Button>
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Éditer la fiche</CardTitle>
            <CardDescription>
              Version actuelle : {selected.version ?? 1}. Décoche « correction mineure » pour forcer une
              revalidation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fiche-title">Titre</Label>
              <Input id="fiche-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiche-cat">Catégorie</Label>
              <select
                id="fiche-cat"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as FicheCategory)}
              >
                {FORMATION_PAGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {FICHE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiche-summary">Résumé</Label>
              <Textarea id="fiche-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiche-steps">Étapes (une par ligne)</Label>
              <Textarea id="fiche-steps" rows={6} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Portée</p>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={scopeKind}
                onChange={(e) => setScopeKind(e.target.value as FicheScopeKind)}
              >
                <option value="all">Tous les lieux</option>
                <option value="locations">Un ou plusieurs lieux</option>
                <option value="games">Un ou plusieurs jeux</option>
              </select>
              {scopeKind === 'locations' && (
                <div className="space-y-2">
                  {catalog.locations.map((location) => (
                    <label key={location.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={scopeLocationIds.includes(location.id)}
                        onCheckedChange={(v) => {
                          setScopeLocationIds((ids) =>
                            v === true ? [...ids, location.id] : ids.filter((id) => id !== location.id)
                          );
                        }}
                      />
                      {location.name}
                    </label>
                  ))}
                </div>
              )}
              {scopeKind === 'games' && (
                <div className="space-y-3">
                  {gamesGroupedByLocation(catalog).map((group) => (
                    <div key={group.location.id} className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">{group.location.name}</p>
                      {group.games.map((game) => (
                        <label key={game.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={scopeGameIds.includes(game.id)}
                            onCheckedChange={(v) => {
                              setScopeGameIds((ids) =>
                                v === true ? [...ids, game.id] : ids.filter((id) => id !== game.id)
                              );
                            }}
                          />
                          {game.name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={required} onCheckedChange={(v) => setRequired(v === true)} />
              Fiche requise (le GM doit la valider)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={placeholder} onCheckedChange={(v) => setPlaceholder(v === true)} />
              Fiche à compléter (affiche un avertissement aux GM)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={minor} onCheckedChange={(v) => setMinor(v === true)} />
              Correction mineure (ne pas demander de revalidation)
            </label>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Questions (QCM)</h3>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                  Ajouter une question
                </Button>
              </div>
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2 rounded-lg border p-3">
                  <Input
                    value={question.prompt}
                    placeholder="Intitulé"
                    onChange={(e) => {
                      const next = [...questions];
                      next[index] = { ...question, prompt: e.target.value };
                      setQuestions(next);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Coche une ou plusieurs bonnes réponses (2 à 8 choix).
                  </p>
                  {question.choices.map((choice, cidx) => (
                    <div key={choice.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={question.correct_choice_ids.includes(choice.id)}
                        onCheckedChange={(v) => {
                          const next = [...questions];
                          const ids = new Set(question.correct_choice_ids);
                          if (v === true) ids.add(choice.id);
                          else ids.delete(choice.id);
                          next[index] = { ...question, correct_choice_ids: [...ids] };
                          setQuestions(next);
                        }}
                      />
                      <Input
                        value={choice.text}
                        placeholder={`Réponse ${cidx + 1}`}
                        onChange={(e) => {
                          const next = [...questions];
                          const choices = question.choices.map((item, i) =>
                            i === cidx ? { ...item, text: e.target.value } : item
                          );
                          next[index] = { ...question, choices };
                          setQuestions(next);
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        disabled={question.choices.length <= 2}
                        aria-label="Supprimer la réponse"
                        onClick={() => {
                          const next = [...questions];
                          const choices = question.choices.filter((_, i) => i !== cidx);
                          next[index] = {
                            ...question,
                            choices,
                            correct_choice_ids: question.correct_choice_ids.filter((id) => id !== choice.id),
                          };
                          setQuestions(next);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={question.choices.length >= 8}
                    onClick={() => {
                      const next = [...questions];
                      const used = new Set(question.choices.map((item) => item.id));
                      const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                      const id = alphabet.find((letter) => !used.has(letter)) || `r${Date.now()}`;
                      next[index] = {
                        ...question,
                        choices: [...question.choices, { id, text: '' }],
                      };
                      setQuestions(next);
                    }}
                  >
                    + Ajouter une réponse
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!question.id.startsWith('new-')) await deleteQuizQuestion(question.id);
                      setQuestions(questions.filter((q) => q.id !== question.id));
                    }}
                  >
                    Supprimer la question
                  </Button>
                </div>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" disabled={busy} onClick={save}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Supprimer la fiche
            </Button>
            <p className="text-xs text-muted-foreground">
              La suppression est définitive pour les GM. La case « Active » sert seulement à masquer
              temporairement.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-[calc(100%-2rem)] bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la fiche</DialogTitle>
            <DialogDescription>
              Supprimer définitivement « {selected?.title} » ? Elle disparaîtra pour tous les GM.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void removeFiche()}>
              {busy ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
