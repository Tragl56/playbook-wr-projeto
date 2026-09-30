/* ---------- COMIDA ---------- */
function unitLabel(f){const u=UN[f];return u?u[0]+(u[4]?'':' de '+u[5]):'g';}
function vComida(){
  const now=new Date(),date=ymd(now),todayType=typeOf(now),type=S.planView||todayType,T=targets(),tg=T[type],meals=D.plans[type];
  const dk=S.days[date]||{},track=type===todayType;
  let h=`<header><h1>Cardápio</h1><p class="sub">${TYPE_NAME[type]} · meta de ${nf(tg.k)} kcal</p></header>`;
  h+=`<div class="chips" role="group" aria-label="Tipo de dia" style="margin-top:12px">`+['treino','sab','desc'].map(t=>`<button class="chip" aria-pressed="${t===type}" data-act="plan" data-t="${t}">${TYPE_NAME[t]}${t===todayType?' (hoje)':''}</button>`).join('')+`</div>`;
  let tot={k:0,p:0,c:0,g:0};if(track)tot=consumed(date);else meals.forEach((m,i)=>add(tot,mealMacItems(m[2])));
  h+=`<section class="card"><p class="tag" style="margin-bottom:8px">${track?'Comido hoje':'Total do plano'}</p>${fieldHtml(tot,tg,true)}${ringsHtml(tot,tg)}</section>`;
  if(track) h+=`<div class="note">Sem balança: as porções estão em medidas caseiras. Comeu diferente? Abra a refeição e ajuste com <b>+</b> e <b>−</b>, ou adicione outro alimento.</div>`;
  const nextI=track?meals.findIndex((m,i)=>!(dk.eaten&&dk.eaten[i])):-1;
  h+=`<div class="sh"><h2>Refeições</h2></div><div class="tl">`;
  meals.forEach((m,i)=>{
    const items=track?mealItems(type,i,dk):m[2],changed=track&&dk.meals&&dk.meals[i],mm=mealMacItems(items),eaten=track&&dk.eaten&&dk.eaten[i];
    const k=type+i,open=S.open[k]!==undefined?S.open[k]:(i===nextI);
    h+=`<div class="mrow ${eaten?'eaten':''} ${i===nextI?'next':''}"><span class="dot">${eaten?'✓':''}</span><div class="mcard"><div class="mh">
      <button class="grow mopen" data-act="open" data-k="${k}" data-open="${open?1:0}" aria-expanded="${open}"><span class="time">${esc(m[1])}</span><span class="nm">${esc(m[0])}</span><span class="tag">${nf(mm.k)} kcal · ${nf(mm.p)} g proteína${changed?' · ajustado':''}</span></button>
      ${track?`<button class="btn ${eaten?'ghost':''} sm" data-act="eat" data-i="${i}" aria-pressed="${!!eaten}">${eaten?'Desfazer':'Comi'}</button>`:''}</div>`;
    if(open){
      h+=`<ul class="foods">`+items.map(([f,g],j)=>`<li class="fr"><div class="grow"><b>${esc(fmtQty(f,g))}</b><span class="tag">≈ ${nf(g)} g · ${nf(mac(f,g).k)} kcal</span></div>${track?`<div class="stepper sm"><button class="btn ghost sm sq" data-act="qty" data-i="${i}" data-j="${j}" data-d="-1" aria-label="Diminuir ${esc(f)}">−</button><button class="btn ghost sm sq" data-act="qty" data-i="${i}" data-j="${j}" data-d="1" aria-label="Aumentar ${esc(f)}">+</button></div>`:''}</li>`).join('')+`</ul>`;
      if(track){
        h+=`<div class="addrow"><select id="af${i}" aria-label="Adicionar alimento à refeição">${foodOptions()}</select><button class="btn ghost sm" data-act="addf" data-i="${i}">Adicionar</button></div>`;
        if(changed) h+=`<button class="btn ghost sm" style="margin-top:8px" data-act="resetm" data-i="${i}">Voltar ao plano</button>`;
      }
    }
    h+=`</div></div>`;
  });
  h+=`</div>`;
  if(track){
    const f0=foodNames()[0];
    h+=`<div class="sh"><h2>Comeu algo fora do plano?</h2></div><section class="card"><div class="grid2"><label class="f"><span>Alimento</span><select id="xf">${foodOptions()}</select></label>
      <label class="f"><span>Quantidade (<span id="xu" style="display:inline;margin:0">${esc(unitLabel(f0))}</span>)</span><input id="xq" type="number" inputmode="decimal" min="0.5" step="0.5" value="1"></label></div>
      <button class="btn block" style="margin-top:12px" data-act="addx">Adicionar</button>`;
    (dk.extras||[]).forEach((e,i)=>{const m=mac(e.f,e.g);h+=`<div class="lift" style="grid-template-columns:1fr auto"><div><b>${esc(fmtQty(e.f,e.g))}</b><p class="tag">≈ ${nf(e.g)} g · ${nf(m.k)} kcal</p></div><button class="btn ghost sm" data-act="delx" data-i="${i}" aria-label="Remover ${esc(e.f)}">Remover</button></div>`;});
    h+=`<p class="tag" style="margin-top:12px">Seu alimento não está na lista? Cadastre em <b>Meus alimentos</b>, logo abaixo.</p></section>`;
  }
  h+=customCard();
  return h;
}

/* ---------- MEUS ALIMENTOS ---------- */
function plural(u){
  const w=u.trim();if(/ão$/i.test(w))return w.replace(/ão$/i,'ões');if(/l$/i.test(w))return w.replace(/l$/i,'is');
  if(/[rz]$/i.test(w))return w+'es';if(/s$/i.test(w))return w;return w+'s';
}
function foodNames(){return (S.profile.custom||[]).map(f=>f.n).concat(D.foods.map(f=>f[0]));}
function foodOptions(){
  const cu=S.profile.custom||[];if(!cu.length)return D.foods.map(f=>`<option>${esc(f[0])}</option>`).join('');
  return `<optgroup label="Meus alimentos">${cu.map(f=>`<option>${esc(f.n)}</option>`).join('')}</optgroup><optgroup label="Base">${D.foods.map(f=>`<option>${esc(f[0])}</option>`).join('')}</optgroup>`;
}
let _cnames=[];
function regCustom(){
  _cnames.forEach(n=>{delete FOOD[n];delete UN[n];});_cnames=[];
  (S.profile.custom||[]).forEach(f=>{
    const r=100/(f.ug||100);
    FOOD[f.n]={k:f.k*r,p:f.p*r,c:f.c*r,g:f.g*r,m:'1 '+f.u+' ≈ '+f.ug+' '+(f.m||'g')};
    const inName=f.n.toLowerCase().includes(f.u.toLowerCase());
    if(inName){const pl=f.n.replace(new RegExp(f.u.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),w=>w.toLowerCase()===f.u.toLowerCase()?plural(w):w);UN[f.n]=[f.n,pl,f.ug,0.5,true,f.n];}
    else UN[f.n]=[f.u,plural(f.u),f.ug,0.5,false,f.n.toLowerCase()];
    _cnames.push(f.n);
  });
}
function seedCustom(){
  const p=S.profile;if(p.customSeeded)return;p.custom=p.custom||[];
  [{id:'s1',n:'Ceviche',u:'porção',ug:200,m:'g',k:150,p:28,c:6,g:2},{id:'s2',n:'Café com proteína',u:'copo',ug:250,m:'ml',k:125,p:24,c:3,g:2}]
    .forEach(f=>{if(!p.custom.some(x=>x.n.toLowerCase()===f.n.toLowerCase()))p.custom.push(f);});
  p.customSeeded=true;saveProfile();
}
function customCard(){
  const cu=S.profile.custom||[],ed=S.editFood?cu.find(f=>f.id===S.editFood):null,val=x=>ed?x:'';
  let h=`<div class="sh"><h2>Meus alimentos</h2></div><section class="card" id="meus"><p class="tag">Cadastre o que você come no dia a dia. Eles aparecem nas listas de alimentos das refeições e em "Comeu algo fora do plano?". Os valores de ceviche e café com proteína são estimativas: ajuste para a sua receita. Ao remover um alimento, as calorias dele somem dos dias em que você já o usou.</p>`;
  cu.forEach(f=>{h+=`<div class="lift" style="grid-template-columns:1fr auto auto"><div><b>${esc(f.n)}</b><p class="tag">1 ${esc(f.u)} (${nf(f.ug)} ${esc(f.m||'g')}): ${nf(f.k)} kcal · P ${nf(f.p,1)} · C ${nf(f.c,1)} · G ${nf(f.g,1)}</p></div><button class="btn ghost sm" data-act="cf-edit" data-id="${f.id}">Editar</button><button class="btn ghost sm" data-act="cf-del" data-id="${f.id}">${S.delFood===f.id?'Confirmar':'Remover'}</button></div>`;});
  h+=`<h3 style="margin-top:16px;font-size:18px">${ed?'Editar alimento':'Novo alimento'}</h3>
    <div class="grid2" style="margin-top:8px">
    <label class="f"><span>Nome</span><input id="fn" type="text" maxlength="40" placeholder="ex.: Marmita de frango" value="${esc(val(ed&&ed.n))}" ${ed?'readonly':''}></label>
    <label class="f"><span>Unidade</span><input id="fu" type="text" maxlength="20" placeholder="porção, copo, fatia" value="${esc(ed?ed.u:'porção')}"></label>
    <label class="f"><span>Tamanho de 1 unidade</span><input id="fw" type="number" inputmode="decimal" min="1" placeholder="ex.: 200" value="${ed?ed.ug:''}"></label>
    <label class="f"><span>Medida</span><select id="fm"><option value="g" ${!ed||ed.m!=='ml'?'selected':''}>gramas (g)</option><option value="ml" ${ed&&ed.m==='ml'?'selected':''}>mililitros (ml)</option></select></label>
    <label class="f"><span>Calorias (kcal)</span><input id="fk" type="number" inputmode="decimal" min="0" value="${ed?ed.k:''}"></label>
    <label class="f"><span>Proteína (g)</span><input id="fp" type="number" inputmode="decimal" min="0" value="${ed?ed.p:''}"></label>
    <label class="f"><span>Carboidrato (g)</span><input id="fc" type="number" inputmode="decimal" min="0" value="${ed?ed.c:''}"></label>
    <label class="f"><span>Gordura (g)</span><input id="fg" type="number" inputmode="decimal" min="0" value="${ed?ed.g:''}"></label></div>
    <p class="tag" style="margin-top:8px">Preencha os valores de UMA unidade. Se deixar as calorias em branco, eu calculo pelos macros. Se deixar o tamanho em branco, uso 100.</p>
    <button class="btn block" style="margin-top:12px" data-act="cf-save">${ed?'Salvar alterações':'Salvar alimento'}</button>${ed?'<button class="btn ghost block" style="margin-top:8px" data-act="cf-cancel">Cancelar</button>':''}</section>`;
  return h;
}

/* ---------- EVOLUÇÃO ---------- */
function weightChart(list){
  if(list.length<2) return `<p class="empty">Registre pelo menos duas pesagens para ver o gráfico.</p>`;
  const a=[...list].sort((x,y)=>x.d<y.d?-1:1),W=320,H=150,l=8,r=8,t=14,b=22,vals=a.map(x=>x.kg),mn=Math.min(...vals)-.6,mx=Math.max(...vals)+.6;
  const t0=parseYmd(a[0].d).getTime(),t1=parseYmd(a[a.length-1].d).getTime();
  const X=d=>l+(t1===t0?0:(parseYmd(d).getTime()-t0)/(t1-t0))*(W-l-r),Y=v=>t+(1-(v-mn)/(mx-mn))*(H-t-b);
  const pts=a.map(x=>[X(x.d),Y(x.kg)]),line=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area=`M${pts[0][0].toFixed(1)},${H-b} L${line.replace(/ /g,' L')} L${pts[pts.length-1][0].toFixed(1)},${H-b} Z`,L=pts.length-1;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico do peso corporal"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--strong)" stop-opacity=".35"/><stop offset="1" stop-color="var(--strong)" stop-opacity="0"/></linearGradient></defs>
    ${[0,.5,1].map(f=>`<line x1="${l}" x2="${W-r}" y1="${(t+f*(H-t-b)).toFixed(1)}" y2="${(t+f*(H-t-b)).toFixed(1)}" stroke="var(--line)" stroke-dasharray="3 4"/>`).join('')}
    <path d="${area}" fill="url(#wg)"/><polyline points="${line}" fill="none" stroke="var(--strong)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p,i)=>i===L?`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6" fill="var(--surface)" stroke="var(--strong)" stroke-width="3.5"/>`:`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--strong)"/>`).join('')}
    <text x="${l}" y="${H-6}" font-size="11" fill="var(--muted)">${fdate(a[0].d)}</text><text x="${W-r}" y="${H-6}" text-anchor="end" font-size="11" fill="var(--muted)">${fdate(a[a.length-1].d)}</text></svg>`;
}
function liftStats(){
  return LIFTS.map(name=>{const sl=slug(name);let best=0,last=null,lastD='';
    Object.keys(S.days).sort().forEach(d=>{const arr=(S.days[d].sets||{})[sl];if(!arr)return;const ok=arr.filter(x=>x&&x.done&&Number(x.kg)>0);if(!ok.length)return;const mxk=Math.max(...ok.map(x=>Number(x.kg)));best=Math.max(best,mxk);last=mxk;lastD=d;});
    return{name:name.replace(/ \(.*\)$/,''),best,last,lastD};});
}
function weekConsistency(){
  const out=[],m0=monday(new Date());
  for(let w=3;w>=0;w--){const start=addDays(m0,-7*w);let n=0;for(let i=0;i<7;i++){const dk=S.days[ymd(addDays(start,i))];if(dk&&dk.done&&Object.values(dk.done).some(Boolean))n++;}out.push({label:`${pad(start.getDate())}/${pad(start.getMonth()+1)}`,n});}
  return out;
}
const avg=a=>{a=a.filter(x=>typeof x==='number'&&!isNaN(x));return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;};
function healthOf(d){return (S.days[d]||{}).health||{};}
function spark(vals,aria,gid){
  const pts=vals.map((v,i)=>({i,v})).filter(p=>typeof p.v==='number');if(pts.length<2)return '';
  const W=320,H=76,l=34,r=8,t=8,b=8,mn=Math.min(...pts.map(p=>p.v)),mx=Math.max(...pts.map(p=>p.v)),lo=mx===mn?mn-1:mn,hi=mx===mn?mx+1:mx;
  const X=i=>l+i/(vals.length-1)*(W-l-r),Y=v=>t+(1-(v-lo)/(hi-lo))*(H-t-b),line=pts.map(p=>X(p.i).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ');
  const area=`M${X(pts[0].i).toFixed(1)},${H-b} L${line.replace(/ /g,' L')} L${X(pts[pts.length-1].i).toFixed(1)},${H-b} Z`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--strong)" stop-opacity=".3"/><stop offset="1" stop-color="var(--strong)" stop-opacity="0"/></linearGradient></defs>
    <text x="${l-5}" y="${Y(hi)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${nf(hi,1)}</text><text x="${l-5}" y="${Y(lo)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${nf(lo,1)}</text>
    <path d="${area}" fill="url(#${gid})"/><polyline points="${line}" fill="none" stroke="var(--strong)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map(p=>`<circle cx="${X(p.i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.8" fill="var(--strong)"/>`).join('')}</svg>`;
}
function recovery(){
  const rows=[];
  for(let i=6;i>=0;i--){const d=ymd(addDays(new Date(),-i)),hl=healthOf(d),c=consumed(d);
    rows.push({d,sleep:hl.sleep,rhr:hl.rhr,kcal:hl.kcal,eaten:c.k,bal:(typeof hl.kcal==='number'&&c.k>0)?c.k-(tmb()+hl.kcal):null});}
  const msgs=[],sl=avg(rows.map(r=>r.sleep));
  if(sl!=null) msgs.push(sl<7?{t:'warn',s:`Sono médio de ${nf(sl,1)} h nos últimos 7 dias, abaixo de 7 h. Priorize dormir mais antes de cortar mais calorias.`}:{t:'ok',s:`Sono médio de ${nf(sl,1)} h nos últimos 7 dias: bom para recuperar.`});
  const all=[];for(let i=13;i>=0;i--)all.push({i,rhr:healthOf(ymd(addDays(new Date(),-i))).rhr});
  const baseArr=all.filter(x=>x.i>=3&&typeof x.rhr==='number'),base=avg(baseArr.map(x=>x.rhr)),rec=avg(all.filter(x=>x.i<3).map(x=>x.rhr));
  if(baseArr.length>=4&&rec!=null){const diff=rec-base;msgs.push(diff>=5?{t:'warn',s:`Sua FC de repouso está ${nf(diff)} bpm acima da média recente. Pode ser cansaço acumulado, pouco sono ou doença: considere um treino mais leve.`}:{t:'ok',s:'FC de repouso dentro do seu padrão recente.'});}
  const bal=avg(rows.map(r=>r.bal)),nb=rows.filter(r=>r.bal!=null).length;
  if(nb>=3) msgs.push({t:'info',s:`Saldo médio estimado: ${bal>0?'+':''}${nf(bal)} kcal por dia (comido menos gasto). Só conta o que você marcou como comido.`});
  return{rows,msgs};
}
function vEvol(){
  const ws=[...S.weights].sort((a,b)=>a.d<b.d?-1:1),last=ws[ws.length-1],first=ws[0];
  let h=`<header><h1>Evolução</h1><p class="sub">Peso, força e consistência</p></header>`;
  h+=weekCard();
  h+=`<section class="card" style="margin-top:14px">`;
  if(last){const dTot=last.kg-first.kg,wks=Math.max(1,(parseYmd(last.d)-parseYmd(first.d))/604800000),per=dTot/wks;
    h+=`<div class="wtop"><div><p class="tag">Peso atual</p><span class="big">${nf(last.kg,1)}</span> <span class="muted">kg</span></div><div class="delta" style="margin:0"><span class="pill">${dTot>0?'+':''}${nf(dTot,1)} kg no total</span><span class="pill ${ws.length>1&&per<0?'ok':''}">${ws.length>1?(per>0?'+':'')+nf(per,2):'—'} kg/sem</span></div></div>`;}
  else h+=`<p class="tag">Peso</p>`;
  h+=weightChart(S.weights);
  h+=`<div class="grid2" style="margin-top:10px"><label class="f"><span>Data</span><input id="wd" type="date" value="${ymd()}"></label><label class="f"><span>Peso (kg)</span><input id="wk" type="number" inputmode="decimal" step="0.1" placeholder="${nf(S.profile.peso,1)}"></label></div>
    <button class="btn block" style="margin-top:12px" data-act="addw">Salvar peso</button>`;
  if(S.profile.obj==='Definir') h+=`<p class="tag" style="margin-top:10px">Meta ao definir: perder cerca de 0,3 a 0,7 kg por semana sem perder força. Pese-se sempre no mesmo dia e horário.</p>`;
  [...ws].reverse().slice(0,4).forEach(x=>{h+=`<div class="lift" style="grid-template-columns:1fr auto auto"><span>${fdate(x.d)}</span><b>${nf(x.kg,1)} kg</b><button class="btn ghost sm" data-act="delw" data-d="${x.d}" aria-label="Apagar pesagem de ${fdate(x.d)}">Apagar</button></div>`;});
  h+=`</section>`;
  h+=`<div class="sh"><h2>Força nos básicos</h2></div><section class="card">`;
  const ls=liftStats();
  if(ls.every(x=>!x.best)) h+=`<p class="empty">Registre suas séries na aba Treino para acompanhar a carga de cada exercício.</p>`;
  else{
    ls.forEach(x=>{const st=!x.best?'':x.last>=x.best*0.95?'ok':'warn';
      h+=`<div class="lift"><b>${esc(x.name)}</b>${x.best?`<span class="kgs">${nf(x.last,1)}<small>melhor ${nf(x.best,1)} kg</small></span><span class="pill ${st==='ok'?'ok':''}" style="${st==='warn'?'background:var(--warn);color:#fff':''}">${st==='ok'?'Mantendo':'Abaixo'}</span>`:`<span class="muted">—</span><span></span>`}</div>`;});
    h+=`<p class="tag" style="margin-top:8px">“Abaixo” significa que a última carga ficou mais de 5% abaixo do seu melhor. Se acontecer duas semanas seguidas, revise sono e calorias.</p>`;
  }
  h+=`</section>`;
  const rc=recovery();
  h+=`<div class="sh"><h2>Recuperação</h2></div><section class="card">`;
  if(rc.rows.every(r=>r.sleep==null&&r.rhr==null&&r.kcal==null)) h+=`<p class="empty">Registre sono, frequência cardíaca de repouso e calorias ativas na aba Hoje para ver tendências e alertas de recuperação.</p>`;
  else{
    rc.msgs.forEach(m=>{h+=`<div class="ins ${m.t}"><span class="ic">${m.t==='ok'?'✓':m.t==='warn'?'!':'i'}</span><span>${esc(m.s)}</span></div>`;});
    h+=`<table style="margin-top:14px"><thead><tr><th>Dia</th><th>Sono</th><th>FC rep.</th><th>Ativas</th><th>Saldo</th></tr></thead><tbody>`+
      rc.rows.map(r=>`<tr><td>${fdate(r.d)}</td><td>${r.sleep!=null?nf(r.sleep,1)+' h':'—'}</td><td>${r.rhr!=null?r.rhr:'—'}</td><td>${r.kcal!=null?nf(r.kcal):'—'}</td><td>${r.bal!=null?(r.bal>0?'+':'')+nf(r.bal):'—'}</td></tr>`).join('')+`</tbody></table>
      <p class="tag" style="margin-top:8px">Saldo = comido − (metabolismo basal + calorias ativas). É uma estimativa, não uma medida exata. Sinais de recuperação ajudam a decidir o treino, mas não são diagnóstico.</p>`;
    const d14=[];for(let i=13;i>=0;i--)d14.push(healthOf(ymd(addDays(new Date(),-i))));
    const s1=spark(d14.map(x=>x.sleep),'Sono nos últimos 14 dias','g1'),s2=spark(d14.map(x=>x.rhr),'Frequência cardíaca de repouso nos últimos 14 dias','g2');
    if(s1) h+=`<p class="tag" style="margin-top:14px">Sono (h), 14 dias</p>${s1}`;
    if(s2) h+=`<p class="tag" style="margin-top:10px">FC de repouso (bpm), 14 dias</p>${s2}`;
  }
  h+=`</section>`;
  h+=`<div class="sh"><h2>Testes de campo</h2></div><section class="card"><div class="grid2">
    <label class="f"><span>10 jardas (s)</span><input id="t10" type="number" inputmode="decimal" step="0.01"></label><label class="f"><span>40 jardas (s)</span><input id="t40" type="number" inputmode="decimal" step="0.01"></label>
    <label class="f"><span>Salto vertical (cm)</span><input id="tvj" type="number" inputmode="decimal" step="0.5"></label><label class="f"><span>5-10-5 (s)</span><input id="tag5" type="number" inputmode="decimal" step="0.01"></label></div>
    <button class="btn block" style="margin-top:12px" data-act="addt">Salvar testes de hoje</button>`;
  if(S.tests.length){
    const ts=[...S.tests].sort((a,b)=>a.d<b.d?1:-1),bmin=k=>Math.min(...S.tests.map(x=>x[k]).filter(v=>v>0)),bmax=k=>Math.max(...S.tests.map(x=>x[k]).filter(v=>v>0));
    const b10=bmin('s10'),b40=bmin('s40'),bvj=bmax('vj'),bag=bmin('ag'),cell=(v,b)=>v>0?`<td class="${v===b?'best':''}">${nf(v,2)}</td>`:'<td>—</td>';
    h+=`<table style="margin-top:14px"><thead><tr><th>Data</th><th>10j</th><th>40j</th><th>Salto</th><th>5-10-5</th></tr></thead><tbody>`+
      ts.slice(0,6).map(x=>`<tr><td>${fdate(x.d)}</td>${cell(x.s10,b10)}${cell(x.s40,b40)}${cell(x.vj,bvj)}${cell(x.ag,bag)}</tr>`).join('')+`</tbody></table>`;
  }
  h+=`</section>`;
  const wc=weekConsistency();
  h+=`<div class="sh"><h2>Consistência</h2></div><section class="card"><p class="tag">Dias com treino concluído por semana (planejados: 6)</p><div class="wk">`+
    wc.map(w=>`<div class="col"><b>${w.n}</b><div class="bx"><i style="height:${Math.min(100,w.n/6*100)}%"></i></div><span>${w.label}</span></div>`).join('')+`</div></section>`;
  return h;
}

/* ---------- PERFIL ---------- */
function vPerfil(){
  const p=S.profile,T=targets(),wk=cycleWeek();
  const num=(label,path,val,step='1',mode='numeric')=>`<label class="f"><span>${label}</span><input type="number" inputmode="${mode}" step="${step}" data-p="${path}" value="${val}"></label>`;
  let h=`<div class="brand" style="margin-bottom:6px">${LOGO}<span class="wm">Playbook <em>WR</em></span></div><header><h1>Perfil</h1><p class="sub">Seus dados definem as metas do dia</p></header>`;
  h+=`<div class="pills" style="margin-bottom:14px"><span class="pill">${nf(p.peso,1)} kg</span><span class="pill">${nf(p.altura)} cm</span><span class="pill">${nf(p.idade)} anos</span><span class="pill ac">${esc(p.obj)}</span></div>`;
  h+=`<section class="card"><div class="grid2">${num('Peso (kg)','peso',p.peso,'0.1','decimal')}${num('Altura (cm)','altura',p.altura)}${num('Idade','idade',p.idade)}
    <label class="f"><span>Sexo</span><select data-p="sexo"><option value="M" ${p.sexo==='M'?'selected':''}>Masculino</option><option value="F" ${p.sexo==='F'?'selected':''}>Feminino</option></select></label>
    <label class="f"><span>Objetivo</span><select data-p="obj">${Object.keys(ADJ).map(o=>`<option ${p.obj===o?'selected':''}>${o}</option>`).join('')}</select></label>
    ${num('Proteína (g por kg)','prot',p.prot,'0.1','decimal')}</div></section>`;
  h+=`<div class="sh"><h2>Metas por tipo de dia</h2></div><section class="card"><table><thead><tr><th>Dia</th><th>kcal</th><th>Prot</th><th>Carbo</th><th>Gord</th></tr></thead><tbody>`+
    ['treino','sab','desc'].map(t=>`<tr><td>${TYPE_NAME[t]}</td><td>${nf(T[t].k)}</td><td>${T[t].p}</td><td>${T[t].c}</td><td>${T[t].g}${T[t].gkg<0.8?' ⚠':''}</td></tr>`).join('')+`</tbody></table>
    <p class="tag" style="margin-top:8px">Metabolismo basal: ${nf(tmb())} kcal. ⚠ indica gordura abaixo de 0,8 g por kg: reduza o carboidrato ou suba as calorias.</p>
    <details><summary>Ajuste fino: atividade e carboidrato</summary><div class="grid3" style="margin-top:8px">
    ${['treino','sab','desc'].map(t=>num('Fator '+TYPE_NAME[t],'fat.'+t,p.fat[t],'0.05','decimal')).join('')}
    ${['treino','sab','desc'].map(t=>num('Carbo g/kg '+TYPE_NAME[t],'carb.'+t,p.carb[t],'0.1','decimal')).join('')}</div><div style="margin-top:10px">${num('Meta de água (ml por kg)','agua',p.agua)}</div></details></section>`;
  h+=`<div class="sh"><h2>Ciclo de 4 semanas</h2></div><section class="card"><p class="tag">Semana 4 é a descarga: cargas cerca de 10% menores e 1 série a menos.</p>
    <label class="f" style="margin-top:10px"><span>Semana atual do ciclo</span><select data-p="_week">${[1,2,3,4].map(w=>`<option value="${w}" ${w===wk?'selected':''}>Semana ${w}${w===4?' (descarga)':''}</option>`).join('')}</select></label></section>`;
  h+=`<div class="sh"><h2>Salvamento e tema</h2></div><section class="card"><p class="tag">${Store.mode==='cloud'?'Seus dados ficam salvos na sua conta e acompanham você em qualquer aparelho.':Store.mode==='local'?'Seus dados ficam salvos só neste aparelho. Faça um backup de vez em quando.':'Sem armazenamento disponível: os dados somem ao fechar. Abra o app pelo ícone ou pelo link.'}</p>
    <details><summary>Backup e restauração</summary><button class="btn ghost block" style="margin:8px 0" data-act="bk-make">Gerar backup</button><textarea id="bk" style="font-size:16px" aria-label="Texto do backup" placeholder="Cole aqui um backup para restaurar"></textarea>
    <button class="btn ghost block" style="margin-top:8px" data-act="bk-load">Restaurar deste texto</button></details>
    <label class="f" style="margin-top:12px"><span>Tema</span><select data-p="_theme"><option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label></section>`;
  return h;
}


/* ---------- CONFIGURAÇÃO INICIAL (sem perfil salvo) ---------- */
function vSetup(){
  const num=(label,id,step,mode,ph)=>`<label class="f"><span>${label}</span><input id="${id}" type="number" inputmode="${mode}" step="${step}" placeholder="${ph}"></label>`;
  let h=`<div class="brand" style="margin-bottom:6px">${LOGO}<span class="wm">Playbook <em>WR</em></span></div><header><h1>Vamos começar</h1><p class="sub">Seus dados calculam as metas de calorias, macros e água. Eles ficam guardados só com você.</p></header>`;
  h+=`<section class="card" id="setup"><div class="grid2">${num('Peso (kg)','su-peso','0.1','decimal','ex.: 80,5')}${num('Altura (cm)','su-alt','1','numeric','ex.: 178')}${num('Idade','su-idade','1','numeric','ex.: 22')}
    <label class="f"><span>Sexo</span><select id="su-sexo"><option value="">Escolha</option><option value="M">Masculino</option><option value="F">Feminino</option></select></label></div>
    <label class="f" style="margin-top:12px"><span>Objetivo</span><select id="su-obj"><option value="">Escolha</option><option value="Definir">Definir (perder gordura mantendo a força)</option><option value="Manter">Manter o peso</option><option value="Ganhar massa">Ganhar massa</option></select></label>
    <button class="btn xl block" style="margin-top:16px" data-act="setup-save">Começar</button>
    <p class="tag" style="margin-top:10px">Dá para mudar tudo depois, na aba Perfil.</p></section>`;
  h+=`<section class="card"><details><summary>Já usa o app em outro aparelho? Restaurar backup</summary><p class="tag" style="margin-top:8px">No outro aparelho: Perfil &gt; Backup e restauração &gt; Gerar backup. Copie o texto e cole aqui.</p>
    <textarea id="bk" style="font-size:16px;margin-top:8px" aria-label="Texto do backup" placeholder="Cole aqui o backup"></textarea>
    <button class="btn ghost block" style="margin-top:8px" data-act="bk-load">Restaurar deste texto</button></details></section>`;
  return h;
}
