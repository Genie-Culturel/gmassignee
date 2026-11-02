import { FormEvent, ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';

const ACCESS_PIN = '1950';
const PIN_STORAGE_KEY = 'gmassignee_pin_ok';

export function isPinUnlocked(): boolean {
  try {
    return window.localStorage.getItem(PIN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberPin() {
  try {
    window.localStorage.setItem(PIN_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function PinGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isPinUnlocked);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (pin === ACCESS_PIN) {
      rememberPin();
      setUnlocked(true);
      setError(false);
      return;
    }
    setError(true);
    setPin('');
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-10">
      <div className="text-center w-full max-w-sm">
        <div className="mb-8">
          <Lock className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            GMassignee
          </h1>
          <p className="text-purple-300/70 text-sm tracking-widest uppercase mt-2">
            Accès sécurisé
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-8 border border-purple-800/50 shadow-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Entrez le code PIN</h2>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="••••"
              value={pin}
              autoFocus
              onChange={(e) => {
                setError(false);
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              }}
              className="w-full bg-slate-700/50 border border-slate-600/50 focus:border-purple-500/50 rounded-lg px-4 py-3 text-white text-center text-3xl tracking-widest focus:outline-none transition"
            />
            <button
              type="submit"
              className="w-full min-h-11 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 px-4 py-3 rounded-lg text-white font-bold transition shadow-lg shadow-purple-500/20"
            >
              Accéder
            </button>
          </form>
          {error && (
            <div className="text-red-400 text-sm mt-4">Code PIN incorrect</div>
          )}
        </div>
      </div>
    </div>
  );
}
