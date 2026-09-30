// Configuração inicial: sem perfil salvo o app pede os dados; com perfil salvo (ou backup) vai direto ao app.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { FILE, mockDate, withProfile } = require('./helpers');
const html = fs.readFileSync(process.argv[2] || FILE, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA ') + m);
let errs = [];

async function session(url, stored, fn) {
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errs.push(String((e.detail && e.detail.stack) || e.message)));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w) { mockDate(w); w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      if (stored) w.localStorage.setItem('wr_playbook_v1', JSON.stringify(stored)); } });
  const w = dom.window, d = w.document;
  const click = (e) => e.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const fill = (id, v) => { d.getElementById(id).value = v; };
  const saved = () => JSON.parse(w.localStorage.getItem('wr_playbook_v1') || 'null');
  const toast = () => d.getElementById('toast').textContent;
  await sleep(300);
  await fn({ w, d, click, fill, saved, toast });
  w.close();
}

(async () => {
  // 1) Primeira vez, sem nada salvo
  await session('https://example.test/#treino', null, async ({ d, click, fill, saved, toast }) => {
    ok(!!d.getElementById('setup'), 'sem perfil salvo abre a configuração inicial (mesmo com #treino no link)');
    ok(d.body.classList.contains('setup'), 'a barra de abas fica escondida durante a configuração');
    ok(saved() === null, 'nada é gravado antes de concluir a configuração');

    const go = () => click(d.querySelector('[data-act="setup-save"]'));
    go(); await sleep(20);
    ok(/peso/.test(toast()) && !!d.getElementById('setup'), 'sem peso é recusado: ' + toast());
    fill('su-peso', '82.5'); fill('su-alt', '90'); fill('su-idade', '21'); go(); await sleep(20);
    ok(/altura/.test(toast()), 'altura fora da faixa é recusada: ' + toast());
    fill('su-alt', '183'); go(); await sleep(20);
    ok(/sexo/.test(toast()) && d.getElementById('su-peso').value === '82.5', 'falta o sexo e os valores digitados continuam lá');
    d.getElementById('su-sexo').value = 'M'; go(); await sleep(20);
    ok(/objetivo/.test(toast()), 'falta o objetivo: ' + toast());
    d.getElementById('su-obj').value = 'Definir'; go(); await sleep(20);

    ok(!d.getElementById('setup') && !d.body.classList.contains('setup'), 'concluir leva ao app com as abas: ' + toast());
    ok(d.querySelector('#tabs [aria-current="page"]').dataset.tab === 'hoje', 'abre na aba Hoje');
    const s = saved();
    ok(s && s.profile.peso === 82.5 && s.profile.altura === 183 && s.profile.idade === 21 && s.profile.sexo === 'M' && s.profile.obj === 'Definir',
      'perfil gravado no aparelho: ' + (s && JSON.stringify({ p: s.profile.peso, a: s.profile.altura, i: s.profile.idade, o: s.profile.obj })));
    ok(s && s.weights.list.length === 1 && s.weights.list[0].kg === 82.5, 'o peso informado vira a primeira pesagem');
    ok(s && s.profile.customSeeded === true && s.profile.custom.length === 2, '"Meus alimentos" iniciais também são gravados');

    click(d.querySelector('[data-tab="perfil"]')); await sleep(20);
    ok(d.querySelector('[data-p="peso"]').value === '82.5' && /183 cm/.test(d.querySelector('.pills').textContent), 'a aba Perfil mostra os dados informados');
  });

  // 2) Quem já tem perfil salvo (versão antiga, sem campos novos) não vê a configuração
  await session('https://example.test/', withProfile(), async ({ d }) => {
    ok(!d.getElementById('setup') && !!d.querySelector('#tabs [aria-current="page"]'), 'perfil já salvo: vai direto para o app');
  });

  // 3) Restaurar backup direto da configuração inicial
  await session('https://example.test/', null, async ({ d, click, fill, saved, toast }) => {
    fill('bk', '{"weights":{"list":[]}}'); click(d.querySelector('[data-act="bk-load"]')); await sleep(20);
    ok(/inválido/.test(toast()) && !!d.getElementById('setup') && saved() === null, 'backup sem perfil é recusado e nada é gravado');
    const backup = withProfile({ weights: { list: [{ d: '2026-09-01', kg: 81 }] } });
    fill('bk', JSON.stringify(backup)); click(d.querySelector('[data-act="bk-load"]')); await sleep(20);
    const s = saved();
    ok(!d.getElementById('setup') && s && s.profile.peso === backup.profile.peso && s.weights.list.length === 1, 'backup válido restaura e abre o app: ' + toast());
  });

  console.log('ERROS:', errs.length ? errs : 'nenhum'); process.exit(0);
})();
