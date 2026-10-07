import { useCallback, useEffect, useRef, useState } from 'react';
import { noteLocalChange } from '../lib/sync.js';

const PREFIX = 'nosotros:';

function read(key, initialValue) {
  const fallback = typeof initialValue === 'function' ? initialValue() : initialValue;
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.warn(`[useLocalStorage] No se pudo leer "${key}", uso el valor inicial.`, err);
    return fallback;
  }
}

/**
 * Estado de React persistido en LocalStorage.
 * - Lectura síncrona en el primer render (no hay "parpadeo" ni pérdida al recargar).
 * - Escritura inmediata en cada cambio, con soporte para actualizaciones funcionales.
 * - Sincroniza entre pestañas y entre componentes que usen la misma clave.
 * - Avisa a lib/sync.js para que el cambio se suba a la nube.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue));
  const initialRef = useRef(initialValue);

  const setStoredValue = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          window.localStorage.setItem(PREFIX + key, JSON.stringify(resolved));
          window.dispatchEvent(new CustomEvent('local-storage', { detail: { key } }));
          noteLocalChange(key);
        } catch (err) {
          console.error(`[useLocalStorage] No se pudo guardar "${key}".`, err);
        }
        return resolved;
      });
    },
    [key]
  );

  useEffect(() => {
    const sync = (event) => {
      const changedKey = event.type === 'storage' ? event.key : PREFIX + event.detail?.key;
      if (changedKey === PREFIX + key) setValue(read(key, initialRef.current));
    };
    window.addEventListener('storage', sync);
    window.addEventListener('local-storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('local-storage', sync);
    };
  }, [key]);

  return [value, setStoredValue];
}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
