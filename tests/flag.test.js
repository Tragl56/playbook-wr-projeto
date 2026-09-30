const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const {FILE,mockDate,seedStore}=require('./helpers');
const html=fs.readFileSync(process.argv[2]||FILE,'utf8');
const pad=n=>String(n).padStart(2,'0'),fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function nextWeekday(wd){const d=new Date();d.setHours(18,0,0,0);while(d.getDay()!==wd)d.setDate(d.getDate()+1);return d;}
async function session(target,seed,fn){
  const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.detail&&e.detail.stack||e.message)));
  const off=target.getTime()-Date.now();
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/',virtualConsole:vc,pretendToBeVisual:true,
    beforeParse(w){const R=w.Date;w.Date=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+off);}static now(){return R.now()+off;}};
      w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};seedStore(w,seed);}});
  const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const click=e=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  await sleep(300);await fn({w,d,sleep,click});w.close();return errs;
}
const ok=(c,m)=>console.log((c?'OK   ':'FALHA ')+m);
(async()=>{
  const wed=nextWeekday(3),thu=new Date(wed.getTime()+864e5),mon=nextWeekday(1);
  let errs=[];
  errs=errs.concat(await session(wed,null,async({d,sleep,click})=>{
    const card=[...d.querySelectorAll('.card')].find(c=>/Opcional · Flag/.test(c.textContent));
    ok(!!card,'quarta: cartão do flag aparece na aba Hoje');
    ok(/20:00/.test(card.textContent)&&/18:30/.test(card.textContent),'mostra horário e dica de refeição antes do jogo');
    click(card.querySelector('[data-act="goto-treino"]'));await sleep(30);
    ok(d.querySelector('h1').textContent==='Flag football','abre a atividade Flag football');
    ok([...d.querySelectorAll('.chip')].some(c=>/Flag/.test(c.textContent)),'chip do flag na lista de treinos');
    ok(/Atividade opcional/.test(d.querySelector('.note').textContent)&&!/não é o treino de hoje/.test(d.getElementById('view').textContent),'aviso de opcional, sem aviso de "outro dia"');
    ok(d.querySelectorAll('.chk').length===6,'6 itens no checklist');
    const first=d.querySelector('.chk input');first.checked=true;first.dispatchEvent(new d.defaultView.Event('change',{bubbles:true}));await sleep(1200);
    ok(/1<\/b> de 6 itens/.test(d.getElementById('prog').innerHTML),'progresso 1 de 6: '+d.getElementById('prog').textContent);
    ok(/⏱/.test(d.getElementById('sesst').textContent),'cronômetro iniciou');
    ok(/Marcar como feito/.test(d.querySelector('[data-act="finish"]').textContent),'botão "Marcar como feito"');
    click(d.querySelector('[data-act="finish"]'));await sleep(30);
    ok(!!d.querySelector('.sumcard'),'resumo ao concluir: '+[...d.querySelectorAll('.sumcard .stat')].map(s=>s.textContent).join(' | '));
    click(d.querySelector('[data-tab="hoje"]'));await sleep(30);
    const c2=[...d.querySelectorAll('.card')].find(c=>/Opcional · Flag/.test(c.textContent));
    ok(/Feito/.test(c2.textContent)&&!d.querySelector('[data-act="finish"][data-id="FLAG"]'),'Hoje mostra "Feito ✓" e some o botão');
    click(d.querySelector('[data-tab="evol"]'));await sleep(30);
    const wc=[...d.querySelectorAll('.card')].find(c=>/Esta semana/.test(c.textContent));
    ok(!!wc&&/Flag 1×/.test(wc.textContent),'Evolução: resumo da semana com "Flag 1×"');
    console.log('   ',[...wc.querySelectorAll('.stat')].map(s=>s.textContent).join(' | '));
  }));
  // atalho "Fui jogar" direto da aba Hoje
  errs=errs.concat(await session(wed,null,async({d,sleep,click})=>{
    click(d.querySelector('[data-act="finish"][data-id="FLAG"]'));await sleep(30);
    const c=[...d.querySelectorAll('.card')].find(c=>/Opcional · Flag/.test(c.textContent));
    ok(/Feito/.test(c.textContent),'botão "Fui jogar" marca como feito direto');
  }));
  // quinta depois de um flag
  const ys=fmt(wed);const seed={['d_'+ys]:{eaten:{},extras:[],water:0,sets:{},done:{FLAG:true},chk:{}}};
  errs=errs.concat(await session(thu,seed,async({d,sleep,click})=>{
    click(d.querySelector('[data-tab="treino"]'));await sleep(30);
    ok(d.querySelector('h1').textContent==='Academia C','quinta abre Academia C');
    ok(/Ontem teve flag/.test(d.getElementById('view').textContent),'quinta após flag: nota de recuperação');
  }));
  errs=errs.concat(await session(thu,null,async({d,sleep,click})=>{
    click(d.querySelector('[data-tab="treino"]'));await sleep(30);
    ok(!/Ontem teve flag/.test(d.getElementById('view').textContent),'quinta sem flag: sem nota');
  }));
  errs=errs.concat(await session(mon,null,async({d})=>{
    ok(![...d.querySelectorAll('.card')].some(c=>/Opcional · Flag/.test(c.textContent)),'segunda: sem cartão do flag');
  }));
  console.log('ERROS:',errs.length?errs:'nenhum');process.exit(0);
})();
