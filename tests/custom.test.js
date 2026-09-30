const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const {FILE,mockDate,seedStore}=require('./helpers');
const html=fs.readFileSync(process.argv[2]||FILE,'utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.detail&&e.detail.stack||e.message)));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/#comida',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){mockDate(w);seedStore(w);w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};}});
const w=dom.window,d=w.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),click=e=>e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const ok=(c,m)=>console.log((c?'OK   ':'FALHA ')+m);
const kcal=()=>d.querySelector('.fieldcap .big').textContent;
const toast=()=>d.getElementById('toast').textContent;
const fill=(id,v)=>{d.getElementById(id).value=v;};
(async()=>{
  await sleep(300);
  const names=()=>[...d.querySelectorAll('#meus .lift b')].map(b=>b.textContent);
  ok(names().join('|')==='Ceviche|Café com proteína','já vêm cadastrados: '+names().join(' | '));
  console.log('  ',[...d.querySelectorAll('#meus .lift .tag')].map(t=>t.textContent).join('\n   '));
  ok(d.querySelector('#xf optgroup[label="Meus alimentos"]')&&[...d.querySelector('#xf optgroup').children].length===2,'lista do "fora do plano" tem grupo Meus alimentos');
  // extras: 1 porção de ceviche
  const xf=d.getElementById('xf');ok(xf.value==='Ceviche','1º item da lista é o ceviche');
  console.log('  unidade mostrada:',d.getElementById('xu').textContent);
  const k0=kcal();fill('xq','1');click(d.querySelector('[data-act="addx"]'));await sleep(20);
  console.log('  extra adicionado:',[...d.querySelectorAll('.lift b')].map(b=>b.textContent).filter(t=>/ceviche/i.test(t)).join(','),'| kcal',k0,'->',kcal());
  ok(kcal()==='150','1 porção de ceviche soma 150 kcal: '+kcal());
  // café com proteína em uma refeição (2 copos = +2 passos)
  ok(!!d.querySelector('.mrow.next .foods'),'próxima refeição já vem aberta');
  const sel=d.querySelector('.addrow select');sel.value='Café com proteína';click(d.querySelector('.addrow [data-act="addf"]'));await sleep(20);
  const row=[...d.querySelectorAll('.foods .fr b')].map(b=>b.textContent);
  ok(row.some(t=>/copo de café com proteína/.test(t)),'entrou na refeição: '+row.filter(t=>/café/.test(t)).join(','));
  click([...d.querySelectorAll('[data-act="qty"][data-d="1"]')].pop());await sleep(20);
  console.log('  após +1 passo:',[...d.querySelectorAll('.foods .fr b')].map(b=>b.textContent).filter(t=>/café/.test(t)).join(','));
  // novo alimento
  fill('fn','Marmita de frango');fill('fu','marmita');fill('fw','400');fill('fp','45');fill('fc','60');fill('fg','12');
  click(d.querySelector('[data-act="cf-save"]'));await sleep(20);
  ok(names().includes('Marmita de frango'),'novo alimento cadastrado (kcal calculada): '+[...d.querySelectorAll('#meus .lift .tag')].pop().textContent);
  // duplicado / inválido
  fill('fn','ceviche');fill('fk','100');click(d.querySelector('[data-act="cf-save"]'));await sleep(20);
  ok(/Já existe/.test(toast()),'nome repetido é recusado: '+toast());
  fill('fn','Arroz branco cozido');fill('fk','100');click(d.querySelector('[data-act="cf-save"]'));await sleep(20);
  ok(/Já existe/.test(toast()),'nome igual ao da base é recusado');
  fill('fn','Teste');fill('fk','');click(d.querySelector('[data-act="cf-save"]'));await sleep(20);
  ok(/calorias/.test(toast()),'sem calorias nem macros é recusado: '+toast());
  // plural
  sel.value='Marmita de frango';
  const x2=d.getElementById('xf');x2.value='Marmita de frango';x2.dispatchEvent(new w.Event('change',{bubbles:true}));
  fill('xq','2');click(d.querySelector('[data-act="addx"]'));await sleep(20);
  console.log('  plural:',[...d.querySelectorAll('.lift b')].map(b=>b.textContent).filter(t=>/marmita/i.test(t)).join(','));
  // editar
  click([...d.querySelectorAll('[data-act="cf-edit"]')][0]);await sleep(20);
  ok(d.getElementById('fn').readOnly&&d.getElementById('fk').value==='150','editar carrega os valores (nome travado)');
  fill('fk','170');click(d.querySelector('[data-act="cf-save"]'));await sleep(20);
  ok(/170 kcal/.test(d.querySelector('#meus .lift .tag').textContent),'edição salva: '+d.querySelector('#meus .lift .tag').textContent);
  // remover em duas etapas
  const before=names().length;
  click([...d.querySelectorAll('[data-act="cf-del"]')].pop());await sleep(20);
  ok(names().length===before&&/Confirmar/.test(d.querySelector('#meus').textContent),'1º toque pede confirmação');
  click([...d.querySelectorAll('[data-act="cf-del"]')].pop());await sleep(20);
  ok(names().length===before-1,'2º toque remove');
  // persistência
  const saved=JSON.parse(w.localStorage.getItem('wr_playbook_v1'));
  ok(saved.profile.custom.length===names().length&&saved.profile.customSeeded===true,'salvo no aparelho: '+saved.profile.custom.map(f=>f.n).join(', '));
  console.log('ERROS:',errs.length?errs:'nenhum');process.exit(0);
})();
