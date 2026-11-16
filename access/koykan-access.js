// Koykan access overview shared by the internal Koykan apps (docs/KOYKAN_APPS_STANDARD.md §2 "Pregled pristupa").
// Source of truth: koykan-platform/public/koykan-access.js. Copy it unchanged into every app.
// Only Dom sees it (koykan-auth.js canSeeAccess: user id, never role). The app answers GET /api/access with
//   { app, people: [...] }                       from sharedAppAccess(env)
//   + stores: { <store id>: <name> }             optional, from sharedStores(env)
//   + extra: [{ title, columns: [..], rows: [[..]] }]   optional, app-specific access (e.g. Shifts store keys, tablets)
// and 404 for everyone else. Access is changed only in koykan-platform (npm run key), never here.
//   import { mountAccess } from './koykan-access.js';  mountAccess(element, { key });

/** What each role means, in the words of the standard (§3). */
export const ROLE_TEXT = {
  admin: 'everything in this app',
  area: 'all stores of their scope; approves and controls',
  manager: 'own store only',
  editor: 'edits content (own items where the app says so)',
  viewer: 'reads only',
  store: 'store tablet, only the store screens',
};
const ROLE_ORDER = ['admin', 'area', 'manager', 'editor', 'viewer', 'store'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** "2026-11-16T12:01:00Z" -> "16.11.2026." (Dom's date format). */
export function hrDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return isNaN(d) ? '–' : `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
}
/** Scope of one person as plain words: "all stores", "partner X", or store names. */
export function scopeText(p, stores = {}) {
  const sc = p.scopes && p.scopes.length ? p.scopes : (p.store_id ? [{ scope_type: 'store', scope_id: p.store_id }] : [{ scope_type: 'all', scope_id: '*' }]);
  return sc.map((s) => s.scope_type === 'all' ? 'all stores' : s.scope_type === 'org' ? `partner ${s.scope_id}` : (stores[s.scope_id] || s.scope_id)).join(', ');
}
/** Counts per role of active people, in role order: [[role, n]]. */
export function roleCounts(people) {
  const n = {};
  for (const p of people) if (p.active) n[p.role] = (n[p.role] || 0) + 1;
  return ROLE_ORDER.filter((r) => n[r]).map((r) => [r, n[r]]).concat(Object.keys(n).filter((r) => !ROLE_ORDER.includes(r)).map((r) => [r, n[r]]));
}

/** Renders the overview from an /api/access answer (pure, tested). */
export function renderAccess(data) {
  const people = data.people || [], stores = data.stores || {}, active = people.filter((p) => p.active);
  const counts = roleCounts(people).map(([r, n]) => `<b>${n}</b> ${esc(r)}`).join(' · ');
  const rows = people.map((p) => `<tr${p.active ? '' : ' class="muted"'}>
    <td><b>${esc(p.name)}</b>${p.title ? `<div class="muted small">${esc(p.title)}</div>` : ''}</td>
    <td><b>${esc(p.role)}</b><div class="muted small">${esc(ROLE_TEXT[p.role] || '')}</div></td>
    <td>${esc(scopeText(p, stores))}</td>
    <td>${p.email ? esc(p.email) : '<span class="muted">–</span>'}</td>
    <td>${p.active ? (p.keys ? `since ${hrDate(p.key_since)}` : '<span class="muted">no key</span>') : '<b>inactive</b>'}</td>
    <td>${hrDate(p.changed_at)}</td></tr>`).join('');
  const extra = (data.extra || []).map((x) => `<h3>${esc(x.title)}</h3><div class="tablewrap"><table>
    <thead><tr>${x.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${x.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${x.columns.length}" class="muted">none</td></tr>`}</tbody></table></div>`).join('');
  return `<div class="kaccess">
  <p><b>${active.length}</b> people with access${counts ? ` · ${counts}` : ''}${people.length > active.length ? ` · ${people.length - active.length} inactive` : ''}</p>
  <div class="tablewrap"><table>
    <thead><tr><th>Person</th><th>Role</th><th>Scope</th><th>Email</th><th>Personal key</th><th>Last change</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="muted">Nobody has access to this app.</td></tr>'}</tbody></table></div>
  ${extra}
  <p class="muted small">Only Dom sees this page. Keys are never shown. Access is changed only through koykan-platform (Dom's OK, audit log in koykan-auth).</p>
</div>`;
}

/** Loads GET /api/access with the viewer's key and renders it into el. 404 = not Dom: shows nothing but a short line. */
export async function mountAccess(el, { key, base = '' } = {}) {
  el.innerHTML = '<p class="muted">Loading access…</p>';
  try {
    const r = await fetch(`${base}/api/access`, { headers: { authorization: 'Bearer ' + key } });
    if (r.status === 404 || r.status === 403) { el.innerHTML = '<p class="muted">This page is for Dom only.</p>'; return null; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    el.innerHTML = renderAccess(data);
    return data;
  } catch (e) {
    el.innerHTML = `<div class="err">Access overview could not load (${esc(e.message)}).</div>`;
    return null;
  }
}
