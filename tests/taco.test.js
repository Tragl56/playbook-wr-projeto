// Tabela TACO (busca, adicionar ao dia, salvar em Meus alimentos) e código de barras (Open Food Facts simulado).
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { FILE, mockDate, seedStore } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'app-data.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const errs = []; const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));

// Open Food Facts simulado: um produto conhecido, um inexistente e um com falha de rede
const PRODUCT = { status: 1, product: { product_name: 'Leite Condensado', brands: 'Moça, Nestlé', serving_size: '20 g', serving_quantity: 20,
  nutriments: { 'energy-kcal_100g': 325, proteins_100g: 7, carbohydrates_100g: 55, fat_100g: 8 } } };
const urls = [];
const fakeFetch = async (url) => {
  urls.push(url);
  if (url.includes('/7891000100103.json')) return { json: async () => PRODUCT };
  if (url.includes('/7890000000000.json')) throw new TypeError('Failed to fetch');
  return { json: async () => ({ status: 0, status_verbose: 'product not found' }) };
};

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/#comida', virtualConsole: vc, pretendToBeVisual: true,
  beforeParse(w) { mockDate(w); seedStore(w); w.fetch = fakeFetch; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {}; } });
const w = dom.window, d = w.document;
const click = (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const type = (id, v, ev = 'input') => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event(ev, { bubbles: true })); };
const toast = () => d.getElementById('toast').textContent;
const saved = () => JSON.parse(w.localStorage.getItem('wr_playbook_v1'));
const results = () => [...d.querySelectorAll('#tres .lift b')].map((b) => b.textContent);
const kcal = () => Number(d.querySelector('.fieldcap .big').textContent.replace(/\./g, ''));
const val = (id) => d.getElementById(id).value;
const peito = 'Frango, peito, sem pele, grelhado';

(async () => {
  await sleep(300);
  // dados
  const t = D.taco.find((f) => f[0] === peito);
  ok(D.taco.length > 550 && t && t[2] === 159 && t[3] === 32, `TACO nos dados do app: ${D.taco.length} alimentos (peito grelhado: ${t && t[2]} kcal, ${t && t[3]} g prot.)`);
  ok(D.taco.every((f) => f[2] > 0 || /^Sal,/.test(f[0])), 'nenhum alimento com 0 kcal por falta de análise (só o sal)');

  // busca
  const card = d.getElementById('taco');
  ok(card && new RegExp(D.taco.length).test(card.textContent.replace(/\./g, '')), 'aba Comida tem o cartão "Tabela TACO"');
  const tq = d.getElementById('tq');
  type('tq', 'a');
  ok(/pelo menos 2 letras/.test(d.getElementById('tres').textContent), 'com 1 letra pede mais texto');
  type('tq', 'frango grelhado');
  ok(results().includes(peito), 'busca "frango grelhado" acha o peito grelhado: ' + results().slice(0, 3).join(' | '));
  ok(d.getElementById('tq') === tq, 'a busca atualiza só a lista: o campo não é recriado (o teclado não fecha)');
  type('tq', 'feijao carioca cozido');
  ok(results()[0] === 'Feijão, carioca, cozido', 'busca ignora acentos: ' + results()[0]);
  type('tq', 'xyzabc');
  ok(/Nada encontrado/.test(d.getElementById('tres').textContent), 'sem resultado explica');

  // escolher, ajustar gramas e adicionar ao dia
  type('tq', 'peito grelhado');
  click([...d.querySelectorAll('[data-act="taco-pick"]')].find((b) => b.dataset.n === peito)); await sleep(20);
  ok(!!d.querySelector('.tsel') && /159 kcal/.test(d.querySelector('.tsel').textContent), 'escolher mostra os valores por 100 g');
  type('tg', '200');
  ok(/318 kcal/.test(d.getElementById('tgk').textContent) && /64,0 g prot/.test(d.getElementById('tgk').textContent), 'quantidade recalcula na hora: ' + d.getElementById('tgk').textContent);
  const k0 = kcal();
  click(d.querySelector('[data-act="taco-add"]')); await sleep(20);
  const ex = Object.entries(saved()).find(([k]) => k.startsWith('d_'))[1].extras;
  ok(ex.length === 1 && ex[0].f === peito && ex[0].g === 200, 'adicionar ao dia grava o extra: ' + JSON.stringify(ex[0]));
  ok(kcal() - k0 === 318, `calorias do dia sobem 318 (${k0} → ${kcal()})`);
  ok([...d.querySelectorAll('.lift b')].some((b) => b.textContent === '200 g de frango, peito, sem pele, grelhado'), 'o extra aparece com nome: "200 g de frango, peito, sem pele, grelhado"');

  // salvar em Meus alimentos, mudando o tamanho da unidade
  type('tq', 'abacate');
  click(d.querySelector('[data-act="taco-pick"][data-n="Abacate, cru"]')); await sleep(20);
  click(d.querySelector('[data-act="taco-my"]')); await sleep(20);
  ok(val('fn') === 'Abacate, cru' && val('fw') === '100' && val('fk') === '96' && /Tabela TACO/.test(d.getElementById('fsrc').textContent), 'Salvar em Meus alimentos preenche o formulário com a TACO');
  type('fu', 'colher'); type('fw', '30', 'change');
  ok(val('fk') === '29' && val('fp') === '0.4' && val('fg') === '2.5', `mudar a unidade para 30 g recalcula: ${val('fk')} kcal, P ${val('fp')}, G ${val('fg')}`);
  click(d.querySelector('[data-act="cf-save"]')); await sleep(20);
  const ab = saved().profile.custom.find((f) => f.n === 'Abacate, cru');
  ok(ab && ab.u === 'colher' && ab.ug === 30 && ab.k === 29 && !d.getElementById('fsrc'), 'salvo em Meus alimentos (1 colher = 30 g, 29 kcal)');
  ok([...d.querySelectorAll('#xf option')].some((o) => o.textContent === 'Abacate, cru'), 'passa a aparecer na lista de alimentos');

  // código de barras
  type('fbar', '123', 'change'); click(d.querySelector('[data-act="bar-find"]')); await sleep(30);
  ok(/8 a 14 números/.test(toast()) && urls.length === 0, 'código curto é recusado sem consultar: ' + toast());
  type('fbar', '7891000100103', 'change'); click(d.querySelector('[data-act="bar-find"]')); await sleep(50);
  ok(urls.length === 1 && urls[0].startsWith('https://world.openfoodfacts.org/api/v2/product/7891000100103.json'), 'consulta o Open Food Facts pelo código');
  ok(val('fn') === 'Leite Condensado (Moça)' && val('fw') === '20' && val('fk') === '65' && val('fp') === '1.4' && val('fc') === '11' && val('fg') === '1.6',
    `produto encontrado preenche a porção do rótulo: ${val('fn')}, ${val('fw')} g, ${val('fk')} kcal, P ${val('fp')} C ${val('fc')} G ${val('fg')}`);
  ok(/Open Food Facts/.test(d.getElementById('fsrc').textContent) && /Confira/.test(d.getElementById('fsrc').textContent), 'avisa a fonte e pede para conferir com o rótulo');
  type('fk', '70', 'change'); type('fw', '40', 'change');
  ok(val('fk') === '70', 'se você corrigir as calorias à mão, mudar a unidade não sobrescreve');
  click(d.querySelector('[data-act="cf-cancel"]')); await sleep(20);
  ok(val('fn') === '' && !d.getElementById('fsrc'), 'Cancelar limpa o formulário');
  type('fbar', '7899999999999', 'change'); click(d.querySelector('[data-act="bar-find"]')); await sleep(50);
  ok(/não encontrado/.test(toast()) && val('fn') === '', 'produto inexistente: ' + toast());
  type('fbar', '7890000000000', 'change'); click(d.querySelector('[data-act="bar-find"]')); await sleep(50);
  ok(/Sem conexão/.test(toast()), 'sem internet: ' + toast());

  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
