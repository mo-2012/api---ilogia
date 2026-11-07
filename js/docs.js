import { $, el, mountChrome } from './common.js';
import { CONFIG } from './config.js';

mountChrome('docs.html');
const AUTH = { p: 'عام', u: 'مستخدم', a: 'مدير' };
const EP = [
  ['GET', '/health', 'p', 'فحص أن الخدمة تعمل'], ['GET', '/health/ready', 'p', 'جاهزية المصادقة وقاعدة البيانات'], ['GET', '/system/status', 'p', 'الإصدار وحالات التكاملات'],
  ['GET', '/auth/me', 'u', 'هويتك وأدوارك (من الخادم)'],
  ['GET', '/users/me/profile', 'u', 'ملفك الشخصي'], ['PATCH', '/users/me/profile', 'u', 'تحديث الاسم والصف'], ['GET', '/users/me/preferences', 'u', 'تفضيلاتك'], ['PUT', '/users/me/preferences', 'u', 'حفظ اللغة والإعدادات'],
  ['GET', '/apps', 'p', 'قائمة التطبيقات وحالة إتاحتها'], ['GET', '/apps/{id}', 'p', 'تطبيق واحد'],
  ['GET', '/notifications', 'u', 'إشعاراتك (ترقيم صفحات)'], ['PATCH', '/notifications/{id}/read', 'u', 'تعليم إشعار كمقروء'], ['POST', '/notifications/read-all', 'u', 'تعليم الكل'], ['DELETE', '/notifications/{id}', 'u', 'حذف إشعار'], ['POST', '/notifications', 'a', 'إرسال إشعار لمستخدم'],
  ['POST', '/activity', 'u', 'تسجيل نشاط'], ['GET', '/activity', 'u', 'سجل نشاطك'], ['GET', '/activity/summary', 'u', 'ملخص ٣٠ يومًا من البيانات الفعلية'],
  ['GET', '/integrations/verify/certificates/{serial}', 'p', 'التحقق من شهادة'], ['GET', '/integrations', 'a', 'التكاملات وحالة إعدادها'], ['POST', '/integrations/{id}/check', 'a', 'فحص صحة تكامل'], ['PATCH', '/integrations/{id}', 'a', 'ضبط تكامل'],
  ['GET', '/admin/apps', 'a', 'كل التطبيقات (بما فيها المخفية)'], ['POST', '/admin/apps', 'a', 'تسجيل تطبيق'], ['PATCH', '/admin/apps/{id}', 'a', 'تعديل تطبيق'], ['POST', '/admin/apps/{id}/check', 'a', 'فحص صحة تطبيق'],
  ['POST', '/sso/authorize', 'u', 'إصدار كود دخول موحد (PKCE)'], ['POST', '/sso/token', 'p', 'استبدال الكود بتوكن قصير العمر'],
];
$('#eps').replaceChildren(...EP.map(([m, p, a, d]) => el('div', { class: 'ep' }, el('span', { class: 'm ' + m }, m), el('div', {}, el('code', {}, p), el('div', { class: 'small muted' }, d)), el('span', { class: 'badge' + (a === 'a' ? ' gold' : '') }, AUTH[a]))));
$('#base').textContent = CONFIG.API_BASE;
if (CONFIG.API_ENABLED) $('#fullDocs').href = CONFIG.API_BASE + '/docs';
else {
  $('#fullDocs').removeAttribute('href');
  $('#fullDocs').classList.add('g');
  $('#fullDocs').setAttribute('aria-disabled', 'true');
  $('#fullDocs').textContent = 'التوثيق التفاعلي غير متاح حتى نشر خدمة API';
}
