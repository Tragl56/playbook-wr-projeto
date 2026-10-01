// Tendência do peso (aba Evolução): perdendo rápido, parado, dentro do esperado, poucos dados e o botão de aplicar.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { FILE, mockDate, nextWeekday, PROFILE, withProfile } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const T = nextWeekday(3);
const ago = (n) => { const d = new Date(T); d.setDate(d.getDate() - n); return fmt(d); };
// pesagens: [[dias atrás, kg], ...]
const W = (list) => ({ weights: { list: list.map(([n, kg]) => ({ d: ago(n), kg })) } });
let errs = [];

async function session(stored, fn) {
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/#evol', virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { mockDate(w, T); w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.localStorage.setItem('wr_playbook_v1', JSON.stringify(stored)); } });
  const w = dom.window, d = w.document;
  await sleep(300);
  const box = () => d.getElementById('trend');
  const btn = () => d.querySelector('[data-act="trend-apply"]');
  const saved = () => JSON.parse(w.localStorage.getItem('wr_playbook_v1'));
  await fn({ w, d, box, btn, saved, click: (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) });
  w.close();
}

(async () => {
  // Definir (perfil de teste): 80 kg
  await session(withProfile(W([[21, 80], [14, 79], [7, 78], [0, 77]])), async ({ d, box, btn, saved, click }) => {
    ok(box().dataset.st === 'rapido' && box().classList.contains('warn'), 'perdendo 1 kg por semana (>1%): "rápido demais": ' + box().textContent.slice(0, 90));
    ok(/comer cerca de \d+ kcal/.test(box().textContent), 'sugere comer mais: ' + (box().textContent.match(/Sugestão:[^.]*/) || [''])[0]);
    ok(btn() && Number(btn().dataset.d) > 0, 'botão de aplicar soma nos fatores: ' + (btn() && btn().dataset.d));
    const before = saved().profile.fat;
    ok(before === undefined || before.treino === 1.55, 'nada muda antes de tocar no botão');
    const dF = Number(btn().dataset.d);
    click(btn()); await new Promise((r) => setTimeout(r, 20));
    const p = saved().profile;
    ok(Math.abs(p.fat.treino - (1.55 + dF)) < 1e-9 && Math.abs(p.fat.sab - (1.75 + dF)) < 1e-9 && Math.abs(p.fat.desc - (1.40 + dF)) < 1e-9,
      `aplicar soma ${dF} nos 3 fatores: ${p.fat.treino} / ${p.fat.sab} / ${p.fat.desc}`);
    ok(p.trendAdj && p.trendAdj.d === ago(0), 'guarda a data do ajuste');
    ok(box().dataset.st === 'pouco' && /Ajuste aplicado/.test(box().textContent) && !btn(), 'depois do ajuste espera novas pesagens (sem botão)');
  });

  await session(withProfile(W([[21, 80], [14, 80.1], [7, 79.9], [0, 80]])), async ({ box, btn }) => {
    ok(box().dataset.st === 'parado', 'peso parado ao definir: ' + box().textContent.slice(0, 80));
    ok(/cortar cerca de \d+ kcal/.test(box().textContent) && btn() && Number(btn().dataset.d) < 0, 'sugere cortar calorias (fator negativo: ' + (btn() && btn().dataset.d) + ')');
  });

  await session(withProfile(W([[21, 80], [14, 79.5], [7, 79], [0, 78.5]])), async ({ box, btn }) => {
    ok(box().dataset.st === 'ok' && box().classList.contains('ok') && !btn(), 'perdendo 0,5 kg por semana: dentro do esperado, sem sugestão: ' + box().textContent.slice(0, 80));
    ok(/-0,50 kg por semana/.test(box().textContent), 'mostra a variação por semana em pt-BR');
  });

  await session(withProfile(W([[7, 80], [0, 79.6]])), async ({ box, btn }) => {
    ok(box().dataset.st === 'pouco' && /2 pesagens em 7 dias/.test(box().textContent) && !btn(), 'poucos dados: explica o que falta: ' + box().textContent.slice(0, 90));
  });

  // pesagens antigas (mais de 28 dias) não entram na conta
  await session(withProfile(W([[60, 90], [21, 80], [14, 79.5], [7, 79], [0, 78.5]])), async ({ box }) => {
    ok(box().dataset.st === 'ok', 'usa só os últimos 28 dias');
  });

  await session(withProfile(Object.assign({ profile: Object.assign({}, PROFILE, { obj: 'Ganhar massa' }) }, W([[21, 80], [14, 80], [7, 79.9], [0, 80]]))), async ({ box, btn }) => {
    ok(box().dataset.st === 'parado' && btn() && Number(btn().dataset.d) > 0, 'ganhar massa sem subir: sugere comer mais');
  });

  await session(withProfile(Object.assign({ profile: Object.assign({}, PROFILE, { obj: 'Manter' }) }, W([[21, 80], [14, 80.5], [7, 81], [0, 81.5]]))), async ({ box, btn }) => {
    ok(box().dataset.st === 'subindo' && btn() && Number(btn().dataset.d) < 0, 'manter com peso subindo: sugere cortar');
  });

  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
