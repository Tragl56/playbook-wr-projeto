const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const {FILE,mockDate,seedStore}=require('./helpers');
const html=fs.readFileSync(process.argv[2]||FILE,'utf8');
const pad=n=>String(n).padStart(2,'0'),fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const past=new Date();past.setDate(past.getDate()-7);
const slugM='rosca_martelo_triceps_na_corda_bi_set',slugP='rosca_de_punho_e_rosca_de_punho_reversa';
const seed={['d_'+fmt(past)]:{eaten:{},extras:[],water:0,chk:{},done:{},sets:{[slugM]:[{kg:14,reps:12,kg2:25,reps2:12,done:true},{kg:14,reps:12,kg2:25,reps2:12,done:true}],[slugP]:[{kg:20,reps:15,done:true}]}}};
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.detail&&e.detail.stack||e.message)));
function wed(){const d=new Date();d.setHours(17,0,0,0);while(d.getDay()!==3)d.setDate(d.getDate()+1);return d;}
const off=wed().getTime()-Date.now();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/#treino',virtualConsole:vc,pretendToBeVisual:true,
  beforeParse(w){const R=w.Date;w.Date=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+off);}static now(){return R.now()+off;}};
    w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};seedStore(w,seed);}});
const w=dom.window,d=w.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),click=e=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const ok=(c,m)=>console.log((c?'OK   ':'FALHA ')+m);
const ex=sl=>d.querySelector(`.ex[data-slug="${sl}"]`);
(async()=>{
  await sleep(300);
  ok(d.querySelector('h1').textContent==='Academia B','quarta abre a Academia B');
  const m=ex(slugM);
  ok(!!m,'exercício do bi-set existe');
  click(m.querySelector('.ex-h'));await sleep(10);
  const m1=ex(slugM);
  const sets=[...m1.querySelectorAll('.set')];
  ok(sets.length===3&&sets.every(s=>s.querySelector('.kg')&&s.querySelector('.kg2')&&s.querySelector('.rp')&&s.querySelector('.rp2')),'cada série tem 2 cargas e 2 repetições (3 séries)');
  ok(sets[0].querySelector('.kg').value==='14'&&sets[0].querySelector('.kg2').value==='25','carga sugerida vem do histórico: A=14, B=25');
  ok(sets[0].querySelector('.rp').value==='12'&&sets[0].querySelector('.rp2').value==='12','repetições pré-preenchidas 12 + 12');
  console.log('  última vez:',m1.querySelector('.last').textContent);
  console.log('  legenda:',m1.querySelector('.ex-b > p.tag').textContent);
  ok(m1.querySelectorAll('[data-act="kgadj"]').length===4,'dois controles de ±2,5 (um por movimento)');
  // digita cargas diferentes e conclui a 1ª série
  sets[0].querySelector('.kg').value='16';sets[0].querySelector('.kg2').value='30';sets[0].querySelector('.rp2').value='10';
  click(sets[0].querySelector('.tick'));await sleep(30);
  const sv=JSON.parse(w.localStorage.getItem('wr_playbook_v1'));const k=Object.keys(sv).filter(x=>x.startsWith('d_')).sort().pop();
  const s0=sv[k].sets[slugM][0];
  ok(s0.kg===16&&s0.kg2===30&&s0.reps===12&&s0.reps2===10&&s0.done===true,'salvou as duas cargas e repetições: '+JSON.stringify(s0));
  const after=[...ex(slugM).querySelectorAll('.set')];
  ok(after[1].querySelector('.kg').value==='16'&&after[1].querySelector('.kg2').value==='30','as próximas séries herdam as duas cargas (16 / 30)');
  // +2,5 só no movimento B
  click(ex(slugM).querySelector('[data-act="kgadj"][data-w="2"][data-d="2.5"]'));await sleep(20);
  const a2=[...ex(slugM).querySelectorAll('.set')];
  ok(a2[1].querySelector('.kg').value==='16'&&a2[1].querySelector('.kg2').value==='32.5','+2,5 no B não mexe no A (16 / 32.5)');
  click(ex(slugM).querySelector('[data-act="kgadj"][data-w="1"][data-d="-2.5"]'));await sleep(20);
  const a3=[...ex(slugM).querySelectorAll('.set')];
  ok(a3[2].querySelector('.kg').value==='13.5'&&a3[2].querySelector('.kg2').value==='32.5','−2,5 no A não mexe no B (13.5 / 32.5)');
  // persistência após trocar de aba
  click(d.querySelector('[data-tab="hoje"]'));await sleep(20);click(d.querySelector('[data-tab="treino"]'));await sleep(20);
  const a4=[...ex(slugM).querySelectorAll('.set')];
  ok(a4[0].querySelector('.kg2').value==='30'&&a4[0].classList.contains('done')&&a4[2].querySelector('.kg2').value==='32.5','valores persistem ao voltar à aba');
  // conclui as outras e finaliza -> volume e recordes
  for(const t of d.querySelectorAll('.set:not(.done) .tick')) click(t);
  await sleep(30);click(d.querySelector('[data-act="finish"]'));await sleep(30);
  const sc=d.querySelector('.sumcard');
  console.log('  resumo:',[...sc.querySelectorAll('.stat')].map(s=>s.textContent).join(' | '));
  console.log('  recordes:',[...sc.querySelectorAll('.ins')].map(x=>x.textContent).join(' / '));
  ok([...sc.querySelectorAll('.ins')].some(x=>/Tríceps na corda/.test(x.textContent)),'recorde do 2º movimento aparece com o nome certo');
  ok([...sc.querySelectorAll('.ins')].some(x=>/Rosca martelo/.test(x.textContent)),'recorde do 1º movimento aparece com o nome certo');
  // roscas de punho
  click(d.querySelector('[data-act="undo"]'));await sleep(20);
  const p=ex(slugP);click(p.querySelector('.ex-h'));await sleep(10);
  const ps=[...ex(slugP).querySelectorAll('.set')];
  ok(ps.length===3&&ps.every(s=>s.querySelector('.kg2')),'roscas de punho (normal e reversa) também têm 2 cargas');
  ok(ps[0].querySelector('.kg').value==='20'&&ps[0].querySelector('.kg2').value==='','histórico antigo (só 1 carga) continua funcionando: A=20, B em branco');
  ok(ps[0].querySelector('.rp').value==='15'&&ps[0].querySelector('.rp2').value==='15','repetições 15 + 15');
  // exercício comum não muda
  const s1=d.querySelector('.ex[data-slug="supino_reto_barra_ou_halteres"]');
  ok(s1&&!s1.querySelector('.kg2')&&s1.querySelectorAll('[data-act="kgadj"]').length===2,'supino (exercício comum) continua com 1 carga');
  console.log('ERROS:',errs.length?errs:'nenhum');process.exit(0);
})();
