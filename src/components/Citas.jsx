import { useMemo, useState } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage.js';
import { MapPinIcon, PlusIcon, SparkIcon } from './Icons.jsx';
import { DeleteButton, EditActions, EditButton, EmptyState, Progress, SectionHeader } from './ui.jsx';

export const CATEGORIES = [
  { id: 'aventura', label: 'Aventura', emoji: '🏔️' },
  { id: 'gastro', label: 'Gastro', emoji: '🍜' },
  { id: 'casa', label: 'En casa', emoji: '🛋️' },
  { id: 'cultura', label: 'Cultura', emoji: '🎭' },
  { id: 'escapada', label: 'Escapada', emoji: '🚗' },
  { id: 'lowcost', label: 'Low cost', emoji: '🪙' },
];

const STARTER = [
  { title: 'Picnic nocturno mirando estrellas con una app de constelaciones', category: 'aventura' },
  { title: 'Cocinar un plato de un país al azar girando un globo', category: 'casa' },
  { title: 'Ruta de los 3 mejores churros/postres de la ciudad y votarlos', category: 'gastro' },
];

export default function Citas() {
  const [dates, setDates] = useLocalStorage('dates', () =>
    STARTER.map((s) => ({ id: uid(), ...s, done: false, createdAt: Date.now() }))
  );
  const [form, setForm] = useState({ title: '', category: 'aventura' });
  const [cat, setCat] = useState('todas');
  const [status, setStatus] = useState('pendientes');
  const [picked, setPicked] = useState(null);
  const [editId, setEditId] = useState(null);

  const visible = useMemo(
    () =>
      dates.filter(
        (d) =>
          (cat === 'todas' || d.category === cat) &&
          (status === 'todas' || (status === 'hechas' ? d.done : !d.done))
      ),
    [dates, cat, status]
  );
  const doneCount = dates.filter((d) => d.done).length;

  const save = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    if (editId) {
      setDates((prev) => prev.map((d) => (d.id === editId ? { ...d, title, category: form.category, updatedAt: Date.now() } : d)));
      setEditId(null);
    } else {
      setDates((prev) => [{ id: uid(), title, category: form.category, done: false, createdAt: Date.now() }, ...prev]);
    }
    setForm({ ...form, title: '' });
  };

  const startEdit = (d) => {
    setForm({ title: d.title, category: d.category });
    setEditId(d.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm({ ...form, title: '' });
    setEditId(null);
  };

  const toggle = (id) =>
    setDates((prev) => prev.map((d) => (d.id === id ? { ...d, done: !d.done, doneAt: !d.done ? Date.now() : null } : d)));

  const surprise = () => {
    const pool = dates.filter((d) => !d.done && (cat === 'todas' || d.category === cat));
    if (!pool.length) return setPicked({ title: 'No quedan ideas pendientes aquí. ¡Añade alguna nueva!' });
    setPicked(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div>
      <SectionHeader kicker="Misiones disponibles" title="Citas">
        Un tablón de ideas para salir de la rutina. Marca las que ya habéis vivido.
      </SectionHeader>

      {dates.length > 0 && <Progress done={doneCount} total={dates.length} label="Citas vividas" />}

      <form onSubmit={save} className={`card mb-4 space-y-3 ${editId ? 'border-neon-purple/60 shadow-neon' : ''}`}>
        {editId && <p className="label mb-0">Editando cita</p>}
        <input className="input" placeholder="Nueva idea de cita…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} onClick={() => setForm({ ...form, category: c.id })} className={`chip ${form.category === c.id ? 'chip-on' : 'chip-off'}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        {editId ? (
          <EditActions onCancel={cancelEdit} disabled={!form.title.trim()} />
        ) : (
          <button type="submit" className="btn-primary w-full" disabled={!form.title.trim()}>
            <PlusIcon /> Añadir idea
          </button>
        )}
      </form>

      <button type="button" className="btn-ghost mb-4 w-full" onClick={surprise}>
        <SparkIcon className="h-5 w-5 text-pink-300" /> Sorpréndeme con una cita
      </button>
      {picked && (
        <div className="card mb-4 border-neon-purple/60 text-center shadow-neon animate-fade-up">
          <p className="label">Misión seleccionada</p>
          <p className="text-lg font-semibold text-white">{picked.title}</p>
          <button type="button" className="mt-2 text-xs text-gray-500" onClick={() => setPicked(null)}>Cerrar</button>
        </div>
      )}

      <div className="mb-2 grid grid-cols-3 gap-2">
        {[
          ['pendientes', 'Pendientes'],
          ['hechas', 'Hechas'],
          ['todas', 'Todas'],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setStatus(id)} className={`chip ${status === id ? 'chip-on' : 'chip-off'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <button type="button" onClick={() => setCat('todas')} className={`chip ${cat === 'todas' ? 'chip-on' : 'chip-off'}`}>Todas</button>
        {CATEGORIES.map((c) => (
          <button type="button" key={c.id} onClick={() => setCat(c.id)} className={`chip ${cat === c.id ? 'chip-on' : 'chip-off'}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={MapPinIcon} text="Nada por aquí con estos filtros." />
      ) : (
        <ul className="space-y-2">
          {visible.map((d) => {
            const c = CATEGORIES.find((x) => x.id === d.category);
            return (
              <li key={d.id} className={`card flex items-center gap-3 py-3 transition ${d.done ? 'opacity-60' : ''}`}>
                <input type="checkbox" className="checkbox" checked={d.done} onChange={() => toggle(d.id)} aria-label="Marcar como realizada" />
                <div className="min-w-0 flex-1">
                  <p className={`break-words text-base font-medium text-white ${d.done ? 'line-through decoration-neon-purple' : ''}`}>{d.title}</p>
                  <p className="mt-0.5 text-xs text-violet-300/80">
                    {c?.emoji} {c?.label}
                    {d.done && d.doneAt && ` · ${new Date(d.doneAt).toLocaleDateString('es-ES')}`}
                  </p>
                </div>
                <EditButton onClick={() => startEdit(d)} />
                <DeleteButton
                  onClick={() => {
                    setDates((prev) => prev.filter((x) => x.id !== d.id));
                    if (editId === d.id) cancelEdit();
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
