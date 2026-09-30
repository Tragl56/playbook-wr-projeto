const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const {FILE,mockDate,seedStore}=require('./helpers');
const html=fs.readFileSync(process.argv[2]||FILE,'utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.detail&&e.detail.stack||e.message)));
// histórico: supino com 80 kg x 6 (topo da faixa 6) há 7 dias, para testar sugestão e recorde
const d=new Date();d.setDate(d.getDate()-7);const pad=n=>String(n).padStart(2,'0');const past=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const seed={['d_'+past]:{eaten:{},extras:[],water:0,sets:{supino_reto_barra_ou_halteres:[{kg:80,reps:6,done:true},{kg:80,reps:6,done:true}]},done:{},chk:{}}};
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/#treino',virtualConsole:vc,pretendToBeVisual:true,
  beforeParse(w){mockDate(w);seedStore(w,seed);w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};}});
const w=dom.window,doc=w.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),click=e=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const ok=(c,m)=>console.log((c?'OK   ':'FALHA ')+m);
(async()=>{
  await sleep(300);
  ok(doc.querySelector('#tabs [aria-current="page"]').dataset.tab==='treino','abre direto na aba Treino pelo #treino');
  console.log('  resumo:',[...doc.querySelectorAll('.pills .pill')].map(p=>p.textContent).join(' | '));
  ok(/Aquecimento/.test(doc.querySelector('.chk').textContent),'aquecimento virou item marcável');
  ok(doc.querySelector('#sesst').textContent==='','relógio vazio antes de começar');
  // marca aquecimento -> inicia relógio
  const wu=doc.querySelector('.chk input');wu.checked=true;wu.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(1200);
  ok(/⏱/.test(doc.querySelector('#sesst').textContent),'relógio iniciou: '+doc.querySelector('#sesst').textContent);
  // 1º exercício é supino: sugestão baseada no histórico
  const ex0=doc.querySelector('.ex');console.log('  última vez:',ex0.querySelector('.last').textContent);
  // digita 82,5 na 1ª série e conclui -> propaga nas próximas
  const sets=[...ex0.querySelectorAll('.set')];const kg0=sets[0].querySelector('.kg');kg0.value='82.5';
  click(sets[0].querySelector('.tick'));await sleep(30);
  const ex0b=doc.querySelector('.ex');const kgs=[...ex0b.querySelectorAll('.set .kg')].map(i=>i.value);
  ok(kgs.every(v=>v==='82.5'),'carga da 1ª série propagou: '+kgs.join(', '));
  // ajuste +2,5 nas séries restantes
  click(ex0b.querySelector('[data-act="kgadj"][data-d="2.5"]'));await sleep(20);
  const kgs2=[...doc.querySelector('.ex').querySelectorAll('.set .kg')].map(i=>i.value);
  ok(kgs2[0]==='82.5'&&kgs2.slice(1).every(v=>v==='85'),'+2,5 só nas restantes: '+kgs2.join(', '));
  // persistência: troca de aba e volta
  click(doc.querySelector('[data-tab="hoje"]'));await sleep(20);click(doc.querySelector('[data-tab="treino"]'));await sleep(20);
  const kgs3=[...doc.querySelector('.ex').querySelectorAll('.set .kg')].map(i=>i.value);
  ok(kgs3.join()===kgs2.join(),'valores persistem após trocar de aba: '+kgs3.join(', '));
  ok(location=>true,'hash atual: '+w.location.hash);
  // conclui todas as séries de todos os exercícios
  for(const t of doc.querySelectorAll('.set:not(.done) .tick')){click(t);}
  await sleep(30);
  console.log('  progresso:',doc.querySelector('#prog').textContent);
  // anotação
  const ta=doc.querySelector('textarea[data-note]');ta.value='Ombro ok';ta.dispatchEvent(new w.Event('change',{bubbles:true}));
  // finalizar
  click(doc.querySelector('[data-act="finish"]'));await sleep(30);
  const sc=doc.querySelector('.sumcard');
  ok(!!sc,'cartão de resumo apareceu');
  console.log('  resumo:',sc&&[...sc.querySelectorAll('.stat')].map(s=>s.textContent).join(' | '));
  console.log('  recordes:',[...doc.querySelectorAll('.sumcard .ins')].map(x=>x.textContent).join(' / ')||'(nenhum)');
  console.log('  anotação no resumo:',/Ombro ok/.test(sc.textContent));
  ok(/min/.test(doc.querySelector('#sesst').textContent),'duração registrada: '+doc.querySelector('#sesst').textContent);
  // desfazer
  click(doc.querySelector('[data-act="undo"]'));await sleep(20);
  ok(!doc.querySelector('.sumcard'),'desfazer remove o resumo');
  // sessão de outro dia -> aviso
  click(doc.querySelector('[data-act="sess"][data-id="A"]'));await sleep(20);
  ok(/não é o treino de hoje/.test(doc.querySelector('.note').textContent),'aviso de treino que não é o de hoje');
  click(doc.querySelector('.note [data-act="sess"]'));await sleep(20);
  ok(doc.querySelector('h1').textContent.includes('Academia B'),'botão volta para o treino de hoje');
  // campo (sexta) usa cronômetro também
  click(doc.querySelector('[data-act="sess"][data-id="S"]'));await sleep(20);
  console.log('  campo:',[...doc.querySelectorAll('.pills .pill')].map(p=>p.textContent).join(' | '));
  console.log('ERROS:',errs.length?errs:'nenhum');process.exit(0);
})();
