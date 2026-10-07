import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage.js';
import { CalendarIcon, HeartIcon, PlusIcon } from './Icons.jsx';
import { DeleteButton, EmptyState } from './ui.jsx';

const DAY = 86_400_000;

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(now) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}

function computeStats(anniversary, now) {
  if (!anniversary) return null;
  const start = parseLocalDate(anniversary);
  const today = startOfToday(now);
  const days = Math.round((today - start) / DAY);
  if (days < 0) return { future: true, days: -days };

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let rest = today.getDate() - start.getDate();
  if (rest < 0) {
    months -= 1;
    rest += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let next = new Date(today.getFullYear(), start.getMonth(), start.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, start.getMonth(), start.getDate());
  const toNext = Math.round((next - today) / DAY);

  return { future: false, days, years, months, rest, toNext, nextNumber: next.getFullYear() - start.getFullYear() };
}

const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDay = (iso) =>
  parseLocalDate(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export default function Dashboard() {
  const [anniversary, setAnniversary] = useLocalStorage('anniversary', '');
  const [names, setNames] = useLocalStorage('names', { me: '', her: '' });
  const [notes, setNotes] = useLocalStorage('appreciations', []);
  const [draft, setDraft] = useState('');
  const [editingDate, setEditingDate] = useState(!anniversary);
  const now = useNow();
  const stats = useMemo(() => computeStats(anniversary, now), [anniversary, now]);

  const today = todayKey(now);
  const grouped = useMemo(() => {
    const map = new Map();
    for (const n of notes) {
      if (!map.has(n.date)) map.set(n.date, []);
      map.get(n.date).push(n);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [notes]);
  const todayCount = notes.filter((n) => n.date === today).length;

  const addNote = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setNotes((prev) => [{ id: uid(), text, date: today, createdAt: Date.now() }, ...prev]);
    setDraft('');
  };

  const couple = names.me && names.her ? `${names.me} & ${names.her}` : 'Nosotros';

  return (
    <div className="space-y-5">
      <header>
        <p className="label">Sistema de pareja · online</p>
        <h1 className="section-title">{couple}</h1>
      </header>

      {/* Contador */}
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-neon-purple/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-neon-indigo/20 blur-3xl" />

        {stats && !editingDate ? (
          <div className="relative text-center">
            {stats.future ? (
              <>
                <p className="label">Faltan</p>
                <p className="font-display text-6xl font-extrabold text-white animate-pulse-glow">{stats.days}</p>
                <p className="mt-1 text-gray-300">días para empezar nuestra historia</p>
              </>
            ) : (
              <>
                <p className="label">Juntos desde hace</p>
                <p className="font-display text-7xl font-extrabold leading-none text-white animate-pulse-glow">
                  {stats.days.toLocaleString('es-ES')}
                </p>
                <p className="mt-2 text-lg font-medium text-violet-200">días</p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    [stats.years, stats.years === 1 ? 'año' : 'años'],
                    [stats.months, stats.months === 1 ? 'mes' : 'meses'],
                    [stats.rest, stats.rest === 1 ? 'día' : 'días'],
                  ].map(([n, l]) => (
                    <div key={l} className="rounded-xl border border-neon-violet/20 bg-void-800/80 py-3">
                      <p className="font-display text-2xl font-bold text-white">{n}</p>
                      <p className="text-xs uppercase tracking-widest text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-300">
                  {stats.toNext === 0 ? (
                    <span className="font-semibold text-pink-300">¡Hoy es vuestro aniversario nº {stats.nextNumber}! 💜</span>
                  ) : (
                    <>
                      Aniversario nº {stats.nextNumber} en{' '}
                      <span className="font-semibold text-pink-300">{stats.toNext} días</span>
                    </>
                  )}
                </p>
              </>
            )}
            <button type="button" className="mt-4 text-xs text-gray-500 underline-offset-4 hover:underline" onClick={() => setEditingDate(true)}>
              Editar fecha y nombres
            </button>
          </div>
        ) : (
          <form
            className="relative space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (anniversary) setEditingDate(false);
            }}
          >
            <div className="flex items-center gap-2 text-violet-200">
              <CalendarIcon className="h-5 w-5" />
              <p className="font-semibold">Configura vuestro aniversario</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Tu nombre" value={names.me} onChange={(e) => setNames((n) => ({ ...n, me: e.target.value }))} />
              <input className="input" placeholder="Su nombre" value={names.her} onChange={(e) => setNames((n) => ({ ...n, her: e.target.value }))} />
            </div>
            <label className="block">
              <span className="label">Fecha del aniversario</span>
              <input type="date" className="input" value={anniversary} max="2100-12-31" onChange={(e) => setAnniversary(e.target.value)} required />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={!anniversary}>
              Guardar
            </button>
          </form>
        )}
      </section>

      {/* Cosas que aprecio hoy */}
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="label">Diario de gratitud</p>
            <h2 className="text-lg font-bold text-white">Cosas que aprecio de ti hoy</h2>
          </div>
          <span className="rounded-full bg-neon-purple/20 px-3 py-1 text-sm font-semibold text-violet-200">{todayCount} hoy</span>
        </div>
        <form onSubmit={addNote} className="flex gap-2">
          <input
            className="input"
            placeholder="Hoy aprecio que…"
            value={draft}
            maxLength={280}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn-primary w-14 shrink-0 px-0" aria-label="Añadir" disabled={!draft.trim()}>
            <PlusIcon />
          </button>
        </form>
      </section>

      {grouped.length === 0 ? (
        <EmptyState icon={HeartIcon} text="Apunta cada día un pequeño detalle. Dentro de un año tendrás un tesoro para enseñarle." />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
                {date === today ? 'Hoy' : formatDay(date)}
              </p>
              <ul className="space-y-2">
                {items.map((n) => (
                  <li key={n.id} className="card flex items-start gap-3 py-3">
                    <HeartIcon className="mt-0.5 h-5 w-5 shrink-0 text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,.8)]" />
                    <p className="flex-1 break-words text-[15px] leading-relaxed text-gray-200">{n.text}</p>
                    <DeleteButton onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
