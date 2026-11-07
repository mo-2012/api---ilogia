import { CONFIG } from './config.js';

export const session = { token: null }; // في الذاكرة فقط (لا تخزين للتوكن)
const MSG = {
  unauthorized: 'انتهت الجلسة. سجّل الدخول من جديد.', token_expired: 'انتهت الجلسة. سجّل الدخول من جديد.',
  forbidden: 'ليس لديك صلاحية لهذا الإجراء.', not_found: 'غير موجود.', conflict: 'هذا العنصر موجود بالفعل.',
  validation_error: 'تحقق من البيانات المدخلة.', rate_limited: 'طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
  service_unavailable: 'الخدمة غير متاحة حاليًا. حاول بعد قليل.', integration_unavailable: 'الخدمة التابعة غير متاحة حاليًا.', bad_request: 'طلب غير صالح.',
};
const SERVICE_DISABLED = 'خدمة الحساب غير متاحة: لم يتم نشر الـ backend أو ضبط عنوانه بعد.';

export async function api(path, { method = 'GET', json, auth = true } = {}) {
  if (!CONFIG.API_ENABLED) { const e = new Error(SERVICE_DISABLED); e.code = 'service_not_configured'; throw e; }
  let res;
  try {
    res = await fetch(CONFIG.API_BASE + path, { method, headers: { ...(auth && session.token ? { Authorization: 'Bearer ' + session.token } : {}), ...(json ? { 'Content-Type': 'application/json' } : {}) }, body: json ? JSON.stringify(json) : undefined });
  } catch { const e = new Error('تعذّر الاتصال بالخادم. تأكد من الإنترنت، وأن عنوان هذا الموقع مضاف في CORS بالـ API.'); e.code = 'network'; throw e; }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) { const e = new Error(MSG[data?.error?.code] || `تعذر تنفيذ الطلب (HTTP ${res.status}).`); e.code = data?.error?.code; e.status = res.status; throw e; }
  return data;
}

export async function signIn(email, password) {
  if (!CONFIG.API_ENABLED) { const e = new Error(SERVICE_DISABLED); e.code = 'service_not_configured'; throw e; }
  let r;
  try { r = await fetch(`${CONFIG.SB_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: CONFIG.SB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); }
  catch { throw new Error('تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(/not confirmed/i.test(d.msg || d.error_description || '') ? 'لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد من بريدك.' : 'البريد الإلكتروني أو كلمة السر غير صحيحة.');
  session.token = d.access_token;
}
