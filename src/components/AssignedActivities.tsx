import { ReactNode, useState } from 'react';
import { Calendar, ChevronDown, Clock, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AssignedSession,
  assignmentStatusLabel,
  assignmentTimeRange,
  assignmentTitle,
  splitAssignedSessions,
} from '@/lib/assignedSessions';
import { assignmentKey, PersistedSession } from '@/lib/sessionRepository';
import { formatLongWeekdayDate } from '@/lib/utils';

interface AssignedActivitiesProps {
  sessions: AssignedSession[];
  openByAssignment: Map<string, PersistedSession>;
  busy: boolean;
  onStart: (session: AssignedSession) => void;
}

export function AssignedActivities({
  sessions,
  openByAssignment,
  busy,
  onStart,
}: AssignedActivitiesProps) {
  const { today, upcoming } = splitAssignedSessions(sessions);

  return (
    <div className="space-y-4">
      <ActivitySection
        title="Mes Activités Aujourd'hui"
        icon={<Calendar className="h-5 w-5" />}
        iconClass="bg-blue-50 text-blue-600"
        empty="Aucune activité aujourd'hui"
        sessions={today}
        openByAssignment={openByAssignment}
        busy={busy}
        onStart={onStart}
      />
      <ActivitySection
        title="Mes Prochaines Activités"
        description="Vos prochaines sessions programmées"
        icon={<Clock className="h-5 w-5" />}
        iconClass="bg-emerald-50 text-emerald-600"
        empty="Aucune activité à venir"
        sessions={upcoming}
        openByAssignment={openByAssignment}
        busy={busy}
        onStart={onStart}
      />
    </div>
  );
}

function ActivitySection({
  title,
  description,
  icon,
  iconClass,
  empty,
  sessions,
  openByAssignment,
  busy,
  onStart,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  iconClass: string;
  empty: string;
  sessions: AssignedSession[];
  openByAssignment: Map<string, PersistedSession>;
  busy: boolean;
  onStart: (session: AssignedSession) => void;
}) {
  return (
    <Card>
      <CardHeader className={sessions.length === 0 ? 'pb-2' : 'pb-3'}>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          >
            {icon}
          </span>
          {title}
        </CardTitle>
        {description && <CardDescription className="pl-12">{description}</CardDescription>}
      </CardHeader>
      <CardContent className={sessions.length === 0 ? 'pt-0' : 'p-0'}>
        {sessions.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y">
            {sessions.map((session) => (
              <ActivityRow
                key={session.id}
                session={session}
                existing={openByAssignment.get(assignmentKey(session))}
                busy={busy}
                onStart={onStart}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  session,
  existing,
  busy,
  onStart,
}: {
  session: AssignedSession;
  existing?: PersistedSession;
  busy: boolean;
  onStart: (session: AssignedSession) => void;
}) {
  const [open, setOpen] = useState(false);
  const title = assignmentTitle(session);
  const range = assignmentTimeRange(session);
  const longDate = formatLongWeekdayDate(session.date);

  return (
    <li>
      <div className="flex items-start gap-1 px-2 py-1 sm:px-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => onStart(session)}
          aria-label={`${existing ? 'Reprendre' : 'Démarrer'} ${title}, ${longDate}, ${range}`}
          className="min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-muted/50 disabled:opacity-50 sm:px-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <span className="min-w-0 font-medium leading-snug">{title}</span>
                <span className="flex shrink-0 flex-wrap items-center gap-1 pt-0.5">
                  <Badge variant="assigned">{assignmentStatusLabel(session.status)}</Badge>
                  {existing && <Badge variant="success">En cours</Badge>}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground sm:hidden">
                <p>{longDate}</p>
                <p>{range}</p>
              </div>
            </div>
            <div className="hidden shrink-0 text-right text-sm text-muted-foreground sm:block">
              <p>{longDate}</p>
              <p>{range}</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Replier ${title}` : `Déplier ${title}`}
          onClick={() => setOpen((value) => !value)}
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t bg-muted/30 px-4 py-3 sm:px-6">
          {session.groupName && (
            <p className="text-sm">
              <span className="text-muted-foreground">Groupe · </span>
              {session.groupName}
            </p>
          )}
          {session.notes && <p className="text-sm text-muted-foreground">{session.notes}</p>}
          <p className="text-sm text-muted-foreground">
            {longDate} · {range}
            {` · ${session.playerCount} joueur${session.playerCount > 1 ? 's' : ''}`}
          </p>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={() => onStart(session)}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {existing ? 'Reprendre la session' : 'Démarrer la session'}
          </Button>
        </div>
      )}
    </li>
  );
}
