/* ---------- ações ---------- */
function setPath(obj,path,val){const k=path.split('.');let o=obj;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=val;}
function setTheme(t){try{if(t==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t);localStorage.setItem('wr_theme',t);}catch(e){}}
function updateProgress(){
  const sets=document.querySelectorAll('.set');let dn,tot,unit;
  if(sets.length){dn=document.querySelectorAll('.set.done').length;tot=sets.length;unit='séries';}
  else{tot=document.querySelectorAll('.chk').length;dn=document.querySelectorAll('.chk.on').length;unit='itens';}
  const pc=tot?Math.round(dn/tot*100):0,el=$('#prog');
  if(el)el.innerHTML=`<b>${dn}</b> de ${tot} ${unit}`;
  const pb=$('#progbar');if(pb)pb.style.width=pc+'%';
  const pp=$('#progpct');if(pp)pp.textContent=pc+'%';
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,date=ymd();
  if(a==='tick'){
    const row=b.closest('.set'),dk=day(date),sl=row.dataset.ex,i=+row.dataset.i;
    const kg=$('.kg',row).value,rp=$('.rp',row).value;
    dk.sets[sl]=dk.sets[sl]||[];const was=!!(dk.sets[sl][i]&&dk.sets[sl][i].done);
    dk.sets[sl][i]=Object.assign({kg:kg===''?'':Number(kg),reps:rp===''?'':Number(rp),done:!was},pairVals(row));
    for(let j=0;j<i;j++) if(!dk.sets[sl][j]) dk.sets[sl][j]={kg:'',reps:'',done:false};
    if(!was&&!dk.t0)dk.t0=Date.now();
    saveDay(date);row.classList.toggle('done',!was);b.setAttribute('aria-pressed',String(!was));
    const ex=row.closest('.ex'),rowsAll=[...ex.querySelectorAll('.set')],dnN=rowsAll.filter(r=>r.classList.contains('done')).length,complete=dnN>=rowsAll.length;
    if(!was){const cur=$('.kg',row).value;if(cur!==''){[...ex.querySelectorAll('.set')].slice(i+1).forEach(r=>{if(r.classList.contains('done'))return;const k=$('.kg',r);if(k.value!==cur){k.value=cur;k.dispatchEvent(new Event('change',{bubbles:true}));}});}}
    if(!was){const c2=$('.kg2',row);if(c2&&c2.value!==''){[...ex.querySelectorAll('.set')].slice(i+1).forEach(r=>{if(r.classList.contains('done'))return;const k=$('.kg2',r);if(k&&k.value!==c2.value){k.value=c2.value;k.dispatchEvent(new Event('change',{bubbles:true}));}});}}
    ex.querySelectorAll('.dots i').forEach((d,ix)=>d.classList.toggle('on',ix<dnN));ex.classList.toggle('complete',complete);updateProgress();
    if(complete&&!was){
      S.exOpen[ex.dataset.slug]=false;ex.classList.remove('open');ex.querySelector('.ex-h').setAttribute('aria-expanded','false');
      const nx=[...document.querySelectorAll('.ex')].find(e=>!e.classList.contains('complete'));
      if(nx){S.exOpen[nx.dataset.slug]=true;nx.classList.add('open');nx.querySelector('.ex-h').setAttribute('aria-expanded','true');setTimeout(()=>nx.scrollIntoView({behavior:'smooth',block:'start'}),160);}
    }
    if(!was&&row.dataset.last!=='1') startRest(restSecs(row.dataset.rest),'Descanso · '+row.dataset.name);
    return;
  }
  if(a==='campochk') return;
  if(a==='restbtn'){startRest(+b.dataset.s,'Descanso');return;}
  if(a==='rest+'){timer.end+=15000;timer.total+=15000;tick();return;}
  if(a==='toggleex'){const ex=b.closest('.ex'),op=!ex.classList.contains('open');ex.classList.toggle('open',op);b.setAttribute('aria-expanded',String(op));S.exOpen[b.dataset.ex]=op;return;}
  if(a==='rest-stop'){stopRest();return;}
  if(a==='sess'){S.sess=b.dataset.id;view();return;}
  if(a==='goto-treino'){S.sess=b.dataset.id;go('treino');return;}
  if(a==='goto-comida'){go('comida');return;}
  if(a==='finish'){const dk=day(date),id=b.dataset.id;dk.done[id]=true;dk.dur=dk.dur||{};if(dk.t0){dk.dur[id]=Math.max(1,Math.round((Date.now()-dk.t0)/60000));delete dk.t0;}saveDay(date);stopRest();toast('Treino concluído. Bom trabalho!');view();window.scrollTo(0,0);return;}
  if(a==='kgadj'){const ex=b.closest('.ex'),d=+b.dataset.d;ex.querySelectorAll('.set:not(.done)').forEach(r=>{const inp=$(b.dataset.w==='2'?'.kg2':'.kg',r);if(!inp)return;inp.value=Math.max(0,Math.round(((Number(inp.value)||0)+d)*2)/2);inp.dispatchEvent(new Event('change',{bubbles:true}));});return;}
  if(a==='undo'){const dk=day(date),id=b.dataset.id;delete dk.done[id];if(dk.dur&&dk.dur[id]){dk.t0=Date.now()-dk.dur[id]*60000;delete dk.dur[id];}saveDay(date);view();return;}
  if(a==='eat'){const dk=day(date),i=+b.dataset.i;if(dk.eaten[i])delete dk.eaten[i];else dk.eaten[i]=true;saveDay(date);view();return;}
  if(a==='water'||a==='wadd'||a==='wset'||a==='wundo'){
    const dk=day(date),cur=dk.water||0;let delta=0;dk.wlog=dk.wlog||[];
    if(a==='water') delta=Number(b.dataset.n);
    else if(a==='wadd'){const n=Math.round(Number($('#wadd').value));if(!(n>=1&&n<=5000)){toast('Digite a quantidade em ml, de 1 a 5000.');return;}delta=n;}
    else if(a==='wset'){const n=Math.round(Number($('#wset').value));if($('#wset').value===''||!(n>=0&&n<=15000)){toast('Digite o total de hoje em ml, de 0 a 15000.');return;}delta=n-cur;if(delta===0){toast('O total já está nesse valor.');return;}}
    else{if(!dk.wlog.length){return;}delta=-dk.wlog.pop();dk.water=Math.max(0,cur+delta);saveDay(date);view();return;}
    dk.water=Math.max(0,cur+delta);dk.wlog.push(dk.water-cur);if(dk.wlog.length>30)dk.wlog.shift();
    saveDay(date);view();return;}
  if(a==='plan'){S.planView=b.dataset.t;view();return;}
  if(a==='open'){S.open[b.dataset.k]=b.dataset.open!=='1';view();return;}
  if(a==='qty'||a==='addf'||a==='resetm'){
    const type=typeOf(new Date()),i=+b.dataset.i,dk=day(date);
    const ensure=()=>{dk.meals=dk.meals||{};if(!dk.meals[i])dk.meals[i]=D.plans[type][i][2].map(f=>[f[0],f[1]]);return dk.meals[i];};
    if(a==='resetm'){if(dk.meals)delete dk.meals[i];}
    else if(a==='qty'){const arr=ensure(),j=+b.dataset.j,it=arr[j],u=UN[it[0]]||[0,0,1,1],st=(u[3]||1)*(u[2]||1);it[1]=Math.max(0,Math.round((it[1]+(+b.dataset.d)*st)*100)/100);if(it[1]<=0)arr.splice(j,1);}
    else{const arr=ensure(),f=$('#af'+i).value,ex=arr.find(x=>x[0]===f);if(ex)ex[1]=Math.round((ex[1]+ugOf(f))*100)/100;else arr.push([f,ugOf(f)]);}
    S.open[type+i]=true;saveDay(date);view();return;}
  if(a==='pf'){S.profile.pf=Math.min(1.5,Math.max(0.5,Math.round((S.profile.pf+Number(b.dataset.n))*100)/100));saveProfile();view();return;}
  if(a==='addx'){const f=$('#xf').value,q=Number($('#xq').value);if(!(q>0)){toast('Informe a quantidade.');return;}
    const dk=day(date);dk.extras.push({f,g:Math.round(q*ugOf(f))});saveDay(date);view();return;}
  if(a==='cf-edit'){S.editFood=b.dataset.id;S.delFood=null;view();try{$('#fn').scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}return;}
  if(a==='cf-cancel'){S.editFood=null;view();return;}
  if(a==='cf-del'){
    const id=b.dataset.id;
    if(S.delFood!==id){S.delFood=id;view();return;}
    S.profile.custom=(S.profile.custom||[]).filter(f=>f.id!==id);S.delFood=null;if(S.editFood===id)S.editFood=null;
    saveProfile();regCustom();toast('Alimento removido.');view();return;}
  if(a==='cf-save'){
    const tx=id=>$(id).value.trim(),nm=id=>{const x=tx(id);return x===''?null:Number(x);};
    const list=S.profile.custom=S.profile.custom||[],ed=S.editFood?list.find(f=>f.id===S.editFood):null;
    const n=ed?ed.n:tx('#fn'),u=tx('#fu')||'porção',ug=nm('#fw')==null?100:nm('#fw'),m=$('#fm').value==='ml'?'ml':'g';
    let k=nm('#fk');const p=nm('#fp')||0,c=nm('#fc')||0,g=nm('#fg')||0;
    if(!n){toast('Digite o nome do alimento.');return;}
    if(!ed&&(D.foods.some(f=>f[0].toLowerCase()===n.toLowerCase())||list.some(f=>f.n.toLowerCase()===n.toLowerCase()))){toast('Já existe um alimento com esse nome.');return;}
    if(!(ug>=1&&ug<=5000)){toast('O tamanho da unidade deve ficar entre 1 e 5000.');return;}
    if(k==null)k=Math.round(4*p+4*c+9*g);
    if(!(k>0)){toast('Informe as calorias ou os macros.');return;}
    if(k>4000||p>500||c>500||g>500||[k,p,c,g].some(x=>x<0)){toast('Confira os valores: são de UMA unidade.');return;}
    if(ed)Object.assign(ed,{u,ug,m,k,p,c,g});else list.push({id:Date.now().toString(36),n,u,ug,m,k,p,c,g});
    S.editFood=null;saveProfile();regCustom();toast('Alimento salvo.');view();return;}
  if(a==='delx'){const dk=day(date);dk.extras.splice(+b.dataset.i,1);saveDay(date);view();return;}
  if(a==='addw'){const d=$('#wd').value,kg=Number($('#wk').value);if(!d||!(kg>20&&kg<300)){toast('Informe uma data e um peso válido em kg.');return;}
    S.weights=S.weights.filter(x=>x.d!==d);S.weights.push({d,kg});saveWeights();toast('Peso salvo.');view();return;}
  if(a==='delw'){S.weights=S.weights.filter(x=>x.d!==b.dataset.d);saveWeights();view();return;}
  if(a==='addt'){const v=id=>Number($(id).value)||0,o={d:date,s10:v('#t10'),s40:v('#t40'),vj:v('#tvj'),ag:v('#tag5')};
    if(!(o.s10||o.s40||o.vj||o.ag)){toast('Preencha pelo menos um teste.');return;}
    S.tests=S.tests.filter(x=>x.d!==date);S.tests.push(o);saveTests();toast('Testes salvos.');view();return;}
  if(a==='savehl'){
    const rd=id=>{const v=$(id).value;return v===''?null:Number(v);};
    const sl=rd('#hs'),rh=rd('#hr'),kc=rd('#hk');
    if(sl==null&&rh==null&&kc==null){toast('Preencha pelo menos um dado.');return;}
    if((sl!=null&&!(sl>=0&&sl<=16))||(rh!=null&&!(rh>=30&&rh<=120))||(kc!=null&&!(kc>=0&&kc<=5000))){toast('Confira os valores: sono até 16 h, FC de 30 a 120, calorias até 5000.');return;}
    const dk=day(date);dk.health=dk.health||{};
    [['sleep',sl],['rhr',rh],['kcal',kc]].forEach(([k,v])=>{if(v==null)delete dk.health[k];else dk.health[k]=v;});
    saveDay(date);toast('Dados do relógio salvos.');view();return;}
  if(a==='setup-save'){
    const n=id=>{const v=$(id).value.replace(',','.').trim();return v===''?NaN:Number(v);};
    const peso=n('#su-peso'),altura=n('#su-alt'),idade=n('#su-idade'),sexo=$('#su-sexo').value,obj=$('#su-obj').value;
    if(!(peso>=30&&peso<=250)){toast('Informe o peso em kg, entre 30 e 250.');return;}
    if(!(altura>=120&&altura<=230)){toast('Informe a altura em cm, entre 120 e 230.');return;}
    if(!(idade>=12&&idade<=90)){toast('Informe a idade, entre 12 e 90 anos.');return;}
    if(!sexo){toast('Escolha o sexo (usado no cálculo do metabolismo).');return;}
    if(!obj){toast('Escolha o objetivo.');return;}
    Object.assign(S.profile,{peso:Math.round(peso*10)/10,altura:Math.round(altura),idade:Math.round(idade),sexo,obj,cycleStart:ymd(monday())});
    S.needSetup=false;saveProfile();
    if(!S.weights.some(x=>x.d===date)){S.weights.push({d:date,kg:S.profile.peso});saveWeights();}
    toast('Tudo pronto. Bom treino!');S.tab='hoje';view();window.scrollTo(0,0);return;}
  if(a==='bk-make'){$('#bk').value=JSON.stringify(Store.blob());$('#bk').select();return;}
  if(a==='bk-load'){try{const o=JSON.parse($('#bk').value);if(!o||typeof o!=='object'||!o.profile)throw 0;S.days={};applyLoaded(o);
      saveProfile();saveWeights();saveTests();Object.keys(S.days).forEach(saveDay);toast('Backup restaurado.');view();}catch(err){toast('Texto de backup inválido.');}return;}
});
document.addEventListener('change',e=>{
  const t=e.target,date=ymd();
  if(t.id==='xf'){const u=$('#xu');if(u)u.textContent=unitLabel(t.value);return;}
  if(t.dataset.note){const dk=day(date);dk.notes=dk.notes||{};dk.notes[t.dataset.note]=t.value;saveDay(date);return;}
  if(t.dataset.h){
    const dk=day(date),v=Number(t.value);dk.health=dk.health||{};
    if(t.value===''){delete dk.health[t.dataset.h];}
    else if(v>30&&v<250){dk.health[t.dataset.h]=v;}
    else{toast('Valor de FC inválido.');t.value=dk.health[t.dataset.h]||'';return;}
    saveDay(date);return;}
  if(t.dataset.act==='campochk'){const dk=day(date);dk.chk[t.dataset.k]=t.checked;if(t.checked&&!dk.t0)dk.t0=Date.now();saveDay(date);t.closest('.chk').classList.toggle('on',t.checked);updateProgress();return;}
  if(t.closest('.set')){ // guarda valores digitados sem marcar como concluído
    const row=t.closest('.set'),dk=day(date),sl=row.dataset.ex,i=+row.dataset.i;dk.sets[sl]=dk.sets[sl]||[];
    const prev=dk.sets[sl][i]||{};dk.sets[sl][i]=Object.assign({kg:$('.kg',row).value===''?'':Number($('.kg',row).value),reps:$('.rp',row).value===''?'':Number($('.rp',row).value),done:!!prev.done},pairVals(row));
    for(let j=0;j<i;j++) if(!dk.sets[sl][j]) dk.sets[sl][j]={kg:'',reps:'',done:false};
    saveDay(date);return;}
  const path=t.dataset.p;if(!path)return;
  if(path==='_theme'){setTheme(t.value);return;}
  if(path==='_week'){S.profile.cycleStart=ymd(addDays(monday(new Date()),-7*(Number(t.value)-1)));saveProfile();view();return;}
  let v=t.value;if(t.type==='number'){v=Number(v);if(!(v>0)&&path!=='pf'){toast('Valor inválido.');view();return;}}
  setPath(S.profile,path,v);saveProfile();view();
});
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)go(b.dataset.tab);});
function go(tab){S.tab=tab;view();const v=$('#view');v.classList.remove('enter');void v.offsetWidth;v.classList.add('enter');window.scrollTo(0,0);try{history.replaceState(null,'','#'+tab);}catch(e){}}
function view(){
  regCustom();
  const fn=S.needSetup?vSetup:{hoje:vHoje,treino:vTreino,comida:vComida,evol:vEvol,perfil:vPerfil}[S.tab];
  document.body.classList.toggle('setup',S.needSetup);
  $('#view').innerHTML=fn();
  document.querySelectorAll('#tabs button').forEach(b=>{if(b.dataset.tab===S.tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  const th=$('[data-p="_theme"]');if(th){try{th.value=localStorage.getItem('wr_theme')||'auto';}catch(e){}}
}
(async function boot(){
  try{const t=localStorage.getItem('wr_theme');if(t&&t!=='auto')setTheme(t);}catch(e){}
  try{
    await Promise.race([Store.init(),new Promise(r=>setTimeout(r,8000))]);
    applyLoaded(await Store.loadAll());seedCustom();
  }catch(e){}
  const hh=(location.hash||'').slice(1);if(['hoje','treino','comida','evol','perfil'].includes(hh))S.tab=hh;
  view();
  window.addEventListener('hashchange',()=>{const h2=(location.hash||'').slice(1);if(['hoje','treino','comida','evol','perfil'].includes(h2)&&h2!==S.tab){S.tab=h2;view();window.scrollTo(0,0);}});
  setInterval(()=>{const el=$('#sesst');if(el)el.textContent=sessClock();},1000);
})();