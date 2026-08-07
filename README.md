# klartext-karten

Eigenständige, installierbare PWA für alle 22 KLARTEXT-Kartendecks — digitale Flip-Cards +
Volltextsuche. Kein Login, kein Backend, kein Framework, kein Build-Schritt: reines HTML/CSS/JS,
offline-fähig.

Bewusst getrennt von den anderen beiden KLARTEXT-Repos (siehe `klartext-app/KLARTEXT_Chat_Einstieg.md`
für den vollen Kontext):
- **`klartext-app`** — interne Case-Management-/Trainings-App (Supabase, Login, Fachkräfte/Träger).
- **`klartext-shop`** — Marketing-/Verkaufsseiten (`klartext-mentoring.de`).
- **`klartext-karten`** (dieses Repo) — die Kunden-App zum Ausprobieren/Nutzen der gekauften Decks.

Vorderseite antippen → dreht sich zur Rückseite mit Anleitung, Impulsfragen/Schritten und Tipp.
Suchleiste oben durchsucht Titel, Anleitungen, Fragen und Hinweise über alle Decks hinweg.

## Lokal testen

Service Worker brauchen `http://`, nicht `file://`. **`serve.py` verwenden, nicht
`python3 -m http.server`** — der eingebaute Server setzt keine Cache-Control-Header, wodurch
Safari geänderte Dateien oft trotz Neuladen aus dem Browser-Cache zeigt:

```bash
python3 serve.py
```

Dann im Browser öffnen: `http://localhost:8080`

Falls in Safari trotzdem eine alte Version erscheint: Einstellungen → Datenschutz →
„Website-Daten verwalten" → „localhost" suchen → entfernen.

## Deployment

Cloudflare Pages, eigenes Projekt, Custom Domain `karten.klartext-mentoring.de` (Root-Verzeichnis
dieses Repos direkt als Build-Ausgabe, kein Build-Command nötig).

## Struktur

```
index.html            Deck-Übersicht + Suche + Karten-Ansicht (eine Seite, kein Reload)
style.css              Alle Styles, Deckfarbe wird pro Deck per CSS-Variable gesetzt
app.js                  Lade-/Flip-/Such-/Navigations-Logik
manifest.json            PWA-Metadaten (Name, Icons, Startfarbe)
service-worker.js        Offline-Caching (App-Hülle + einmal geöffnete Decks)
icons/                    App-Icons (192px/512px, plus ein Icon pro Deck)
data/decks.json           Register aller 22 Decks (Titel, Farbe, Kategorie, Kartenzahl)
data/<id>.json             Ein JSON pro Deck (Kartentexte + Bildpfade)
data/search-index.json     Vorgebautes, flaches Suchregister über alle Decks (572 Karten)
images/<id>/                Komprimierte Kartenbilder
```

## Ein Deck aktualisieren / neu ergänzen

Die Kartentexte werden weiterhin in `klartext-app` gepflegt (`build_all_cards_<deck>.py`,
`pwa_export_deck.py`). Nach einer Änderung dort: die betroffene(n) `data/<id>.json`-Datei(en) und
bei Bedarf `images/<id>/` von `klartext-app/pwa/` hierher kopieren, danach
`data/search-index.json` neu generieren (Skript folgt/auf Anfrage) und die Service-Worker-
Cache-Version in `service-worker.js` erhöhen (`klartext-shell-vXX`), sonst bekommen
Bestandsnutzer:innen die Änderung nicht zu sehen.
