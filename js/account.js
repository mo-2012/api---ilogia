import { $, el, mountChrome, fmtDate } from './common.js';
import { api, signIn, session } from './api.js';
import { icon } from './icons.js';
import { CONFIG } from './config.js';

mountChrome('account.html');
let me = null;
const TABS = [['overview', 'نظرة عامة', 'user'], ['notifications', 'الإشعارات', 'bell'], ['activity', 'نشاطي', 'activity'], ['admin', 'الإدارة', 'admin']];
const alertBox = (cls, text) => el('div', { class: 'alert ' + cls, role: 'alert' }, text);
const safe = async (box, fn) => { try { await fn(); } catch (e) { box.replaceChildren(alertBox('e', e.message)); if (e.code === 'unauthorized' || e.code === 'token_expired') logout(); } };

async function checkService() {
  const btn = $('#loginBtn'), msg = $('#loginMsg');
  btn.disabled = true;
  if (!CONFIG.API_ENABLED) {
    msg.replaceChildren(alertBox('e', 'تسجيل الدخول متوقف لأن خدمة الحساب الخلفية لم تُنشر بعد.'));
    return;
  }
  try {
    await api('/health', { auth: false });
    msg.replaceChildren();
    btn.disabled = false;
  } catch (e) {
    msg.replaceChildren(alertBox('e', `تسجيل الدخول غير متاح لأن خدمة الحساب الخلفية لا تستجيب. ${e.message}`));
  }
}

// ---------- الدخول ----------
$('#loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault(); const btn = $('#loginBtn'), msg = $('#loginMsg'); msg.replaceChildren(); btn.disabled = true;
  try { await signIn($('#email').value.trim(), $('#password').value); $('#password').value = ''; await start(); }
  catch (e) { msg.replaceChildren(alertBox('e', e.message)); } finally { btn.disabled = false; }
});
checkService();
function logout() { session.token = null; me = null; $('#dash').hidden = true; $('#loginBox').hidden = false; }

async function start() {
  me = await api('/auth/me');
  $('#loginBox').hidden = true; $('#dash').hidden = false;
  const tabs = TABS.filter(([k]) => k !== 'admin' || me.roles.isAdmin);
  const side = $('#side'); side.replaceChildren(...tabs.map(([k, t, ic]) => el('a', { href: '#' + k, 'data-k': k, html: icon(ic, 20) + `<span>${t}</span>` })),
    el('a', { href: '#', id: 'out', html: icon('logout', 20) + '<span>تسجيل الخروج</span>' }));
  $('#out').addEventListener('click', (e) => { e.preventDefault(); logout(); });
  route();
}
window.addEventListener('hashchange', () => me && route());

function route() {
  let k = location.hash.slice(1) || 'overview'; if (!TABS.some(([t]) => t === k) || (k === 'admin' && !me.roles.isAdmin)) k = 'overview';
  document.querySelectorAll('#side a[data-k]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.k === k)));
  const main = $('#view'); main.replaceChildren(el('p', { class: 'empty' }, 'جارٍ التحميل…'));
  ({ overview, notifications, activity, admin })[k](main);
}

// ---------- نظرة عامة ----------
function overview(main) {
  const roles = [me.roles.isAdmin && 'مدير', me.roles.isTeacher && 'معلّم'].filter(Boolean).join('، ') || 'طالب';
  const kv = el('dl', { class: 'kv' }, el('dt', {}, 'البريد'), el('dd', {}, me.email || '—'), el('dt', {}, 'الدور'), el('dd', {}, roles));
  main.replaceChildren(el('div', { class: 'card' }, el('h2', {}, 'حسابي'), kv));
}

// ---------- الإشعارات ----------
function notifications(main) {
  const list = el('ul', { class: 'list' }), box = el('div'), empty = el('p', { class: 'empty', hidden: true }, 'لا توجد إشعارات.');
  const readAll = el('button', { class: 'btn g s' }, 'تعليم الكل كمقروء');
  main.replaceChildren(el('div', { class: 'card' }, el('div', { class: 'row' }, el('h2', { style: 'margin:0' }, 'الإشعارات'), el('span', { style: 'margin-inline-start:auto' }, readAll)), box, list, empty));
  const load = () => safe(box, async () => {
    box.replaceChildren(); const { data } = await api('/notifications?limit=30'); list.replaceChildren(); empty.hidden = data.length > 0;
    for (const n of data) {
      const mark = n.read_at ? null : el('button', { class: 'btn g s' }, 'مقروء'), del = el('button', { class: 'btn d s', 'aria-label': 'حذف الإشعار' }, 'حذف');
      mark?.addEventListener('click', () => safe(box, async () => { await api(`/notifications/${n.id}/read`, { method: 'PATCH' }); load(); }));
      del.addEventListener('click', () => safe(box, async () => { await api(`/notifications/${n.id}`, { method: 'DELETE' }); load(); }));
      list.append(el('li', {}, el('span', { class: 'dot ' + (n.read_at ? '' : 'ok'), style: 'margin-top:10px' }),
        el('div', { class: 'grow' }, el('div', { class: n.read_at ? '' : 'unread' }, n.title), n.body ? el('div', { class: 'small muted' }, n.body) : null, el('div', { class: 'small muted' }, fmtDate(n.created_at))), mark, del));
    }
  });
  readAll.addEventListener('click', () => safe(box, async () => { await api('/notifications/read-all', { method: 'POST' }); load(); }));
  load();
}

// ---------- النشاط ----------
const APP_NAMES = { app: 'iLogia', ai: 'AI', exams: 'Exams', cards: 'Cards', planner: 'Planner', library: 'Library', arena: 'Arena', verify: 'Verify' };
function activity(main) {
  const box = el('div'); main.replaceChildren(el('div', { class: 'card' }, el('h2', {}, 'نشاطك آخر ٣٠ يومًا'), box));
  safe(box, async () => {
    const s = await api('/activity/summary');
    if (!s.total) { box.replaceChildren(el('p', { class: 'empty' }, 'لا يوجد نشاط مسجّل بعد. سيظهر هنا عندما تستخدم تطبيقات iLogia.')); return; }
    const apps = Object.entries(s.by_app).map(([k, v]) => el('li', {}, el('span', { class: 'grow' }, APP_NAMES[k] || k), el('b', {}, String(v))));
    box.replaceChildren(el('div', { class: 'nums' }, el('div', {}, el('b', {}, String(s.total)), 'نشاط مسجّل'), el('div', {}, el('b', {}, String(s.active_days)), 'يوم نشط')),
      el('h3', { style: 'margin-top:20px' }, 'حسب التطبيق'), el('ul', { class: 'list' }, apps), s.truncated ? el('p', { class: 'small muted' }, 'تم عرض آخر ١٠٠٠ نشاط فقط.') : null);
  });
}

// ---------- الإدارة ----------
const STATUSES = [['active', 'مفعّل'], ['maintenance', 'صيانة'], ['disabled', 'متوقف'], ['hidden', 'مخفي']];
const HS = { ok: 'سليم', degraded: 'بطيء', down: 'متوقف', unknown: 'لم يُفحص', unconfigured: 'غير مُعدّ', disabled: 'معطّل' };
function admin(main) {
  const msg = el('div'), tbody = el('tbody'), intBox = el('ul', { class: 'list' });
  const table = el('div', { class: 'tblwrap' }, el('table', { class: 'tbl' }, el('thead', {}, el('tr', {}, ...['التطبيق', 'الحالة', 'الصحة', ''].map((t) => el('th', {}, t)))), tbody));
  const f = (id, label, ph = '', type = 'text', req = false) => el('label', {}, label, el('input', { id, type, placeholder: ph, required: req, dir: 'ltr' }));
  const form = el('form', { class: 'formgrid' }, f('n_id', 'المعرّف (app_id)', 'exams', 'text', true), f('n_name', 'الاسم', 'iLogia Exams', 'text', true), f('n_url', 'رابط التطبيق', 'https://exams.ilogia-eg.com', 'url', true),
    f('n_health', 'رابط فحص الصحة', 'https://exams.ilogia-eg.com/health', 'url'), f('n_redirect', 'Redirect URI للدخول الموحد', 'https://exams.ilogia-eg.com/auth/callback', 'url'), el('div', { style: 'align-self:end' }, el('button', { class: 'btn' }, 'إضافة التطبيق')));
  main.replaceChildren(el('div', { class: 'card' }, el('h2', {}, 'إدارة التطبيقات'), el('p', { class: 'muted small' }, 'التطبيق الجديد يُضاف «مخفيًا». غيّر حالته إلى «مفعّل» بعد فحص صحته.'), msg, table),
    el('div', { class: 'card' }, el('h2', {}, 'إضافة تطبيق'), form), el('div', { class: 'card' }, el('h2', {}, 'التكاملات'), intBox));

  const loadApps = () => safe(msg, async () => {
    msg.replaceChildren(); const { data } = await api('/admin/apps'); tbody.replaceChildren(); if (!data.length) tbody.append(el('tr', {}, el('td', { colspan: 4, class: 'empty' }, 'لا توجد تطبيقات مسجّلة.')));
    for (const a of data) {
      const sel = el('select', { class: 's', 'aria-label': 'حالة ' + a.name }, ...STATUSES.map(([v, t]) => el('option', { value: v, selected: v === a.status }, t)));
      sel.addEventListener('change', () => safe(msg, async () => { await api('/admin/apps/' + a.app_id, { method: 'PATCH', json: { status: sel.value } }); msg.replaceChildren(alertBox('o', 'تم تحديث الحالة.')); loadApps(); }));
      const chk = el('button', { class: 'btn g s' }, 'فحص الصحة');
      chk.addEventListener('click', () => safe(msg, async () => { chk.disabled = true; try { const r = await api(`/admin/apps/${a.app_id}/check`, { method: 'POST' }); msg.replaceChildren(alertBox('o', `${a.name}: ${HS[r.health_status]} (${r.latency_ms}ms)`)); } finally { chk.disabled = false; } loadApps(); }));
      tbody.append(el('tr', {}, el('td', {}, el('b', {}, a.name), el('div', { class: 'small muted code' }, a.app_id)), el('td', {}, sel),
        el('td', {}, el('span', { class: 'badge ' + (a.health_status === 'down' ? 'err' : '') }, HS[a.health_status] || a.health_status), a.available ? el('span', { class: 'badge gold', style: 'margin-inline-start:6px' }, 'متاح') : null), el('td', {}, chk)));
    }
  });
  form.addEventListener('submit', (ev) => { ev.preventDefault(); safe(msg, async () => {
    const v = (id) => $('#' + id).value.trim(); const body = { app_id: v('n_id'), name: v('n_name'), url: v('n_url') };
    if (v('n_health')) body.health_url = v('n_health'); if (v('n_redirect')) body.redirect_uris = [v('n_redirect')];
    await api('/admin/apps', { method: 'POST', json: body }); form.reset(); msg.replaceChildren(alertBox('o', 'تمت إضافة التطبيق (مخفي).')); loadApps();
  }); });

  const loadInt = () => safe(msg, async () => {
    const { data } = await api('/integrations'); intBox.replaceChildren();
    for (const i of data) {
      const out = el('span', { class: 'badge' }, i.configured ? (i.enabled ? 'مفعّل' : 'معطّل') : 'غير مُعدّ'); const b = el('button', { class: 'btn g s' }, 'فحص');
      b.addEventListener('click', () => safe(msg, async () => { b.disabled = true; try { const r = await api(`/integrations/${i.id}/check`, { method: 'POST' }); out.textContent = HS[r.status] + (r.latency_ms ? ` · ${r.latency_ms}ms` : ''); out.className = 'badge' + (r.status === 'down' ? ' err' : ''); } finally { b.disabled = false; } }));
      intBox.append(el('li', {}, el('span', { class: 'grow' }, el('b', {}, i.id), el('span', { class: 'small muted', style: 'margin-inline-start:8px' }, i.kind === 'supabase' ? 'مدمج' : 'عبر HTTP')), out, b));
    }
  });
  loadApps(); loadInt();
}
