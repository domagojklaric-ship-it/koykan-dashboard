# koykan-dashboard

## Sigurnost val 2 (20.11.2026.)
- **CSP (B3):** svaka stranica ima `<meta http-equiv="Content-Security-Policy">`: `default-src 'self'`, skripte samo iz datoteka (bez inline skripti i `onclick` atributa), stilovi iz datoteka i Google Fonts, `connect-src` samo koykan-tasks i koykan-boards (Obveze još i Google Apps Script). Inline skripte i stilovi su izdvojeni u `index-N.js` / `index.css` uz svaku stranicu; stilovi koje JS dodaje idu preko `adoptedStyleSheets` (`kyCss` u `shell.js`).
- **C11:** link na koraku je poveznica samo ako je `http(s)://`; sve ostalo se prikazuje kao tekst (svih 11 boardova i ladica).
- **C2:** "Obriši" je sada "Odbaci" uz obavezan razlog (worker v11 ne briše, nego označava `dropped`).
- **A2:** KCEP i `kcep/gantt.html` rade samo s osobnim ključem; Gantt čita koykan-boards (stari Apps Script više ne postoji).
- Lokalni pregled: `.claude/launch.json` konfiguracija `koykan-mock-sig2` (lažni API, bez ključeva; localStorage `koykan_secret`='mock', `ky_full`='1' postaviti ručno).
