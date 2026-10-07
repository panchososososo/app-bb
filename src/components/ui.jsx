import { TrashIcon } from './Icons.jsx';

export function SectionHeader({ kicker, title, children }) {
  return (
    <header className="mb-5">
      <p className="label">{kicker}</p>
      <h1 className="section-title">{title}</h1>
      {children && <p className="mt-2 text-sm leading-relaxed text-gray-400">{children}</p>}
    </header>
  );
}

export function EmptyState({ icon: Icon, text }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center">
      {Icon && <Icon className="h-10 w-10 text-neon-violet/60" />}
      <p className="max-w-[16rem] text-sm text-gray-400">{text}</p>
    </div>
  );
}

export function DeleteButton({ onClick, label = 'Eliminar' }) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      onClick={() => {
        if (window.confirm('¿Seguro que quieres eliminarlo?')) onClick();
      }}
    >
      <TrashIcon className="h-5 w-5" />
    </button>
  );
}

export function Progress({ done, total, label }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-semibold text-violet-300">
          {done}/{total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-void-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-indigo shadow-neon-sm transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
