import { useState } from 'react';
import { useSync } from '../hooks/useSync.js';
import { connect, disconnect, syncNow } from '../lib/sync.js';
import { CloudIcon, CloudOffIcon, CopyIcon, RefreshIcon } from './Icons.jsx';

const LABELS = {
  off: 'Solo en este teléfono',
  idle: 'En la nube',
  syncing: 'Guardando…',
  offline: 'Sin señal',
  error: 'Error al sincronizar',
};

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

function ConnectForm({ onDone }) {
  const [token, setToken] = useState('');
  const [gist, setGist] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await connect(token, gist);
      onDone();
    } catch (err) {
      setError(err?.message === 'Failed to fetch' ? 'Sin conexión. Prueba de nuevo con señal.' : err?.message ?? 'No se pudo conectar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm leading-relaxed text-gray-400">
        Guarda tus datos en un Gist secreto de tu GitHub, igual que la Bitácora PDT. Solo entran los dispositivos donde pegues tu token.
      </p>
      <label className="block">
        <span className="label">Token de GitHub</span>
        <input className="input" type="password" autoComplete="off" placeholder="github_pat_…" value={token} onChange={(e) => setToken(e.target.value)} required />
        <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-indigo-300 underline underline-offset-2">
          Crear token (permiso Gists: lectura y escritura)
        </a>
      </label>
      <label className="block">
        <span className="label">ID del Gist</span>
        <input className="input" autoComplete="off" placeholder="Vacío la primera vez: se crea uno" value={gist} onChange={(e) => setGist(e.target.value)} />
      </label>
      {error && <p className="rounded-xl border border-pink-400/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy || !token.trim()}>
        <CloudIcon className="h-5 w-5" /> {busy ? 'Conectando…' : 'Conectar'}
      </button>
    </form>
  );
}

export default function SyncBadge() {
  const sync = useSync();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const label = LABELS[sync.status] ?? LABELS.idle;
  const ok = sync.configured && (sync.status === 'idle' || sync.status === 'syncing');

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(sync.gistId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin portapapeles: el ID igual queda a la vista */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed right-3 z-40 flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold backdrop-blur-md transition active:scale-95 ${
          ok ? 'border-neon-violet/40 bg-void-900/80 text-violet-200' : 'border-gray-600/50 bg-void-900/80 text-gray-400'
        } ${sync.status === 'error' ? '!border-pink-400/50 !text-pink-200' : ''}`}
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        aria-label={label}
      >
        {ok ? <CloudIcon className={`h-4 w-4 ${sync.status === 'syncing' ? 'animate-pulse' : ''}`} /> : <CloudOffIcon className="h-4 w-4" />}
        <span className="hidden min-[360px]:inline">{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="pb-safe mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-neon-purple/40 bg-void-900 p-5 shadow-neon animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-void-700" />
            <p className="label">Nube</p>
            {sync.configured ? (
              <>
                <p className="text-base font-semibold text-white">{label}</p>
                {sync.lastSync && (
                  <p className="text-sm text-gray-400">
                    Última vez a las {new Date(sync.lastSync).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {sync.error && <p className="mt-2 text-sm text-pink-300">{sync.error}</p>}

                <div className="mt-4 rounded-xl border border-neon-violet/25 bg-void-800 p-3">
                  <p className="text-xs text-gray-400">ID del Gist (pégalo en tus otros dispositivos junto con tu token)</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 break-all text-sm text-violet-200">{sync.gistId}</code>
                    <button type="button" className="icon-btn" onClick={copyId} aria-label="Copiar ID">
                      <CopyIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {copied && <p className="text-xs text-violet-300">Copiado</p>}
                </div>

                <div className="mt-5 flex gap-2">
                  <button type="button" className="btn-ghost flex-1" onClick={() => syncNow()}>
                    <RefreshIcon className="h-5 w-5" /> Sincronizar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost flex-1"
                    onClick={() => {
                      if (window.confirm('¿Desconectar este dispositivo? Lo guardado aquí se queda, pero deja de sincronizarse.')) disconnect();
                    }}
                  >
                    Desconectar
                  </button>
                </div>
              </>
            ) : (
              <ConnectForm onDone={() => {}} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
