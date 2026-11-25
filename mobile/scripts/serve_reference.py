"""Serve a referência visual histórica e seus recursos locais para testes."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

BASE = Path(__file__).resolve().parents[1]


class ReferenceHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parts = [part for part in unquote(urlsplit(path).path).replace('\\', '/').split('/')
                 if part and part not in ('.', '..')]
        public = parts and parts[0] in ('img', 'codigo_etica.pdf', 'CÓDIGO DE ÉTICA E CONDUTA ECI.docx')
        base = (BASE / ('public' if public else 'reference')).resolve()
        target = base.joinpath(*parts).resolve()
        return str(target if target.is_relative_to(base) else base / '__invalid_path__')


if __name__ == '__main__':
    print('Referência visual: http://localhost:5501', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 5501), ReferenceHandler).serve_forever()
