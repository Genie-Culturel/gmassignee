import { ReactNode } from 'react';
import { Calendar, Clock, PlayCircle, Users } from 'lucide-react';
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
  const title = assignmentTitle(session);
  const range = assignmentTimeRange(session);
  const longDate = formatLongWeekdayDate(session.date);
  const players = `${session.playerCount} joueur${session.playerCount > 1 ? 's' : ''}`;

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 font-medium leading-snug">{title}</span>
          <Badge variant="assigned">{assignmentStatusLabel(session.status)}</Badge>
          {existing && <Badge variant="success">En cours</Badge>}
        </div>
        {session.groupName && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {session.groupName}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {longDate} · {range} · {players}
        </p>
        {session.notes && <p className="text-xs text-muted-foreground">{session.notes}</p>}
      </div>
      <Button
        type="button"
        className="h-11 w-full shrink-0 sm:w-auto"
        variant={existing ? 'secondary' : 'default'}
        disabled={busy}
        onClick={() => onStart(session)}
        aria-label={`${existing ? 'Reprendre' : 'Démarrer'} la session ${title}, ${longDate}, ${range}`}
      >
        <PlayCircle className="mr-2 h-4 w-4" />
        {existing ? 'Reprendre la session' : 'Démarrer la session'}
      </Button>
    </li>
  );
}
