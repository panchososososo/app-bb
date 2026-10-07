import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';

/*
 * Sincronización con la nube (Supabase).
 * - LocalStorage sigue siendo la fuente inmediata: la app funciona sin señal.
 * - Cada sección (clave) se sube entera a la tabla `nosotros`.
 * - Gana la versión más reciente de cada sección.
 * - La primera vez que se inicia sesión en un dispositivo, las listas locales y
 *   las de la nube se fusionan por id, así no se pierde nada de lo ya guardado.
 */

const PREFIX = 'nosotros:';
const META_KEY = `${PREFIX}__sync`;
const LOCAL_ONLY_KEY = `${PREFIX}__solo-local`;
const TABLE = 'nosotros';

export const SYNCED_KEYS = [
  'anniversary',
  'names',
  'appreciations',
  'agreements',
  'gifts',
  'dates',
  'letters',
  'letter-draft',
];

export const supabase =
  CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY
    ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: `${PREFIX}auth` },
      })
    : null;

// ---------- utilidades de almacenamiento ----------
function readJSON(fullKey, fallback) {
  try {
    const raw = localStorage.getItem(fullKey);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJSON(fullKey, value) {
  try {
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch (err) {
    console.error('[sync] No se pudo escribir en LocalStorage', err);
  }
}
const readMeta = () => ({ stamps: {}, dirty: [], ...readJSON(META_KEY, {}) });
const writeMeta = (meta) => writeJSON(META_KEY, meta);
const hasLocal = (key) => localStorage.getItem(PREFIX + key) !== null;

function applyRemote(key, value) {
  writeJSON(PREFIX + key, value);
  // useLocalStorage escucha este evento y vuelve a leer la clave.
  window.dispatchEvent(new CustomEvent('local-storage', { detail: { key } }));
}

function mergeById(remote, local) {
  const seen = new Set(remote.map((x) => x?.id));
  return [...remote, ...local.filter((x) => x?.id && !seen.has(x.id))];
}

// ---------- estado observable (para la interfaz) ----------
let state = {
  enabled: !!supabase,
  ready: !supabase,
  user: null,
  status: supabase ? 'idle' : 'off', // off | idle | syncing | offline | error
  lastSync: null,
  error: null,
  localOnly: readJSON(LOCAL_ONLY_KEY, false),
};
const listeners = new Set();
function emit(patch) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getState = () => state;

// ---------- cambios locales ----------
let timer = null;
export function noteLocalChange(key) {
  if (!supabase || !SYNCED_KEYS.includes(key)) return;
  const meta = readMeta();
  meta.stamps[key] = Date.now();
  if (!meta.dirty.includes(key)) meta.dirty.push(key);
  writeMeta(meta);
  scheduleSync(1200);
}

export function scheduleSync(delay = 0) {
  if (!supabase || !state.user) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, delay);
}

// ---------- sincronización ----------
let running = null;
export function syncNow() {
  if (!supabase || !state.user) return Promise.resolve();
  if (running) return running;
  running = doSync().finally(() => {
    running = null;
    // Si algo cambió mientras se subía, se programa otra vuelta.
    if (readMeta().dirty.length && navigator.onLine && state.status !== 'error') scheduleSync(500);
  });
  return running;
}

async function doSync() {
  if (!navigator.onLine) {
    emit({ status: 'offline' });
    return;
  }
  emit({ status: 'syncing', error: null });
  try {
    // 1) Bajar lo que hay en la nube (RLS devuelve solo las filas propias).
    const { data: rows, error } = await supabase.from(TABLE).select('clave, valor, actualizado');
    if (error) throw error;

    const meta = readMeta();
    const remote = new Map(rows.map((r) => [r.clave, r]));
    const toPush = new Set(meta.dirty);

    for (const key of SYNCED_KEYS) {
      const row = remote.get(key);
      const localTs = meta.stamps[key] ?? 0;

      if (!row) {
        // La nube no lo tiene: subir lo local (migración inicial).
        if (hasLocal(key)) {
          if (!meta.stamps[key]) meta.stamps[key] = Date.now();
          toPush.add(key);
        }
        continue;
      }

      const remoteTs = new Date(row.actualizado).getTime();

      // Primera vez en este dispositivo con datos previos: fusionar listas.
      if (!localTs && hasLocal(key)) {
        const local = readJSON(PREFIX + key, null);
        if (Array.isArray(local) && Array.isArray(row.valor)) {
          const merged = mergeById(row.valor, local);
          applyRemote(key, merged);
          if (merged.length !== row.valor.length) {
            meta.stamps[key] = Date.now();
            toPush.add(key);
          } else {
            meta.stamps[key] = remoteTs;
            toPush.delete(key);
          }
          continue;
        }
      }

      if (remoteTs > localTs) {
        applyRemote(key, row.valor);
        meta.stamps[key] = remoteTs;
        toPush.delete(key);
      }
    }

    // 2) Subir lo pendiente.
    if (toPush.size) {
      const payload = [...toPush].map((key) => ({
        user_id: state.user.id,
        clave: key,
        valor: readJSON(PREFIX + key, null),
        actualizado: new Date(meta.stamps[key] ?? Date.now()).toISOString(),
      }));
      const { error: upErr } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id,clave' });
      if (upErr) throw upErr;
    }

    // 3) Guardar el estado, sin pisar cambios hechos mientras se sincronizaba.
    const latest = readMeta();
    for (const [key, ts] of Object.entries(meta.stamps)) {
      if ((latest.stamps[key] ?? 0) <= ts) latest.stamps[key] = ts;
    }
    latest.dirty = latest.dirty.filter((key) => (latest.stamps[key] ?? 0) > (meta.stamps[key] ?? 0));
    writeMeta(latest);

    emit({ status: 'idle', lastSync: Date.now() });
  } catch (err) {
    console.error('[sync]', err);
    emit({ status: navigator.onLine ? 'error' : 'offline', error: err?.message ?? String(err) });
  }
}

// ---------- sesión ----------
export async function initSync() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  emit({ ready: true, user: data.session?.user ?? null });

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    if (user?.id !== state.user?.id) {
      emit({ user });
      if (user) scheduleSync();
    }
  });
  if (state.user) scheduleSync();

  window.addEventListener('online', () => scheduleSync());
  window.addEventListener('offline', () => emit({ status: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync();
  });
  setInterval(() => document.visibilityState === 'visible' && scheduleSync(), 120_000);
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  setLocalOnly(false);
  emit({ user: data.user });
  await syncNow();
}

export async function signOut() {
  await syncNow().catch(() => {});
  await supabase.auth.signOut();
  // La próxima sesión vuelve a fusionar desde cero.
  writeMeta({ stamps: {}, dirty: [] });
  emit({ user: null, status: 'idle', lastSync: null });
}

export function setLocalOnly(value) {
  writeJSON(LOCAL_ONLY_KEY, value);
  emit({ localOnly: value });
}
