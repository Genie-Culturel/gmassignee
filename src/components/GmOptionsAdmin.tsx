import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGmOptions } from '@/hooks/useGmOptions';
import { GM_OPTION_FIELDS, GmOptionKey } from '@/lib/gmOptions';

export function GmOptionsAdmin() {
  const { options, loading, setOption } = useGmOptions();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<GmOptionKey | null>(null);

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
      <CardHeader>
        <CardTitle>Options GM</CardTitle>
        <CardDescription>
          Ces interrupteurs contrôlent ce que voient les GMs. Les admins et formateurs
          gardent l’accès pour configurer, même si un module est masqué.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
