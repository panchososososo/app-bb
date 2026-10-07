import { useState } from 'react';
import { setLocalOnly, signIn } from '../lib/sync.js';
import { CloudIcon, HeartIcon } from './Icons.jsx';

const MESSAGES = {
  'Invalid login credentials': 'Correo o clave incorrectos.',
  'Email not confirmed': 'Ese correo aún no está confirmado en Supabase.',
  'Failed to fetch': 'Sin conexión. Prueba de nuevo cuando tengas señal.',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(MESSAGES[err?.message] ?? err?.message ?? 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-6 py-10 animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-neon-purple/40 bg-void-900 shadow-neon">
          <HeartIcon className="h-10 w-10 text-neon-purple drop-shadow-[0_0_8px_rgba(176,38,255,.9)]" />
        </div>
        <p className="label">Acceso cifrado</p>
        <h1 className="section-title">Nosotros</h1>
        <p className="mt-2 text-sm text-gray-400">Inicia sesión para guardar todo en la nube y verlo en cualquier dispositivo.</p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <label className="block">
          <span className="label">Correo</span>
          <input className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Clave</span>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="rounded-xl border border-pink-400/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy || !email || !password}>
          <CloudIcon className="h-5 w-5" /> {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <button type="button" className="mt-6 text-center text-sm text-gray-500 underline-offset-4 hover:underline" onClick={() => setLocalOnly(true)}>
        Usar sin nube en este dispositivo
      </button>
    </div>
  );
}
