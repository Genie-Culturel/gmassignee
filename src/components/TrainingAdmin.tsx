import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FicheStep, FicheCategory, FicheValidation, ProcedureFiche, QuizQuestionAdmin } from '@/lib/database.types';
import { FORMATION_PAGE_CATEGORIES, FICHE_CATEGORY_LABELS } from '@/lib/constants';
import {
  FORMATION_EDITOR_TAB,
  FormationEditorQuery,
  FormationEditorSection,
  applyFormationEditorQuery,
  parseFormationEditorQuery,
} from '@/lib/formationNav';
import { assertQuizzesBelongToFiche, quizzesBelongingToFiche } from '@/lib/training';
import {
  deleteFiche,
  deleteQuizQuestion,
  demoTrackingRows,
  listAdminValidations,
  listGmProfiles,
  listGmAuthorizedGameIds,
  listQuizQuestionsAdmin,
  saveFiche,
  saveQuizQuestion,
  clearSkipVersionBump,
  buildTrackingRows,
  GmTrainingRow,
} from '@/lib/trainingRepository';
import { isMockMode } from '@/lib/supabase';
import { FicheStepsEditor } from '@/components/FicheStepsEditor';
import { GameScopeSelect } from '@/components/GameScopeSelect';
import { FicheOrderList } from '@/components/FicheOrderList';
import { FICHE_SUB_GROUPS, ficheSubGroup, ficheSubGroupLabel } from '@/lib/ficheSubGroups';
import { ParcoursAdmin } from '@/components/ParcoursAdmin';
import { FicheScopeEditor } from '@/components/FicheScopeEditor';
import { deriveScopeKind } from '@/lib/ficheScope';
import {
  ALL_GAMES_VALUE,
  VenueCatalog,
  defaultScopeForNewFiche,
  filterFichesForGame,
} from '@/lib/venues';
import { GmOptionsAdmin } from '@/components/GmOptionsAdmin';
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
  const location = useLocation();
  const navigate = useNavigate();
  const query = parseFormationEditorQuery(location.search);
  const section: FormationEditorSection = query.editor ?? 'fiches';
  const [filterGameId, setFilterGameId] = useState(ALL_GAMES_VALUE);
  const visible = filterFichesForGame(fiches, catalog, filterGameId);
  const [selectedId, setSelectedId] = useState(query.fiche || '');

  const writeQuery = (patch: Partial<FormationEditorQuery>, replace = true) => {
    const search = applyFormationEditorQuery(location.search, {
      tab: FORMATION_EDITOR_TAB,
      ...patch,
    });
    navigate({ pathname: location.pathname, search }, { replace });
  };

  useEffect(() => {
    if (query.fiche) setSelectedId(query.fiche);
  }, [query.fiche]);

  useEffect(() => {
    if (query.fiche) return;
    setSelectedId(visible[0]?.id || '');
    // Keep the current fiche after save/create; reset only when the game filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterGameId]);

  const editorFiches = useMemo(() => {
    if (selectedId && !visible.some((fiche) => fiche.id === selectedId)) {
      const extra = fiches.find((fiche) => fiche.id === selectedId);
      if (extra) return [extra, ...visible];
    }
    return visible;
  }, [fiches, visible, selectedId]);

  const selectFiche = (id: string) => {
    setSelectedId(id);
    writeQuery({
      editor: 'fiches',
      fiche: id || null,
    });
  };

  const openFicheFromParcours = (ficheId: string, stepId: string) => {
    setSelectedId(ficheId);
    writeQuery(
      { editor: 'fiches', fiche: ficheId, retour: 'parcours', step: stepId },
      false
    );
  };

  const retourParcours = () => {
    writeQuery({ editor: 'parcours', fiche: null, retour: null, step: query.step });
  };

  const onSectionChange = (next: string) => {
    if (next === 'parcours') {
      writeQuery({ editor: 'parcours', fiche: null, retour: null });
      return;
    }
    if (next === 'suivi') {
      writeQuery({ editor: 'suivi', fiche: null, retour: null, step: null });
      return;
    }
    writeQuery({
      editor: 'fiches',
      fiche: selectedId || null,
      retour: null,
      step: null,
    });
  };

  return (
    <div className="space-y-4">
      <GmOptionsAdmin />
      <GameScopeSelect
        id="admin-game-filter"
        label="Filtrer par jeu"
        catalog={catalog}
        value={filterGameId}
        onChange={setFilterGameId}
      />
      <Tabs value={section} onValueChange={onSectionChange} className="w-full">
        <TabsList className="grid h-12 w-full grid-cols-3">
          <TabsTrigger value="parcours" className="px-2 text-base font-semibold">Parcours</TabsTrigger>
          <TabsTrigger value="fiches" className="px-2 text-base font-semibold">Éditer les fiches</TabsTrigger>
          <TabsTrigger value="suivi" className="px-2 text-base font-semibold">Suivi des GM</TabsTrigger>
        </TabsList>
        <TabsContent
          value="parcours"
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
          <ParcoursAdmin
            catalog={catalog}
            fiches={fiches}
            filterGameId={filterGameId}
            onOpenFiche={openFicheFromParcours}
            focusStepId={section === 'parcours' ? query.step : null}
          />
        </TabsContent>
        <TabsContent value="suivi" className="mt-4">
          <AdminTracking fiches={visible} catalog={catalog} gmId={gmId} myValidations={myValidations} />
        </TabsContent>
        <TabsContent value="fiches" className="mt-4">
          <AdminFicheEditor
            fiches={editorFiches}
            orderFiches={fiches}
            catalog={catalog}
            filterGameId={filterGameId}
            selectedId={selectedId}
            onSelect={selectFiche}
            onFichesChanged={onFichesChanged}
            showRetourParcours={query.retour === 'parcours'}
            onRetourParcours={retourParcours}
            scrollToEditor={query.retour === 'parcours'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminTracking({
  fiches,
  catalog,
  gmId,
  myValidations,
}: {
  fiches: ProcedureFiche[];
  catalog: VenueCatalog;
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
        const authorizedGameIdsByGm = await listGmAuthorizedGameIds(profiles.map((profile) => profile.gm_id));
        if (!cancelled) {
          setRows(buildTrackingRows(profiles, fiches, validations, { catalog, authorizedGameIdsByGm }));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Suivi indisponible');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fiches, catalog, gmId, myValidations]);

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
        <CardDescription>
          Progression de chaque GM sur les fiches requises de ses circuits RH (même filtre que sa vue
          Formations). 0 compétence → 0/0.
        </CardDescription>
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
                {row.no_competences
                  ? 'Aucune compétence'
                  : row.missing.length
                    ? `${row.missing.slice(0, 3).join(', ')}${row.missing.length > 3 ? ` +${row.missing.length - 3}` : ''}`
                    : '—'}
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
                    {row.no_competences ? (
                      <span className="text-xs text-muted-foreground">Aucune compétence</span>
                    ) : row.missing.length ? (
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
  orderFiches,
  catalog,
  filterGameId,
  selectedId,
  onSelect,
  onFichesChanged,
  showRetourParcours,
  onRetourParcours,
  scrollToEditor,
}: {
  fiches: ProcedureFiche[];
  /** Unfiltered list for drag-and-drop so a game filter cannot scramble group indexes. */
  orderFiches: ProcedureFiche[];
  catalog: VenueCatalog;
  filterGameId: string;
  selectedId: string;
  onSelect: (id: string) => void;
  onFichesChanged: () => void;
  showRetourParcours?: boolean;
  onRetourParcours?: () => void;
  scrollToEditor?: boolean;
}) {
  const selected = fiches.find((fiche) => fiche.id === selectedId) || null;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const editorRef = useRef<HTMLDivElement>(null);
  const skipInitialScrollRef = useRef(!scrollToEditor);
  const scrollEditorIntoView = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<FicheCategory>('formation_technique');
  const [subGroup, setSubGroup] = useState<string>('');
  const [steps, setSteps] = useState<FicheStep[]>([]);
  const [required, setRequired] = useState(true);
  const [active, setActive] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [minor, setMinor] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionAdmin[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [questionsFicheId, setQuestionsFicheId] = useState(selectedId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scopeLocationIds, setScopeLocationIds] = useState<string[]>([]);
  const [scopeGameIds, setScopeGameIds] = useState<string[]>([]);

  // Reset quizzes during render (not in useEffect) so the previous fiche never paints.
  const quizzesStale = questionsFicheId !== selectedId;
  if (quizzesStale) {
    setQuestionsFicheId(selectedId);
    setQuestions([]);
    setQuizzesLoading(Boolean(selectedId));
  }
  const shownQuestions = quizzesStale ? [] : quizzesBelongingToFiche(questions, selectedId);
  const showQuizLoading = quizzesLoading || quizzesStale;

  useEffect(() => {
    if (!selectedId) return;
    if (skipInitialScrollRef.current) {
      skipInitialScrollRef.current = false;
      return;
    }
    const run = () => scrollEditorIntoView();
    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      run();
      timeout = window.setTimeout(run, 0);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setSummary(selected.summary || '');
    setCategory(selected.category);
    setSubGroup(ficheSubGroup(selected) ?? '');
    setSteps(selected.content_steps.map((step) => ({ ...step, images: step.images ? [...step.images] : undefined })));
    setRequired(selected.is_required !== false);
    setActive(selected.is_active);
    setPlaceholder(Boolean(selected.is_placeholder));
    setMinor(false);
    setMessage(null);
    setError(null);
    setConfirmDelete(false);
    setScopeLocationIds(selected.scope_location_ids || []);
    setScopeGameIds(selected.scope_game_ids || []);
  }, [selected]);

  useEffect(() => {
    if (!selectedId) {
      setQuestions([]);
      setQuizzesLoading(false);
      return;
    }
    const ficheId = selectedId;
    setQuestions([]);
    setQuizzesLoading(true);
    let cancelled = false;
    listQuizQuestionsAdmin(ficheId)
      .then((rows) => {
        if (cancelled || selectedIdRef.current !== ficheId) return;
        setQuestions(quizzesBelongingToFiche(rows, ficheId));
      })
      .catch(() => {
        if (cancelled || selectedIdRef.current !== ficheId) return;
        setQuestions([]);
      })
      .finally(() => {
        if (!cancelled && selectedIdRef.current === ficheId) setQuizzesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const save = async () => {
    const ficheId = selected?.id;
    if (!ficheId || quizzesLoading || quizzesStale) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const cleanedSteps: FicheStep[] = steps
        .map((step) => ({ ...step, text: step.text.trim() }))
        .filter((step) => step.text || (step.images && step.images.length > 0))
        .map((step, index) => {
          const next: FicheStep = { ...step, order: index + 1 };
          if (!next.images || next.images.length === 0) delete next.images;
          return next;
        });
      const cleanedQuestions = questions.map((question) => {
        const choices = question.choices.filter((choice) => choice.text.trim());
        return {
          ...question,
          fiche_id: question.fiche_id,
          prompt: question.prompt.trim(),
          choices,
          correct_choice_ids: question.correct_choice_ids.filter((id) =>
            choices.some((choice) => choice.id === id)
          ),
        };
      });
      assertQuizzesBelongToFiche(cleanedQuestions, ficheId);
      if (cleanedQuestions.some((q) => !q.prompt || q.choices.length < 2 || q.correct_choice_ids.length < 1)) {
        throw new Error('Chaque question doit avoir un intitulé, au moins 2 réponses et une bonne réponse.');
      }
      if (selectedIdRef.current !== ficheId) {
        throw new Error('La fiche a changé pendant l’enregistrement. Réessayez.');
      }
      const scopeKind = deriveScopeKind(scopeLocationIds, scopeGameIds);
      await saveFiche({
        fiche: {
          ...selected,
          id: ficheId,
          title,
          summary,
          category,
          sub_group: subGroup || null,
          content_steps: cleanedSteps,
          is_required: required,
          is_active: active,
          is_placeholder: placeholder,
        },
        minorCorrection: minor,
        scope: { kind: scopeKind, locationIds: scopeLocationIds, gameIds: scopeGameIds },
      });
      for (const question of cleanedQuestions) {
        if (selectedIdRef.current !== ficheId) {
          throw new Error('La fiche a changé pendant l’enregistrement. Réessayez.');
        }
        await saveQuizQuestion({ ...question, fiche_id: ficheId }, { skipBump: minor });
      }
      if (minor) await clearSkipVersionBump(ficheId);
      setMessage(minor ? 'Enregistré sans revalidation.' : 'Enregistré — version incrémentée si le contenu a changé.');
      onFichesChanged();
      if (selectedIdRef.current === ficheId) {
        const rows = await listQuizQuestionsAdmin(ficheId);
        if (selectedIdRef.current === ficheId) {
          setQuestions(quizzesBelongingToFiche(rows, ficheId));
        }
      }
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
      onSelect(nextId);
      onFichesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible');
    } finally {
      setBusy(false);
    }
  };

  const addQuestion = () => {
    if (!selected || quizzesLoading || quizzesStale) return;
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
      {showRetourParcours && onRetourParcours && (
        <Button type="button" variant="secondary" onClick={onRetourParcours}>
          ← Retour au parcours
        </Button>
      )}
      <FicheOrderList
        fiches={orderFiches}
        catalog={catalog}
        selectedId={selectedId}
        onSelect={(id) => {
          if (id === selectedId) {
            scrollEditorIntoView();
          }
          onSelect(id);
        }}
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
            onSelect(created.id);
          }}
        >
          Nouvelle fiche
        </Button>
      </div>

      {selected && (
        <Card id="admin-fiche-editor" ref={editorRef} className="scroll-mt-20">
          <CardHeader>
            {showRetourParcours && onRetourParcours && (
              <Button type="button" variant="secondary" size="sm" className="mb-3" onClick={onRetourParcours}>
                ← Retour au parcours
              </Button>
            )}
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
              <Label htmlFor="fiche-subgroup">Sous-catégorie</Label>
              <select
                id="fiche-subgroup"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={subGroup}
                onChange={(e) => setSubGroup(e.target.value)}
              >
                {FICHE_SUB_GROUPS.map((group) => (
                  <option key={group.value ?? 'general'} value={group.value ?? ''}>
                    {group.value === null ? 'Général (tous les jeux et lieux)' : group.label}
                  </option>
                ))}
                {subGroup && !FICHE_SUB_GROUPS.some((group) => group.value === subGroup) && (
                  <option value={subGroup}>{ficheSubGroupLabel(subGroup)}</option>
                )}
              </select>
              <p className="text-xs text-muted-foreground">
                Regroupe la fiche dans la liste (Général ou par lieu). N’entraîne pas de revalidation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiche-summary">Résumé</Label>
              <Textarea id="fiche-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Étapes</Label>
              <FicheStepsEditor ficheId={selected.id} steps={steps} onChange={setSteps} disabled={busy} />
            </div>
            <FicheScopeEditor
              catalog={catalog}
              locationIds={scopeLocationIds}
              gameIds={scopeGameIds}
              filterGameId={filterGameId}
              onChange={({ locationIds, gameIds }) => {
                setScopeLocationIds(locationIds);
                setScopeGameIds(gameIds);
              }}
            />
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

            <div key={selectedId} className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Questions (QCM)</h3>
                <Button type="button" size="sm" variant="outline" disabled={showQuizLoading} onClick={addQuestion}>
                  Ajouter une question
                </Button>
              </div>
              {showQuizLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des questions…</p>
              ) : (
                shownQuestions.map((question, index) => (
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
                ))
              )}
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
            <Button className="w-full" disabled={busy || showQuizLoading} onClick={save}>
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
