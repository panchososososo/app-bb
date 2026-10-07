import { useEffect, useRef, useState } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage.js';
import { LETTER_PROMPTS } from '../data/letterPrompts.js';
import { ChevronIcon, CopyIcon, PenIcon, SparkIcon } from './Icons.jsx';
import { DeleteButton, EmptyState, SectionHeader } from './ui.jsx';

const EMPTY = { id: null, title: '', body: '', promptId: null };

export default function Cartas() {
  const [letters, setLetters] = useLocalStorage('letters', []);
  const [draft, setDraft] = useLocalStorage('letter-draft', EMPTY); // el borrador se autoguarda
  const [openPrompt, setOpenPrompt] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0;

  const applyPrompt = (p) => {
    const hasText = draft.body.trim().length > 0;
    if (hasText && !window.confirm('¿Añadir la plantilla al final de lo que ya llevas escrito?')) return;
    setDraft((d) => ({
      ...d,
      title: d.title || p.title,
      body: hasText ? `${d.body}\n\n${p.starter}` : p.starter,
      promptId: p.id,
    }));
    setTimeout(() => {
      editorRef.current?.focus();
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const save = () => {
    if (!draft.body.trim()) return;
    const now = Date.now();
    const letter = {
      ...draft,
      id: draft.id ?? uid(),
      title: draft.title.trim() || 'Sin título',
      updatedAt: now,
      createdAt: draft.createdAt ?? now,
    };
    setLetters((prev) => (draft.id ? prev.map((l) => (l.id === draft.id ? letter : l)) : [letter, ...prev]));
    setDraft(EMPTY);
    setToast('Carta guardada 💜');
  };

  const edit = (l) => {
    if (draft.body.trim() && draft.id !== l.id && !window.confirm('Tienes un borrador sin guardar. ¿Reemplazarlo?')) return;
    setDraft(l);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copy = async (text) => {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setToast('Copiada al portapapeles');
    } catch {
      /* el usuario canceló el diálogo de compartir */
    }
  };

  return (
    <div>
      <SectionHeader kicker="Canal cifrado" title="Cartas">
        Escribe sin prisa. El borrador se guarda solo mientras escribes.
      </SectionHeader>

      {/* Prompts creativos */}
      <section className="mb-5">
        <div className="mb-2 flex items-center gap-2 px-1">
          <SparkIcon className="h-4 w-4 text-pink-300" />
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">¿Bloqueado? Prueba una idea</p>
        </div>
        <ul className="space-y-2">
          {LETTER_PROMPTS.map((p) => {
            const isOpen = openPrompt === p.id;
            return (
              <li key={p.id} className={`card overflow-hidden p-0 transition ${isOpen ? 'border-neon-purple/60 shadow-neon' : ''}`}>
                <button type="button" className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenPrompt(isOpen ? null : p.id)} aria-expanded={isOpen}>
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="flex-1 text-base font-semibold text-white">{p.title}</span>
                  <ChevronIcon className={`h-5 w-5 text-gray-500 transition ${isOpen ? 'rotate-180 text-violet-300' : ''}`} />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-neon-violet/20 px-4 pb-4 pt-3 animate-fade-up">
                    <p className="text-[15px] leading-relaxed text-gray-300">{p.hint}</p>
                    <button type="button" className="btn-primary w-full" onClick={() => applyPrompt(p)}>
                      <PenIcon className="h-5 w-5" /> Empezar con esta idea
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Editor */}
      <section className="card mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="label mb-0">{draft.id ? 'Editando carta' : 'Nueva carta'}</p>
          <span className="text-xs text-gray-500">{words} palabras</span>
        </div>
        <input className="input font-semibold" placeholder="Título (opcional)" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
        <textarea
          ref={editorRef}
          className="input min-h-[280px] resize-y font-serif text-[17px] leading-8"
          placeholder="Querida…"
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost flex-1"
            disabled={!draft.body && !draft.title}
            onClick={() => {
              if (window.confirm('¿Descartar el borrador?')) setDraft(EMPTY);
            }}
          >
            Descartar
          </button>
          <button type="button" className="btn-primary flex-1" onClick={save} disabled={!draft.body.trim()}>
            {draft.id ? 'Actualizar' : 'Guardar carta'}
          </button>
        </div>
      </section>

      {/* Archivo */}
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Archivo ({letters.length})</p>
      {letters.length === 0 ? (
        <EmptyState icon={PenIcon} text="Tus cartas guardadas aparecerán aquí, listas para releer o enviar." />
      ) : (
        <ul className="space-y-2">
          {letters.map((l) => {
            const isOpen = expanded === l.id;
            const prompt = LETTER_PROMPTS.find((p) => p.id === l.promptId);
            return (
              <li key={l.id} className="card">
                <button type="button" className="w-full text-left" onClick={() => setExpanded(isOpen ? null : l.id)}>
                  <p className="text-base font-semibold text-white">
                    {prompt?.emoji ?? '✉️'} {l.title}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(l.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {!isOpen && <p className="mt-2 line-clamp-2 text-sm text-gray-400">{l.body}</p>}
                </button>
                {isOpen && (
                  <div className="animate-fade-up">
                    <p className="mt-3 whitespace-pre-wrap break-words font-serif text-[16px] leading-7 text-gray-200">{l.body}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <button type="button" className="btn-ghost flex-1" onClick={() => edit(l)}>Editar</button>
                      <button type="button" className="btn-ghost flex-1" onClick={() => copy(l.body)}>
                        <CopyIcon className="h-5 w-5" /> Enviar
                      </button>
                      <DeleteButton onClick={() => setLetters((prev) => prev.filter((x) => x.id !== l.id))} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="rounded-full border border-neon-purple/50 bg-void-900 px-5 py-3 text-sm font-semibold text-white shadow-neon animate-fade-up">{toast}</div>
        </div>
      )}
    </div>
  );
}
