import { $, el, mountChrome } from './common.js';
import { loadApps, appCard } from './catalog.js';

mountChrome('apps.html');
let all = [], filter = 'all';
const FILTERS = [['all', 'الكل'], ['available', 'متاح الآن'], ['pending', 'قيد الإعداد']];

function render() {
  const list = all.filter((a) => filter === 'all' || (filter === 'available' ? a.available : !a.available));
  $('#appsGrid').replaceChildren(...list.map(appCard)); $('#empty').hidden = list.length > 0;
}
(async () => {
  $('#chips').replaceChildren(...FILTERS.map(([k, t]) => { const b = el('button', { class: 'chip', 'aria-pressed': String(k === filter) }, t); b.addEventListener('click', () => { filter = k; [...$('#chips').children].forEach((c, i) => c.setAttribute('aria-pressed', String(FILTERS[i][0] === k))); render(); }); return b; }));
  const { items, error } = await loadApps(); all = items;
  if (error) { const a = $('#err'); a.textContent = error + ' (تظهر القائمة العامة فقط)'; a.hidden = false; }
  render();
})();
