import { useEffect } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Dashboard from './components/Dashboard.jsx';
import Acuerdos from './components/Acuerdos.jsx';
import Regalos from './components/Regalos.jsx';
import Citas from './components/Citas.jsx';
import Cartas from './components/Cartas.jsx';
import Login from './components/Login.jsx';
import SyncBadge from './components/SyncBadge.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useSync } from './hooks/useSync.js';

const SECTIONS = {
  inicio: Dashboard,
  acuerdos: Acuerdos,
  regalos: Regalos,
  citas: Citas,
  cartas: Cartas,
};

export default function App() {
  const [tab, setTab] = useLocalStorage('tab', 'inicio');
  const sync = useSync();
  const Section = SECTIONS[tab] ?? Dashboard;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  if (sync.enabled && !sync.ready) return <div className="min-h-[100dvh]" />;
  if (sync.enabled && !sync.user && !sync.localOnly) return <Login />;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
      <main
        key={tab}
        className="flex-1 px-4 pb-32 animate-fade-up"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
        <Section />
      </main>
      <SyncBadge />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
