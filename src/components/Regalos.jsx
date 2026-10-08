import { useMemo, useState } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage.js';
import { GiftIcon, PlusIcon } from './Icons.jsx';
import { DeleteButton, EditActions, EditButton, EmptyState, Progress, SectionHeader } from './ui.jsx';

const eur = (n) =>
  Number(n || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

function GiftRow({ g, onToggle, onRemove, onEdit }) {
  return (
    <li className={`card flex items-center gap-3 py-3 transition ${g.bought ? 'opacity-55' : ''}`}>
      <input type="checkbox" className="checkbox" checked={g.bought} onChange={() => onToggle(g.id)} aria-label={`Marcar ${g.name} como comprado`} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-base font-semibold text-white ${g.bought ? 'line-through decoration-neon-purple' : ''}`}>{g.name}</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-violet-300">{g.price ? eur(g.price) : 'Sin precio'}</span>
          {g.link && (
            <a href={g.link} target="_blank" rel="noopener noreferrer" className="truncate text-indigo-300 underline underline-offset-2">
              ver enlace
            </a>
          )}
        </div>
      </div>
      <EditButton onClick={() => onEdit(g)} />
      <DeleteButton onClick={() => onRemove(g.id)} />
    </li>
  );
}

export default function Regalos() {
  const [gifts, setGifts] = useLocalStorage('gifts', []);
  const [form, setForm] = useState({ name: '', price: '', link: '' });
  const [showBought, setShowBought] = useState(true);

  const { pending, bought, totals } = useMemo(() => {
    const sum = (list) => list.reduce((s, g) => s + (Number(g.price) || 0), 0);
    const p = gifts.filter((g) => !g.bought);
    const b = gifts.filter((g) => g.bought);
    return { pending: p, bought: b, totals: { pending: sum(p), spent: sum(b) } };
  }, [gifts]);

  const [editId, setEditId] = useState(null);

  const save = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const price = form.price === '' ? 0 : Math.max(0, parseFloat(String(form.price).replace(',', '.')) || 0);
    let link = form.link.trim();
    if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;
    if (editId) {
      setGifts((prev) => prev.map((g) => (g.id === editId ? { ...g, name, price, link, updatedAt: Date.now() } : g)));
    } else {
      setGifts((prev) => [{ id: uid(), name, price, link, bought: false, createdAt: Date.now() }, ...prev]);
    }
    cancelEdit();
  };

  const startEdit = (g) => {
    setForm({ name: g.name, price: g.price ? String(g.price).replace('.', ',') : '', link: g.link ?? '' });
    setEditId(g.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm({ name: '', price: '', link: '' });
    setEditId(null);
  };

  const toggle = (id) => setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, bought: !g.bought } : g)));
  const remove = (id) => {
    setGifts((prev) => prev.filter((g) => g.id !== id));
    if (editId === id) cancelEdit();
  };

  return (
    <div>
      <SectionHeader kicker="Wishlist encriptada" title="Regalos">
        Apunta lo que menciona de pasada. Ese es el regalo que nunca espera.
      </SectionHeader>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="card py-3 text-center">
          <p className="label">Pendiente</p>
          <p className="font-display text-xl font-bold text-white">{eur(totals.pending)}</p>
        </div>
        <div className="card py-3 text-center">
          <p className="label">Invertido</p>
          <p className="font-display text-xl font-bold text-pink-300">{eur(totals.spent)}</p>
        </div>
      </div>

      {gifts.length > 0 && <Progress done={bought.length} total={gifts.length} label="Comprados" />}

      <form onSubmit={save} className={`card mb-5 space-y-3 ${editId ? 'border-neon-purple/60 shadow-neon' : ''}`}>
        {editId && <p className="label mb-0">Editando regalo</p>}
        <input className="input" placeholder="¿Qué le gustaría?" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="flex gap-2">
          <div className="relative w-36 shrink-0">
            <input
              className="input pr-8"
              placeholder="Precio"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.,]/g, '') })}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
          </div>
          <input className="input" placeholder="Enlace (opcional)" inputMode="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        </div>
        {editId ? (
          <EditActions onCancel={cancelEdit} disabled={!form.name.trim()} />
        ) : (
          <button type="submit" className="btn-primary w-full" disabled={!form.name.trim()}>
            <PlusIcon /> Añadir a la lista
          </button>
        )}
      </form>

      {gifts.length === 0 ? (
        <EmptyState icon={GiftIcon} text="La lista está vacía. La próxima vez que diga «me encanta esto», apúntalo aquí." />
      ) : (
        <>
          <ul className="space-y-2">
            {pending.map((g) => (
              <GiftRow key={g.id} g={g} onToggle={toggle} onRemove={remove} onEdit={startEdit} />
            ))}
          </ul>
          {bought.length > 0 && (
            <div className="mt-6">
              <button type="button" className="mb-2 flex w-full items-center justify-between px-1 text-xs font-semibold uppercase tracking-widest text-gray-500" onClick={() => setShowBought((v) => !v)}>
                <span>Comprados ({bought.length})</span>
                <span>{showBought ? 'Ocultar' : 'Mostrar'}</span>
              </button>
              {showBought && (
                <ul className="space-y-2">
                  {bought.map((g) => (
                    <GiftRow key={g.id} g={g} onToggle={toggle} onRemove={remove} onEdit={startEdit} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
