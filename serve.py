#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lokaler Testserver fuer die KLARTEXT-PWA, der jede Antwort explizit als
"nicht cachen" markiert. Der eingebaute `python3 -m http.server` setzt keine
Cache-Control-Header - Safari (und andere Browser) duerfen dann alte Versionen
von app.js/style.css/service-worker.js aus dem eigenen HTTP-Cache ausliefern,
selbst nach einem harten Reload. Das fuehrt genau zu dem Symptom "ich habe die
Datei geaendert, aber im Browser passiert nichts".

Aufruf:
  python3 serve.py            # Port 8080
  python3 serve.py 8000       # anderer Port
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = HTTPServer(("localhost", port), NoCacheHandler)
    print(f"Server laeuft auf http://localhost:{port}/  (Strg+C zum Beenden)")
    print("Alle Antworten sind als 'nicht cachen' markiert - jede Aenderung wird sofort geladen.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer gestoppt.")
