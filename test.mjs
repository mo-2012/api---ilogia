// Run: node test.mjs  — spins up fake Supabase + fake Anthropic and exercises the API.
import http from 'node:http'
import assert from 'node:assert/strict'
import { createServer } from './server.mjs'

const CH = '11111111-1111-1111-1111-111111111111', EXPIRED = '22222222-2222-2222-2222-222222222222'
const ledger = []
const fake = http.createServer(async (req, res) => {
  const body = await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)) })
  const j = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)) }
  if (req.url === '/auth/v1/user') return req.headers.authorization === 'Bearer good' ? j(200, { id: 'aaaaaaaa-0000-0000-0000-000000000000' }) : j(401, {})
  if (req.url.startsWith('/rest/v1/ilg_challenges')) {
    if (req.url.includes(CH)) return j(200, [{ id: CH, title: 'T', points: 50, is_active: true, ends_at: null }])
    if (req.url.includes(EXPIRED)) return j(200, [{ id: EXPIRED, title: 'E', points: 5, is_active: true, ends_at: '2020-01-01T00:00:00Z' }])
    return j(200, [])
  }
  if (req.url === '/rest/v1/ilg_points_ledger') {
    const row = JSON.parse(body)
    if (ledger.some(l => l.user_id === row.user_id && l.challenge_id === row.challenge_id)) return j(409, {})
    ledger.push(row); return j(201, {})
  }
  if (req.url === '/v1/messages') return req.headers['x-api-key'] === 'k' ? j(200, { content: [{ type: 'text', text: 'رد تجريبي' }] }) : j(401, {})
  j(404, {})
})
await new Promise(r => fake.listen(0, r))
const base = `http://127.0.0.1:${fake.address().port}`
const api = createServer({ supabaseUrl: base, serviceKey: 's', anthropicKey: 'k', anthropicUrl: `${base}/v1/messages`, origins: ['https://arena.ilogia-eg.com'], aiPerMinute: 5 })
await new Promise(r => api.listen(0, r))
const A = `http://127.0.0.1:${api.address().port}`
const post = (p, body, h = {}) => fetch(A + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...h }, body: body && JSON.stringify(body) })
const good = { Authorization: 'Bearer good' }

assert.equal((await post(`/challenges/${CH}/complete`)).status, 401, 'no token')
assert.equal((await post(`/challenges/${CH}/complete`, null, { Authorization: 'Bearer bad' })).status, 401, 'bad token')
assert.equal((await post(`/challenges/nope/complete`, null, good)).status, 400, 'bad id')
assert.equal((await post(`/challenges/33333333-3333-3333-3333-333333333333/complete`, null, good)).status, 404, 'missing')
assert.equal((await post(`/challenges/${EXPIRED}/complete`, null, good)).status, 410, 'expired')
const ok = await post(`/challenges/${CH}/complete`, null, good)
assert.equal(ok.status, 200); assert.equal((await ok.json()).points, 50)
assert.equal((await post(`/challenges/${CH}/complete`, null, good)).status, 409, 'duplicate')
assert.equal(ledger.length, 1)
assert.equal(ledger[0].points, 50, 'points come from DB, not client')

assert.equal((await post('/ai', { mode: 'x', text: 'a' })).status, 400)
assert.equal((await post('/ai', { mode: 'quiz', text: '' })).status, 400)
assert.equal((await post('/ai', { mode: 'quiz', text: 'x'.repeat(7000) })).status, 413)
const r = await post('/ai', { mode: 'summarize', text: 'نص' }); assert.equal((await r.json()).reply, 'رد تجريبي')
assert.equal((await post('/ai', { mode: 'summarize', text: 'نص' })).status, 200)
assert.equal((await post('/ai', { mode: 'summarize', text: 'نص' })).status, 429, 'rate limit')

const pre = await fetch(A + '/ai', { method: 'OPTIONS', headers: { Origin: 'https://arena.ilogia-eg.com' } })
assert.equal(pre.status, 204); assert.equal(pre.headers.get('access-control-allow-origin'), 'https://arena.ilogia-eg.com')
assert.equal((await fetch(A + '/ai', { method: 'OPTIONS', headers: { Origin: 'https://evil.com' } })).status, 403)
assert.equal((await fetch(A + '/health')).status, 200)
console.log('all tests passed'); api.close(); fake.close()
