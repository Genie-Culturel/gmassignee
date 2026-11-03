import { AlertTriangle, Flag } from 'lucide-react';
import { SessionFlag } from '@/lib/sessionView';
import { cn } from '@/lib/utils';

interface SessionFlagBadgeProps {
  flag: SessionFlag | null;
  reviewed: boolean;
  className?: string;
}

/** Red = incident, amber = remark only, grey once marked « Relevé ». */
export function SessionFlagBadge({ flag, reviewed, className }: SessionFlagBadgeProps) {
  if (!flag) return null;
  const isIncident = flag.kind === 'incident';
  const label = isIncident ? 'Incident' : 'Remarque';
  const Icon = isIncident ? AlertTriangle : Flag;
  const tone = reviewed
    ? 'border-slate-200 bg-slate-100 text-slate-500'
    : isIncident
      ? 'border-red-200 bg-red-100 text-red-700'
      : 'border-amber-200 bg-amber-100 text-amber-800';
  const title = `${label}${reviewed ? ' (relevé)' : ''}${flag.excerpt ? ` : ${flag.excerpt}` : ''}`;
  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        tone,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
      {reviewed && <span className="font-normal">· relevé</span>}
    </span>
  );
}
