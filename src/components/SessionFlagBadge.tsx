import { AlertTriangle, Banknote, Flag, PencilLine } from 'lucide-react';
import { SessionFlag } from '@/lib/sessionView';
import { cn } from '@/lib/utils';

interface SessionFlagBadgeProps {
  flag: SessionFlag | null;
  reviewed: boolean;
  className?: string;
}

const FLAG_STYLE: Record<SessionFlag['kind'], { tone: string; Icon: typeof Flag }> = {
  incident: { tone: 'border-red-200 bg-red-100 text-red-700', Icon: AlertTriangle },
  remark: { tone: 'border-amber-200 bg-amber-100 text-amber-800', Icon: Flag },
  cash: { tone: 'border-emerald-200 bg-emerald-100 text-emerald-800', Icon: Banknote },
};

/** Red = incident, amber = remark, green = money collected; grey once marked « Relevé ». */
export function SessionFlagBadge({ flag, reviewed, className }: SessionFlagBadgeProps) {
  if (!flag) return null;
  const { tone, Icon } = FLAG_STYLE[flag.kind];
  const title = `${flag.label}${reviewed ? ' (relevé)' : ''}${flag.excerpt ? ` : ${flag.excerpt}` : ''}`;
  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold',
        reviewed ? 'border-slate-200 bg-slate-100 text-slate-500' : tone,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {flag.label}
      {reviewed && <span className="font-normal">· relevé</span>}
    </span>
  );
}

export function SessionFlagBadges({
  flags,
  reviewed,
  className,
}: {
  flags: SessionFlag[];
  reviewed: boolean;
  className?: string;
}) {
  if (!flags.length) return null;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {flags.map((flag) => (
        <SessionFlagBadge key={flag.kind} flag={flag} reviewed={reviewed} />
      ))}
    </span>
  );
}

/** Distinct marker for sessions started outside the planning (« Démarrer une session manuelle »). */
export function ManualSessionBadge({ className }: { className?: string }) {
  return (
    <span
      title="Session démarrée manuellement, hors planning GMassignee"
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-violet-400 bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700',
        className
      )}
    >
      <PencilLine className="h-3 w-3" aria-hidden />
      Session manuelle
    </span>
  );
}
