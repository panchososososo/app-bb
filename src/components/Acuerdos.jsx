import { useMemo, useState } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage.js';
import { HandshakeIcon, PlusIcon } from './Icons.jsx';
import { DeleteButton, EditButton, EmptyState, Progress, SectionHeader } from './ui.jsx';

const TYPES = [
  { id: 'promesa', label: 'Promesa', emoji: '🤞' },
  { id: 'dinamica', label: 'Dinámica', emoji: '🔁' },
  { id: 'regla', label: 'Regla de oro', emoji: '✨' },
];

const WHO = [
  { id: 'ambos', label: 'Ambos' },
  { id: 'yo', label: 'Yo' },
  { id: 'ella', label: 'Ella' },
];

const FILTERS = [{ id: 'todos', label: 'Todos' }, ...TYPES];

export default function Acuerdos() {
  const [items, setItems] = useLocalStorage('agreements', []);
  const [form, setForm] = useState({ title: '', detail: '', type: 'promesa', who: 'ambos' });
  const [filter, setFilter] = useState('todos');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const visible = useMemo(
    () => items.filter((i) => filter === 'todos' || i.type === filter),
    [items, filter]
  );
  const kept = items.filter((i) => i.done).length;

  const closeForm = () => {
    setForm({ title: '', detail: '', type: form.type, who: 'ambos' });
    setEditId(null);
    setOpen(false);
  };

  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const data = { title: form.title.trim(), detail: form.detail.trim(), type: form.type, who: form.who };
    if (editId) {
      setItems((prev) => prev.map((i) => (i.id === editId ? { ...i, ...data, updatedAt: Date.now() } : i)));
    } else {
      setItems((prev) => [{ id: uid(), ...data, done: false, createdAt: Date.now() }, ...prev]);
    }
    closeForm();
  };

  const startEdit = (i) => {
    setForm({ title: i.title, detail: i.detail ?? '', type: i.type, who: i.who });
    setEditId(i.id);
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = (id) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done, doneAt: !i.done ? Date.now() : null } : i)));

  return (
    <div>
      <SectionHeader kicker="Protocolo compartido" title="Acuerdos">
        Promesas, dinámicas y reglas que construís juntos. Márcalas cuando se cumplan o se consoliden.
      </SectionHeader>

      {items.length > 0 && <Progress done={kept} total={items.length} label="Cumplidos / consolidados" />}

      {open ? (
        <form onSubmit={save} className={`card mb-5 space-y-3 animate-fade-up ${editId ? 'border-neon-purple/60 shadow-neon' : ''}`}>
          {editId && <p className="label mb-0">Editando acuerdo</p>}
          <input className="input" placeholder="Ej: Nada de móviles en la cena" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          <textarea className="input min-h-[88px] resize-none" placeholder="Detalles, por qué es importante, cuándo aplica…" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          <div>
            <span className="label">Tipo</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button type="button" key={t.id} onClick={() => setForm({ ...form, type: t.id })} className={`chip ${form.type === t.id ? 'chip-on' : 'chip-off'}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">¿Quién se compromete?</span>
            <div className="flex gap-2">
              {WHO.map((w) => (
                <button type="button" key={w.id} onClick={() => setForm({ ...form, who: w.id })} className={`chip flex-1 ${form.who === w.id ? 'chip-on' : 'chip-off'}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={closeForm}>Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={!form.title.trim()}>{editId ? 'Guardar cambios' : 'Guardar'}</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-primary mb-5 w-full" onClick={() => setOpen(true)}>
          <PlusIcon /> Nuevo acuerdo
        </button>
      )}

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? 'chip-on' : 'chip-off'}`}>
            {f.emoji ? `${f.emoji} ` : ''}{f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={HandshakeIcon} text="Aún no hay acuerdos aquí. Empieza por algo pequeño que ambos queráis cuidar." />
      ) : (
        <ul className="space-y-3">
          {visible.map((i) => {
            const type = TYPES.find((t) => t.id === i.type);
            const who = WHO.find((w) => w.id === i.who);
            return (
              <li key={i.id} className={`card flex items-start gap-3 transition ${i.done ? 'opacity-60' : ''}`}>
                <input type="checkbox" className="checkbox mt-0.5" checked={i.done} onChange={() => toggle(i.id)} aria-label="Marcar como cumplido" />
                <div className="min-w-0 flex-1">
                  <p className={`break-words text-base font-semibold text-white ${i.done ? 'line-through decoration-neon-purple' : ''}`}>{i.title}</p>
                  {i.detail && <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-gray-400">{i.detail}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-neon-indigo/15 px-2.5 py-1 text-indigo-200">{type?.emoji} {type?.label}</span>
                    <span className="rounded-full bg-neon-purple/15 px-2.5 py-1 text-violet-200">{who?.label}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <EditButton onClick={() => startEdit(i)} />
                  <DeleteButton
                    onClick={() => {
                      setItems((prev) => prev.filter((x) => x.id !== i.id));
                      if (editId === i.id) closeForm();
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
