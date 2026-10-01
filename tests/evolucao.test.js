// Treino e evolução: força estimada, histórico por exercício, passo de carga, prontidão, consistência,
// testes de campo (6 testes, gráficos e lembrete na semana 4) e cintura (inclusive na tendência do peso).
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { FILE, mockDate, nextWeekday, PROFILE, withProfile } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const T = nextWeekday(3); // quarta: Academia B (tem supino e barra fixa)
const ago = (n) => { const d = new Date(T); d.setDate(d.getDate() - n); return fmt(d); };
const day = (o) => Object.assign({ eaten: {}, extras: [], water: 0, sets: {}, done: {}, chk: {} }, o);
const SUP = 'supino_reto_barra_ou_halteres', BAR = 'barra_fixa_pull_up';
let errs = [];

async function session(url, stored, fn) {
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { mockDate(w, T); w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.localStorage.setItem('wr_playbook_v1', JSON.stringify(stored)); } });
  const w = dom.window, d = w.document;
  await sleep(300);
  const click = (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const change = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const saved = () => JSON.parse(w.localStorage.getItem('wr_playbook_v1'));
  const toast = () => d.getElementById('toast').textContent;
  await fn({ w, d, click, change, saved, toast });
  w.close();
}

// supino: 90×6 há 3 semanas (força est. 108), 85×3 há 2 (93,5), 80×8 há 1 (101,3) -> última abaixo de 95% do melhor
const lifts = {
  ['d_' + ago(21)]: day({ sets: { [SUP]: [{ kg: 90, reps: 6, done: true }] }, done: { B: true } }),
  ['d_' + ago(14)]: day({ sets: { [SUP]: [{ kg: 85, reps: 3, done: true }] }, done: { B: true } }),
  ['d_' + ago(7)]: day({ sets: { [SUP]: [{ kg: 80, reps: 8, done: true }, { kg: 80, reps: 8, done: true }], [BAR]: [{ kg: '', reps: 10, done: true }, { kg: '', reps: 9, done: true }] }, done: { B: true } }),
};

(async () => {
  // ---------- Treino: histórico, passo de carga e prontidão ----------
  const health = (h) => ({ ['d_' + ago(0)]: day({ health: h }) });
  const base = {}; for (let i = 1; i <= 6; i++) base['d_' + ago(i + 7)] = day({ health: { rhr: 55 } });
  await session('https://example.test/#treino', withProfile(Object.assign({}, lifts, base, health({ sleep: 5.5, rhr: 62 }))), async ({ d, click, change, saved }) => {
    const ex = () => d.querySelector(`.ex[data-slug="${SUP}"]`);
    const hist = ex().querySelector('details.hist');
    ok(hist && /80 kg × 8 · 80 kg × 8/.test(hist.textContent) && /101 kg/.test(hist.textContent) && hist.querySelector('svg'), 'Treino: histórico do supino com séries, força estimada e gráfico');
    ok(/hoje: 80,0 kg; se sobrar reserva, tente 82,5 kg/.test(ex().querySelector('.last').textContent), 'passo padrão de 2,5 kg na dica');
    change(ex().querySelector('select[data-step]'), '5'); await sleep(20);
    ok(saved().profile.steps[SUP] === 5, 'passo de carga salvo por exercício');
    ok(/tente 85,0 kg/.test(ex().querySelector('.last').textContent) && ex().querySelector('[data-act="kgadj"][data-d="5"]') && /\+5/.test(ex().querySelector('[data-act="kgadj"][data-d="5"]').textContent), 'com passo de 5 kg a dica e os botões usam 5');
    ok(!d.querySelector(`.ex[data-slug="${BAR}"] [data-act="kgadj"][data-d="5"]`), 'o passo de um exercício não muda os outros');
    const r = d.getElementById('ready');
    ok(r && r.dataset.lvl === '4' && /pegar leve/.test(r.textContent) && /5,5 h/.test(r.textContent) && /7 bpm acima/.test(r.textContent), 'prontidão: dormiu 5,5 h e FC 7 bpm acima -> "pegar leve": ' + (r && r.textContent.slice(0, 110)));
  });
  await session('https://example.test/#treino', withProfile(Object.assign({}, base, health({ sleep: 6.5, rhr: 55 }))), async ({ d }) => {
    const r = d.getElementById('ready');
    ok(r && r.dataset.lvl === '1' && /Atenção/.test(r.textContent), 'prontidão: 6,5 h de sono -> atenção');
  });
  await session('https://example.test/#treino', withProfile(Object.assign({}, base, health({ sleep: 8, rhr: 55 }))), async ({ d }) => {
    const r = d.getElementById('ready');
    ok(r && r.dataset.lvl === '0' && /Pronto para treinar/.test(r.textContent) && /FC de repouso na sua média/.test(r.textContent), 'prontidão: 8 h e FC na média -> pronto');
  });
  await session('https://example.test/#treino', withProfile(), async ({ d }) => {
    const r = d.getElementById('ready');
    ok(r && r.dataset.lvl === '-1' && /registre o sono/.test(r.textContent), 'sem dados de hoje: explica como ativar a prontidão');
  });

  // ---------- Evolução ----------
  const evol = Object.assign({}, lifts, {
    ['d_' + ago(2)]: day({ done: { A: true } }), ['d_' + ago(1)]: day({ done: { FLAG: true, DOM: true } }),
    tests: { list: [{ d: ago(28), s10: 1.8, s40: 0, vj: 0, ag: 0, bj: 240 }] },
    measures: { list: [{ d: ago(21), cm: 92 }] },
  });
  await session('https://example.test/#evol', withProfile(evol), async ({ d, click, change, saved, toast }) => {
    const row = (n) => [...d.querySelectorAll('.lift')].find((r) => r.querySelector('b') && r.querySelector('b').textContent === n);
    const sup = row('Supino reto'), bar = row('Barra fixa');
    ok(sup && sup.querySelector('.fval').textContent === '101 kg' && /melhor 108 kg/.test(sup.textContent) && /Abaixo/.test(sup.textContent), 'força estimada: supino 80×8 = 101 kg, melhor 108 (90×6) -> Abaixo');
    ok(sup && /última: 80 kg × 8/.test(sup.textContent), 'mostra a última melhor série');
    ok(bar && bar.querySelector('.fval').textContent === '10 reps' && /Mantendo/.test(bar.textContent), 'barra fixa sem carga usa repetições');
    ok(/Epley/.test(d.body.textContent), 'explica a força estimada');

    const cols = [...d.querySelectorAll('.wk .col b')].map((b) => b.textContent);
    ok(cols[cols.length - 1] === '1', 'consistência: flag e descanso ativo não contam como treino (semana atual = 1): ' + cols.join(','));

    // histórico de qualquer exercício
    const hx = d.getElementById('hx');
    ok(hx && hx.querySelectorAll('option').length > 20, 'Evolução: seletor com todos os exercícios da academia');
    change(hx, 'Agachamento livre (back squat)'); await sleep(20);
    ok(/Ainda sem séries/.test(d.getElementById('histex').textContent), 'exercício sem registro explica');
    change(d.getElementById('hx'), 'Supino reto (barra ou halteres)'); await sleep(20);
    ok(d.getElementById('histex').querySelectorAll('.hrow').length === 3 && d.getElementById('histex').querySelector('svg'), 'supino: 3 sessões e gráfico');

    // testes de campo
    ok(['t10', 't40', 'tvj', 'tbj', 'tag5', 'tc3'].every((id) => d.getElementById(id)), 'os 6 testes têm campo (incluindo salto horizontal e 3-cone)');
    d.getElementById('t10').value = '1.72'; d.getElementById('tbj').value = '245'; d.getElementById('tc3').value = '7.1';
    click(d.querySelector('[data-act="addt"]')); await sleep(20);
    const t = saved().tests.list.find((x) => x.d === ago(0));
    ok(t && t.s10 === 1.72 && t.bj === 245 && t.c3 === 7.1, 'salva salto horizontal e 3-cone: ' + JSON.stringify(t));
    const tile = (k) => d.querySelector(`.ttile[data-k="${k}"]`);
    ok(/1,72 s ★/.test(tile('s10').textContent) && /menor é melhor/.test(tile('s10').textContent) && tile('s10').querySelector('svg'), '10 jardas: melhor marca (menor tempo) com gráfico');
    ok(/245 cm ★/.test(tile('bj').textContent) && /maior é melhor/.test(tile('bj').textContent), 'salto horizontal: maior é melhor');
    ok(/7,10 s/.test(tile('c3').textContent), '3-cone aparece');

    // cintura
    d.getElementById('mc').value = '90'; click(d.querySelector('[data-act="addm"]')); await sleep(20);
    ok(saved().measures.list.some((m) => m.d === ago(0) && m.cm === 90), 'cintura salva (e entra no backup)');
    ok(/-2,0 cm desde/.test(d.getElementById('cintura').textContent) && d.getElementById('cintura').querySelector('svg'), 'mostra a variação e o gráfico da cintura');
    d.getElementById('mc').value = '20'; click(d.querySelector('[data-act="addm"]')); await sleep(20);
    ok(/40 a 200/.test(toast()), 'medida absurda é recusada');
    click(d.querySelector(`[data-act="delm"][data-d="${ago(0)}"]`)); await sleep(20);
    ok(!saved().measures.list.some((m) => m.d === ago(0)), 'apagar medida');
  });

  // tendência: peso parado, mas a cintura caiu -> recomenda esperar antes de cortar
  const flat = { weights: { list: [[21, 80], [14, 80.1], [7, 79.9], [0, 80]].map(([n, kg]) => ({ d: ago(n), kg })) } };
  await session('https://example.test/#evol', withProfile(Object.assign({}, flat, { measures: { list: [{ d: ago(21), cm: 92 }, { d: ago(0), cm: 90 }] } })), async ({ d }) => {
    const tr = d.getElementById('trend');
    ok(tr.dataset.st === 'parado' && tr.classList.contains('info') && /cintura caiu 2,0 cm/.test(tr.textContent) && /esperar/.test(tr.textContent), 'peso parado + cintura caindo: sugere esperar antes de cortar');
  });
  await session('https://example.test/#evol', withProfile(flat), async ({ d }) => {
    ok(d.getElementById('trend').classList.contains('warn') && !/cintura/.test(d.getElementById('trend').textContent), 'sem medidas de cintura: aviso normal');
  });

  // ---------- lembrete dos testes na semana 4 ----------
  const mon = new Date(T); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const wk4 = new Date(mon); wk4.setDate(wk4.getDate() - 21);
  const p4 = { profile: Object.assign({}, PROFILE, { cycleStart: fmt(wk4) }) };
  await session('https://example.test/', withProfile(p4), async ({ d, click }) => {
    ok(!!d.getElementById('testrem'), 'semana 4 sem testes recentes: Hoje lembra dos testes de campo');
    click(d.querySelector('[data-act="goto-tests"]')); await sleep(20);
    ok(d.querySelector('#tabs [aria-current="page"]').dataset.tab === 'evol' && d.getElementById('testes'), 'o botão leva aos testes na Evolução');
  });
  await session('https://example.test/', withProfile(Object.assign({}, p4, { tests: { list: [{ d: ago(10), s10: 1.75 }] } })), async ({ d }) => {
    ok(!d.getElementById('testrem'), 'com teste feito há 10 dias: sem lembrete');
  });
  await session('https://example.test/', withProfile(), async ({ d }) => {
    ok(!d.getElementById('testrem'), 'fora da semana 4: sem lembrete');
  });

  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
