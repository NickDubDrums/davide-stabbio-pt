# Davide PT Portfolio

Static site (HTML/CSS/JS) — GitHub Pages ready.

## Dev
- VS Code + Live Server
- `index.html`, `about.html`, `contact.html` leggono `/data/content.json`.

## Editor Mode
- Apri `/editor.html` → password (demo) `davide-2025` → modifica JSON → **Scarica** `content.json` → sostituisci in `/data/` via GitHub web.
- Cambia la password: in `/js/editor.js` sostituisci `ALLOWED_HASH` con l'hash SHA-256 della nuova password (puoi usare DevTools: `crypto.subtle` → oppure un tool locale).

## To-do
- Sostituire immagini placeholder in `/assets/images/`.
- Aggiornare contatti reali in `content.json`.
- (Opz.) EmailJS per invio form.
