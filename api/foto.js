// Função da Vercel: recebe a foto do prato e devolve os alimentos estimados (nome, gramas, kcal e macros).
// Variáveis de ambiente (Vercel > Settings > Environment Variables):
//   ANTHROPIC_API_KEY  chave da API da Anthropic (console.anthropic.com)
//   APP_CODE           código de acesso que o app envia no cabeçalho x-app-code (evita uso por estranhos)
// A foto não é guardada: vai só para a API do Claude e a resposta volta para o app.
const crypto = require('crypto');
const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.default || sdk;
const D = require('../data/app-data.json');

const MODEL = 'claude-opus-5-5';
const MAX_B64 = 3_500_000; // ~2,6 MB de imagem (o app manda ~200 KB)
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Lista fixa (base do app + TACO) no system prompt, com cache: só muda quando os dados do app mudam.
const SYSTEM = `Você analisa fotos de refeições para um app brasileiro de nutrição de um atleta (wide receiver de futebol americano).

Identifique cada alimento visível e estime a porção em gramas (ou ml para bebidas). Use o prato, os talheres e as mãos como referência de tamanho. Inclua óleo, molhos e acompanhamentos quando estiverem visíveis. Não invente itens que não aparecem; se algo estiver escondido ou ambíguo, diga em "observacao".

Para cada item:
- nome: nome curto em português, como a pessoa falaria (ex.: "arroz branco", "feijão carioca", "peito de frango grelhado").
- alimento: o nome EXATO, copiado de uma das listas abaixo, do item que melhor corresponde, incluindo o preparo (cozido, grelhado, frito, cru). Ordem de preferência: "Meus alimentos" do usuário (enviados junto com a foto), depois "Base do app", depois "TACO". Se nenhum corresponder bem, use "".
- gramas: porção estimada.
- kcal, proteina, carbo, gordura: sua estimativa para essa porção (o app usa esses números quando "alimento" fica vazio).

Se a foto não for de comida, devolva "itens" vazio, "prato" false e explique em "observacao". "observacao" é uma frase curta (até 160 caracteres) sobre o que foi mais difícil de estimar.

## Base do app
${D.foods.map((f) => f[0]).join('\n')}

## TACO
${D.taco.map((f) => f[0]).join('\n')}`;

const SCHEMA = {
  type: 'object',
  properties: {
    prato: { type: 'boolean' },
    observacao: { type: 'string' },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string' }, alimento: { type: 'string' }, gramas: { type: 'number' },
          kcal: { type: 'number' }, proteina: { type: 'number' }, carbo: { type: 'number' }, gordura: { type: 'number' },
        },
        required: ['nome', 'alimento', 'gramas', 'kcal', 'proteina', 'carbo', 'gordura'],
        additionalProperties: false,
      },
    },
  },
  required: ['prato', 'observacao', 'itens'],
  additionalProperties: false,
};

const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
const sameCode = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const num = (v) => (Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : 0);

function makeHandler(getClient = () => new Anthropic()) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return send(res, 405, { erro: 'Use POST.' });
    const code = process.env.APP_CODE;
    if (!code || !process.env.ANTHROPIC_API_KEY) return send(res, 503, { erro: 'A foto do prato ainda não foi configurada no servidor (ANTHROPIC_API_KEY e APP_CODE na Vercel).' });
    if (!sameCode(req.headers['x-app-code'] || '', code)) return send(res, 401, { erro: 'Código de acesso errado. Confira em Perfil > Foto do prato.' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
    const image = body && typeof body.image === 'string' ? body.image : '';
    const type = body && TYPES.includes(body.media_type) ? body.media_type : null;
    if (!image || !type || image.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(image)) return send(res, 400, { erro: 'Foto inválida ou grande demais.' });
    const meus = Array.isArray(body.meus) ? body.meus.filter((s) => typeof s === 'string').slice(0, 100).map((s) => s.slice(0, 80)) : [];

    let msg;
    try {
      msg = await getClient().beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: type, data: image } },
            { type: 'text', text: meus.length ? `Meus alimentos do usuário:\n${meus.join('\n')}\n\nAnalise o prato da foto.` : 'Analise o prato da foto.' },
          ],
        }],
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return send(res, 502, { erro: 'A chave da API da Anthropic foi recusada. Confira ANTHROPIC_API_KEY na Vercel.' });
      if (e instanceof Anthropic.RateLimitError) return send(res, 429, { erro: 'Muitas fotos seguidas. Espere um minuto e tente de novo.' });
      if (e instanceof Anthropic.BadRequestError) return send(res, 400, { erro: 'A API não aceitou a foto. Tente outra foto.' });
      if (e instanceof Anthropic.APIError) return send(res, 502, { erro: 'O serviço de análise falhou. Tente de novo em instantes.' });
      return send(res, 502, { erro: 'Não consegui falar com o serviço de análise.' });
    }

    if (msg.stop_reason === 'refusal') return send(res, 422, { erro: 'Não consegui analisar essa foto. Tente outra.' });
    if (msg.stop_reason === 'max_tokens') return send(res, 502, { erro: 'A análise ficou incompleta. Tente de novo.' });
    const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    let out;
    try { out = JSON.parse(text); } catch (e) { return send(res, 502, { erro: 'A resposta veio em formato inesperado. Tente de novo.' }); }

    const itens = (out.itens || []).map((it) => ({
      nome: String(it.nome || '').slice(0, 60), alimento: String(it.alimento || '').slice(0, 80), gramas: num(it.gramas),
      kcal: num(it.kcal), proteina: num(it.proteina), carbo: num(it.carbo), gordura: num(it.gordura),
    })).filter((it) => it.nome && it.gramas > 0);
    const u = msg.usage || {};
    return send(res, 200, {
      prato: !!out.prato, observacao: String(out.observacao || '').slice(0, 200), itens,
      uso: { entrada: u.input_tokens || 0, cache: u.cache_read_input_tokens || 0, saida: u.output_tokens || 0 },
    });
  };
}

module.exports = makeHandler();
module.exports.makeHandler = makeHandler;
module.exports.SYSTEM = SYSTEM;
module.exports.SCHEMA = SCHEMA;
