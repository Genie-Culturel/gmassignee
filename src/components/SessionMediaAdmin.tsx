import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminSessionVideoRow, listAdminSessionVideos } from '@/lib/sessionMedia';
import { formatDate, formatTime } from '@/lib/utils';

export function SessionMediaAdmin() {
  const [rows, setRows] = useState<AdminSessionVideoRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminSessionVideos()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Suivi indisponible'));
  }, []);

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
        <CardTitle className="text-lg">Vidéos envoyées</CardTitle>
        <CardDescription>Par session : oui/non et heure d’envoi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-6 sm:pt-0">
        <div className="space-y-3 sm:hidden">
          {rows.map((row) => (
            <div key={row.sessionId} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{row.game}</p>
              <p className="text-xs text-muted-foreground">
                {row.date ? formatDate(row.date + 'T12:00:00') : '—'} · {row.time} · {row.gmName}
              </p>
              <div className="mt-2">
                {row.videosSentAt ? (
                  <Badge variant="success">Oui · {formatTime(row.videosSentAt)}</Badge>
                ) : (
                  <Badge variant="secondary">Non</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">Session</th>
                <th className="px-3 py-2 font-medium">GM</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Vidéos envoyées</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sessionId} className="border-b align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.game}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.date} {row.time}
                      {row.groupName ? ` · ${row.groupName}` : ''}
                    </p>
                  </td>
                  <td className="px-3 py-2">{row.gmName || '—'}</td>
                  <td className="px-3 py-2 text-xs">{row.clientEmail || '—'}</td>
                  <td className="px-3 py-2">
                    {row.videosSentAt ? (
                      <span className="font-medium text-emerald-700">
                        Oui · {formatTime(row.videosSentAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune session pour l’instant.</p>
        )}
      </CardContent>
    </Card>
  );
}
