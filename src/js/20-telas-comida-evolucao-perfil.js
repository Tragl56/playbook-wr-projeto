/* ---------- COMIDA ---------- */
function unitLabel(f){const u=UN[f];return u?u[0]+(u[4]?'':' de '+u[5]):'g';}
function vComida(){
  const now=new Date(),date=ymd(now),todayType=typeOf(now),type=S.planView||todayType,T=targets(),tg=T[type],meals=D.plans[type];
  const dk=S.days[date]||{},track=type===todayType;
  let h=`<header><h1>Cardápio</h1><p class="sub">${TYPE_NAME[type]} · meta de ${nf(tg.k)} kcal</p></header>`;
  h+=`<div class="chips" role="group" aria-label="Tipo de dia" style="margin-top:12px">`+['treino','sab','desc'].map(t=>`<button class="chip" aria-pressed="${t===type}" data-act="plan" data-t="${t}">${TYPE_NAME[t]}${t===todayType?' (hoje)':''}</button>`).join('')+`</div>`;
  let tot={k:0,p:0,c:0,g:0};if(track)tot=consumed(date);else meals.forEach((m,i)=>add(tot,mealMacItems(m[2])));
  h+=`<section class="card"><p class="tag" style="margin-bottom:8px">${track?'Comido hoje':'Total do plano'}</p>${fieldHtml(tot,tg,true)}${ringsHtml(tot,tg)}</section>`;
  if(track&&fotoOn()) h+=fotoCard();
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
    (dk.extras||[]).forEach((e,i)=>{const m=exMac(e);h+=`<div class="lift" style="grid-template-columns:1fr auto"><div><b>${esc(fmtQty(e.f,e.g))}</b><p class="tag">≈ ${nf(e.g)} g · ${nf(m.k)} kcal</p></div><button class="btn ghost sm" data-act="delx" data-i="${i}" aria-label="Remover ${esc(e.f)}">Remover</button></div>`;});
    h+=`<p class="tag" style="margin-top:12px">Seu alimento não está na lista? Busque na <b>Tabela TACO</b> ou cadastre em <b>Meus alimentos</b>, logo abaixo.</p></section>`;
    h+=tacoCard();
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
  const cu=S.profile.custom||[],ed=S.editFood?cu.find(f=>f.id===S.editFood):null,pf=!ed&&S.prefill;
  const val=k=>ed?ed[k]:pf?pf[k]:'';
  let h=`<div class="sh"><h2>Meus alimentos</h2></div><section class="card" id="meus"><p class="tag">Cadastre o que você come no dia a dia. Eles aparecem nas listas de alimentos das refeições e em "Comeu algo fora do plano?". Os valores de ceviche e café com proteína são estimativas: ajuste para a sua receita. Ao remover um alimento, as calorias dele somem dos dias em que você já o usou.</p>`;
  cu.forEach(f=>{h+=`<div class="lift" style="grid-template-columns:1fr auto auto"><div><b>${esc(f.n)}</b><p class="tag">1 ${esc(f.u)} (${nf(f.ug)} ${esc(f.m||'g')}): ${nf(f.k)} kcal · P ${nf(f.p,1)} · C ${nf(f.c,1)} · G ${nf(f.g,1)}</p></div><button class="btn ghost sm" data-act="cf-edit" data-id="${f.id}">Editar</button><button class="btn ghost sm" data-act="cf-del" data-id="${f.id}">${S.delFood===f.id?'Confirmar':'Remover'}</button></div>`;});
  h+=`<h3 style="margin-top:16px;font-size:18px">${ed?'Editar alimento':'Novo alimento'}</h3>`;
  if(!ed) h+=`<div class="grid2" style="margin-top:8px;align-items:end"><label class="f"><span>Código de barras</span><input id="fbar" type="text" inputmode="numeric" autocomplete="off" maxlength="20" placeholder="ex.: 7891000100103" value="${esc(pf&&pf.code||'')}"></label><button class="btn ghost block" data-act="bar-find">Buscar produto</button></div>
    <p class="tag" style="margin-top:6px">Para produtos de mercado. Dica: na câmera do iPhone, toque nos números do código para copiá-los (Texto ao Vivo).</p>`;
  if(pf) h+=`<div class="ins info" id="fsrc"><span class="ic">i</span><span>Valores de ${esc(pf.src)}${pf.src==='Open Food Facts'?' (base colaborativa)':''}. Confira com o rótulo ou a receita antes de salvar. Se mudar o tamanho da unidade, recalculo calorias e macros.</span></div>`;
  h+=`<div class="grid2" style="margin-top:8px">
    <label class="f"><span>Nome</span><input id="fn" type="text" maxlength="60" placeholder="ex.: Marmita de frango" value="${esc(val('n'))}" ${ed?'readonly':''}></label>
    <label class="f"><span>Unidade</span><input id="fu" type="text" maxlength="20" placeholder="porção, copo, fatia" value="${esc(ed?ed.u:pf?pf.u:'porção')}"></label>
    <label class="f"><span>Tamanho de 1 unidade</span><input id="fw" type="number" inputmode="decimal" min="1" placeholder="ex.: 200" value="${val('ug')}"></label>
    <label class="f"><span>Medida</span><select id="fm"><option value="g" ${val('m')!=='ml'?'selected':''}>gramas (g)</option><option value="ml" ${val('m')==='ml'?'selected':''}>mililitros (ml)</option></select></label>
    <label class="f"><span>Calorias (kcal)</span><input id="fk" type="number" inputmode="decimal" min="0" value="${val('k')}"></label>
    <label class="f"><span>Proteína (g)</span><input id="fp" type="number" inputmode="decimal" min="0" value="${val('p')}"></label>
    <label class="f"><span>Carboidrato (g)</span><input id="fc" type="number" inputmode="decimal" min="0" value="${val('c')}"></label>
    <label class="f"><span>Gordura (g)</span><input id="fg" type="number" inputmode="decimal" min="0" value="${val('g')}"></label></div>
    <p class="tag" style="margin-top:8px">Preencha os valores de UMA unidade. Se deixar as calorias em branco, eu calculo pelos macros. Se deixar o tamanho em branco, uso 100.</p>
    <button class="btn block" style="margin-top:12px" data-act="cf-save">${ed?'Salvar alterações':'Salvar alimento'}</button>${ed||pf?'<button class="btn ghost block" style="margin-top:8px" data-act="cf-cancel">Cancelar</button>':''}</section>`;
  return h;
}

/* ---------- TABELA TACO: busca, adicionar ao dia e salvar em Meus alimentos ---------- */
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let _tacoN=null;
function tacoFind(q){
  const ws=norm(q).split(/[\s,]+/).filter(Boolean);if(!ws.length||norm(q).trim().length<2)return[];
  _tacoN=_tacoN||D.taco.map(f=>norm(f[0]));const w0=ws[0];
  return D.taco.map((f,i)=>({f,n:_tacoN[i]})).filter(x=>ws.every(w=>x.n.includes(w)))
    .sort((a,b)=>(b.n.startsWith(w0)-a.n.startsWith(w0))||(a.n.length-b.n.length)).slice(0,15).map(x=>x.f);
}
const macTxt=(k,p,c,g)=>`${nf(k)} kcal · ${nf(p,1)} g prot. · ${nf(c,1)} g carbo · ${nf(g,1)} g gord.`;
function tacoResults(){
  const sel=S.tacoSel&&TACO[S.tacoSel];
  if(sel){const g=S.tacoG||100,r=g/100;
    return `<div class="tsel"><b>${esc(S.tacoSel)}</b><p class="tag">${esc(D.tacoCats[sel.cat]||'')} · por 100 g: ${macTxt(sel.k,sel.p,sel.c,sel.g)}</p>
      <label class="f" style="margin-top:10px"><span>Quanto você comeu (g)</span><input id="tg" type="number" inputmode="decimal" min="1" max="3000" step="1" value="${g}"></label>
      <p class="tag" id="tgk" style="margin-top:6px">≈ ${macTxt(sel.k*r,sel.p*r,sel.c*r,sel.g*r)}</p>
      <div class="btnrow" style="margin-top:10px"><button class="btn" data-act="taco-add">Adicionar ao dia</button><button class="btn ghost" data-act="taco-my">Salvar em Meus alimentos</button></div>
      <button class="btn ghost sm" style="margin-top:8px" data-act="taco-back">Voltar à busca</button></div>`;}
  const q=S.tq||'';if(norm(q).trim().length<2)return `<p class="tag" style="margin-top:8px">Digite pelo menos 2 letras. Ex.: "frango grelhado", "banana", "pão de queijo".</p>`;
  const rs=tacoFind(q);if(!rs.length)return `<p class="empty">Nada encontrado para "${esc(q)}". Tente outra palavra (ex.: "pescada" ou "salmão" em vez de "peixe"). A TACO é de 2011 e não tem tudo: se faltar, use o código de barras ou cadastre em Meus alimentos.</p>`;
  return rs.map(f=>`<div class="lift" style="grid-template-columns:1fr auto"><div><b>${esc(f[0])}</b><p class="tag">${macTxt(f[2],f[3],f[4],f[5])} (100 g)</p></div><button class="btn ghost sm" data-act="taco-pick" data-n="${esc(f[0])}">Usar</button></div>`).join('');
}
function tacoCard(){
  return `<div class="sh"><h2>Tabela TACO</h2></div><section class="card" id="taco"><p class="tag">${nf(D.taco.length)} alimentos brasileiros da Unicamp, com valores por 100 g. Funciona sem internet.</p>
    <label class="f" style="margin-top:10px"><span>Buscar alimento</span><input id="tq" type="search" autocomplete="off" placeholder="ex.: pescada, abacate, cuscuz" value="${esc(S.tq||'')}"></label>
    <div id="tres">${tacoResults()}</div></section>`;
}

/* ---------- CÓDIGO DE BARRAS (Open Food Facts) ---------- */
// Preenche o formulário de "Meus alimentos"; quem salva é o usuário.
async function barFind(){
  const inp=$('#fbar'),code=(inp?inp.value:'').replace(/\D/g,'');
  if(code.length<8||code.length>14){toast('Digite o código de barras: de 8 a 14 números.');return;}
  toast('Buscando o produto…');
  let j;
  try{const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_pt,brands,serving_size,serving_quantity,quantity,nutriments`);j=await r.json();}
  catch(e){toast('Sem conexão com o Open Food Facts. Tente de novo ou preencha pelo rótulo.');return;}
  const p=j&&j.status===1&&j.product;
  if(!p){toast('Produto não encontrado. Preencha pelo rótulo.');return;}
  const nu=p.nutriments||{},v=k=>Math.max(0,Number(nu[k+'_100g'])||0);
  const per={k:Number(nu['energy-kcal_100g'])||(Number(nu.energy_100g)||0)/4.184,p:v('proteins'),c:v('carbohydrates'),g:v('fat')};
  if(!(per.k>0)&&!(per.p||per.c||per.g)){toast('Esse produto está sem tabela nutricional no Open Food Facts. Preencha pelo rótulo.');return;}
  if(!(per.k>0))per.k=4*per.p+4*per.c+9*per.g;
  const sq=Number(p.serving_quantity),ug=sq>=1&&sq<=2000?Math.round(sq*10)/10:100;
  const m=/\bml\b/i.test(p.serving_size||'')||(!p.serving_size&&/\b(ml|l)\b/i.test(p.quantity||''))?'ml':'g';
  const brand=String(p.brands||'').split(',')[0].trim(),nm0=String(p.product_name_pt||p.product_name||'').trim()||'Produto '+code;
  const n=(brand&&!norm(nm0).includes(norm(brand))?`${nm0} (${brand})`:nm0).slice(0,60);
  S.editFood=null;S.formBase=per;S.prefill=Object.assign({n,u:'porção',ug,m,src:'Open Food Facts',code},scaleBase(per,ug));
  toast('Encontrado. Confira com o rótulo antes de salvar.');view();
  try{$('#fn').scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}
}
// valores de UMA unidade a partir dos valores por 100 g/ml
function scaleBase(b,ug){const r=ug/100,one=x=>Math.round(x*r*10)/10;return{k:Math.round(b.k*r),p:one(b.p),c:one(b.c),g:one(b.g)};}

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
  h+=trendHtml();
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
    <p class="tag" style="margin-top:10px" id="bklast">Último backup: ${p.lastBackup?fdate(p.lastBackup)+'/'+p.lastBackup.slice(0,4):'nenhum ainda'}</p>
    <div class="btnrow" style="margin-top:10px"><button class="btn" data-act="bk-file">Salvar arquivo</button><button class="btn ghost" data-act="bk-copy">Copiar backup</button></div>
    <p class="tag" style="margin-top:8px">No iPhone, "Salvar arquivo" abre o compartilhamento: escolha "Salvar em Arquivos". "Copiar" serve para colar em Notas ou num e-mail para você mesmo.</p>
    <details><summary>Restaurar backup</summary>${restoreHtml()}</details>
    <label class="f" style="margin-top:12px"><span>Tema</span><select data-p="_theme"><option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label></section>`;
  h+=fotoSetupHtml();
  h+=remindersHtml();
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
  h+=`<section class="card"><details><summary>Já usa o app em outro aparelho? Restaurar backup</summary><p class="tag" style="margin-top:8px">No outro aparelho: Perfil &gt; Salvar arquivo (ou Copiar backup). Depois escolha o arquivo ou cole o texto aqui.</p>
    ${restoreHtml()}</details></section>`;
  return h;
}

/* ---------- BACKUP ---------- */
// Restaurar: arquivo (#bkf, tratado no `change`) ou texto colado (#bk + bk-load).
function restoreHtml(){
  return `<label class="btn ghost block filebtn" style="margin-top:8px">Escolher arquivo de backup<input id="bkf" class="vh" type="file" accept=".json,application/json,text/plain"></label>
    <textarea id="bk" style="font-size:16px;margin-top:8px" aria-label="Texto do backup" placeholder="Ou cole aqui o texto do backup"></textarea>
    <button class="btn ghost block" style="margin-top:8px" data-act="bk-load">Restaurar deste texto</button>
    <p class="tag" style="margin-top:6px">Restaurar troca os dados deste aparelho pelos do backup.</p>`;
}
const bkName=()=>`playbook-wr-backup-${ymd()}.json`;
function markBackup(msg){S.profile.lastBackup=ymd();delete S.profile.bkSnooze;saveProfile();toast(msg);view();}
// Dias sem backup (desde o último backup ou o primeiro registro). Só avisa a partir de 30 dias e quando os dados ficam no aparelho.
function bkDue(){
  if(Store.mode!=='local'||S.needSetup)return 0;
  const p=S.profile,today=ymd();if(p.bkSnooze&&p.bkSnooze>today)return 0;
  const since=p.lastBackup||Object.keys(S.days).concat(S.weights.map(w=>w.d)).sort()[0];if(!since)return 0;
  const n=Math.round((parseYmd(today)-parseYmd(since))/86400000);return n>=30?n:0;
}
async function bkFile(){
  const txt=JSON.stringify(Store.blob()),name=bkName();
  try{const f=new File([txt],name,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Backup do Playbook WR'});markBackup('Backup salvo.');return;}
  }catch(e){if(e&&e.name==='AbortError')return;}
  try{const u=URL.createObjectURL(new Blob([txt],{type:'application/json'})),a=document.createElement('a');
    a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);markBackup('Arquivo de backup baixado.');}
  catch(e){toast('Não consegui gerar o arquivo. Use "Copiar backup".');}
}
async function bkCopy(){
  const txt=JSON.stringify(Store.blob());
  try{await navigator.clipboard.writeText(txt);markBackup('Backup copiado. Cole em Notas ou num e-mail para você.');}
  catch(e){const ta=$('#bk');if(ta){ta.closest('details').open=true;ta.value=txt;ta.select();}toast('Não consegui copiar sozinho: o texto está no campo "Restaurar backup". Copie de lá.');}
}
function restoreBackup(txt){
  try{const o=JSON.parse(txt);if(!o||typeof o!=='object'||!o.profile)throw 0;S.days={};applyLoaded(o);
    saveProfile();saveWeights();saveTests();Object.keys(S.days).forEach(saveDay);toast('Backup restaurado.');view();}
  catch(err){toast('Backup inválido: confira se é o arquivo ou o texto certo.');}
}

/* ---------- TENDÊNCIA DO PESO: sugere ajuste de calorias, nunca aplica sozinho ---------- */
// Reta de tendência das pesagens dos últimos 28 dias (desde o último ajuste aplicado). Precisa de 3 pesagens em 14 dias.
function trend(){
  const p=S.profile,adj=p.trendAdj&&p.trendAdj.d,ws=[...S.weights].filter(w=>!adj||w.d>=adj).sort((a,b)=>a.d<b.d?-1:1);
  if(!ws.length)return{st:'pouco',n:0,dias:0};
  const end=parseYmd(ws[ws.length-1].d),pts=ws.map(w=>({x:Math.round((parseYmd(w.d)-end)/86400000),y:w.kg})).filter(q=>q.x>=-28);
  const dias=-pts[0].x;
  if(pts.length<3||dias<14)return{st:'pouco',n:pts.length,dias};
  const mx=pts.reduce((a,q)=>a+q.x,0)/pts.length,my=pts.reduce((a,q)=>a+q.y,0)/pts.length;
  const slope=pts.reduce((a,q)=>a+(q.x-mx)*(q.y-my),0)/pts.reduce((a,q)=>a+(q.x-mx)**2,0);
  const rate=slope*7,kg=my-slope*mx,pct=rate/kg*100,o=p.obj;
  let st,dir=0;
  if(o==='Definir'){st=pct<=-1?'rapido':rate>-0.2?'parado':'ok';dir=st==='rapido'?1:st==='parado'?-1:0;}
  else if(o==='Ganhar massa'){st=pct>=0.5?'rapido':rate<0.1?'parado':'ok';dir=st==='rapido'?-1:st==='parado'?1:0;}
  else{st=rate<=-0.25?'caindo':rate>=0.25?'subindo':'ok';dir=st==='caindo'?1:st==='subindo'?-1:0;}
  // cerca de +175 kcal ou −125 kcal por dia, convertidos em passos de 0,05 nos fatores de atividade
  const base=tmb()*(ADJ[o]||1),dF=dir?dir*Math.max(0.05,Math.round((dir>0?175:125)/base/0.05)*0.05):0;
  return{st,n:pts.length,dias,rate,pct,dir,dF:Math.round(dF*100)/100,dk:Math.round(dF*base/10)*10};
}
function trendHtml(){
  const t=trend(),p=S.profile,sg=(v,d)=>(v>0?'+':'')+nf(v,d),adj=p.trendAdj;
  const box=(cls,txt)=>`<div class="ins ${cls}" id="trend" data-st="${t.st}"><span class="ic">${cls==='ok'?'✓':cls==='warn'?'!':'i'}</span><span>${txt}</span></div>`;
  if(t.st==='pouco'){
    const ini=adj?`Ajuste aplicado em ${fdate(adj.d)}. A nova tendência sai depois de 2 semanas de pesagens. `:'';
    return box('info',`${ini}Tendência do peso: preciso de pelo menos 3 pesagens em 14 dias. Agora: ${t.n} ${t.n===1?'pesagem':'pesagens'}${t.n>1?' em '+t.dias+' dias':''}. Pese-se 1 a 2 vezes por semana, em jejum, no mesmo horário.`);
  }
  const r=`${sg(t.rate,2)} kg por semana (${sg(t.pct,1)}% do peso)`;
  const msg={
    Definir:{rapido:`Perdendo rápido demais: ${r}. Acima de ~1% por semana você tende a perder força e músculo.`,
             parado:`Peso quase parado: ${r}. Para definir, o esperado é perder pelo menos 0,2 kg por semana.`,
             ok:`Dentro do esperado: ${r}. Mantenha as metas.`},
    'Ganhar massa':{rapido:`Ganhando rápido demais: ${r}. Acima de ~0,5% por semana boa parte tende a ser gordura.`,
             parado:`Peso não está subindo: ${r}. Para ganhar massa, o esperado é pelo menos +0,1 kg por semana.`,
             ok:`Dentro do esperado: ${r}. Mantenha as metas.`},
    Manter:{caindo:`Peso caindo: ${r}. Para manter, o ideal é variar menos de 0,25 kg por semana.`,
             subindo:`Peso subindo: ${r}. Para manter, o ideal é variar menos de 0,25 kg por semana.`,
             ok:`Peso estável: ${r}. Mantenha as metas.`}
  }[p.obj]||{};
  const head=`Tendência de ${t.dias} dias (${t.n} pesagens): `;
  if(!t.dir) return box('ok',head+(msg[t.st]||''));
  const T=targets().treino.k,dica=t.dir>0?'Prefira somar carboidrato (arroz, batata, banana).':'Corte primeiro beliscos e gordura; andar mais durante o dia também ajuda.';
  return box('warn',head+(msg[t.st]||'')+` <b>Sugestão:</b> ${t.dir>0?'comer':'cortar'} cerca de ${nf(Math.abs(t.dk))} kcal por dia (meta do dia de treino: ${nf(T)} → ${nf(T+t.dk)} kcal). ${dica}`)+
    `<button class="btn ghost block" style="margin-top:8px" data-act="trend-apply" data-d="${t.dF}">Aplicar sugestão (${sg(t.dk,0)} kcal por dia)</button><p class="tag" style="margin-top:6px">Nada muda se você não tocar. O ajuste soma ${sg(t.dF,2)} nos fatores de atividade (Perfil &gt; Ajuste fino), e dá para desfazer lá.</p>`;
}

/* ---------- LEMBRETES (app Lembretes ou Atalhos do iPhone) ---------- */
function remindersHtml(){
  const goal=Math.round(S.profile.peso*S.profile.agua),hrs=['08:00','10:00','12:00','14:00','16:00','18:00','20:00'],ml=Math.max(100,Math.round(goal/hrs.length/50)*50);
  const days={treino:'segunda a sexta',sab:'sábado',desc:'domingo'};
  const meals=['treino','sab','desc'].map(t=>`<p style="margin-top:6px"><b style="color:var(--ink)">${TYPE_NAME[t]} (${days[t]}):</b> ${D.plans[t].map(m=>`${esc(m[1].split('–')[0])} ${esc(m[0].replace(/\s*\(.*\)$/,''))}`).join(' · ')}</p>`).join('');
  return `<div class="sh"><h2>Lembretes no iPhone</h2></div><section class="card" id="lembretes"><p class="tag">O app instalado não consegue mandar avisos sozinho. Crie os avisos no app Lembretes (mais simples) ou no Atalhos. Ao receber o aviso, abra o Playbook pelo ícone da tela inicial.</p>
    <details><summary>Horários sugeridos</summary><p><b style="color:var(--ink)">Água (todo dia):</b> ${hrs.join(', ')}, com cerca de ${nf(ml)} ml cada (meta de ${nf(goal)} ml).</p>${meals}</details>
    <details><summary>Como criar no app Lembretes</summary><ol class="steps"><li>Abra o app Lembretes e crie a lista "Playbook" (Adicionar Lista).</li><li>Toque em "Novo Lembrete" e escreva, por exemplo, "Água: ${nf(ml)} ml".</li><li>Toque no ⓘ, ative Data e Hora e escolha o horário.</li><li>Em Repetir, escolha Diariamente. Para refeições, use Personalizado &gt; Semanalmente e marque os dias (segunda a sexta, sábado ou domingo).</li><li>Repita para cada horário.</li></ol></details>
    <details><summary>Como criar no app Atalhos</summary><ol class="steps"><li>Abra Atalhos &gt; Automação &gt; + &gt; Hora do Dia.</li><li>Escolha o horário e a repetição (todo dia ou nos dias da semana) e marque Executar Imediatamente.</li><li>Toque em Seguinte &gt; Nova Automação em Branco &gt; Adicionar Ação e busque "Mostrar Notificação".</li><li>Escreva o texto do aviso (ex.: "Água: ${nf(ml)} ml") e conclua.</li><li>Repita para cada horário.</li></ol></details>
    <p class="tag" style="margin-top:8px">Não use links do site nos avisos: eles abrem no Safari, que guarda os dados separados do app instalado.</p></section>`;
}

/* ---------- FOTO DO PRATO (função /api/foto na Vercel, com o Claude) ---------- */
// O código de acesso fica só neste aparelho (não vai para o backup).
const FOTO_KEY='wr_foto_code';
function fotoCode(){try{return localStorage.getItem(FOTO_KEY)||'';}catch(e){return '';}}
// Só no site (http/https). No artefato do Claude não há a função /api/foto.
const fotoOn=()=>/^https?:$/.test(location.protocol)&&Store.mode!=='cloud';
function fotoFood(it){const n=it.alimento;return n&&(FOOD[n]||TACO[n])?n:'';}
// kcal e macros do item para `g` gramas: tabela (base/Meus/TACO) quando houver; senão a estimativa da foto
function fotoMac(it,g){const n=fotoFood(it);if(n)return mac(n,g);const r=it.gramas>0?g/it.gramas:0;return{k:it.kcal*r,p:it.proteina*r,c:it.carbo*r,g:it.gordura*r};}
function fotoTotal(){const t={k:0,p:0,c:0,g:0};((S.foto&&S.foto.itens)||[]).forEach(it=>{if(it.sel)add(t,fotoMac(it,it.g));});return t;}
function fotoCard(){
  const F=S.foto;
  let h=`<section class="card" id="foto" style="margin-top:12px"><div class="card-h"><h3>Foto do prato</h3></div>`;
  if(!F){
    h+=`<p class="tag">Tire uma foto do prato e eu estimo os alimentos, as quantidades e as calorias. Você confere antes de somar ao dia.</p>
      <label class="btn xl block filebtn" style="margin-top:12px">Fotografar o prato<input id="fotoin" class="vh" type="file" accept="image/*"></label>`;
    if(!fotoCode()) h+=`<p class="tag" style="margin-top:8px">Antes, configure o código de acesso em Perfil &gt; Foto do prato.</p>`;
    return h+`</section>`;
  }
  if(F.img) h+=`<img class="fotothumb" src="${F.img}" alt="Foto do prato">`;
  if(F.st==='busy') return h+`<p class="tag" style="margin-top:8px" role="status">Analisando a foto… pode levar até 30 segundos.</p></section>`;
  if(F.st==='err') return h+`<div class="ins warn"><span class="ic">!</span><span>${esc(F.msg)}</span></div><div class="btnrow" style="margin-top:10px"><label class="btn filebtn">Tentar outra foto<input id="fotoin" class="vh" type="file" accept="image/*"></label><button class="btn ghost" data-act="foto-clear">Fechar</button></div></section>`;
  if(!F.itens.length) return h+`<div class="ins info"><span class="ic">i</span><span>${esc(F.obs||'Não encontrei alimentos na foto.')}</span></div><div class="btnrow" style="margin-top:10px"><label class="btn filebtn">Tentar outra foto<input id="fotoin" class="vh" type="file" accept="image/*"></label><button class="btn ghost" data-act="foto-clear">Fechar</button></div></section>`;
  h+=`<p class="tag" style="margin-top:8px">Confira os itens e ajuste os gramas. Desmarque o que não comeu.</p>`;
  F.itens.forEach((it,i)=>{const m=fotoMac(it,it.g),src=fotoFood(it)?(TACO[fotoFood(it)]&&!FOOD[fotoFood(it)]?'TACO':'tabela do app'):'estimativa da foto';
    h+=`<div class="fotoit${it.sel?'':' off'}"><label class="fchk"><input type="checkbox" id="pc${i}" ${it.sel?'checked':''}><span><b>${esc(it.nome)}</b><span class="tag">${esc(src)}${fotoFood(it)&&norm(fotoFood(it))!==norm(it.nome)?': '+esc(fotoFood(it)):''}</span></span></label>
      <label class="f"><span>Gramas</span><input id="pg${i}" type="number" inputmode="decimal" min="1" max="3000" step="1" value="${Math.round(it.g)}"></label><span class="tag" id="pk${i}">${nf(m.k)} kcal · ${nf(m.p)} g prot.</span></div>`;});
  const t=fotoTotal();
  h+=`<p style="margin-top:10px" id="ptot"><b>Total marcado: ${nf(t.k)} kcal</b> <span class="tag">· ${nf(t.p)} g prot. · ${nf(t.c)} g carbo · ${nf(t.g)} g gord.</span></p>`;
  if(F.obs) h+=`<p class="tag" style="margin-top:4px">Obs.: ${esc(F.obs)}</p>`;
  h+=`<div class="btnrow" style="margin-top:12px"><button class="btn" data-act="foto-add">Adicionar ao dia</button><button class="btn ghost" data-act="foto-clear">Descartar</button></div>
    <p class="tag" style="margin-top:8px">É uma estimativa por foto: pode errar a quantidade, principalmente de óleo e molhos.</p></section>`;
  return h;
}
// atualiza kcal do item e o total sem recriar a tela (o teclado não fecha)
function fotoRefresh(i){
  const it=S.foto.itens[i],m=fotoMac(it,it.g),el=$('#pk'+i);if(el)el.textContent=`${nf(m.k)} kcal · ${nf(m.p)} g prot.`;
  const t=fotoTotal(),tot=$('#ptot');if(tot)tot.innerHTML=`<b>Total marcado: ${nf(t.k)} kcal</b> <span class="tag">· ${nf(t.p)} g prot. · ${nf(t.c)} g carbo · ${nf(t.g)} g gord.</span>`;
  const row=$('#pc'+i);if(row)row.closest('.fotoit').classList.toggle('off',!it.sel);
}
// reduz a foto para no máximo 1280 px (JPEG) antes de enviar
async function shrinkImage(file,max=1280){
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=url;});
    const w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');
    c.width=Math.round(w*s);c.height=Math.round(h*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return c.toDataURL('image/jpeg',0.82);
  }finally{URL.revokeObjectURL(url);}
}
async function fotoSend(file){
  const code=fotoCode();if(!code){toast('Configure o código em Perfil > Foto do prato.');go('perfil');return;}
  if(navigator.onLine===false){toast('Sem internet: a foto precisa de conexão.');return;}
  let img;
  try{img=await shrinkImage(file);}catch(e){toast('Não consegui abrir essa foto.');return;}
  S.foto={st:'busy',img};view();
  let r,j;
  try{
    r=await fetch('/api/foto',{method:'POST',headers:{'Content-Type':'application/json','x-app-code':code},
      body:JSON.stringify({image:img.split(',')[1],media_type:'image/jpeg',meus:(S.profile.custom||[]).map(f=>`${f.n} (1 ${f.u} = ${f.ug} ${f.m||'g'})`)})});
    j=await r.json().catch(()=>null);
  }catch(e){S.foto={st:'err',img,msg:'Sem conexão com o servidor. Tente de novo.'};view();return;}
  if(!r.ok||!j||!Array.isArray(j.itens)){S.foto={st:'err',img,msg:(j&&j.erro)||'A análise falhou. Tente de novo.'};view();return;}
  S.foto={st:'ok',img,obs:j.observacao||'',itens:j.itens.map(it=>Object.assign({},it,{g:it.gramas,sel:true}))};view();
}
function fotoSetupHtml(){
  if(!fotoOn())return '';
  const ok=!!fotoCode();
  return `<div class="sh"><h2>Foto do prato</h2></div><section class="card" id="fotocfg"><p class="tag">A foto vai para a função do site, que pergunta ao Claude (Anthropic) o que tem no prato. A foto não é guardada. Cada análise tem um custo pequeno na sua conta da API da Anthropic.</p>
    <p style="margin-top:8px" id="fotost">${ok?'<b style="color:var(--ok)">Configurado neste aparelho ✓</b>':'<b>Não configurado neste aparelho</b>'}</p>
    <label class="f" style="margin-top:8px"><span>Código de acesso (o mesmo de APP_CODE na Vercel)</span><input id="fcode" type="password" autocomplete="off" placeholder="${ok?'••••••••':'digite o código'}"></label>
    <div class="btnrow" style="margin-top:10px"><button class="btn" data-act="foto-code">Salvar código</button>${ok?'<button class="btn ghost" data-act="foto-uncode">Apagar</button>':''}</div></section>`;
}
