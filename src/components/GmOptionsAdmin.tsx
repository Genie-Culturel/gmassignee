import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useGmOptions } from '@/hooks/useGmOptions';
import { GM_OPTION_FIELDS, GmOptionKey } from '@/lib/gmOptions';

export function GmOptionsAdmin() {
  const { options, loading, setOption } = useGmOptions();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<GmOptionKey | null>(null);
  const [open, setOpen] = useState(false);

  const enabledCount = GM_OPTION_FIELDS.filter((field) => options[field.key]).length;
  const totalCount = GM_OPTION_FIELDS.length;

  const onToggle = async (key: GmOptionKey, value: boolean) => {
    setError(null);
    setPending(key);
    try {
      await setOption(key, value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <Accordion
        type="single"
        collapsible
        value={open ? 'gm-options' : ''}
        onValueChange={(value) => setOpen(value === 'gm-options')}
      >
        <AccordionItem value="gm-options" className="border-none">
          <AccordionTrigger className="px-6 py-6 hover:no-underline">
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 pr-2 text-left">
              <span className="text-2xl font-semibold leading-none tracking-tight">Options GM</span>
              <span className="text-sm font-normal text-muted-foreground">
                {open
                  ? 'Ces interrupteurs contrôlent ce que voient les GMs. Les admins et formateurs gardent l’accès pour configurer, même si un module est masqué.'
                  : `${enabledCount}/${totalCount} activées`}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 text-base">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {GM_OPTION_FIELDS.map((field) => (
                <div key={field.key} className="flex items-start gap-3">
                  <Checkbox
                    id={`gm-option-${field.key}`}
                    checked={options[field.key]}
                    disabled={loading || pending === field.key}
                    onCheckedChange={(checked) => void onToggle(field.key, checked === true)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <Label htmlFor={`gm-option-${field.key}`} className="cursor-pointer font-medium">
                      {field.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
