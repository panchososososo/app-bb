import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Dashboard from './components/Dashboard.jsx';
import Acuerdos from './components/Acuerdos.jsx';
import Regalos from './components/Regalos.jsx';
import Citas from './components/Citas.jsx';
import Cartas from './components/Cartas.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';

const SECTIONS = {
  inicio: Dashboard,
  acuerdos: Acuerdos,
  regalos: Regalos,
  citas: Citas,
  cartas: Cartas,
};

export default function App() {
  const [tab, setTab] = useLocalStorage('tab', 'inicio');
  const [animKey, setAnimKey] = useState(0);
  const Section = SECTIONS[tab] ?? Dashboard;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setAnimKey((k) => k + 1);
  }, [tab]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
      <main
        key={animKey}
        className="flex-1 px-4 pb-32 animate-fade-up"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}
      >
        <Section />
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
