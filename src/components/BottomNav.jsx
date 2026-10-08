import { StarIcon, GiftIcon, HandshakeIcon, HeartIcon, MapPinIcon, PenIcon } from './Icons.jsx';

const ITEMS = [
  { id: 'inicio', label: 'Inicio', Icon: HeartIcon },
  { id: 'gustos', label: 'Gustos', Icon: StarIcon },
  { id: 'acuerdos', label: 'Acuerdos', Icon: HandshakeIcon },
  { id: 'regalos', label: 'Regalos', Icon: GiftIcon },
  { id: 'citas', label: 'Citas', Icon: MapPinIcon },
  { id: 'cartas', label: 'Cartas', Icon: PenIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-neon-violet/25 bg-void-950/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-[68px] w-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold tracking-normal transition ${
                  isActive ? 'text-white' : 'text-gray-500 active:text-violet-300'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 h-1 w-10 rounded-b-full bg-gradient-to-r from-neon-purple to-neon-indigo shadow-neon" />
                )}
                <span
                  className={`flex h-9 w-11 items-center justify-center rounded-xl transition ${
                    isActive ? 'bg-neon-purple/20 shadow-neon-sm' : ''
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'drop-shadow-[0_0_6px_rgba(176,38,255,0.9)]' : ''}`} />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

