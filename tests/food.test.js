// Cardápio em medidas caseiras: ajustar porções, adicionar alimento, voltar ao plano e "fora do plano".
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { FILE, mockDate, seedStore } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'app-data.json'), 'utf8'));

const errs = []; const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/', virtualConsole: vc, pretendToBeVisual: true, beforeParse(w) { mockDate(w); seedStore(w); } });
const w = dom.window, d = w.document; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const kcal = () => Number(d.querySelector('.fieldcap .big').textContent.replace(/\./g, ''));
const items = (i = 0) => [...d.querySelectorAll('.mrow')[i].querySelectorAll('.fr b')].map((b) => b.textContent);

// kcal esperadas do 1º item do plano (calculadas dos dados, não escritas à mão)
const food = Object.fromEntries(D.foods.map((f) => [f[0], f]));
const kcalOf = (name, g) => food[name][1] * g / 100;
const plan0 = D.plans.treino[0][2];
const expected = Math.round(plan0.reduce((t, [n, g]) => t + kcalOf(n, g), 0));

(async () => {
  await sleep(300);
  const tile = d.querySelector('.tile .sumtxt');
  ok(tile && /3 ovos cozidos/.test(tile.textContent), 'Hoje: a próxima refeição lista o cardápio em medidas caseiras: ' + (tile && tile.textContent));
  click(d.querySelector('[data-tab="comida"]')); await sleep(30);
  ok(!!d.querySelectorAll('.mrow')[0].querySelector('.foods'), 'a próxima refeição já vem aberta');
  ok(items().includes('3 ovos cozidos'), 'café da manhã tem "3 ovos cozidos"');

  click(d.querySelectorAll('.mrow')[0].querySelector('[data-act="eat"]')); await sleep(20);
  ok(Math.abs(kcal() - expected) <= 1, `marcar "Comi" soma as calorias do plano (${kcal()} ≈ ${expected})`);

  let r0 = d.querySelectorAll('.mrow')[0];
  if (!r0.querySelector('.foods')) click(r0.querySelector('.mopen')); await sleep(20);
  const ovoIdx = () => items().findIndex((t) => /ovo/.test(t));
  click(d.querySelectorAll('.mrow')[0].querySelectorAll('[data-act="qty"][data-d="-1"]')[ovoIdx()]); await sleep(20);
  ok(items().includes('2 ovos cozidos') && /ajustado/.test(d.querySelectorAll('.mrow')[0].textContent), 'botão − tira 1 ovo e marca a refeição como "ajustado"');
  ok(Math.abs(kcal() - (expected - kcalOf('Ovo cozido', 50))) <= 1, 'as calorias do dia caem junto (−1 ovo)');

  for (let i = 0; i < 2; i++) { click(d.querySelectorAll('.mrow')[0].querySelectorAll('[data-act="qty"][data-d="1"]')[ovoIdx()]); await sleep(15); }
  ok(items().includes('4 ovos cozidos'), 'botão + soma ovos (4 ovos cozidos)');

  d.getElementById('af0').value = 'Queijo minas frescal';
  click(d.querySelector('[data-act="addf"][data-i="0"]')); await sleep(20);
  ok(items().some((t) => /1 fatia de queijo minas/.test(t)), 'adicionar alimento dentro da refeição: ' + items().filter((t) => /queijo/.test(t)));

  click(d.querySelector('[data-act="resetm"][data-i="0"]')); await sleep(20);
  ok(items().includes('3 ovos cozidos') && Math.abs(kcal() - expected) <= 1, '"Voltar ao plano" restaura porções e calorias');

  const xf = d.getElementById('xf'); xf.value = 'Ovo cozido'; xf.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(d.getElementById('xu').textContent === 'ovo cozido', 'fora do plano: o rótulo da unidade acompanha o alimento: ' + d.getElementById('xu').textContent);
  const antes = kcal();
  d.getElementById('xq').value = '2'; click(d.querySelector('[data-act="addx"]')); await sleep(20);
  ok([...d.querySelectorAll('.lift b')].some((b) => b.textContent === '2 ovos cozidos') && Math.abs(kcal() - antes - 2 * kcalOf('Ovo cozido', 50)) <= 1, 'fora do plano: 2 ovos somam as calorias certas');

  click(d.querySelector('[data-act="plan"][data-t="sab"]')); await sleep(20);
  ok(d.querySelectorAll('[data-act="qty"]').length === 0, 'ao olhar o plano de outro dia não há botões de edição');
  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
