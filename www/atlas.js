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
function ancestors(i,s=new Set()){Q[i].p.forEach(p=>{if(!s.has(p)){s.add(p);ancestors(p,s)}});return s}

let shown=new Set(Object.keys(TR)),goodOnly=false,availOnly=false,sel=null;
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
  document.getElementById("count").textContent=`${done.size} / ${ids.length} done · ${DATA.filter(d=>avail(d.i)).length} up next · ${goodLeft} good rewards left`;
}

let v={x:0,y:0,k:1};
const apply=()=>world.setAttribute("transform",`translate(${v.x},${v.y}) scale(${v.k})`);
function zoomAt(px,py,f){const k=Math.min(2.5,Math.max(.08,v.k*f));const wx=(px-v.x)/v.k,wy=(py-v.y)/v.k;v.k=k;v.x=px-wx*k;v.y=py-wy*k;apply()}
function area(){const r=svg.getBoundingClientRect();let w=r.width,h=r.height;if(!panel.hidden){const p=panel.getBoundingClientRect();if(p.height<r.height-1)h-=p.height;else w-=p.width}return{w,h}}
function fit(){const a=area();const k=Math.min(a.w/BOUNDS.w,a.h/BOUNDS.h,1.2);v.k=k;v.x=(a.w-BOUNDS.w*k)/2;v.y=(a.h-BOUNDS.h*k)/2;apply()}
function centerOn(i){const a=area(),P=POS[i];if(v.k<.75)v.k=.75;v.x=a.w/2-P.x*v.k;v.y=a.h/2-P.y*v.k;apply()}

const ptrs=new Map();let moved=0,downId=null,pinch=null;
svg.addEventListener("pointerdown",e=>{svg.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;
  const n=e.target.closest&&e.target.closest(".qn");downId=ptrs.size===1&&n?n.dataset.id:null;svg.classList.add("drag");
  if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
svg.addEventListener("pointermove",e=>{if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){v.x+=dx;v.y+=dy;moved+=Math.abs(dx)+Math.abs(dy);apply()}
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=svg.getBoundingClientRect();
    if(pinch)zoomAt((a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top,d/pinch);pinch=d;moved=99}});
function up(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size){svg.classList.remove("drag");if(downId&&moved<6)open(downId);downId=null}}
svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
svg.addEventListener("wheel",e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(-e.deltaY*.0015))},{passive:false});
svg.addEventListener("keydown",e=>{const n=e.target.closest&&e.target.closest(".qn");if(n&&(e.key==="Enter"||e.key===" ")){e.preventDefault();open(n.dataset.id)}});
const mid=()=>{const r=svg.getBoundingClientRect();return[r.width/2,r.height/2]};
document.getElementById("zin").onclick=()=>zoomAt(...mid(),1.25);
document.getElementById("zout").onclick=()=>zoomAt(...mid(),.8);
document.getElementById("fit").onclick=fit;

const tbox=document.getElementById("traders");
Object.keys(TR).forEach(t=>{const b=document.createElement("button");b.className="tchip";b.setAttribute("aria-pressed","true");
  const n=DATA.filter(d=>d.t===t).length;b.innerHTML=`<span class="sw" style="background:var(--${TR[t]})"></span>${t} <span class="q">${n}</span>`;
  b.onclick=()=>{shown.has(t)?shown.delete(t):shown.add(t);b.setAttribute("aria-pressed",shown.has(t));draw()};tbox.appendChild(b)});
const gb=document.getElementById("good");gb.onclick=()=>{goodOnly=!goodOnly;gb.setAttribute("aria-pressed",goodOnly);draw()};
const ab=document.getElementById("avail");ab.onclick=()=>{availOnly=!availOnly;ab.setAttribute("aria-pressed",availOnly);draw()};
const rb=document.getElementById("reset");let armed=null;
rb.onclick=()=>{if(armed){Native.tap("warning");clearTimeout(armed);armed=null;done.clear();save();rb.textContent="Reset progress";sel?open(sel,true):draw();return}
  rb.textContent="Tap again to reset";armed=setTimeout(()=>{armed=null;rb.textContent="Reset progress"},3000)};
const dl=document.getElementById("qlist");DATA.slice().sort((a,b)=>a.n.localeCompare(b.n)).forEach(d=>{const o=document.createElement("option");o.value=d.n;dl.appendChild(o)});
const find=document.getElementById("find");
function doFind(){const s=find.value.trim().toLowerCase();if(!s)return;const d=DATA.find(x=>x.n.toLowerCase()===s)||DATA.find(x=>x.n.toLowerCase().includes(s));if(d)open(d.i)}
find.addEventListener("change",doFind);find.addEventListener("keydown",e=>{if(e.key==="Enter")doFind()});

const RC={Common:"--r-com",Uncommon:"--r-unc",Rare:"--r-rare",Epic:"--r-epic",Legendary:"--r-leg"};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const btns=a=>a.map(i=>`<button data-go="${i}">${esc(Q[i].n)}</button>`).join("");
function open(i,keep){sel=i;const q=Q[i],k=TR[q.t];
  const st=done.has(i)?"Done":avail(i)?"Up next":"Locked";
  const anc=[...ancestors(i)].filter(a=>!done.has(a));
  panel.innerHTML=`
  <div class="row"><div class="chips"><span class="chip" style="background:var(--${k}-bg);color:var(--${k}-ink);border-color:var(--${k})">${q.t}</span><span class="chip">${st}</span>${q.one?'<span class="chip">One raid</span>':""}${q.tier==="bp"?'<span class="bdg bp">BP</span>':q.tier==="ep"?'<span class="bdg ep">EPIC</span>':""}</div>
  <button class="close" id="cls">Close</button></div>
  <h2>${esc(q.n)}</h2>
  ${!done.has(i)?`<p class="route">${anc.length?`<strong>${anc.length}</strong> quest${anc.length>1?"s":""} left before this unlocks. The route is highlighted on the map.`:"Available now."}</p>`:""}
  <div><p class="lbl">Objectives</p><ol>${q.o.map(o=>`<li>${esc(o)}</li>`).join("")}</ol>${q.one?'<p class="note" style="margin-top:6px">Everything has to be done in a single raid.</p>':""}</div>
  ${q.q.length?`<div><p class="lbl">Bring</p><ul>${q.q.map(r=>`<li>${r[1]}× ${esc(r[0])}</li>`).join("")}</ul></div>`:""}
  ${q.g.length?`<div><p class="lbl">Given on accept</p><ul>${q.g.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
  <div><p class="lbl">Rewards</p><ul class="rw">${q.r.map(r=>`<li><span class="rar" style="color:var(${RC[r[2]]||"--muted"})">${esc(r[2]||r[3])}</span><span>${esc(r[0])}${r[3]==="Blueprint"?' <span class="bdg bp">BP</span>':""}</span><span class="q">×${r[1]}</span></li>`).join("")}${q.x?`<li><span class="rar" style="color:var(--muted)">XP</span><span class="q">${q.x.toLocaleString()}</span></li>`:""}</ul></div>
  ${q.p.length?`<div><p class="lbl">Requires${q.p.length>1?" (all)":""}</p><div class="links">${btns(q.p)}</div></div>`:""}
  ${q.unl.length?`<div><p class="lbl">Unlocks</p><div class="links">${btns(q.unl)}</div></div>`:""}
  <div class="row"><button class="donebtn" id="tog" aria-pressed="${done.has(i)}">${done.has(i)?"Marked done":"Mark done"}</button>
  ${!done.has(i)&&anc.length?`<button id="here">I'm on this quest</button>`:""}</div>
  <div class="row"><a href="https://arcraiders.wiki/index.php?search=${encodeURIComponent(q.n)}" target="_blank" rel="noopener">Wiki</a>
  <a href="https://metaforge.app/arc-raiders/map" target="_blank" rel="noopener">Interactive map</a></div>
  <p class="note">Quest items aren't consumed, and squad progress is shared.</p>`;
  panel.hidden=false;document.getElementById("hint").hidden=true;draw();if(!keep)centerOn(i);
  document.getElementById("cls").onclick=()=>{panel.hidden=true;sel=null;draw()};
  document.getElementById("tog").onclick=()=>{Native.tap(done.has(i)?"light":"success");done.has(i)?done.delete(i):done.add(i);save();open(i,true)};
  const h=document.getElementById("here");if(h)h.onclick=()=>{Native.tap("success");ancestors(i).forEach(a=>done.add(a));save();open(i,true)};
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>open(b.dataset.go));
}

if(window.dagre){layout();draw();fit();addEventListener("resize",()=>{if(!sel)fit()})}
else{document.querySelector(".board").insertAdjacentHTML("beforeend",'<div class="err">The layout library didn\'t load. Reload the page to try again.</div>')}

// About screen: unofficial disclaimer, privacy, data version, manual update check.
document.getElementById("about").onclick=()=>{
  sel=null;draw();
  const D=window.ATLAS_DATA,C=window.ATLAS_CONFIG||{};
  panel.innerHTML=`
  <div class="row"><div class="chips"><span class="chip">About</span></div><button class="close" id="cls">Close</button></div>
  <h2>Speranza Quest Atlas</h2>
  <p class="note"><strong>Unofficial fan-made tool.</strong> Not affiliated with, endorsed by, or sponsored by Embark Studios. Arc Raiders is a trademark of Embark Studios AB.</p>
  <div><p class="lbl">Your progress</p><p class="note">Saved only on this device. No account, no ads, no tracking, and your progress never leaves your phone.</p></div>
  <div><p class="lbl">Quest data</p><p class="note">Version ${esc(D.version)} · ${D.quests.length} quests · ${esc(D.source)}</p>
  <div class="row" style="margin-top:8px"><button id="upd">Check for quest updates</button></div><p class="note" id="updmsg" style="margin-top:6px"></p></div>
  <div><p class="lbl">Sources</p><p class="note">Quest details compiled from community resources: <a href="https://arcraiders.wiki" target="_blank" rel="noopener">Arc Raiders Wiki</a> and <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener">MetaForge</a>. Spot an error? It may be from an older patch.</p></div>
  ${C.privacyUrl?`<div class="row"><a href="${esc(C.privacyUrl)}" target="_blank" rel="noopener">Privacy policy</a></div>`:""}`;
  panel.hidden=false;document.getElementById("hint").hidden=true;
  document.getElementById("cls").onclick=()=>{panel.hidden=true};
  document.getElementById("upd").onclick=async()=>{const m=document.getElementById("updmsg");m.textContent="Checking…";m.textContent=await Native.checkForUpdates(true)||""};
};
