import { mountAccess, renderAccess } from './koykan-access.js';
const TASKS = 'https://koykan-tasks.koykan.workers.dev';
const BOARDS = 'https://koykan-boards.koykan.workers.dev';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let key = ''; try { key = localStorage.getItem('koykan_key') || ''; } catch (e) {}
const dash = document.getElementById('dash'), boards = document.getElementById('boards');
if (!key) {
  dash.innerHTML = '<p class="muted">Otvori stranicu osobnim Koykan ključem (link s <code>#k=</code> ključem s Koykan Home).</p>';
} else {
  mountAccess(dash, { key, base: TASKS });
  (async () => {
    try {
      const r = await fetch(BOARDS + '/api/access', { headers: { authorization: 'Bearer ' + key } });
      if (!r.ok) { boards.innerHTML = '<p class="muted">Ova stranica je samo za Doma.</p>'; return; }
      const list = await r.json();
      let html = (list.extra || []).map((x) => '<h3>' + esc(x.title) + '</h3><div class="tablewrap"><table><thead><tr>' + x.columns.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
        x.rows.map((row) => '<tr>' + row.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>').join('');
      boards.innerHTML = html;
      for (const b of list.boards || []) {
        const det = document.createElement('details'); det.className = 'sec';
        det.innerHTML = '<summary>Board ' + esc(b) + '</summary><div class="body muted">Učitavam…</div>';
        boards.appendChild(det);
        let loaded = false;
        det.addEventListener('toggle', async () => {
          if (!det.open || loaded) return; loaded = true;
          const body = det.querySelector('.body');
          try {
            const rr = await fetch(BOARDS + '/api/access?board=' + encodeURIComponent(b), { headers: { authorization: 'Bearer ' + key } });
            if (!rr.ok) throw new Error('HTTP ' + rr.status);
            body.className = 'body'; body.innerHTML = renderAccess(await rr.json());
          } catch (e) { body.innerHTML = '<span class="err">Ne mogu učitati (' + esc(e.message) + ').</span>'; loaded = false; }
        });
      }
    } catch (e) { boards.innerHTML = '<div class="err">Boardovi se ne mogu učitati (' + esc(e.message) + ').</div>'; }
  })();
}
