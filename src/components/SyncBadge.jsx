import { useState } from 'react';
import { useSync } from '../hooks/useSync.js';
import { setLocalOnly, signOut, syncNow } from '../lib/sync.js';
import { CloudIcon, CloudOffIcon, RefreshIcon } from './Icons.jsx';

const LABELS = {
  idle: 'En la nube',
  syncing: 'Guardando…',
  offline: 'Sin señal',
  error: 'Error al sincronizar',
};

export default function SyncBadge() {
  const sync = useSync();
  const [open, setOpen] = useState(false);
  if (!sync.enabled) return null;

  const signedIn = !!sync.user;
  const label = signedIn ? LABELS[sync.status] ?? 'En la nube' : 'Solo en este teléfono';
  const ok = signedIn && (sync.status === 'idle' || sync.status === 'syncing');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed right-3 z-40 flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold backdrop-blur-md transition active:scale-95 ${
          ok ? 'border-neon-violet/40 bg-void-900/80 text-violet-200' : 'border-pink-400/40 bg-void-900/80 text-pink-200'
        }`}
        style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        aria-label={label}
      >
        {ok ? <CloudIcon className={`h-4 w-4 ${sync.status === 'syncing' ? 'animate-pulse' : ''}`} /> : <CloudOffIcon className="h-4 w-4" />}
        <span className="hidden min-[360px]:inline">{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="pb-safe mx-auto w-full max-w-lg rounded-t-3xl border-t border-neon-purple/40 bg-void-900 p-5 shadow-neon animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-void-700" />
            <p className="label">Cuenta</p>
            {signedIn ? (
              <>
                <p className="break-all text-base font-semibold text-white">{sync.user.email}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {label}
                  {sync.lastSync && ` · última vez ${new Date(sync.lastSync).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
                {sync.error && <p className="mt-2 text-sm text-pink-300">{sync.error}</p>}
                <div className="mt-5 flex gap-2">
                  <button type="button" className="btn-ghost flex-1" onClick={() => syncNow()}>
                    <RefreshIcon className="h-5 w-5" /> Sincronizar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost flex-1"
                    onClick={async () => {
                      if (!window.confirm('¿Cerrar sesión? Lo guardado en este teléfono se queda aquí.')) return;
                      await signOut();
                      setOpen(false);
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">Tus datos se guardan solo en este teléfono. Inicia sesión para subirlos a la nube.</p>
                <button
                  type="button"
                  className="btn-primary mt-5 w-full"
                  onClick={() => {
                    setLocalOnly(false);
                    setOpen(false);
                  }}
                >
                  <CloudIcon className="h-5 w-5" /> Iniciar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
