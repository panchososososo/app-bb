/*
 * Sincronización con la nube vía un Gist secreto de tu cuenta de GitHub
 * (el mismo sistema que la Bitácora PDT).
 * - LocalStorage sigue siendo la fuente inmediata: la app funciona sin señal.
 * - Todo se guarda en un archivo `nosotros.json` dentro del Gist.
 * - Solo entra quien tenga tu token de GitHub, que se pega una vez en cada
 *   dispositivo tuyo y nunca sale de él (salvo hacia api.github.com).
 * - Gana la versión más reciente de cada sección; la primera vez que conectas
 *   un dispositivo, sus listas se fusionan con las de la nube por id.
 */

const PREFIX = 'nosotros:';
const META_KEY = `${PREFIX}__sync`;
const CONF_KEY = `${PREFIX}__github`;
const GIST_FILE = 'nosotros.json';
const API = 'https://api.github.com';

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
const readConf = () => readJSON(CONF_KEY, {});
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

/** Acepta el ID del Gist o su URL completa. */
export function parseGistId(input) {
  const text = String(input ?? '').trim();
  const match = text.match(/[0-9a-f]{20,}/i);
  return match ? match[0] : text;
}

// ---------- estado observable (para la interfaz) ----------
const isConfigured = () => {
  const c = readConf();
  return !!(c.token && c.gistId);
};
let state = {
  configured: isConfigured(),
  gistId: readConf().gistId ?? null,
  status: isConfigured() ? 'idle' : 'off', // off | idle | syncing | offline | error
  lastSync: null,
  error: null,
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

// ---------- API de GitHub ----------
async function gh(path, { token = readConf().token, ...opts } = {}) {
  const res = await fetch(API + path, {
    ...opts,
    cache: 'no-store', // nunca usar una copia vieja del Gist
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const reason =
      res.status === 401
        ? 'el token no es válido o expiró'
        : res.status === 403
          ? 'el token no tiene permiso de Gists (lectura y escritura)'
          : res.status === 404
            ? 'no encuentro ese Gist con este token'
            : `error ${res.status}`;
    throw new Error(`GitHub: ${reason}`);
  }
  return res.json();
}

async function pullDoc() {
  const gist = await gh(`/gists/${readConf().gistId}`);
  const file = gist.files?.[GIST_FILE];
  if (!file) return { items: {} };
  let content = file.content;
  if (file.truncated && file.raw_url) content = await (await fetch(file.raw_url, { cache: 'no-store' })).text();
  try {
    const doc = JSON.parse(content);
    return { items: doc.items ?? {} };
  } catch {
    return { items: {} };
  }
}

async function pushDoc(doc) {
  await gh(`/gists/${readConf().gistId}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify({ app: 'nosotros', version: 1, ...doc }, null, 2) } } }),
  });
}

function localDoc() {
  const meta = readMeta();
  const items = {};
  const now = Date.now();
  for (const key of SYNCED_KEYS) {
    if (hasLocal(key)) items[key] = { valor: readJSON(PREFIX + key, null), actualizado: meta.stamps[key] ?? now };
  }
  return { items };
}

// ---------- cambios locales ----------
let timer = null;
export function noteLocalChange(key) {
  if (!SYNCED_KEYS.includes(key)) return;
  const meta = readMeta();
  meta.stamps[key] = Date.now();
  if (!meta.dirty.includes(key)) meta.dirty.push(key);
  writeMeta(meta);
  scheduleSync(1500);
}

export function scheduleSync(delay = 0) {
  if (!isConfigured()) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, delay);
}

// ---------- sincronización ----------
let running = null;
export function syncNow() {
  if (!isConfigured()) return Promise.resolve();
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
    // 1) Bajar lo que hay en la nube.
    const remoteDoc = await pullDoc();
    const meta = readMeta();
    const toPush = new Set(meta.dirty);

    for (const key of SYNCED_KEYS) {
      const row = remoteDoc.items[key];
      const localTs = meta.stamps[key] ?? 0;

      if (!row) {
        // La nube no lo tiene: subir lo local (migración inicial).
        if (hasLocal(key)) {
          if (!meta.stamps[key]) meta.stamps[key] = Date.now();
          toPush.add(key);
        }
        continue;
      }

      const remoteTs = Number(row.actualizado) || 0;

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
      } else if (localTs > remoteTs) {
        toPush.add(key);
      }
    }

    // 2) Subir lo pendiente (el archivo completo, con lo más nuevo de cada lado).
    if (toPush.size) {
      const items = { ...remoteDoc.items };
      for (const key of toPush) {
        items[key] = { valor: readJSON(PREFIX + key, null), actualizado: meta.stamps[key] ?? Date.now() };
      }
      await pushDoc({ items });
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

// ---------- conexión ----------
export function initSync() {
  window.addEventListener('online', () => scheduleSync());
  window.addEventListener('offline', () => isConfigured() && emit({ status: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync();
  });
  setInterval(() => document.visibilityState === 'visible' && scheduleSync(), 120_000);
  scheduleSync();
}

/**
 * Conecta este dispositivo. Sin gistId crea un Gist secreto nuevo con lo que
 * hay en el teléfono; con gistId se une al existente y fusiona los datos.
 * Devuelve el ID del Gist (para conectar tus otros dispositivos).
 */
export async function connect(tokenInput, gistInput) {
  const token = String(tokenInput ?? '').trim();
  if (!token) throw new Error('Falta el token.');
  let gistId = parseGistId(gistInput);

  if (gistId) {
    await gh(`/gists/${gistId}`, { token }); // valida token + Gist antes de guardar
  } else {
    const created = await gh('/gists', {
      token,
      method: 'POST',
      body: JSON.stringify({
        description: 'Nosotros — datos de la app (no borrar)',
        public: false,
        files: { [GIST_FILE]: { content: JSON.stringify({ app: 'nosotros', version: 1, ...localDoc() }, null, 2) } },
      }),
    });
    gistId = created.id;
  }

  writeJSON(CONF_KEY, { token, gistId });
  // Se empieza de cero para que la primera vuelta fusione en vez de pisar.
  writeMeta({ stamps: {}, dirty: [] });
  emit({ configured: true, gistId, status: 'idle', error: null });
  await syncNow();
  return gistId;
}

export function disconnect() {
  clearTimeout(timer);
  localStorage.removeItem(CONF_KEY);
  writeMeta({ stamps: {}, dirty: [] });
  emit({ configured: false, gistId: null, status: 'off', lastSync: null, error: null });
}
