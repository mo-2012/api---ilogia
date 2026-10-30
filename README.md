# api---ilogia
الباك-إند لـ `api.ilogia-eg.com`. بدون أي اعتماديات (Node 20+).

## التشغيل
1. نفّذ `supabase/schema.sql` في Supabase SQL editor (يضيف unique index يمنع تكرار الإنجاز + RLS قراءة فقط).
2. `cp .env.example .env` واملأ المفاتيح، ثم `node --env-file=.env server.mjs`.
3. `node test.mjs` لتشغيل الاختبارات (تستخدم Supabase/Anthropic وهميين).

## الـ Endpoints
- `POST /challenges/:id/complete` + `Authorization: Bearer <access_token>` → يتحقق من المستخدم، يقرأ النقاط من الجدول (لا يثق بالعميل)، ويسجل في الـ ledger. أكواد: 200 / 401 / 404 / 409 (مكرر) / 410 (منتهي) / 429.
- `POST /ai` `{mode,text}` → `{reply}` عبر Claude. الحد 6000 حرف و10 طلبات/دقيقة لكل IP.
- `GET /health`

## الربط
- Arena: `VITE_API_URL=https://api.ilogia-eg.com`
- AI: `VITE_AI_ENDPOINT=https://api.ilogia-eg.com/ai`
- CORS مقصور على `ALLOWED_ORIGINS`.
- خلف reverse proxy (Caddy/nginx) مع HTTPS؛ الـ rate limit يعتمد على `X-Forwarded-For`، فتأكد أن البروكسي هو من يضبطه.
