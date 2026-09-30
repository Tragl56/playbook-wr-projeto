/* ---------- utilidades ---------- */
const $=(s,el=document)=>el.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseYmd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
const DIAS=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const nf=(n,d=0)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const clone=o=>JSON.parse(JSON.stringify(o));
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40);
const fdate=s=>{const [y,m,d]=s.split('-');return `${d}/${m}`};

/* ---------- sessões da semana ---------- */
const SESSIONS=[
 {id:'A',wd:1,kind:'gym',short:'Seg · A',name:'Academia A',tag:'Inferior: força e posterior de coxa',dur:'60–75 min'},
 {id:'T',wd:2,kind:'campo',short:'Ter · Campo',name:'Campo: velocidade',tag:'Sprints e aceleração',dur:'60 min'},
 {id:'B',wd:3,kind:'gym',short:'Qua · B',name:'Academia B',tag:'Superior, core e pegada',dur:'60–70 min'},
 {id:'C',wd:4,kind:'gym',short:'Qui · C',name:'Academia C',tag:'Potência, saltos e prevenção',dur:'60 min'},
 {id:'S',wd:5,kind:'campo',short:'Sex · Campo',name:'Campo: mãos e rotas',tag:'Agilidade, rotas e mãos, em ritmo leve',dur:'45–60 min'},
 {id:'SAB',wd:6,kind:'time',short:'Sáb · Time',name:'Treino do time',tag:'12h às 16h',dur:'4 h'},
 {id:'DOM',wd:0,kind:'rest',short:'Dom · Descanso',name:'Descanso ativo',tag:'Recuperação e sono',dur:'20–30 min'},
];
const REST_ITEMS=['Caminhada leve de 20 a 30 minutos','Mobilidade por 15 minutos: quadril, tornozelo, isquiotibiais e ombro','Preparar as refeições da semana','Dormir cedo: meta de 8 a 9 horas'];
const LIFTS=['Agachamento livre (back squat)','Supino reto (barra ou halteres)','Levantamento terra convencional (barra reta)','Remada curvada (barra ou halteres)','Barra fixa (pull-up)'];
const sessOf=wd=>SESSIONS.find(s=>s.wd===wd);
const typeOf=d=>{const w=d.getDay();return w===6?'sab':w===0?'desc':'treino'};
const TYPE_NAME={treino:'Dia de treino',sab:'Sábado (time)',desc:'Descanso'};

/* ---------- estado ---------- */
const monday=(d=new Date())=>addDays(d,-((d.getDay()+6)%7));
// Perfil neutro: os dados reais vêm da configuração inicial (vSetup) e ficam só no aparelho/conta.
const DEFAULT_PROFILE={peso:75,altura:175,idade:25,sexo:'M',obj:'Manter',prot:2.0,
  fat:{treino:1.55,sab:1.75,desc:1.40},carb:{treino:3.3,sab:4.3,desc:2.6},pf:1,agua:35,cycleStart:ymd(monday())};
// needSetup: nenhum perfil salvo ainda. Enquanto for true, o app mostra a configuração inicial e não grava nada.
const S={profile:clone(DEFAULT_PROFILE),weights:[],tests:[],days:{},tab:'hoje',sess:null,planView:null,open:{},exOpen:{},needSetup:true};
const day=(date=ymd())=>{ if(!S.days[date]) S.days[date]={eaten:{},extras:[],water:0,sets:{},done:{},chk:{}}; return S.days[date]; };

/* ---------- armazenamento: conta (db), navegador (localStorage) ou memória ---------- */
const LSKEY='wr_playbook_v1';
const Store={
  mode:'memory',col:null,timers:{},chain:{},
  async init(){
    try{
      if(window.claude&&claude.use){
        const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
        const uid=user?await user.id():null;
        if(db&&uid){this.col=db.collection('data/users/'+uid);this.mode='cloud';return;}
      }
    }catch(e){}
    try{localStorage.setItem('__t','1');localStorage.removeItem('__t');this.mode='local';}catch(e){this.mode='memory';}
  },
  async loadAll(){
    const out={};
    if(this.mode==='cloud'){
      try{const snap=await this.col.get();snap.docs.forEach(d=>{out[d.id]=d.data();});}
      catch(e){this.mode='local';try{localStorage.setItem('__t','1');localStorage.removeItem('__t');}catch(_){this.mode='memory';}}
    }
    if(this.mode==='local'){
      try{const raw=localStorage.getItem(LSKEY);if(raw)Object.assign(out,JSON.parse(raw));}catch(e){}
    }
    return out;
  },
  docData(id){
    if(id==='profile') return S.profile;
    if(id==='weights') return {list:S.weights};
    if(id==='tests') return {list:S.tests};
    if(id.startsWith('d_')) return S.days[id.slice(2)]||{};
    return {};
  },
  blob(){
    const b={profile:S.profile,weights:{list:S.weights},tests:{list:S.tests}};
    Object.keys(S.days).forEach(k=>{b['d_'+k]=S.days[k];});
    return b;
  },
  save(id){
    if(S.needSetup) return;
    if(this.mode==='local'){try{localStorage.setItem(LSKEY,JSON.stringify(this.blob()));}catch(e){}return;}
    if(this.mode!=='cloud') return;
    clearTimeout(this.timers[id]);
    this.timers[id]=setTimeout(()=>{
      const body=clone(this.docData(id));
      this.chain[id]=(this.chain[id]||Promise.resolve())
        .then(()=>this.col.doc(id).set(body))
        .catch(()=>toast('Não consegui salvar agora. Tente de novo em instantes.'));
    },500);
  }
};
const saveProfile=()=>Store.save('profile');
const saveWeights=()=>Store.save('weights');
const saveTests=()=>Store.save('tests');
const saveDay=date=>Store.save('d_'+date);
function applyLoaded(o){
  if(o.profile){const p=o.profile;S.needSetup=false;S.profile=Object.assign(clone(DEFAULT_PROFILE),p,{fat:Object.assign({},DEFAULT_PROFILE.fat,p.fat||{}),carb:Object.assign({},DEFAULT_PROFILE.carb,p.carb||{})});}
  if(o.weights&&Array.isArray(o.weights.list)) S.weights=o.weights.list;
  if(o.tests&&Array.isArray(o.tests.list)) S.tests=o.tests.list;
  Object.keys(o).forEach(k=>{if(k.startsWith('d_')){const d=o[k]||{};S.days[k.slice(2)]=Object.assign({eaten:{},extras:[],water:0,sets:{},done:{},chk:{}},d);}});
}

/* ---------- cálculos ---------- */
const ADJ={'Ganhar massa':1.10,'Manter':1.0,'Definir':0.90};
function tmb(){const p=S.profile;return 10*p.peso+6.25*p.altura-5*p.idade+(p.sexo==='M'?5:-161);}
function targets(){
  const p=S.profile,T={};
  ['treino','sab','desc'].forEach(t=>{
    const k=Math.round(tmb()*p.fat[t]*(ADJ[p.obj]||1)/10)*10;
    const P=Math.round(p.peso*p.prot),C=Math.round(p.peso*p.carb[t]),G=Math.max(0,Math.round((k-P*4-C*4)/9));
    T[t]={k,p:P,c:C,g:G,gkg:G/p.peso};
  });
  return T;
}
const FOOD={};D.foods.forEach(f=>{FOOD[f[0]]={k:f[1],p:f[2],c:f[3],g:f[4],m:f[5]};});
const UN=D.units;
const mac=(n,g)=>{const f=FOOD[n];if(!f)return{k:0,p:0,c:0,g:0};const x=g/100;return{k:f.k*x,p:f.p*x,c:f.c*x,g:f.g*x};};
const add=(a,b)=>{a.k+=b.k;a.p+=b.p;a.c+=b.c;a.g+=b.g;return a;};
const ugOf=n=>UN[n]?UN[n][2]:1;
function fmtQty(n,g){const u=UN[n];if(!u)return nf(g)+' g';const q=Math.round(g/u[2]*100)/100,qs=nf(q,q%1?1:0),unit=q>1?u[1]:u[0];return qs+' '+unit+(u[4]?'':' de '+u[5]);}
const mealMacItems=items=>items.reduce((t,f)=>add(t,mac(f[0],f[1])),{k:0,p:0,c:0,g:0});
const mealItems=(type,i,dk)=>((dk&&dk.meals&&dk.meals[i])||D.plans[type][i][2]);
function consumed(date){
  const dk=S.days[date]||{},t={k:0,p:0,c:0,g:0},type=typeOf(parseYmd(date));
  (D.plans[type]||[]).forEach((m,i)=>{if(dk.eaten&&dk.eaten[i])add(t,mealMacItems(mealItems(type,i,dk)));});
  (dk.extras||[]).forEach(e=>add(t,mac(e.f,e.g)));
  return t;
}
function cycleWeek(date=new Date()){
  const diff=Math.round((parseYmd(ymd(date))-parseYmd(S.profile.cycleStart))/86400000);
  return Math.floor(Math.max(diff,0)/7)%4+1;
}
function restSecs(t){
  if(!t)return 0;const n=(String(t).match(/\d+/g)||[]).map(Number);if(!n.length)return 0;
  const avg=n.reduce((a,b)=>a+b,0)/n.length;return /min/.test(t)?Math.round(avg*60):Math.round(avg);
}
const fmtT=s=>`${Math.floor(s/60)}:${pad(s%60)}`;
function lastSet(sl){
  const dates=Object.keys(S.days).filter(d=>d<ymd()).sort().reverse();
  for(const d of dates){const arr=(S.days[d].sets||{})[sl];if(arr){const ok=arr.filter(x=>x&&x.done&&x.kg!==''&&x.kg!=null);if(ok.length){return ok.reduce((a,b)=>Number(b.kg)>=Number(a.kg)?b:a);}}}
  return null;
}

/* ---------- cronômetro de descanso ---------- */
const timer={end:0,iv:null,ctx:null};
function startRest(sec,label){
  if(sec<=0)return;
  try{timer.ctx=timer.ctx||new (window.AudioContext||window.webkitAudioContext)();}catch(e){}
  timer.end=Date.now()+sec*1000;timer.total=sec*1000;
  $('#restL').textContent=label||'Descanso';
  $('#rest').classList.add('on');
  clearInterval(timer.iv);timer.iv=setInterval(tick,250);tick();
}
function tick(){
  const left=Math.max(0,Math.ceil((timer.end-Date.now())/1000));
  $('#restT').textContent=fmtT(left);const rp=$('#restP');if(rp&&timer.total)rp.style.width=Math.max(0,Math.min(100,(1-(timer.end-Date.now())/timer.total)*100))+'%';
  if(left===0){
    clearInterval(timer.iv);$('#restL').textContent='Descanso encerrado. Próxima série!';
    beep();try{navigator.vibrate&&navigator.vibrate([200,100,200]);}catch(e){}
    setTimeout(()=>{if(Date.now()>=timer.end)$('#rest').classList.remove('on');},5000);
  }
}
function beep(){
  try{const c=timer.ctx;if(!c)return;const o=c.createOscillator(),g=c.createGain();
    o.frequency.value=880;g.gain.value=.15;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.35);}catch(e){}
}
function stopRest(){clearInterval(timer.iv);timer.end=0;$('#rest').classList.remove('on');}
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2400);}
