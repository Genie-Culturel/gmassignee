import { FormEvent, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { setDemoFlag } from '@/lib/config';

export function Login() {
  const { signIn, signUp, handoffEmail, handoffActive } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState(handoffEmail);
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fromLovable = handoffActive || Boolean(handoffEmail);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'in') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
      } else {
        const err = await signUp(email.trim(), password, displayName.trim() || email.trim());
        if (err) {
          if (err.toLowerCase().includes('confirm')) setInfo(err);
          else setError(err);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const enterDemo = () => {
    setDemoFlag(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>GMassignee</CardTitle>
          <CardDescription>
            {fromLovable
              ? 'Pour ouvrir Formations / Suivi avec le même compte que le tableau de bord GM, reconnecte-toi.'
              : mode === 'in'
                ? 'Connecte-toi pour suivre tes parties VR Center'
                : 'Crée un compte GM (e-mail + mot de passe)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fromLovable && (
            <Alert className="mb-4">
              <AlertDescription>
                La session GitHub Pages n'est pas partagée avec Lovable. Connecte-toi
                {handoffEmail ? ` avec ${handoffEmail}` : ''}.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'up' && (
              <div className="space-y-2">
                <Label htmlFor="display-name">Prénom / nom</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ex: Julien"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gm@genie-culturel.ch"
                autoComplete="email"
                autoFocus={!handoffEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                autoFocus={Boolean(handoffEmail) && mode === 'in'}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {info && (
              <Alert>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? '…' : mode === 'in' ? 'Se connecter' : 'Créer le compte'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {mode === 'in' ? (
              <button type="button" className="underline text-muted-foreground" onClick={() => setMode('up')}>
                Pas encore de compte ? Créer un compte GM
              </button>
            ) : (
              <button type="button" className="underline text-muted-foreground" onClick={() => setMode('in')}>
                Déjà un compte ? Se connecter
              </button>
            )}
          </div>
          <div className="mt-6 pt-4 border-t text-center">
            <Button type="button" variant="ghost" size="sm" onClick={enterDemo}>
              Continuer en mode démo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
