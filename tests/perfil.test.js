// Backup (arquivo, cópia, restauração e lembrete mensal), limites dos campos do Perfil, lembretes do iPhone e foco ao trocar de aba.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { FILE, mockDate, nextWeekday, withProfile } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const T = nextWeekday(3);
const ago = (n) => { const d = new Date(T); d.setDate(d.getDate() - n); return fmt(d); };
const emptyDay = { eaten: {}, extras: [], water: 500, sets: {}, done: {}, chk: {} };
let errs = [];

async function session(url, stored, fn, setup) {
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { mockDate(w, T); w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.localStorage.setItem('wr_playbook_v1', JSON.stringify(stored)); if (setup) setup(w); } });
  const w = dom.window, d = w.document;
  await sleep(300);
  const click = (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const saved = () => JSON.parse(w.localStorage.getItem('wr_playbook_v1'));
  const toast = () => d.getElementById('toast').textContent;
  await fn({ w, d, click, saved, toast });
  w.close();
}

(async () => {
  // Lembrete mensal na aba Hoje
  await session('https://example.test/', withProfile({ ['d_' + ago(40)]: emptyDay }), async ({ d, click, saved }) => {
    const c = d.getElementById('bkrem');
    ok(c && /40 dias/.test(c.textContent), 'Hoje: 40 dias de uso sem backup mostra o lembrete');
    click(d.querySelector('[data-act="bk-later"]')); await sleep(20);
    ok(!d.getElementById('bkrem') && saved().profile.bkSnooze === ago(-7), '"Lembrar em 7 dias" esconde o aviso até ' + saved().profile.bkSnooze);
  });
  await session('https://example.test/', withProfile({ ['d_' + ago(40)]: emptyDay, profile: Object.assign(withProfile().profile, { lastBackup: ago(10) }) }), async ({ d }) => {
    ok(!d.getElementById('bkrem'), 'backup feito há 10 dias: sem lembrete');
  });
  await session('https://example.test/', withProfile({ ['d_' + ago(5)]: emptyDay }), async ({ d }) => {
    ok(!d.getElementById('bkrem'), 'app usado há só 5 dias: sem lembrete');
  });

  // Perfil: salvar arquivo, copiar, restaurar de arquivo
  let downloaded = null, copied = null;
  const stub = (w) => {
    w.URL.createObjectURL = () => 'blob:teste'; w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () { downloaded = this.download; };
    Object.defineProperty(w.navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { copied = t; } } });
  };
  await session('https://example.test/#perfil', withProfile({ ['d_' + ago(3)]: emptyDay, weights: { list: [{ d: ago(3), kg: 80 }] } }), async ({ w, d, click, saved, toast }) => {
    ok(/nenhum ainda/.test(d.getElementById('bklast').textContent), 'Perfil mostra "Último backup: nenhum ainda"');
    click(d.querySelector('[data-act="bk-file"]')); await sleep(30);
    ok(downloaded === `playbook-wr-backup-${ago(0)}.json`, 'Salvar arquivo baixa ' + downloaded);
    ok(saved().profile.lastBackup === ago(0) && !/nenhum/.test(d.getElementById('bklast').textContent), 'registra a data do backup: ' + d.getElementById('bklast').textContent);

    click(d.querySelector('[data-act="bk-copy"]')); await sleep(30);
    const o = copied && JSON.parse(copied);
    ok(o && o.profile && o.weights.list.length === 1 && o['d_' + ago(3)], 'Copiar backup copia perfil, pesagens e dias');
    ok(/copiado/.test(toast()), 'avisa que copiou: ' + toast());

    // restaurar a partir de um arquivo
    const backup = withProfile({ weights: { list: [{ d: ago(20), kg: 82 }, { d: ago(10), kg: 81 }] }, ['d_' + ago(10)]: emptyDay });
    d.querySelector('details:has(#bkf)') && (d.querySelector('details:has(#bkf)').open = true);
    const inp = d.getElementById('bkf');
    Object.defineProperty(inp, 'files', { configurable: true, value: [new w.File([JSON.stringify(backup)], 'b.json', { type: 'application/json' })] });
    inp.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(60);
    const s = saved();
    ok(/restaurado/.test(toast()) && s.weights.list.length === 2 && s['d_' + ago(10)] && !s['d_' + ago(3)], 'restaurar de arquivo troca os dados pelos do backup');

    const inp2 = d.getElementById('bkf');
    Object.defineProperty(inp2, 'files', { configurable: true, value: [new w.File(['isso não é backup'], 'x.txt')] });
    inp2.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(60);
    ok(/inválido/.test(toast()) && saved().weights.list.length === 2, 'arquivo errado é recusado sem apagar nada');
  }, stub);

  // Perfil: limites dos campos, lembretes e acessibilidade
  await session('https://example.test/#perfil', withProfile(), async ({ w, d, click, saved, toast }) => {
    const peso = () => d.querySelector('[data-p="peso"]');
    peso().value = '5'; peso().dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(20);
    ok(/fora da faixa: use de 30 a 250/.test(toast()) && peso().value === '80' && saved().profile.peso === 80, 'peso 5 kg é recusado e o valor volta: ' + toast());
    const idade = d.querySelector('[data-p="idade"]');
    idade.value = '200'; idade.dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(20);
    ok(/12 a 90/.test(toast()) && saved().profile.idade === 30, 'idade 200 é recusada');
    peso().value = '81.5'; peso().dispatchEvent(new w.Event('change', { bubbles: true })); await sleep(20);
    ok(saved().profile.peso === 81.5, 'peso válido é salvo');

    const lem = d.getElementById('lembretes');
    ok(lem && /08:00/.test(lem.textContent) && /400 ml/.test(lem.textContent) && /07:30 Café da manhã/.test(lem.textContent),
      'Lembretes no iPhone: horários de água (~400 ml para 81,5 kg) e das refeições');
    ok(/Safari/.test(lem.textContent), 'avisa para não usar links (abrem no Safari)');

    ok(!d.getElementById('view').hasAttribute('aria-live'), 'a tela não é mais lida inteira a cada mudança (sem aria-live no main)');
    click(d.querySelector('[data-tab="evol"]')); await sleep(20);
    ok(d.activeElement && d.activeElement.tagName === 'H1' && /Evolução/.test(d.activeElement.textContent), 'trocar de aba leva o foco ao título da tela');
  });

  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
