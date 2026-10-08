import { useMemo, useState } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage.js';
import { PlusIcon, StarIcon } from './Icons.jsx';
import { DeleteButton, EditActions, EditButton, EmptyState, SectionHeader } from './ui.jsx';

export const LIKE_CATEGORIES = [
  { id: 'comida', label: 'Comida', emoji: '🍓' },
  { id: 'musica', label: 'Música', emoji: '🎧' },
  { id: 'pelis', label: 'Pelis y series', emoji: '🎬' },
  { id: 'lugares', label: 'Lugares', emoji: '📍' },
  { id: 'flores', label: 'Flores y colores', emoji: '🌷' },
  { id: 'estilo', label: 'Ropa y marcas', emoji: '👗' },
  { id: 'detalles', label: 'Detalles', emoji: '💌' },
  { id: 'otros', label: 'Otros', emoji: '✨' },
];

const EMPTY_FORM = { name: '', note: '', category: 'comida' };
const catOf = (id) => LIKE_CATEGORIES.find((c) => c.id === id) ?? LIKE_CATEGORIES.at(-1);

function CategoryChips({ value, onChange }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {LIKE_CATEGORIES.map((c) => (
        <button type="button" key={c.id} onClick={() => onChange(c.id)} className={`chip ${value === c.id ? 'chip-on' : 'chip-off'}`}>
          {c.emoji} {c.label}
        </button>
      ))}
    </div>
  );
}

function LikeForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initial);
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, name: form.name.trim(), note: form.note.trim() });
    if (!onCancel) setForm({ ...EMPTY_FORM, category: form.category });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="input" placeholder="Ej: el helado de pistacho" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="input" placeholder="Detalle (opcional): dónde, cuál, talla…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      <CategoryChips value={form.category} onChange={(category) => setForm({ ...form, category })} />
      {onCancel ? (
        <EditActions onCancel={onCancel} disabled={!form.name.trim()} />
      ) : (
        <button type="submit" className="btn-primary w-full" disabled={!form.name.trim()}>
          <PlusIcon /> {submitLabel}
        </button>
      )}
    </form>
  );
}

export default function Gustos() {
  const [likes, setLikes] = useLocalStorage('likes', []);
  const [filter, setFilter] = useState('todas');
  const [editingId, setEditingId] = useState(null);

  const groups = useMemo(() => {
    const visible = likes.filter((l) => filter === 'todas' || l.category === filter);
    return LIKE_CATEGORIES.map((c) => [c, visible.filter((l) => catOf(l.category).id === c.id)]).filter(([, items]) => items.length);
  }, [likes, filter]);

  const add = (data) => setLikes((prev) => [{ id: uid(), ...data, createdAt: Date.now() }, ...prev]);
  const update = (id, data) => {
    setLikes((prev) => prev.map((l) => (l.id === id ? { ...l, ...data, updatedAt: Date.now() } : l)));
    setEditingId(null);
  };

  return (
    <div>
      <SectionHeader kicker="Base de datos del corazón" title="Gustos">
        Todo lo que le encanta, en un solo lugar. Útil para regalos, citas y sorpresas.
      </SectionHeader>

      <div className="card mb-5">
        <LikeForm initial={EMPTY_FORM} onSubmit={add} submitLabel="Guardar gusto" />
      </div>

      {likes.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          <button type="button" onClick={() => setFilter('todas')} className={`chip ${filter === 'todas' ? 'chip-on' : 'chip-off'}`}>
            Todas ({likes.length})
          </button>
          {LIKE_CATEGORIES.filter((c) => likes.some((l) => catOf(l.category).id === c.id)).map((c) => (
            <button type="button" key={c.id} onClick={() => setFilter(c.id)} className={`chip ${filter === c.id ? 'chip-on' : 'chip-off'}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState icon={StarIcon} text="¿Su comida favorita? ¿La canción que siempre canta? Empieza a anotarlo aquí." />
      ) : (
        <div className="space-y-5">
          {groups.map(([cat, items]) => (
            <section key={cat.id}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
                {cat.emoji} {cat.label}
              </p>
              <ul className="space-y-2">
                {items.map((l) =>
                  editingId === l.id ? (
                    <li key={l.id} className="card border-neon-purple/60 shadow-neon animate-fade-up">
                      <LikeForm initial={{ name: l.name, note: l.note ?? '', category: l.category }} onSubmit={(data) => update(l.id, data)} onCancel={() => setEditingId(null)} />
                    </li>
                  ) : (
                    <li key={l.id} className="card flex items-center gap-3 py-3">
                      <StarIcon className="h-5 w-5 shrink-0 text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,.8)]" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-semibold text-white">{l.name}</p>
                        {l.note && <p className="break-words text-sm text-gray-400">{l.note}</p>}
                      </div>
                      <EditButton onClick={() => setEditingId(l.id)} />
                      <DeleteButton onClick={() => setLikes((prev) => prev.filter((x) => x.id !== l.id))} />
                    </li>
                  )
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
