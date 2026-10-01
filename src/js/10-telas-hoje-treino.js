/* ---------- ATIVIDADE OPCIONAL: FLAG FOOTBALL (quartas, 20h) ---------- */
const OPT_ITEMS=[
  ["Aquecimento (10 min)","Trote leve, mobilidade de quadril e tornozelo e 3 acelerações progressivas. Não faça sprint máximo a frio."],
  ["Hidratação antes","300 a 500 ml de água até 30 minutos antes do jogo."],
  ["Flag football (cerca de 1 h)","O treino da tarde é de superior, então as pernas estão descansadas. Jogue com qualidade e pare se sentir dor aguda."],
  ["Hidratação durante","Água em toda pausa."],
  ["Volta à calma (5 a 8 min)","Trote leve e alongamento de quadril, isquiotibiais e panturrilha."],
  ["Jantar completo e sono","Depois do jogo, refeição com carboidrato e proteína. Durma 8 a 9 h: quinta tem treino de potência."]
];
const FLAG={id:'FLAG',wd:-1,kind:'opt',short:'Qua · Flag (opcional)',name:'Flag football',tag:'Opcional · quarta às 20h',dur:'cerca de 1 h'};
const allSess=()=>SESSIONS.concat([FLAG]);
function optHtml(ss,dk){const ch=dk.chk||{};let h='';OPT_ITEMS.forEach((it,i)=>{const k='OPT-'+i;h+=checkRow(k,!!ch[k],it[0],it[1]);});return h;}
function weekCard(){
  const now=new Date(),mon=monday(now),T=targets();let trained=0,planned=0,kc=0,pr=0,nd=0,wt=0,wn=0,wg=0,flag=0;
  for(let i=0;i<7;i++){
    const d=addDays(mon,i);if(d>now)break;const k=ymd(d),dk=S.days[k]||{};
    if(d.getDay()!==0)planned++;
    if(dk.done&&Object.keys(dk.done).some(x=>dk.done[x]&&x!=='FLAG'&&x!=='DOM'))trained++;
    if(dk.done&&dk.done.FLAG)flag++;
    if(dk.eaten&&Object.keys(dk.eaten).some(x=>dk.eaten[x])){const c=consumed(k);nd++;kc+=c.k;pr+=c.p;wg+=T[typeOf(d)].k;}
    if(dk.water>0){wn++;wt+=dk.water;}
  }
  const st=[[`${trained}/${planned}`,'treinos'],[nd?nf(kc/nd):'—','kcal por dia'],[nd?nf(pr/nd):'—','g de proteína por dia'],[wn?nf(wt/wn/1000,1):'—','L de água por dia']];
  return `<section class="card" style="margin-top:14px"><div class="card-h"><h3>Esta semana</h3><span class="grow"></span>${flag?`<span class="pill ac">Flag ${flag}×</span>`:''}</div>
    <div class="stats" style="grid-template-columns:repeat(2,1fr)">${st.map(s=>`<div class="stat"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>
    <p class="tag" style="margin-top:8px">${nd?`Médias dos ${nd} dia${nd>1?'s':''} em que você marcou refeições. Meta média: ${nf(wg/nd)} kcal e ${nf(T.treino.p)} g de proteína.`:'Marque as refeições na aba Comida para ver as médias da semana.'}</p></section>`;
}

/* ---------- componentes ---------- */
const LOGO='__LOGO__';
const IC={
  chev:'<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  watch:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l.6-3h4.8L15 6M9 18l.6 3h4.8L15 18M12 10v2.5l1.6 1"/></svg>'
};
const BALL='<svg width="36" height="22" viewBox="0 0 36 22" aria-hidden="true"><ellipse cx="18" cy="11" rx="16.5" ry="9.5" fill="#B8641F" stroke="#0D2117" stroke-width="1.6"/><path d="M11 11h14M13.5 7.6v6.8M18 7.2v7.6M22.5 7.6v6.8" stroke="#FFF7E6" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
const isDone=(dk,id)=>!!(dk&&dk.done&&dk.done[id]);

function ringHtml(label,v,goal){
  const p=goal?Math.min(1,v/goal):0,raw=goal?Math.round(v/goal*100):0,r=26,c=2*Math.PI*r,over=goal&&v>goal*1.1;
  return `<div class="ring ${over?'over':''}"><svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${label}: ${nf(v)} de ${nf(goal)} g"><circle cx="32" cy="32" r="${r}" class="rt"/><circle cx="32" cy="32" r="${r}" class="rp" stroke-dasharray="${(c*p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="37.5" text-anchor="middle" class="rn">${raw}%</text></svg><b>${label}</b><span class="tag">${nf(v)} / ${nf(goal)} g</span></div>`;
}
function ringsHtml(c,tg){return `<div class="rings">${ringHtml('Proteína',Math.round(c.p),tg.p)}${ringHtml('Carbo',Math.round(c.c),tg.c)}${ringHtml('Gordura',Math.round(c.g),tg.g)}</div>`;}
function fieldHtml(c,tg,compact){
  const pct=tg.k?Math.min(1,c.k/tg.k):0,left=(pct*100).toFixed(1),hit=pct>=.98,over=tg.k&&c.k>tg.k*1.05;
  const nums=[10,20,30,40,50,40,30,20,10].map((n,i)=>`<span class="yn b" style="left:${(i+1)*10}%">${n}</span>`).join('');
  return `<div class="fieldwrap"><div class="field ${compact?'compact':''} ${hit?'hit':''}" role="img" aria-label="Calorias do dia: ${nf(c.k)} de ${nf(tg.k)}">
    <div class="ez ezl"><span class="ez-t">CALORIAS</span></div><div class="ez ezr"><span class="ez-t">${hit?'TOUCHDOWN':'META'}</span></div>
    <div class="pitch">${nums}<div class="drive" style="width:${left}%"></div><div class="ball" style="left:${left}%">${BALL}</div></div></div>
    <div class="fieldcap"><div><span class="big">${nf(c.k)}</span> <span class="muted">de ${nf(tg.k)} kcal</span></div>
    <div class="tag ${over?'warnt':''}">${over?'Passou da meta':hit?'Meta batida':'Faltam '+nf(Math.max(0,tg.k-c.k))+' kcal'}</div></div></div>`;
}
function sessProgress(ss,dk,wk){
  if(ss.kind==='gym'){let tot=0,dn=0;D.gym[ss.id].exs.forEach(e=>{const n=wk===4?Math.max(1,e[1]-1):e[1],arr=((dk.sets||{})[slug(e[0])]||[]);tot+=n;for(let j=0;j<n;j++)if(arr[j]&&arr[j].done)dn++;});return{dn,tot,unit:'séries'};}
  const ch=dk.chk||{};
  if(ss.kind==='campo'){const rows=D.campo[ss.id];return{dn:rows.filter((r,i)=>ch[ss.id+'-'+i]).length,tot:rows.length,unit:'blocos'};}
  if(ss.kind==='time')return{dn:D.aq.filter((r,i)=>ch['AQ-'+i]).length,tot:D.aq.length,unit:'itens'};
  if(ss.kind==='opt')return{dn:OPT_ITEMS.filter((r,i)=>ch['OPT-'+i]).length,tot:OPT_ITEMS.length,unit:'itens'};
  return{dn:REST_ITEMS.filter((r,i)=>ch['DOM-'+i]).length,tot:REST_ITEMS.length,unit:'itens'};
}
const ROUTE='<svg class="hero-route" viewBox="0 0 512 512" aria-hidden="true"><polyline points="88,150 168,392 256,196 344,392 414,150"/></svg>';

/* ---------- HOJE ---------- */
function vHoje(){
  const now=new Date(),date=ymd(now),ss=sessOf(now.getDay()),dk=S.days[date]||{},T=targets(),type=typeOf(now),tg=T[type],c=consumed(date);
  const wk=cycleWeek(now),meals=D.plans[type],pf=S.profile.pf,nextI=meals.findIndex((m,i)=>!(dk.eaten&&dk.eaten[i]));
  const water=dk.water||0,wGoal=Math.round(S.profile.peso*S.profile.agua),sp=sessProgress(ss,dk,wk),fin=isDone(dk,ss.id);
  let h=`<div class="brand">${LOGO}<span class="wm">Playbook <em>WR</em></span><span class="grow"></span><span class="pill">Semana ${wk}${wk===4?' · descarga':''}</span></div>`;
  h+=`<section class="hero">${ROUTE}<p class="eyebrow">${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]}</p><h1>${esc(ss.name)}</h1><p class="sub">${esc(ss.tag)}</p>
    <div class="pills"><span class="pill">${esc(ss.dur)}</span><span class="pill ${fin?'ok':sp.dn?'ac':''}">${fin?'Concluído ✓':sp.dn+' de '+sp.tot+' '+sp.unit}</span></div>
    <button class="btn xl block ${fin?'ghost':''}" data-act="goto-treino" data-id="${ss.id}">${fin?'Ver treino':sp.dn?'Continuar treino':'Começar treino'}</button></section>`;
  if(ss.kind==='time'){const nx=nextSat();if(nx)h+=`<div class="note"><b>${esc(nx[0])}</b> · ${esc(nx[1])}</div>`;}
  if(now.getDay()===3){
    const fd=isDone(dk,'FLAG'),fp=sessProgress(FLAG,dk,wk);
    h+=`<section class="card" style="margin-top:12px"><div class="card-h"><h3>Opcional · Flag football</h3><span class="grow"></span><span class="pill ${fd?'ok':fp.dn?'ac':''}">${fd?'Feito ✓':fp.dn?fp.dn+'/'+fp.tot:'20:00'}</span></div>
      <p class="tag">Toda quarta às 20h. Só vá se estiver bem: é opcional e não atrapalha o resto da semana.</p>
      ${fd?'':`<p class="tag" style="margin-top:8px"><b style="color:var(--ink)">Refeição:</b> o jantar planejado é às 19:15, muito perto do jogo. Se for jogar, faça algo leve com carboidrato por volta das 18:30 (por exemplo 1 pão francês e 1 banana) e deixe o jantar completo para depois do jogo.</p>`}
      <div class="btnrow" style="margin-top:12px"><button class="btn ghost" data-act="goto-treino" data-id="FLAG">${fd?'Ver atividade':'Abrir checklist'}</button>${fd?'':`<button class="btn" data-act="finish" data-id="FLAG">Fui jogar</button>`}</div></section>`;
  }
  const bd=bkDue();
  if(bd) h+=`<section class="card" style="margin-top:12px" id="bkrem"><div class="card-h"><h3>Hora do backup</h3></div><p class="tag">Faz ${bd} dias sem backup. Seus dados ficam só neste aparelho: se o app for apagado, o histórico vai junto.</p>
    <div class="btnrow" style="margin-top:12px"><button class="btn" data-act="bk-file">Salvar backup</button><button class="btn ghost" data-act="bk-later">Lembrar em 7 dias</button></div></section>`;
  h+=`<section class="card" style="margin-top:14px">${fieldHtml(c,tg)}${ringsHtml(c,tg)}</section>`;
  h+=`<div class="tiles" style="margin-top:12px;grid-template-columns:1fr">`;
  if(nextI<0) h+=`<section class="card tile"><span class="lbl">Refeições</span><span class="t" style="color:var(--ok)">Ok</span><p class="nm">Tudo marcado hoje</p><p class="tag">Confira o total no campo acima.</p><button class="btn ghost" data-act="goto-comida">Ver cardápio</button></section>`;
  else{const m=meals[nextI],its=mealItems(type,nextI,dk),mm=mealMacItems(its);
    h+=`<section class="card tile"><span class="lbl">Próxima refeição</span><span class="t">${esc(m[1].split('–')[0])}</span><p class="nm">${esc(m[0])}</p><p class="sumtxt">${esc(its.map(([f,g])=>fmtQty(f,g)).join(' · '))}</p><p class="tag">${nf(mm.k)} kcal · ${nf(mm.p)} g prot.</p><button class="btn" data-act="eat" data-i="${nextI}">Comi</button></section>`;}
  h+=`</div>`;
  const wleft=Math.max(0,wGoal-water),wlog=dk.wlog||[];
  h+=`<section class="card" style="margin-top:12px"><div class="card-h"><h3>Água</h3><span class="grow"></span><span class="big" style="font-size:34px">${nf(water/1000,2)}</span><span class="muted" style="margin-left:4px">L</span></div>
    <div class="bar"><i style="width:${Math.min(100,wGoal?water/wGoal*100:0)}%"></i></div>
    <p class="tag" style="margin-top:6px">${nf(water)} ml de ${nf(wGoal)} ml · ${wleft>0?'faltam '+nf(wleft)+' ml':'meta batida'}</p>
    <div class="pills">${[200,300,500].map(n=>`<button class="btn ghost sm" data-act="water" data-n="${n}" aria-label="Somar ${n} mililitros">+${n} ml</button>`).join('')}</div>
    <div class="grid2" style="margin-top:12px;align-items:end"><label class="f"><span>Somar outra quantidade (ml)</span><input id="wadd" type="number" inputmode="numeric" min="1" max="5000" step="1" placeholder="ex.: 350"></label><button class="btn block" data-act="wadd">Adicionar</button></div>
    <details><summary>Corrigir o total de hoje</summary><div class="grid2" style="margin-top:8px;align-items:end"><label class="f"><span>Total de hoje (ml)</span><input id="wset" type="number" inputmode="numeric" min="0" max="15000" step="1" value="${water}"></label><button class="btn ghost block" data-act="wset">Salvar total</button></div></details>
    ${wlog.length?`<button class="btn ghost sm" style="margin-top:10px" data-act="wundo">Desfazer o último (${wlog[wlog.length-1]>0?'+':''}${nf(wlog[wlog.length-1])} ml)</button>`:''}</section>`;
  const hl=dk.health||{},hv=x=>x==null?'':x;
  h+=`<section class="card" style="margin-top:12px"><div class="card-h">${IC.watch}<h3>Dados do relógio</h3></div><p class="tag">Copie do Mi Fitness ou Xiaomi Wear. Leva 10 segundos.</p>
    <div class="grid3" style="margin-top:10px"><label class="f"><span>Sono (h)</span><input id="hs" type="number" inputmode="decimal" step="0.1" min="0" max="16" value="${hv(hl.sleep)}"></label>
    <label class="f"><span>FC repouso</span><input id="hr" type="number" inputmode="numeric" step="1" min="30" max="120" value="${hv(hl.rhr)}"></label>
    <label class="f"><span>Cal. ativas</span><input id="hk" type="number" inputmode="numeric" step="1" min="0" max="5000" value="${hv(hl.kcal)}"></label></div>
    <button class="btn ghost block" style="margin-top:12px" data-act="savehl">Salvar dados do relógio</button></section>`;
  if(Store.mode==='memory') h+=`<div class="note">Este navegador não permite salvar dados. Abra o app pelo ícone ou pelo link para guardar seu histórico.</div>`;
  return h;
}
function nextSat(){
  const now=new Date(),cur=now.getHours()*60+now.getMinutes();let pick=null;
  for(const r of D.sat){const m=String(r[0]).match(/(\d{2}):(\d{2})/);if(!m)continue;const t=+m[1]*60+ +m[2];if(t<=cur+20)pick=r;else{if(!pick)pick=r;break;}}
  return pick;
}

/* ---------- TREINO ---------- */
function sessClock(){
  const dk=S.days[ymd()]||{},cur=S.sess||sessOf(new Date().getDay()).id;
  if(dk.done&&dk.done[cur]) return dk.dur&&dk.dur[cur]?'⏱ '+dk.dur[cur]+' min':'';
  if(!dk.t0) return '';
  return '⏱ '+fmtT(Math.max(0,Math.floor((Date.now()-dk.t0)/1000)));
}
function sessStats(ss,wk){
  if(ss.kind==='gym'){const ex=D.gym[ss.id].exs;return{ex:ex.length,sets:ex.reduce((t,e)=>t+(wk===4?Math.max(1,e[1]-1):e[1]),0)};}
  if(ss.kind==='campo')return{ex:D.campo[ss.id].length,sets:0,blocks:true};
  return null;
}
function sessSummary(ss,dk,wk){
  const dur=dk.dur&&dk.dur[ss.id];let stats,prs=[];
  if(ss.kind==='gym'){
    let sets=0,vol=0;const today=ymd();
    D.gym[ss.id].exs.forEach(e=>{
      const sl=slug(e[0]),ok=((dk.sets||{})[sl]||[]).filter(x=>x&&x.done);
      sets+=ok.length;ok.forEach(x=>{vol+=(Number(x.kg)||0)*(Number(x.reps)||0)+(Number(x.kg2)||0)*(Number(x.reps2)||0);});
      const mx=Math.max(0,...ok.map(x=>Number(x.kg)||0));let best=0;
      Object.keys(S.days).forEach(d=>{if(d>=today)return;((S.days[d].sets||{})[sl]||[]).forEach(x=>{if(x&&x.done&&Number(x.kg)>best)best=Number(x.kg);});});
      const pr=PAIRS[e[0]];
      if(best>0&&mx>best)prs.push({n:pr?pr[0]:e[0].replace(/ \(.*\)$/,''),kg:mx,prev:best});
      if(pr){const mx2=Math.max(0,...ok.map(x=>Number(x.kg2)||0));let b2=0;Object.keys(S.days).forEach(d=>{if(d>=today)return;((S.days[d].sets||{})[sl]||[]).forEach(x=>{if(x&&x.done&&Number(x.kg2)>b2)b2=Number(x.kg2);});});if(b2>0&&mx2>b2)prs.push({n:pr[1],kg:mx2,prev:b2});}
    });
    stats=[[String(sets),'séries'],[nf(vol),'kg de volume'],[dur?dur+' min':'—','duração']];
  }else{
    const sp=sessProgress(ss,dk,wk);
    stats=[[sp.dn+'/'+sp.tot,sp.unit],[dur?dur+' min':'—','duração']];
  }
  let h=`<section class="card sumcard"><div class="card-h"><h3>Treino concluído</h3><span class="pill ok">✓</span></div>
    <div class="stats" style="grid-template-columns:repeat(${stats.length},1fr)">${stats.map(s=>`<div class="stat"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>`;
  prs.forEach(p=>{h+=`<div class="ins ok"><span class="ic">★</span><span>Recorde em ${esc(p.n)}: ${nf(p.kg,1)} kg (antes ${nf(p.prev,1)} kg).</span></div>`;});
  const note=(dk.notes||{})[ss.id];if(note)h+=`<p class="tag" style="margin-top:10px">Anotação: ${esc(note)}</p>`;
  return h+`</section>`;
}
function vTreino(){
  const today=ymd(),dk=S.days[today]||{},todayId=sessOf(new Date().getDay()).id;
  const cur=S.sess||todayId,ss=allSess().find(s=>s.id===cur),wk=cycleWeek(),sp=sessProgress(ss,dk,wk),pc=sp.tot?Math.round(sp.dn/sp.tot*100):0,st=sessStats(ss,wk),done=isDone(dk,ss.id);
  let h=`<header><h1>${esc(ss.name)}</h1><p class="sub">${esc(ss.tag)}</p></header>`;
  h+=`<div class="pills" style="margin-top:10px"><span class="pill">${esc(ss.dur)}</span>${st?(st.blocks?`<span class="pill">${st.ex} blocos</span>`:`<span class="pill">${st.ex} exercícios</span><span class="pill">${st.sets} séries</span>`):''}</div>`;
  h+=`<div class="chips" role="group" aria-label="Escolher treino" style="margin-top:12px">`+allSess().map(s=>`<button class="chip ${isDone(dk,s.id)?'done':''}" aria-pressed="${s.id===cur}" data-act="sess" data-id="${s.id}">${esc(s.short)}</button>`).join('')+`</div>`;
  if(ss.kind==='opt') h+=`<div class="note"><b>Atividade opcional.</b> Se estiver cansado, com dor ou sem tempo, pode pular: isso não atrapalha o resto da semana.</div>`;
  else if(cur!==todayId) h+=`<div class="note">Você está vendo <b>${esc(ss.name)}</b>, que não é o treino de hoje. O que você marcar aqui fica registrado com a data de hoje. <button class="btn ghost sm" style="margin-top:8px;display:block" data-act="sess" data-id="${todayId}">Ir para o treino de hoje</button></div>`;
  h+=`<div class="sessbar"><div class="row2"><span id="prog"><b>${sp.dn}</b> de ${sp.tot} ${sp.unit}</span><span id="sesst" class="clock">${sessClock()}</span><span id="progpct">${pc}%</span></div><div class="pb"><i id="progbar" style="width:${pc}%"></i></div></div>`;
  if(done) h+=sessSummary(ss,dk,wk);
  if(wk===4&&ss.kind==='gym') h+=`<div class="note"><b>Semana de descarga.</b> Use cargas cerca de 10% menores e 1 série a menos por exercício. As séries abaixo já mostram o número reduzido.</div>`;
  if(ss.id==='C'&&new Date().getDay()===4){const yd=S.days[ymd(addDays(new Date(),-1))];if(yd&&yd.done&&yd.done.FLAG)h+=`<div class="note"><b>Ontem teve flag à noite.</b> Se as pernas ou os isquiotibiais estiverem pesados, faça uma série a menos nos saltos e no terra e mantenha a qualidade. Não force a carga hoje.</div>`;}
  if(S.profile.obj==='Definir'&&ss.kind==='gym') h+=`<div class="note">Você está em déficit: o objetivo é manter as cargas dos exercícios principais. Só suba peso se as séries saírem limpas e você estiver recuperado.</div>`;
  if(ss.kind==='gym') h+=gymHtml(ss,dk,wk);
  else if(ss.kind==='campo') h+=campoHtml(ss,dk);
  else if(ss.kind==='time') h+=timeHtml(ss,dk);
  else if(ss.kind==='opt') h+=optHtml(ss,dk);
  else h+=restHtml(ss,dk);
  h+=`<label class="f" style="margin-top:16px"><span>Anotações do treino (opcional)</span><textarea rows="2" style="min-height:72px;padding-top:10px;font-size:16px" data-note="${ss.id}" placeholder="Dor, sensação, o que ajustar na próxima vez">${esc((dk.notes||{})[ss.id]||'')}</textarea></label>`;
  h+=`<div class="fin">`;
  if(done) h+=`<button class="btn ghost block" data-act="undo" data-id="${ss.id}">Desfazer conclusão</button>`;
  else h+=`<button class="btn xl block" data-act="finish" data-id="${ss.id}">${ss.kind==='opt'?'Marcar como feito':'Finalizar treino'}</button>`;
  h+=`</div>`;
  const hl=dk.health||{},hv=x=>x==null?'':x;
  h+=`<section class="card" style="margin-top:16px"><div class="card-h">${IC.watch}<h3>Frequência cardíaca do treino</h3></div><div class="grid2" style="margin-top:8px"><label class="f"><span>Média (bpm)</span><input type="number" inputmode="numeric" data-h="hravg" value="${hv(hl.hravg)}"></label>
    <label class="f"><span>Máxima (bpm)</span><input type="number" inputmode="numeric" data-h="hrmax" value="${hv(hl.hrmax)}"></label></div><p class="tag" style="margin-top:8px">Opcional: veja no resumo do treino do relógio.</p></section>`;
  return h;
}
const PAIRS={
  'Rosca martelo + tríceps na corda (bi-set)':['Rosca martelo','Tríceps na corda'],
  'Rosca de punho e rosca de punho reversa':['Rosca de punho','Rosca de punho reversa']
};
function pairVals(row){
  const k2=$('.kg2',row);if(!k2)return{};const r2=$('.rp2',row);
  return{kg2:k2.value===''?'':Number(k2.value),reps2:r2&&r2.value!==''?Number(r2.value):''};
}
function gymHtml(ss,dk,wk){
  const g=D.gym[ss.id],sets=dk.sets||{};
  const info=g.exs.map(e=>{const sl=slug(e[0]),n=wk===4?Math.max(1,e[1]-1):e[1],arr=sets[sl]||[];let dn=0;for(let j=0;j<n;j++)if(arr[j]&&arr[j].done)dn++;return{sl,n,dn,done:dn>=n};});
  const firstInc=info.findIndex(x=>!x.done);
  let h=checkRow('WU-'+ss.id,!!(dk.chk&&dk.chk['WU-'+ss.id]),'Aquecimento',g.warm);
  g.exs.forEach((e,i)=>{
    const [name,s,rep,desc,rpe,tip]=e,inf=info[i],sl=inf.sl,n=inf.n,last=lastSet(sl),saved=sets[sl]||[];
    const open=S.exOpen[sl]!==undefined?S.exOpen[sl]:i===firstInc,repPre=(String(rep).match(/^\d+/)||[''])[0];
    const pair=PAIRS[name],nums=String(rep).match(/\d+/g)||[],repPre2=nums[1]||nums[0]||'';
    let sug='',sug2='',hint='';
    if(last){
      let k=Number(last.kg);const top=Math.max(0,...(String(rep).match(/\d+/g)||[0]).map(Number));
      if(wk===4){k=Math.round(k*0.9/2.5)*2.5;hint=`hoje: ${nf(k,1)} kg (descarga)`;}
      else if(top>0&&Number(last.reps)>=top) hint=S.profile.obj==='Definir'?`hoje: ${nf(k,1)} kg; se sobrar reserva, tente ${nf(k+2.5,1)} kg`:`hoje: tente ${nf(k+2.5,1)} kg`;
      else hint=`hoje: ${nf(k,1)} kg`;
      sug=k;
      if(pair){const k2=last.kg2!==undefined&&last.kg2!==''?Number(last.kg2):'';sug2=k2===''?'':(wk===4?Math.round(k2*0.9/2.5)*2.5:k2);hint=`hoje: ${nf(k,1)} kg${sug2!==''?' e '+nf(sug2,1)+' kg':''}${wk===4?' (descarga)':''}`;}
    }
    let rows='';
    for(let j=0;j<n;j++){
      const sv=saved[j]||{},kg=sv.kg!==undefined&&sv.kg!==''?sv.kg:sug,rp=sv.reps!==undefined&&sv.reps!==''?sv.reps:repPre,done=!!sv.done;
      if(pair){
        const kg2=sv.kg2!==undefined&&sv.kg2!==''?sv.kg2:sug2,rp2=sv.reps2!==undefined&&sv.reps2!==''?sv.reps2:repPre2;
        rows+=`<div class="set ${done?'done':''}" data-ex="${sl}" data-i="${j}" data-rest="${esc(desc)}" data-name="${esc(name)}" data-last="${j===n-1?1:0}"><span class="n">${j+1}</span>
        <input class="kg" type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${kg}" aria-label="Carga em kg de ${esc(pair[0])}, série ${j+1}">
        <input class="rp" type="number" inputmode="numeric" step="1" min="0" placeholder="reps" value="${rp}" aria-label="Repetições de ${esc(pair[0])}, série ${j+1}">
        <button class="tick" data-act="tick" style="grid-row:span 2;height:auto;min-height:112px" aria-pressed="${done}" aria-label="Concluir série ${j+1}">✓</button>
        <span class="n" style="background:transparent;border:1px solid var(--line);font-size:13px">B</span>
        <input class="kg2" type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${kg2}" aria-label="Carga em kg de ${esc(pair[1])}, série ${j+1}">
        <input class="rp2" type="number" inputmode="numeric" step="1" min="0" placeholder="reps" value="${rp2}" aria-label="Repetições de ${esc(pair[1])}, série ${j+1}"></div>`;
        continue;
      }
      rows+=`<div class="set ${done?'done':''}" data-ex="${sl}" data-i="${j}" data-rest="${esc(desc)}" data-name="${esc(name)}" data-last="${j===n-1?1:0}"><span class="n">${j+1}</span>
        <input class="kg" type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${kg}" aria-label="Carga em kg, série ${j+1}">
        <input class="rp" type="number" inputmode="numeric" step="1" min="0" placeholder="reps" value="${rp}" aria-label="Repetições, série ${j+1}">
        <button class="tick" data-act="tick" aria-pressed="${done}" aria-label="Concluir série ${j+1}">✓</button></div>`;
    }
    h+=`<section class="ex ${open?'open':''} ${inf.done?'complete':''}" data-slug="${sl}"><button class="ex-h" data-act="toggleex" data-ex="${sl}" aria-expanded="${open}"><span class="badge"><span>${i+1}</span></span>
      <span class="grow"><span class="nm">${esc(name)}</span><span class="meta"><b class="tgt">${n} × ${esc(rep)}</b> · descanso ${esc(desc)} · RPE ${esc(rpe)}</span></span>
      <span class="dots">${Array.from({length:n},(_,j)=>`<i class="${j<inf.dn?'on':''}"></i>`).join('')}</span>${IC.chev}</button>
      <div class="ex-b">${last?(pair?`<p class="last">Última vez: ${esc(pair[0])} ${nf(last.kg,1)} kg × ${esc(last.reps||'?')}${last.kg2!==undefined&&last.kg2!==''?' · '+esc(pair[1])+' '+nf(last.kg2,1)+' kg × '+esc(last.reps2||'?'):''} · ${esc(hint)}</p>`:`<p class="last">Última vez: ${nf(last.kg,1)} kg × ${esc(last.reps||'?')} · ${esc(hint)}</p>`):'<p class="last muted">Primeira vez neste exercício: comece leve e anote a carga.</p>'}
      ${pair?[1,2].map(w=>`<div class="loadrow"><span class="tag">Carga das séries que faltam: ${esc(pair[w-1])}</span><div class="stepper sm"><button class="btn ghost sm sq kgb" data-act="kgadj" data-w="${w}" data-d="-2.5" aria-label="Diminuir 2,5 kg em ${esc(pair[w-1])}">−2,5</button><button class="btn ghost sm sq kgb" data-act="kgadj" data-w="${w}" data-d="2.5" aria-label="Aumentar 2,5 kg em ${esc(pair[w-1])}">+2,5</button></div></div>`).join(''):`<div class="loadrow"><span class="tag">Carga das séries que faltam</span><div class="stepper sm"><button class="btn ghost sm sq kgb" data-act="kgadj" data-d="-2.5" aria-label="Diminuir 2,5 kg">−2,5</button><button class="btn ghost sm sq kgb" data-act="kgadj" data-d="2.5" aria-label="Aumentar 2,5 kg">+2,5</button></div></div>`}
      ${pair?`<p class="tag" style="margin:2px 0 8px">Cada série tem duas linhas: a de cima é <b style="color:var(--ink)">${esc(pair[0])}</b> e a de baixo (B) é <b style="color:var(--ink)">${esc(pair[1])}</b>. Toque no ✓ quando terminar os dois.</p>`:''}<div class="cols"><span></span><span>Carga (kg)</span><span>Repetições</span><span></span></div>${rows}
      <details><summary>Como executar</summary><p>${esc(tip)}</p></details></div></section>`;
  });
  h+=`<div class="note">${esc(g.final)}</div>`;
  return h;
}
function checkRow(k,on,title,l1,l2,extra){
  return `<div class="chk ${on?'on':''}"><input type="checkbox" data-act="campochk" data-k="${k}" ${on?'checked':''} aria-label="Concluído: ${esc(title)}"><div class="grow"><b>${esc(title)}</b>${l1?`<p>${esc(l1)}</p>`:''}${l2?`<p>${esc(l2)}</p>`:''}</div>${extra||''}</div>`;
}
function campoHtml(ss,dk){
  const rows=D.campo[ss.id],chk=dk.chk||{};let h='';
  rows.forEach((r,i)=>{const [bloco,ex,ser,desc,inten,como]=r,k=ss.id+'-'+i,rs=restSecs(desc);
    h+=checkRow(k,!!chk[k],ex,`${bloco} · ${ser} · descanso ${desc} · intensidade ${inten}`,como,rs?`<button class="btn ghost sm" data-act="restbtn" data-s="${rs}" aria-label="Iniciar descanso de ${fmtT(rs)}">${fmtT(rs)}</button>`:'');});
  return h;
}
function timeHtml(ss,dk){
  const chk=dk.chk||{};let h=`<div class="sh"><h2>Aquecimento individual</h2></div>`;
  D.aq.forEach((r,i)=>{const k='AQ-'+i;h+=checkRow(k,!!chk[k],r[1],r[2]);});
  h+=`<div class="sh"><h2>Cronograma do dia</h2></div><section class="card">`;
  D.sat.forEach(r=>{h+=`<div class="tl-row"><span class="num">${esc(r[0])}</span><div class="grow"><b style="font-weight:600">${esc(r[1])}</b><p class="tag">${esc(r[2])}</p></div></div>`;});
  return h+`</section>`;
}
function restHtml(ss,dk){
  const chk=dk.chk||{};let h='';
  REST_ITEMS.forEach((t,i)=>{const k='DOM-'+i;h+=checkRow(k,!!chk[k],t);});
  return h;
}

