import { useEffect } from 'react';

declare global {
  interface Window { VLibras?: { Widget: new (root: string) => unknown } }
}

export default function VLibras() {
  useEffect(() => {
    if (document.querySelector('[vw]')) return;
    const widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled';
    widget.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(widget);
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    // The official script initializes the widget automatically.
    document.body.appendChild(script);
    return () => { widget.remove(); script.remove(); };
  }, []);
  return null;
}
