import { FILMING_NOTICE } from '@/lib/sessionMedia';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function FilmingNotice({
  acknowledged,
  onAcknowledged,
  requireCheck = false,
}: {
  acknowledged?: boolean;
  onAcknowledged?: (value: boolean) => void;
  requireCheck?: boolean;
}) {
  return (
    <Alert className="border-sky-200 bg-sky-50 text-sky-950 [&>svg]:text-sky-700">
      <AlertTitle className="text-sm font-semibold">Vidéos clients</AlertTitle>
      <AlertDescription className="space-y-3 text-sm leading-snug">
        <p>{FILMING_NOTICE}</p>
        {requireCheck && onAcknowledged && (
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(v) => onAcknowledged(v === true)}
              className="mt-0.5"
            />
            <span
              onClick={(event) => {
                event.preventDefault();
                onAcknowledged(!acknowledged);
              }}
            >
              J’ai informé le groupe de cet enregistrement.
            </span>
          </label>
        )}
      </AlertDescription>
    </Alert>
  );
}
