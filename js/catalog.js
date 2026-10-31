import { icon } from './icons.js';
import { el, $ } from './common.js';
import { api } from './api.js';
import { CONFIG } from './config.js';

// أسماء وأوصاف عامة للتطبيقات المخطط لها. الإتاحة تأتي من الـ API فقط (لا ندّعي توفر تطبيق غير مسجّل).
export const CATALOG = [
  { id: 'app', name: 'iLogia', desc: 'المنصة التعليمية الرئيسية: الدروس والمكتبة والاشتراكات.', url: CONFIG.MAIN_SITE },
  { id: 'ai', name: 'iLogia AI', desc: 'مساعد ذكي يشرح ويجيب عن أسئلة الدراسة.' },
  { id: 'exams', name: 'iLogia Exams', desc: 'امتحانات وتدريبات لقياس مستواك.' },
  { id: 'cards', name: 'iLogia Cards', desc: 'بطاقات مراجعة سريعة للحفظ والتثبيت.' },
  { id: 'planner', name: 'iLogia Planner', desc: 'جدول دراسة ومتابعة للمهام والمواعيد.' },
  { id: 'library', name: 'iLogia Library', desc: 'مكتبة ملفات ومذكرات حسب الصف والمادة.' },
  { id: 'arena', name: 'iLogia Arena', desc: 'تحديات ومنافسات بين الطلاب.' },
  { id: 'verify', name: 'iLogia Verify', desc: 'التحقق من صحة الشهادات.' },
];

export async function loadApps() {
  let reg = [], error = null;
  try { reg = (await api('/apps', { auth: false })).data; } catch (e) { error = e.message; }
  const byId = new Map(reg.map((a) => [a.app_id, a]));
  const items = CATALOG.map((c) => { const r = byId.get(c.id); return { ...c, ...(r ? { name: r.name || c.name, desc: r.description || c.desc, url: r.url || c.url, status: r.status, available: !!r.available, registered: true } : { status: 'soon', available: false, registered: false }) }; });
  for (const r of reg) if (!CATALOG.some((c) => c.id === r.app_id)) items.push({ id: r.app_id, name: r.name, desc: r.description || '', url: r.url, status: r.status, available: !!r.available, registered: true });
  return { items, error };
}

const LABEL = { active: 'مفعّل', maintenance: 'صيانة', disabled: 'متوقف', soon: 'قريبًا' };
export function appCard(a) {
  const dot = a.available ? 'ok' : a.status === 'maintenance' ? 'warn' : a.status === 'disabled' ? 'bad' : '';
  const state = a.available ? 'متاح الآن' : a.registered ? (a.status === 'active' ? 'لم يُتحقق منه بعد' : LABEL[a.status] || 'غير متاح') : 'قريبًا';
  const open = a.available && /^https:\/\//.test(a.url || '') ? el('a', { class: 'btn s', href: a.url, target: '_blank', rel: 'noopener' }, 'فتح التطبيق') : null;
  return el('article', { class: 'app' }, el('div', { class: 'ic', html: icon(a.id === 'app' ? 'grid' : a.id) }), el('h3', {}, a.name), el('p', {}, a.desc),
    el('div', { class: 'foot' }, el('span', { class: 'dot ' + dot }), el('span', { class: 'small muted' }, state), el('span', { style: 'margin-inline-start:auto' }, open)));
}
