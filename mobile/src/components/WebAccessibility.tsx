import { useEffect, useState } from 'react';

export default function WebAccessibility() {
  const [open, setOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [largeCursor, setLargeCursor] = useState(false);
  const [fontScale, setFontScale] = useState(100);

  useEffect(() => {
    document.body.classList.toggle('eci-accessibility-contrast', contrast);
    document.body.classList.toggle('eci-accessibility-large-cursor', largeCursor);
    document.documentElement.style.fontSize = `${fontScale}%`;
    return () => {
      document.body.classList.remove('eci-accessibility-contrast', 'eci-accessibility-large-cursor');
      document.documentElement.style.fontSize = '';
    };
  }, [contrast, largeCursor, fontScale]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const speak = (selectionOnly = false) => {
    const text = selectionOnly ? window.getSelection()?.toString() : document.querySelector('main')?.textContent;
    if (!text?.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 12000));
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  return <div className="eci-web-accessibility" role="region" aria-label="Ferramentas de acessibilidade">
    {open && <div className="eci-web-accessibility-menu" role="dialog" aria-label="Opções de acessibilidade">
      <button type="button" aria-pressed={contrast} onClick={() => setContrast(value => !value)}>🎨 Alternar cores</button>
      <button type="button" onClick={() => setFontScale(value => Math.min(150, value + 10))}>🔍 Aumentar fonte ({fontScale}%)</button>
      <button type="button" onClick={() => setFontScale(value => Math.max(70, value - 10))}>🔎 Diminuir fonte</button>
      <button type="button" aria-pressed={largeCursor} onClick={() => setLargeCursor(value => !value)}>🖱️ Cursor maior</button>
      <button type="button" onClick={() => speak()}>🔊 Ler página</button>
      <button type="button" onClick={() => speak(true)}>🔊 Ler seleção</button>
      <button type="button" onClick={() => window.speechSynthesis.cancel()}>🔇 Parar leitura</button>
    </div>}
    <button className="eci-web-accessibility-trigger" type="button" aria-label="Abrir menu de acessibilidade" aria-expanded={open} onClick={() => setOpen(value => !value)}><span className="material-symbols-outlined" aria-hidden="true">accessibility_new</span></button>
  </div>;
}
