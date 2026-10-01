// Função /api/foto (Vercel) com o cliente da Anthropic simulado: nada é enviado para a API de verdade.
const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.default || sdk;
const api = require('../api/foto.js');
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);

const IMG = Buffer.from('foto de teste').toString('base64');
const RESP = { prato: true, observacao: 'Quantidade de óleo difícil de ver.', itens: [
  { nome: 'arroz branco', alimento: 'Arroz, tipo 1, cozido', gramas: 150.04, kcal: 192.3, proteina: 3.8, carbo: 42.1, gordura: 0.3 },
  { nome: 'farofa', alimento: '', gramas: 40, kcal: 160, proteina: 2, carbo: 22, gordura: 7 },
  { nome: '', alimento: '', gramas: 10, kcal: 1, proteina: 0, carbo: 0, gordura: 0 },
  { nome: 'molho', alimento: '', gramas: 0, kcal: 0, proteina: 0, carbo: 0, gordura: 0 },
] };

function fakeRes() { return { statusCode: 0, h: {}, body: null, setHeader(k, v) { this.h[k.toLowerCase()] = v; }, end(b) { this.body = JSON.parse(b); } }; }
function fakeClient(answer) {
  const calls = [];
  return { calls, client: { beta: { messages: { create: async (p) => { calls.push(p); if (answer instanceof Error) throw answer; return answer; } } } } };
}
const msg = (o) => Object.assign({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(RESP) }], usage: { input_tokens: 1200, cache_read_input_tokens: 6000, output_tokens: 400 } }, o);
const req = (o = {}) => Object.assign({ method: 'POST', headers: { 'x-app-code': 'codigo-teste-123' }, body: { image: IMG, media_type: 'image/jpeg', meus: ['Ceviche (1 porção = 200 g)'] } }, o);
async function call(h, r) { const res = fakeRes(); await h(r, res); return res; }
// erro do SDK sem chamar a rede: objeto com o protótipo da classe certa
const sdkErr = (C) => Object.assign(Object.create(C.prototype), { message: 'x', status: 0 });

(async () => {
  delete process.env.APP_CODE; delete process.env.ANTHROPIC_API_KEY;
  let f = fakeClient(msg()), h = api.makeHandler(() => f.client), r;

  r = await call(h, req({ method: 'GET' }));
  ok(r.statusCode === 405, 'só aceita POST');
  r = await call(h, req());
  ok(r.statusCode === 503 && /configurada/.test(r.body.erro) && f.calls.length === 0, 'sem ANTHROPIC_API_KEY/APP_CODE na Vercel: 503 e não chama a API');

  process.env.APP_CODE = 'codigo-teste-123'; process.env.ANTHROPIC_API_KEY = 'chave-falsa-de-teste';
  r = await call(h, req({ headers: { 'x-app-code': 'errado' } }));
  ok(r.statusCode === 401 && f.calls.length === 0, 'código de acesso errado: 401 sem gastar nada');
  r = await call(h, req({ headers: {} }));
  ok(r.statusCode === 401, 'sem código: 401');
  r = await call(h, req({ body: { image: 'não é base64!', media_type: 'image/jpeg' } }));
  ok(r.statusCode === 400 && f.calls.length === 0, 'foto inválida: 400');
  r = await call(h, req({ body: { image: IMG, media_type: 'image/gif' } }));
  ok(r.statusCode === 400, 'tipo de imagem não aceito: 400');
  r = await call(h, req({ body: { image: 'A'.repeat(3_600_000), media_type: 'image/jpeg' } }));
  ok(r.statusCode === 400, 'foto grande demais: 400');

  r = await call(h, req());
  const p = f.calls[0];
  ok(r.statusCode === 200 && f.calls.length === 1, 'pedido válido chama a API uma vez');
  ok(p.model === 'claude-opus-5-5' && p.fallbacks === 'default' && p.betas.includes('server-side-fallback-2026-07-01'), 'modelo Claude Opus 5.5 com fallback padrão');
  ok(p.output_config.format.type === 'json_schema' && p.output_config.format.schema === api.SCHEMA && p.output_config.effort === 'medium', 'resposta em JSON garantido (json_schema) e effort explícito');
  ok(p.system[0].cache_control && p.system[0].text === api.SYSTEM && /Arroz, tipo 1, cozido/.test(api.SYSTEM), 'lista de alimentos (base + TACO) no system prompt com cache');
  const img = p.messages[0].content[0], txt = p.messages[0].content[1];
  ok(img.type === 'image' && img.source.type === 'base64' && img.source.media_type === 'image/jpeg' && img.source.data === IMG, 'a foto vai como imagem base64');
  ok(/Ceviche/.test(txt.text), 'os "Meus alimentos" vão junto (fora do cache)');
  ok(!/\d{4}-\d{2}-\d{2}|Date|undefined/.test(api.SYSTEM), 'system prompt sem data nem valores variáveis (o cache não quebra)');
  ok(r.body.itens.length === 2 && r.body.itens[0].gramas === 150 && r.body.itens[0].kcal === 192.3, 'itens sem nome ou sem gramas são descartados; números arredondados: ' + JSON.stringify(r.body.itens[0]));
  ok(r.body.prato === true && /óleo/.test(r.body.observacao) && r.body.uso.cache === 6000, 'devolve observação e uso de tokens');
  ok(r.h['cache-control'] === 'no-store', 'resposta não fica em cache');

  f = fakeClient(msg({ stop_reason: 'refusal', content: [] })); h = api.makeHandler(() => f.client);
  r = await call(h, req());
  ok(r.statusCode === 422 && /outra/.test(r.body.erro), 'recusa do modelo vira mensagem amigável');
  f = fakeClient(msg({ content: [{ type: 'text', text: '{quebrado' }] })); h = api.makeHandler(() => f.client);
  r = await call(h, req());
  ok(r.statusCode === 502, 'JSON inesperado: 502');
  for (const [C, st, re] of [[Anthropic.AuthenticationError, 502, /chave/], [Anthropic.RateLimitError, 429, /minuto/], [Anthropic.InternalServerError, 502, /falhou/]]) {
    f = fakeClient(sdkErr(C)); h = api.makeHandler(() => f.client);
    r = await call(h, req());
    ok(r.statusCode === st && re.test(r.body.erro), `${C.name} -> ${st}: ${r.body.erro}`);
  }
  console.log('ERROS: nenhum'); process.exit(0);
})().catch((e) => { console.log('FALHA exceção: ' + e.stack); console.log('ERROS: ' + e.message); process.exit(1); });
