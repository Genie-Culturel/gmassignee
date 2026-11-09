import { useEffect, useState } from 'react';
import { FicheValidation, ProcedureFiche, QuizQuestionPublic } from '@/lib/database.types';
import { ficheStatus, ficheVersion } from '@/lib/training';
import { listQuizQuestions, submitFicheValidation } from '@/lib/trainingRepository';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface FicheValidationPanelProps {
  fiche: ProcedureFiche;
  gmId: string;
  validation?: FicheValidation;
  onValidated: () => void;
}

export function FicheValidationPanel({
  fiche,
  gmId,
  validation,
  onValidated,
}: FicheValidationPanelProps) {
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [wrong, setWrong] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizOk, setQuizOk] = useState(false);

  const status = ficheStatus(fiche, validation);

  useEffect(() => {
    let cancelled = false;
    const ficheId = fiche.id;
    setQuestions([]);
    setConfirmed(false);
    setWrong([]);
    setQuizOk(false);
    setAnswers({});
    setError(null);
    listQuizQuestions(ficheId)
      .then((rows) => {
        if (cancelled) return;
        const mine = rows.filter((row) => row.fiche_id === ficheId);
        setQuestions(mine);
        if (!mine.length) setQuizOk(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Quiz indisponible');
      });
    return () => {
      cancelled = true;
    };
  }, [fiche.id]);

  const toggleChoice = (questionId: string, choiceId: string, multi: boolean) => {
    setWrong((ids) => ids.filter((id) => id !== questionId));
    setQuizOk(false);
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (!multi) return { ...prev, [questionId]: [choiceId] };
      const next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return { ...prev, [questionId]: next };
    });
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        choice_ids: answers[q.id] || [],
      }));
      const result = await submitFicheValidation({
        gmId,
        fiche,
        confirmed,
        answers: payload,
      });
      if (!result.ok) {
        if (result.wrong_question_ids?.length) {
          setWrong(result.wrong_question_ids);
          setQuizOk(false);
          setError('Certaines réponses sont incorrectes. Corrige-les et réessaie.');
        } else {
          setError(result.error === 'confirm_required' ? 'Coche « J’ai lu et compris ».' : 'Validation refusée');
        }
        return;
      }
      setQuizOk(true);
      setWrong([]);
      onValidated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation impossible');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'done') {
    return (
      <Alert className="border-emerald-200 bg-emerald-50">
        <AlertDescription className="font-medium text-emerald-900">
          Fiche validée (version {validation?.version ?? ficheVersion(fiche)}).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 border-t pt-4">
      {status === 'revalidate' && (
        <Alert className="border-amber-400 bg-amber-50">
          <AlertDescription className="font-medium text-amber-950">
            Cette procédure a été mise à jour. Relis-la et revalide-la.
          </AlertDescription>
        </Alert>
      )}

      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Questions de validation</h3>
          {questions.map((question) => {
            const isWrong = wrong.includes(question.id);
            return (
              <div
                key={question.id}
                className={`space-y-2 rounded-lg border p-3 ${isWrong ? 'border-red-400 bg-red-50' : ''}`}
              >
                <div className="text-sm font-medium leading-snug">
                  {question.prompt}
                  {question.is_example && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      exemple
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Coche la ou les bonnes réponses.</p>
                <div className="space-y-1">
                  {question.choices.map((choice) => {
                    const selected = (answers[question.id] || []).includes(choice.id);
                    return (
                      <label
                        key={choice.id}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          name={`q-${question.id}-${choice.id}`}
                          checked={selected}
                          onChange={() => toggleChoice(question.id, choice.id, true)}
                          className="h-4 w-4"
                        />
                        {choice.text}
                      </label>
                    );
                  })}
                </div>
                {isWrong && (
                  <p className="text-xs font-medium text-red-600">Réponse incorrecte</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2">
        <Checkbox
          id={`read-${fiche.id}`}
          checked={confirmed}
          onCheckedChange={(value) => setConfirmed(value === true)}
        />
        <Label htmlFor={`read-${fiche.id}`} className="leading-snug">
          J&apos;ai lu et compris cette procédure
        </Label>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button className="w-full" size="lg" disabled={busy || !confirmed} onClick={submit}>
        {busy ? 'Validation…' : status === 'revalidate' ? 'Revalider' : 'Valider'}
      </Button>
      {questions.length > 0 && quizOk && (
        <p className="text-center text-xs text-muted-foreground">Quiz réussi.</p>
      )}
    </div>
  );
}
