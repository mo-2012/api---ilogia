import { $, el, mountChrome, fmtDate } from './common.js';
import { api } from './api.js';
import { loadApps, appCard } from './catalog.js';

mountChrome('index.html');

async function board() {
  const ul = $('#boardList'); ul.replaceChildren(el('li', {}, el('span', { class: 'dot' }), 'جارٍ الفحص…'));
  const row = (label, state, text) => el('li', {}, el('span', { class: 'dot ' + state }), label, el('span', { class: 'v' }, text));
  const rows = [];
  try {
    const h = await api('/health', { auth: false });
    rows.push(row('الخدمة', 'ok', 'تعمل'), row('الإصدار', 'ok', h.version));
    try {
      const r = await api('/health/ready', { auth: false }).catch((e) => (e.status === 503 ? { status: 'not_ready', checks: {} } : Promise.reject(e)));
      const c = r.checks || {};
      rows.push(row('المصادقة', c.auth === 'ok' ? 'ok' : 'warn', c.auth === 'ok' ? 'جاهزة' : 'غير جاهزة'), row('قاعدة البيانات', c.database === 'ok' ? 'ok' : 'warn', c.database === 'ok' ? 'جاهزة' : 'غير جاهزة'));
    } catch { rows.push(row('الجاهزية', 'warn', 'تعذّر الفحص')); }
  } catch (e) { rows.push(row('الخدمة', 'bad', 'غير متاحة')); $('#boardNote').textContent = e.message; $('#boardNote').hidden = false; }
  ul.replaceChildren(...rows); $('#boardTime').textContent = 'آخر فحص: ' + fmtDate(Date.now());
}
$('#recheck').addEventListener('click', board);
board();

(async () => {
  const { items } = await loadApps(); const g = $('#appsPreview'); g.replaceChildren(...items.slice(0, 4).map(appCard));
})();
