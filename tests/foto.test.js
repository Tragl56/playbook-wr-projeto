// Foto do prato no app: código de acesso, envio, revisão dos itens (gramas e seleção) e soma ao dia. Servidor simulado.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { FILE, mockDate, seedStore } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const errs = []; const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));

const OKRESP = { prato: true, observacao: 'Óleo da farofa difícil de estimar.', itens: [
  { nome: 'arroz branco', alimento: 'Arroz, tipo 1, cozido', gramas: 150, kcal: 190, proteina: 4, carbo: 42, gordura: 0.4 },
  { nome: 'frango grelhado', alimento: 'Frango, peito, sem pele, grelhado', gramas: 120, kcal: 190, proteina: 38, carbo: 0, gordura: 3 },
  { nome: 'farofa da casa', alimento: '', gramas: 40, kcal: 160, proteina: 2, carbo: 22, gordura: 7 },
] };
let next = null; const calls = [];
const fakeFetch = async (url, opt) => { calls.push({ url, opt }); const n = next; if (n instanceof Error) throw n; return { ok: n.status === 200, status: n.status, json: async () => n.body }; };

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/#comida', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { mockDate(w); seedStore(w); w.fetch = fakeFetch; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {}; } });
const w = dom.window, d = w.document;
const click = (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const toast = () => d.getElementById('toast').textContent;
const saved = () => JSON.parse(w.localStorage.getItem('wr_playbook_v1'));
const kcal = () => Number(d.querySelector('.fieldcap .big').textContent.replace(/\./g, ''));
const card = () => d.getElementById('foto');
const tot = (k) => d.querySelector(`#ptot [data-k="${k}"]`).textContent;
async function sendPhoto() {
  const inp = d.getElementById('fotoin');
  Object.defineProperty(inp, 'files', { configurable: true, value: [new w.File(['x'], 'prato.jpg', { type: 'image/jpeg' })] });
  inp.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(60);
}
const setIn = (id, v, ev) => { const e = d.getElementById(id); if (ev === 'change') e.checked = v; else e.value = v; e.dispatchEvent(new w.Event(ev, { bubbles: true })); };

(async () => {
  await sleep(300);
  w.shrinkImage = async () => 'data:image/jpeg;base64,QUJD'; // canvas não existe no JSDOM

  ok(card() && /código de acesso/.test(card().textContent), 'Comida mostra "Foto do prato" e avisa que falta o código');
  await sendPhoto();
  ok(calls.length === 0 && /Perfil/.test(toast()) && d.getElementById('fotocfg'), 'sem código: não envia nada e leva ao Perfil');

  setIn('fcode', '123', 'input'); click(d.querySelector('[data-act="foto-code"]')); await sleep(20);
  ok(/6 caracteres/.test(toast()) && !w.localStorage.getItem('wr_foto_code'), 'código curto é recusado');
  setIn('fcode', 'codigo-teste-123', 'input'); click(d.querySelector('[data-act="foto-code"]')); await sleep(20);
  ok(w.localStorage.getItem('wr_foto_code') === 'codigo-teste-123' && /Configurado/.test(d.getElementById('fotost').textContent), 'código salvo só neste aparelho');
  ok(!JSON.stringify(saved()).includes('codigo-teste-123'), 'o código não vai para os dados do backup');

  // envio com sucesso
  click(d.querySelector('[data-tab="comida"]')); await sleep(20);
  next = { status: 200, body: OKRESP };
  await sendPhoto();
  const c0 = calls[0], body = c0 && JSON.parse(c0.opt.body);
  ok(c0 && c0.url === '/api/foto' && c0.opt.method === 'POST' && c0.opt.headers['x-app-code'] === 'codigo-teste-123', 'envia para /api/foto com o código no cabeçalho');
  ok(body.image === 'QUJD' && body.media_type === 'image/jpeg' && body.meus.some((m) => /^Ceviche \(1 porção = 200 g\)$/.test(m)), 'manda a foto reduzida e os "Meus alimentos"');
  const rows = [...d.querySelectorAll('.fotoit')];
  ok(rows.length === 3 && d.querySelector('.fotothumb'), 'mostra a foto e os 3 itens para conferir');
  ok(/192 kcal/.test(d.getElementById('pk0').textContent) && /TACO/.test(rows[0].textContent), 'arroz usa o valor da TACO (150 g = 192 kcal), não a estimativa');
  ok(/160 kcal/.test(d.getElementById('pk2').textContent) && /estimativa da foto/.test(rows[2].textContent), 'farofa sem correspondência usa a estimativa da foto');
  ok(tot('k') === '543' && tot('p') === '44' && tot('g') === '10' && tot('c') === '64', `resumo do prato em destaque: ${tot('k')} kcal, ${tot('p')} g proteína, ${tot('g')} g gordura, ${tot('c')} g carbo (192 + 191 + 160 kcal)`);
  ok(/^192 kcal · P 3,8 g · G 0,3 g · C 42 g$/.test(d.getElementById('pk0').textContent), 'cada item mostra kcal, proteína, gordura e carbo: ' + d.getElementById('pk0').textContent);
  ok(/Óleo da farofa/.test(card().textContent), 'mostra a observação');

  const pg2 = d.getElementById('pg2');
  setIn('pg2', '80', 'input');
  ok(d.getElementById('pg2') === pg2 && /320 kcal/.test(d.getElementById('pk2').textContent), 'mudar os gramas recalcula na hora sem recriar a tela (farofa 80 g = 320 kcal)');
  setIn('pc1', false, 'change');
  ok(rows[1].classList.contains('off') && tot('k') === '512', 'desmarcar o frango tira do resumo: ' + tot('k') + ' kcal');

  const k0 = kcal();
  click(d.querySelector('[data-act="foto-add"]')); await sleep(20);
  const ex = Object.entries(saved()).find(([k]) => k.startsWith('d_'))[1].extras;
  ok(ex.length === 2 && ex[0].f === 'Arroz, tipo 1, cozido' && ex[0].g === 150 && !ex[0].m, 'arroz entra como alimento da TACO');
  ok(ex[1].f === 'farofa da casa' && ex[1].g === 80 && ex[1].m && ex[1].m.k === 400, 'farofa entra com os valores estimados por 100 g: ' + JSON.stringify(ex[1]));
  ok(kcal() - k0 === 512 && !d.querySelector('.fotoit') && /2 itens/.test(toast()), `calorias do dia sobem 512 (${k0} → ${kcal()})`);
  ok([...d.querySelectorAll('.lift b')].some((b) => b.textContent === '80 g de farofa da casa'), 'o extra aparece na lista do dia');

  // erros
  next = { status: 401, body: { erro: 'Código de acesso errado. Confira em Perfil > Foto do prato.' } };
  await sendPhoto();
  ok(/Código de acesso errado/.test(card().textContent) && card().querySelector('.ins.warn'), 'erro do servidor aparece no cartão');
  click(d.querySelector('[data-act="foto-clear"]')); await sleep(20);
  next = new TypeError('Failed to fetch');
  await sendPhoto();
  ok(/Sem conexão/.test(card().textContent), 'sem internet: avisa');
  next = { status: 200, body: { prato: false, observacao: 'A foto parece ser de um cachorro.', itens: [] } };
  await sendPhoto();
  ok(/cachorro/.test(card().textContent) && !d.querySelector('[data-act="foto-add"]'), 'foto que não é de comida: explica e não oferece somar');
  click(d.querySelector('[data-act="foto-clear"]')); await sleep(20);
  ok(!!d.getElementById('fotoin') && !d.querySelector('.fotothumb'), 'Fechar volta ao botão de foto');

  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
