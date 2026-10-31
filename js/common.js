import { CONFIG } from './config.js';
import { icon } from './icons.js';

export const $ = (s, r = document) => r.querySelector(s);
export const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v === false || v == null) continue; k === 'class' ? (n.className = v) : k === 'html' ? (n.innerHTML = v) : n.setAttribute(k, v === true ? '' : v); }
  n.append(...kids.flat().filter((x) => x != null && x !== false));
  return n;
};
export const fmtDate = (d) => { try { return new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };

const NAV = [['index.html', 'الرئيسية'], ['apps.html', 'التطبيقات'], ['docs.html', 'للمطورين'], ['account.html', 'حسابي']];

export function mountChrome(page) {
  const theme = document.documentElement.dataset.theme;
  $('#top').innerHTML = `<header class="top"><div class="wrap in">
    <a class="brand" href="index.html"><img src="logo-mark.png" alt="" width="42" height="42"><span><b>iLogia</b><small>الخدمات المشتركة</small></span></a>
    <nav class="pillnav" id="pnav" aria-label="التنقل">${NAV.map(([h, t]) => `<a href="${h}" ${h === page ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    <button class="icon-btn" id="themeBtn" aria-label="تبديل الوضع الليلي">${icon(theme === 'dark' ? 'sun' : 'moon', 20)}</button>
    <button class="icon-btn menu" id="menuBtn" aria-label="القائمة" aria-expanded="false">${icon('menu', 20)}</button>
  </div></header>`;
  $('#foot').innerHTML = `<footer class="foot-site"><div class="wrap"><div class="cols">
    <div><h4>iLogia</h4><p>حساب واحد وخدمات مشتركة لكل تطبيقات iLogia التعليمية.</p></div>
    <div><h4>الموقع</h4><a href="${CONFIG.MAIN_SITE}">الموقع الرئيسي</a><a href="apps.html">التطبيقات</a><a href="account.html">حسابي</a></div>
    <div><h4>للمطورين</h4><a href="docs.html">دليل الواجهة</a><a href="${CONFIG.API_BASE}/docs" target="_blank" rel="noopener">التوثيق التفاعلي</a></div>
  </div><div class="base">© iLogia</div></div></footer>`;
  $('#themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; try { localStorage.setItem('ilogia-theme', next); } catch {}
    $('#themeBtn').innerHTML = icon(next === 'dark' ? 'sun' : 'moon', 20);
  });
  $('#menuBtn').addEventListener('click', (e) => { const o = $('#pnav').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(o)); });
}
