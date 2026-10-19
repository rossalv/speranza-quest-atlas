const DATA=window.ATLAS_DATA.quests;
const W=224,H=62;
const TR={"Shani":"sh","Celeste":"ce","Apollo":"ap","Tian Wen":"tw","Lance":"la","Nomadic Envoy":"ca"};
const Q={};DATA.forEach(d=>{Q[d.i]=d;d.unl=[]});
DATA.forEach(d=>d.p.forEach(p=>Q[p]&&Q[p].unl.push(d.i)));
const ids=DATA.map(d=>d.i);
const LOW=new Set(["Trinket","Recyclable","Cosmetic","Outfits","Misc"]);
DATA.forEach(d=>{d.tier=d.r.some(r=>r[3]==="Blueprint")?"bp":d.r.some(r=>(r[2]==="Epic"||r[2]==="Legendary")&&!LOW.has(r[3]))?"ep":null});

const KEY="speranza-atlas-done";
let done=new Set();
try{done=new Set(JSON.parse(Store.get(KEY)||"[]").filter(i=>Q[i]))}catch(e){}
const save=()=>{Store.set(KEY,JSON.stringify([...done]))};
const avail=i=>!done.has(i)&&Q[i].p.every(p=>done.has(p));
function descendants(i,s=new Set()){Q[i].unl.forEach(c=>{if(!s.has(c)){s.add(c);descendants(c,s)}});return s}
function ancestors(i,s=new Set()){Q[i].p.forEach(p=>{if(!s.has(p)){s.add(p);ancestors(p,s)}});return s}
// Unfinished quests still in the way; a done quest implies its own chain is done.
function pending(i,s=new Set()){Q[i].p.forEach(p=>{if(!done.has(p)&&!s.has(p)){s.add(p);pending(p,s)}});return s}

let shown=new Set(Object.keys(TR)),goodOnly=false,availOnly=false,sel=null,fromItems=false;
const NS="http://www.w3.org/2000/svg",world=document.getElementById("world"),svg=document.getElementById("map"),panel=document.getElementById("panel");
function el(n,a,p){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}

let POS={},EDGES=[],BOUNDS={x:0,y:0,w:1000,h:1000};
function layout(){
  const g=new dagre.graphlib.Graph();
  g.setGraph({rankdir:"TB",nodesep:26,ranksep:58,edgesep:12,marginx:40,marginy:40});
  g.setDefaultEdgeLabel(()=>({}));
  ids.forEach(i=>g.setNode(i,{width:W,height:H}));
  DATA.forEach(d=>d.p.forEach(p=>g.setEdge(p,d.i)));
  dagre.layout(g);
  ids.forEach(i=>{const n=g.node(i);POS[i]={x:n.x,y:n.y}});
  EDGES=g.edges().map(e=>({v:e.v,w:e.w,pts:g.edge(e).points}));
  const gr=g.graph();BOUNDS={x:0,y:0,w:gr.width,h:gr.height};
}
function trunc(s,n){return s.length>n?s.slice(0,n-1)+"…":s}
function draw(){
  world.innerHTML="";
  const route=sel?ancestors(sel):null;
  const vis=i=>shown.has(Q[i].t)&&(!goodOnly||Q[i].tier)&&(!availOnly||avail(i));
  const filtering=shown.size<6||goodOnly||availOnly;
  world.setAttribute("class",filtering||route?"fade":"");
  const defs=el("defs",{},world);
  const mk=el("marker",{id:"ah",viewBox:"0 0 10 10",refX:"8",refY:"5",markerWidth:"6",markerHeight:"6",orient:"auto-start-reverse"},defs);
  el("path",{d:"M2 1L8 5L2 9",fill:"none",stroke:"context-stroke","stroke-width":"1.5"},mk);
  const eg=el("g",{},world);
  EDGES.forEach(e=>{const p=e.pts;let d=`M${p[0].x} ${p[0].y}`;
    for(let k=1;k<p.length-1;k++){const m={x:(p[k].x+p[k+1].x)/2,y:(p[k].y+p[k+1].y)/2};d+=` Q${p[k].x} ${p[k].y} ${k===p.length-2?p[k+1].x+" "+p[k+1].y:m.x+" "+m.y}`}
    if(p.length===2)d+=` L${p[1].x} ${p[1].y}`;
    const onRoute=route&&(e.w===sel||route.has(e.w))&&route.has(e.v);
    let cls="edge"+(onRoute?" route":done.has(e.v)?" live":"");
    if((filtering&&!(vis(e.v)&&vis(e.w)))||(route&&!onRoute))cls+=" dim";
    el("path",{d,class:cls,"marker-end":"url(#ah)"},eg)});
  ids.forEach(i=>{const q=Q[i],P=POS[i],k=TR[q.t];
    const st=done.has(i)?"done":avail(i)?"next":"locked";
    let dim=(filtering&&!vis(i))||(route&&i!==sel&&!route.has(i));
    const g=el("g",{class:`qn ${st}${sel===i?" sel":""}${dim?" dim":""}`,transform:`translate(${P.x-W/2},${P.y-H/2})`,tabindex:dim?"-1":"0",role:"button","data-id":i,"aria-label":`${q.n}, ${q.t}, ${st==="next"?"up next":st}`},world);
    el("rect",{class:"ring",x:-5,y:-5,width:W+10,height:H+10,rx:10},g);
    el("rect",{class:"card",x:0,y:0,width:W,height:H,rx:6,fill:`var(--${k}-bg)`,stroke:`var(--${k})`},g);
    const tg=el("text",{class:"s",x:11,y:16,fill:`var(--${k}-ink)`},g);tg.textContent=q.t.toUpperCase();
    const t=el("text",{class:"t",x:11,y:36,fill:`var(--${k}-ink)`},g);t.textContent=trunc(q.n,25);
    const top=q.r.find(r=>r[3]==="Blueprint")||q.r.find(r=>(r[2]==="Epic"||r[2]==="Legendary")&&!LOW.has(r[3]))||q.r[0];
    const s=el("text",{class:"s",x:11,y:52,fill:`var(--${k}-ink)`},g);s.textContent=top?trunc(top[0],30):"";
    let bx=W-10;
    if(done.has(i)){el("circle",{class:"chk",cx:bx-7,cy:12,r:7},g);el("path",{d:`M${bx-10.5} 12l2.5 2.5 4.5-5`,fill:"none",stroke:"var(--panel)","stroke-width":"1.8"},g);bx-=20}
    if(q.tier==="bp"){el("rect",{class:"bpb",x:bx-24,y:5,width:24,height:14,rx:3},g);const b=el("text",{class:"bpt",x:bx-12,y:15.5,"text-anchor":"middle"},g);b.textContent="BP"}
    else if(q.tier==="ep"){el("rect",{class:"epb",x:bx-36,y:5,width:36,height:14,rx:3},g);const b=el("text",{class:"ept",x:bx-18,y:15.5,"text-anchor":"middle"},g);b.textContent="EPIC"}
  });
  const goodLeft=DATA.filter(d=>d.tier&&!done.has(d.i)).length;
  document.getElementById("count").textContent=`${done.size} / ${ids.length} done · ${DATA.filter(d=>avail(d.i)).length} up next · ${goodLeft} good rewards left${window.ATLAS_DATA.label?" · "+window.ATLAS_DATA.label:""}`;
}

let v={x:0,y:0,k:1};
const apply=()=>world.setAttribute("transform",`translate(${v.x},${v.y}) scale(${v.k})`);
function zoomAt(px,py,f){const k=Math.min(2.5,Math.max(.08,v.k*f));const wx=(px-v.x)/v.k,wy=(py-v.y)/v.k;v.k=k;v.x=px-wx*k;v.y=py-wy*k;apply()}
function area(){const r=svg.getBoundingClientRect();let w=r.width,h=r.height;if(!panel.hidden){const p=panel.getBoundingClientRect();if(p.height<r.height-1)h-=p.height;else w-=p.width}return{w,h}}
function fit(){const a=area();const k=Math.min(a.w/BOUNDS.w,a.h/BOUNDS.h,1.2);v.k=k;v.x=(a.w-BOUNDS.w*k)/2;v.y=(a.h-BOUNDS.h*k)/2;apply()}
// Starting view: frame the quests that are up next at a readable size. If they're
// too spread out for that, center on the one that leads to the most quests.
let touched=false;
function home(){
  const a=area(),nx=ids.filter(i=>avail(i)&&shown.has(Q[i].t));
  if(!nx.length){fit();return}
  let x0=1/0,y0=1/0,x1=-1/0,y1=-1/0;
  nx.forEach(i=>{const P=POS[i];x0=Math.min(x0,P.x-W/2);x1=Math.max(x1,P.x+W/2);y0=Math.min(y0,P.y-H/2);y1=Math.max(y1,P.y+H/2)});
  const pad=40,bw=x1-x0+pad*2,bh=y1-y0+pad*2,k=Math.min(a.w/bw,a.h/bh,1);
  if(k>=.6){v.k=k;v.x=(a.w-bw*k)/2-(x0-pad)*k;v.y=Math.min((a.h-bh*k)/2,a.h*.12)-(y0-pad)*k;apply();return}
  const best=nx.reduce((b,i)=>descendants(i).size>descendants(b).size?i:b,nx[0]),P=POS[best];
  v.k=a.w<700?Math.min(1,a.w/(W*1.5)):.8;v.x=a.w/2-P.x*v.k;v.y=a.h*.2-P.y*v.k;apply();
}
// Remaining quests in play order (top of the tree first).
function pathOrder(list){return [...list].sort((a,b)=>POS[a].y-POS[b].y||POS[a].x-POS[b].x)}
// Show the whole remaining route if it fits at a readable size, else center on the quest.
function frameRoute(i,anc){
  const a=area(),list=[i,...anc];let x0=1/0,y0=1/0,x1=-1/0,y1=-1/0;
  list.forEach(j=>{const P=POS[j];x0=Math.min(x0,P.x-W/2);x1=Math.max(x1,P.x+W/2);y0=Math.min(y0,P.y-H/2);y1=Math.max(y1,P.y+H/2)});
  const pad=30,bw=x1-x0+pad*2,bh=y1-y0+pad*2,k=Math.min(a.w/bw,a.h/bh,1);
  if(k<.45){centerOn(i);return}
  v.k=k;v.x=(a.w-bw*k)/2-(x0-pad)*k;v.y=(a.h-bh*k)/2-(y0-pad)*k;apply();
}
function centerOn(i){const a=area(),P=POS[i];if(v.k<.75)v.k=.75;v.x=a.w/2-P.x*v.k;v.y=a.h/2-P.y*v.k;apply()}

const ptrs=new Map();let moved=0,downId=null,pinch=null;
svg.addEventListener("pointerdown",e=>{svg.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;
  const n=e.target.closest&&e.target.closest(".qn");downId=ptrs.size===1&&n?n.dataset.id:null;svg.classList.add("drag");
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
svg.addEventListener("pointermove",e=>{if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){v.x+=dx;v.y+=dy;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6)touched=true;apply()}
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=svg.getBoundingClientRect();
    if(pinch)zoomAt((a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top,d/pinch);pinch=d;moved=99;touched=true}});
function up(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size){svg.classList.remove("drag");if(downId&&moved<6){fromItems=false;open(downId)}downId=null}}
svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
svg.addEventListener("wheel",e=>{e.preventDefault();touched=true;const r=svg.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(-e.deltaY*.0015))},{passive:false});
svg.addEventListener("keydown",e=>{const n=e.target.closest&&e.target.closest(".qn");if(n&&(e.key==="Enter"||e.key===" ")){e.preventDefault();fromItems=false;open(n.dataset.id)}});
const mid=()=>{const r=svg.getBoundingClientRect();return[r.width/2,r.height/2]};
document.getElementById("zin").onclick=()=>{touched=true;zoomAt(...mid(),1.25)};
document.getElementById("zout").onclick=()=>{touched=true;zoomAt(...mid(),.8)};
document.getElementById("fit").onclick=()=>{touched=true;fit()};

const tbox=document.getElementById("traders");
Object.keys(TR).forEach(t=>{const b=document.createElement("button");b.className="tchip";b.setAttribute("aria-pressed","true");
  const n=DATA.filter(d=>d.t===t).length;b.innerHTML=`<span class="sw" style="background:var(--${TR[t]})"></span>${t} <span class="q">${n}</span>`;
  b.onclick=()=>{shown.has(t)?shown.delete(t):shown.add(t);b.setAttribute("aria-pressed",shown.has(t));flabel();draw()};tbox.appendChild(b)});
const gb=document.getElementById("good");gb.onclick=()=>{goodOnly=!goodOnly;gb.setAttribute("aria-pressed",goodOnly);flabel();draw()};
const ab=document.getElementById("avail");ab.onclick=()=>{availOnly=!availOnly;ab.setAttribute("aria-pressed",availOnly);flabel();draw()};
// Phone: filters live behind this button; its label shows how many are on.
const ft=document.getElementById("ftog"),hdr=document.querySelector("header");
function flabel(){const n=(Object.keys(TR).length-shown.size)+(goodOnly?1:0)+(availOnly?1:0);ft.textContent=n?`Filters · ${n}`:"Filters"}
ft.onclick=()=>{const o=!hdr.classList.contains("open");hdr.classList.toggle("open",o);ft.setAttribute("aria-expanded",o)};
const rb=document.getElementById("reset");let armed=null;
rb.onclick=()=>{if(armed){clearTimeout(armed);armed=null;done.clear();save();rb.textContent="Reset progress";sel?open(sel,true):(draw(),home());return}
  rb.textContent="Tap again to reset";armed=setTimeout(()=>{armed=null;rb.textContent="Reset progress"},3000)};
// ---- Search: quests and rewards ----
// Word-prefix match on every word typed, so "hull bp" finds "Hullcracker Blueprint".
const norm=s=>String(s).toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim();
const ALIAS={bp:"blueprint",bps:"blueprint",blueprints:"blueprint"};
const tokens=s=>norm(s).split(" ").filter(Boolean).map(t=>ALIAS[t]||t);
const RANK={Legendary:5,Epic:4,Rare:3,Uncommon:2,Common:1};
const REW=[];DATA.forEach(d=>d.r.forEach((r,ri)=>REW.push({q:d.i,ri,r,n:norm(r[0])})));
// Items quests ask you to bring (q), so search can answer "what needs this?"
const NEED=[];DATA.forEach(d=>d.q.forEach((r,qi)=>NEED.push({q:d.i,qi,r,n:norm(r[0])})));
const stRank=i=>avail(i)?0:done.has(i)?2:1; // up next, then locked, then done
function matches(t,n){const w=n.split(" ");return t.every(x=>w.some(y=>y.startsWith(x)))}
function search(s){
  const t=tokens(s);if(!t.length)return{qs:[],rs:[],ns:[]};const ns=norm(s);
  const qs=DATA.filter(d=>matches(t,norm(d.n))||norm(d.n).includes(ns))
    .sort((a,b)=>(norm(b.n)===ns)-(norm(a.n)===ns)||norm(b.n).startsWith(ns)-norm(a.n).startsWith(ns)||a.n.localeCompare(b.n)).slice(0,6);
  const rs=REW.filter(x=>matches(t,x.n))
    .sort((a,b)=>(b.n===ns)-(a.n===ns)||(b.r[3]==="Blueprint")-(a.r[3]==="Blueprint")||(RANK[b.r[2]]||0)-(RANK[a.r[2]]||0)||a.r[0].localeCompare(b.r[0])||Q[a.q].n.localeCompare(Q[b.q].n)).slice(0,10);
  const nd=NEED.filter(x=>matches(t,x.n))
    .sort((a,b)=>(b.n===ns)-(a.n===ns)||a.r[0].localeCompare(b.r[0])||stRank(a.q)-stRank(b.q)||Q[a.q].n.localeCompare(Q[b.q].n)).slice(0,8);
  return{qs,rs,ns:nd};
}
const find=document.getElementById("find"),sugg=document.getElementById("sugg");
let hits=[],cur=-1;
function showSugg(){
  const s=find.value.trim();if(!s){hideSugg();return}
  const{qs,rs,ns}=search(s);hits=[];let h="";
  const qst=i=>done.has(i)?"done":avail(i)?"up next":"locked";
  if(qs.length){h+='<div class="sgh">Quests</div>';qs.forEach(d=>{hits.push({q:d.i});h+=`<button class="sg" role="option" data-k="${hits.length-1}"><span class="a">${esc(d.n)}</span><span class="b">${esc(d.t)} · ${qst(d.i)}</span></button>`})}
  if(rs.length){h+='<div class="sgh">Rewards</div>';rs.forEach(x=>{hits.push({q:x.q,ri:x.ri});const bp=x.r[3]==="Blueprint";
    h+=`<button class="sg" role="option" data-k="${hits.length-1}"><span class="a">${esc(x.r[0])}${x.r[1]>1?` <span class="q">×${x.r[1]}</span>`:""}${bp?' <span class="bdg bp">BP</span>':""}</span><span class="b">from ${esc(Q[x.q].n)} · ${esc(Q[x.q].t)} · ${qst(x.q)}</span></button>`})}
  if(ns.length){h+='<div class="sgh">Needed for</div>';ns.forEach(x=>{hits.push({q:x.q,qi:x.qi});
    h+=`<button class="sg" role="option" data-k="${hits.length-1}"><span class="a">${esc(x.r[0])} <span class="q">×${x.r[1]}</span></span><span class="b">for ${esc(Q[x.q].n)} · ${esc(Q[x.q].t)} · ${qst(x.q)}</span></button>`})}
  if(!hits.length)h='<div class="sgnone">No quests, rewards or items match.</div>';
  sugg.innerHTML=h;sugg.hidden=false;find.setAttribute("aria-expanded","true");cur=hits.length?0:-1;mark();
}
function hideSugg(){sugg.hidden=true;find.setAttribute("aria-expanded","false");cur=-1}
function mark(){sugg.querySelectorAll(".sg").forEach(b=>b.classList.toggle("on",+b.dataset.k===cur));const on=sugg.querySelector(".sg.on");on&&on.scrollIntoView({block:"nearest"})}
function pick(k){const x=hits[k];if(!x)return;hideSugg();find.blur();fromItems=false;open(x.q,false,x.ri,x.qi)}
find.addEventListener("input",showSugg);
find.addEventListener("focus",()=>{if(find.value.trim())showSugg()});
find.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"&&hits.length){e.preventDefault();if(sugg.hidden)showSugg();cur=(cur+1)%hits.length;mark()}
  else if(e.key==="ArrowUp"&&hits.length){e.preventDefault();cur=(cur-1+hits.length)%hits.length;mark()}
  else if(e.key==="Enter"){e.preventDefault();if(sugg.hidden)showSugg();pick(cur<0?0:cur)}
  else if(e.key==="Escape"){hideSugg()}});
sugg.addEventListener("pointerdown",e=>e.preventDefault()); // keep focus so the tap registers
sugg.addEventListener("click",e=>{const b=e.target.closest(".sg");if(b)pick(+b.dataset.k)});
find.addEventListener("blur",()=>setTimeout(hideSugg,150));

const RC={Common:"--r-com",Uncommon:"--r-unc",Rare:"--r-rare",Epic:"--r-epic",Legendary:"--r-leg"};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const btns=a=>a.map(i=>`<button data-go="${i}">${esc(Q[i].n)}</button>`).join("");
// hl: reward index to highlight (reward search). hq: bring-item index (needed-for search).
function open(i,keep,hl,hq){sel=i;const q=Q[i],k=TR[q.t];
  const st=done.has(i)?"Done":avail(i)?"Up next":"Locked";
  const anc=[...pending(i)];const focus=hl!=null||hq!=null;
  panel.innerHTML=`
  ${fromItems?'<div class="row"><button id="backitems">← Items to keep</button></div>':""}
  <div class="row"><div class="chips"><span class="chip" style="background:var(--${k}-bg);color:var(--${k}-ink);border-color:var(--${k})">${q.t}</span><span class="chip">${st}</span>${q.one?'<span class="chip">One raid</span>':""}${q.tier==="bp"?'<span class="bdg bp">BP</span>':q.tier==="ep"?'<span class="bdg ep">EPIC</span>':""}</div>
  <button class="close" id="cls">Close</button></div>
  <h2>${esc(q.n)}</h2>
  ${hl!=null&&q.r[hl]?`<p class="note">Reward <strong>${esc(q.r[hl][0])}</strong> comes from this quest.</p>`:""}
  ${hq!=null&&q.q[hq]?`<p class="note">This quest needs <strong>${q.q[hq][1]}× ${esc(q.q[hq][0])}</strong>.</p>`:""}
  ${!done.has(i)?(anc.length?`<details class="path"${hl!=null?" open":""}><summary><strong>${anc.length}</strong> quest${anc.length>1?"s":""} left before this unlocks. The route is highlighted on the map.</summary><ol>${pathOrder(anc).map(a=>`<li><button data-go="${a}">${esc(Q[a].n)}</button> <span class="q">${esc(Q[a].t)}</span></li>`).join("")}</ol></details>`:'<p class="route">Available now.</p>'):""}
  <div><p class="lbl">Objectives</p><ol>${q.o.map(o=>`<li>${esc(o)}</li>`).join("")}</ol>${q.one?'<p class="note" style="margin-top:6px">Everything has to be done in a single raid.</p>':""}</div>
  ${q.q.length?`<div><p class="lbl">Bring</p><ul class="bring">${q.q.map((r,qi)=>`<li${qi===hq?' class="hit"':""}>${r[1]}× ${esc(r[0])}</li>`).join("")}</ul>${!done.has(i)&&!fromItems?'<button class="linkish" id="allitems">All items to keep</button>':""}</div>`:""}
  ${q.g.length?`<div><p class="lbl">Given on accept</p><ul>${q.g.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
  <div><p class="lbl">Rewards</p><ul class="rw">${q.r.map((r,ri)=>`<li${ri===hl?' class="hit"':""}><span class="rar" style="color:var(${RC[r[2]]||"--muted"})">${esc(r[2]||r[3])}</span><span>${esc(r[0])}${r[3]==="Blueprint"?' <span class="bdg bp">BP</span>':""}</span><span class="q">×${r[1]}</span></li>`).join("")}${q.x?`<li><span class="rar" style="color:var(--muted)">XP</span><span class="q">${q.x.toLocaleString()}</span></li>`:""}</ul></div>
  ${q.p.length?`<div><p class="lbl">Requires${q.p.length>1?" (all)":""}</p><div class="links">${btns(q.p)}</div></div>`:""}
  ${q.unl.length?`<div><p class="lbl">Unlocks</p><div class="links">${btns(q.unl)}</div></div>`:""}
  <div class="row"><button class="donebtn" id="tog" aria-pressed="${done.has(i)}">${done.has(i)?"Marked done":"Mark done"}</button>
  ${!done.has(i)&&anc.length?`<button id="here">I'm on this quest</button>`:""}</div>
  <div class="row"><a href="https://arcraiders.wiki/wiki/Special:Search?search=${encodeURIComponent(q.n)}&go=Go" target="_blank" rel="noopener">Wiki</a>
  <a href="https://metaforge.app/arc-raiders/map" target="_blank" rel="noopener">Interactive map</a></div>
  <p class="note">Items you bring are handed in. Squad progress is shared.</p>`;
  panel.hidden=false;panel.scrollTop=0;document.getElementById("hint").hidden=true;draw();if(!keep)(focus?frameRoute(i,anc):centerOn(i));
  document.getElementById("cls").onclick=()=>{panel.hidden=true;sel=null;fromItems=false;draw()};
  const bi=document.getElementById("backitems");if(bi)bi.onclick=()=>openItems();
  const ai=document.getElementById("allitems");if(ai)ai.onclick=()=>openItems();
  document.getElementById("tog").onclick=()=>{done.has(i)?done.delete(i):done.add(i);save();open(i,true)};
  const h=document.getElementById("here");if(h)h.onclick=()=>{ancestors(i).forEach(a=>done.add(a));save();open(i,true)};
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>open(b.dataset.go));
}

if(window.dagre){layout();draw();home();addEventListener("resize",()=>{if(!sel&&!touched)home()});setTimeout(checkShared,0)}
else{document.querySelector(".board").insertAdjacentHTML("beforeend",'<div class="err">The layout library didn\'t load. Reload the page to try again.</div>')}

// About screen: unofficial disclaimer, progress sharing, data version, sources.
document.getElementById("about").onclick=()=>{
  sel=null;fromItems=false;draw();
  const D=window.ATLAS_DATA;
  panel.innerHTML=`
  <div class="row"><div class="chips"><span class="chip">About</span></div><button class="close" id="cls">Close</button></div>
  <h2>Speranza Quest Atlas</h2>
  <p class="note"><strong>Unofficial fan-made tool.</strong> Not affiliated with, endorsed by, or sponsored by Embark Studios. Arc Raiders is a trademark of Embark Studios AB.</p>
  <div><p class="lbl">Your progress</p><p class="note">Saved only in this browser. No account, no ads, no tracking. Clearing your browser data resets it.</p>
  <div class="row" style="margin-top:8px"><button id="share2">Share progress</button></div><p class="share-msg" id="sharemsg2"></p>
  <p class="note" style="margin-top:6px">Opens on any phone or computer, or send it to your squad.</p>
  <div class="row" style="margin-top:10px"><input type="url" id="plink" placeholder="Paste a progress link" aria-label="Paste a progress link" style="flex:1;min-width:0"><button id="pload">Load</button></div><p class="share-msg" id="ploadmsg"></p></div>
  <div><p class="lbl">Use it like an app</p>${installHelp()}</div>
  <div><p class="lbl">Quest data</p><p class="note">${esc(D.label||"")}${D.label?" · ":""}version ${esc(D.version)} · ${D.quests.length} quests</p></div>
  <div><p class="lbl">Sources</p><p class="note">Quest details compiled from community resources: <a href="https://arcraiders.wiki" target="_blank" rel="noopener">Arc Raiders Wiki</a> and <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener">MetaForge</a>. Spot an error? It may be from an older patch.</p></div>
`;
  panel.hidden=false;document.getElementById("hint").hidden=true;
  document.getElementById("cls").onclick=()=>{panel.hidden=true};
  document.getElementById("share2").onclick=()=>shareProgress(document.getElementById("sharemsg2"));
  document.getElementById("pload").onclick=()=>{const v=document.getElementById("plink").value,m=v.match(/#p=[a-z0-9~-]*/i);
    if(!m){document.getElementById("ploadmsg").textContent="That doesn't look like a progress link. It should contain #p=";return}
    location.hash=m[0].slice(1)}; // hashchange runs checkShared
  const ib=document.getElementById("install");if(ib)ib.onclick=async()=>{const p=window.__installPrompt;if(!p)return;p.prompt();try{await p.userChoice}catch(e){}window.__installPrompt=null;ib.remove()};
};

// ---- Share progress by link (no accounts) ----
// The link lists only the furthest quests done in each chain. Finishing a quest in
// the game requires its prerequisites, so everything before them counts as done too.
function progressLink(){
  const front=[...done].filter(i=>!Q[i].unl.some(c=>done.has(c)));
  const base=location.origin+location.pathname;
  return base+"#p="+front.join("~");
}
async function shareProgress(msg){
  if(!done.size){msg.textContent="Mark some quests done first.";return}
  const url=progressLink();
  try{if(navigator.share){await navigator.share({title:"My Speranza Quest Atlas progress",url});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(url);msg.textContent="Link copied. Paste it on your other device or send it to your squad."}
  catch(e){prompt("Copy this link:",url)}
}
document.getElementById("share").onclick=()=>shareProgress({set textContent(t){showToastMsg(t)}});
function showToastMsg(t){const b=document.createElement("button");b.className="toast";b.textContent=t;b.onclick=()=>b.remove();document.body.appendChild(b);setTimeout(()=>b.remove(),4000)}
function checkShared(){
  const m=location.hash.match(/^#p=([a-z0-9~-]*)$/i);if(!m)return;
  const got=new Set();m[1].split("~").filter(i=>Q[i]).forEach(i=>{got.add(i);ancestors(i).forEach(a=>got.add(a))});
  const clear=()=>{try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}};
  if(!got.size){clear();return}
  const extra=[...got].filter(i=>!done.has(i)).length;
  if(!extra){clear();showToastMsg("You already have everything in this link.");return}
  sel=null;draw();
  panel.innerHTML=`
  <div class="row"><div class="chips"><span class="chip">Shared progress</span></div></div>
  <h2>Load this progress?</h2>
  <p class="note">The link has <strong>${got.size}</strong> quests done. ${done.size?`You have <strong>${done.size}</strong> marked here.`:"Nothing is marked in this browser yet."}</p>
  <div class="row">
    <button class="donebtn" aria-pressed="true" id="useit">${done.size?"Replace mine":"Load it"}</button>
    ${done.size&&extra?`<button id="addit">Add ${extra} to mine</button>`:""}
    <button id="noit">Cancel</button>
  </div>`;
  panel.hidden=false;document.getElementById("hint").hidden=true;
  const finish=()=>{save();clear();panel.hidden=true;draw();touched=false;home()};
  document.getElementById("useit").onclick=()=>{done=new Set(got);finish()};
  const ad=document.getElementById("addit");if(ad)ad.onclick=()=>{got.forEach(i=>done.add(i));finish()};
  document.getElementById("noit").onclick=()=>{clear();panel.hidden=true;draw()};
}
addEventListener("hashchange",checkShared);

// ---- Install help (About screen) ----
function installHelp(){
  const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  if(standalone)return '<p class="note">You\'re using the installed version. It works offline. Progress here can be separate from your browser\'s: to bring it over, tap Share progress in the browser, copy the link, and paste it above.</p>';
  if(window.__installPrompt)return '<p class="note">Install it for a home-screen icon, full-screen view and offline use.</p><div class="row" style="margin-top:8px"><button id="install">Install app</button></div>';
  if(ios)return '<p class="note">In Safari, tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>. It opens full screen and works offline. Your progress may not carry over, so share it first and paste the link in the installed version.</p>';
  return '<p class="note">In your browser menu, choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. It opens in its own window and works offline.</p>';
}

// ---- Items to keep: everything unfinished quests ask you to bring ----
// "Have it" ticks live under their own key; progress stays in speranza-atlas-done.
const HAVE_KEY="speranza-atlas-have";
let have=new Set();
try{have=new Set(JSON.parse(Store.get(HAVE_KEY)||"[]"))}catch(e){}
const saveHave=()=>Store.set(HAVE_KEY,JSON.stringify([...have]));
function keepList(){
  const m=new Map();
  DATA.forEach(d=>{if(done.has(d.i))return;d.q.forEach(([n,k])=>{
    let e=m.get(n);if(!e)m.set(n,e={n,total:0,soon:false,qs:[]});
    e.total+=k;if(avail(d.i))e.soon=true;e.qs.push({i:d.i,k})})});
  const list=[...m.values()];
  list.forEach(e=>e.qs.sort((a,b)=>stRank(a.i)-stRank(b.i)||POS[a.i].y-POS[b.i].y||Q[a.i].n.localeCompare(Q[b.i].n)));
  return list.sort((a,b)=>b.soon-a.soon||a.n.localeCompare(b.n));
}
function openItems(){
  sel=null;fromItems=false;draw();
  const list=keepList(),soon=list.filter(e=>e.soon),later=list.filter(e=>!e.soon);
  const row=(e,k)=>`<li class="kp${have.has(e.n)?" got":""}">
    <label class="kh"><input type="checkbox" data-k="${k}"${have.has(e.n)?" checked":""}><span class="kn">${esc(e.n)}</span><span class="q">×${e.total}</span></label>
    <div class="kq">${e.qs.map(x=>`<button data-go="${x.i}">${esc(Q[x.i].n)} <span class="q">×${x.k}${avail(x.i)?" · up next":""}</span></button>`).join("")}</div></li>`;
  const group=(title,arr,off)=>arr.length?`<div><p class="lbl">${title}</p><ul class="keep">${arr.map((e,j)=>row(e,off+j)).join("")}</ul></div>`:"";
  panel.innerHTML=`
  <div class="row"><div class="chips"><span class="chip">Items</span></div><button class="close" id="cls">Close</button></div>
  <h2>Items to keep</h2>
  ${list.length?`<p class="note">What your unfinished quests ask you to bring. Don't sell or recycle these. Tick what you already have; ticks are saved in this browser.</p>
  <p class="q" id="keepcount"></p>
  ${group("For quests up next",soon,0)}
  ${group("For later quests",later,soon.length)}`
  :'<p class="note">Nothing left to keep. None of your unfinished quests ask you to bring items.</p>'}`;
  panel.hidden=false;panel.scrollTop=0;document.getElementById("hint").hidden=true;
  const all=[...soon,...later];
  const count=()=>{const c=document.getElementById("keepcount");if(c)c.textContent=`${all.length} item${all.length===1?"":"s"} · ${all.filter(e=>have.has(e.n)).length} ticked`};count();
  document.getElementById("cls").onclick=()=>{panel.hidden=true};
  panel.querySelectorAll("input[data-k]").forEach(cb=>cb.onchange=()=>{const e=all[+cb.dataset.k];
    cb.checked?have.add(e.n):have.delete(e.n);saveHave();cb.closest(".kp").classList.toggle("got",cb.checked);count()});
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{fromItems=true;open(b.dataset.go)});
}
document.getElementById("items").onclick=openItems;
