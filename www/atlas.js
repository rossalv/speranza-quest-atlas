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
// Ticked objectives, per quest. Each step is stored as "index|text" so duplicate step
// names stay separate and a reworded step simply comes back unticked.
const STEPS_KEY="speranza-atlas-steps";
let steps={};
try{const o=JSON.parse(Store.get(STEPS_KEY)||"{}");for(const k in o)if(Q[k]&&Array.isArray(o[k]))steps[k]=o[k]}catch(e){}
const saveSteps=()=>Store.set(STEPS_KEY,JSON.stringify(steps));
const stepKey=(i,x)=>x+"|"+Q[i].o[x];
const stepDone=(i,x)=>!!(steps[i]&&steps[i].includes(stepKey(i,x)));
function setStep(i,x,on){const s=new Set(steps[i]||[]);on?s.add(stepKey(i,x)):s.delete(stepKey(i,x));if(s.size)steps[i]=[...s];else delete steps[i];saveSteps()}
const stepCount=i=>Q[i].o.reduce((n,_,x)=>n+(stepDone(i,x)?1:0),0);
const avail=i=>!done.has(i)&&Q[i].p.every(p=>done.has(p));
function descendants(i,s=new Set()){Q[i].unl.forEach(c=>{if(!s.has(c)){s.add(c);descendants(c,s)}});return s}
function ancestors(i,s=new Set()){Q[i].p.forEach(p=>{if(!s.has(p)){s.add(p);ancestors(p,s)}});return s}
// Unfinished quests still in the way; a done quest implies its own chain is done.
function pending(i,s=new Set()){Q[i].p.forEach(p=>{if(!done.has(p)&&!s.has(p)){s.add(p);pending(p,s)}});return s}

let shown=new Set(Object.keys(TR)),goodOnly=false,availOnly=false,sel=null,backTo=null,mapSel=null;
// Raid planning: quests with progress on the picked map. m=[] means any map; no m means
// it depends on a map condition (Frigate, Matriarch...), so it never matches a single map.
const onMap=(i,m=mapSel)=>!m||(Array.isArray(Q[i].m)&&(Q[i].m.length===0||Q[i].m.includes(m)));
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
  const vis=i=>shown.has(Q[i].t)&&(!goodOnly||Q[i].tier)&&(!availOnly||avail(i))&&onMap(i);
  const filtering=shown.size<6||goodOnly||availOnly||!!mapSel;
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
    const tg=el("text",{class:"s",x:11,y:16,fill:`var(--${k}-ink)`},g);const sc=done.has(i)?0:stepCount(i);tg.textContent=q.t.toUpperCase()+(sc?` · ${sc}/${q.o.length} steps`:"");
    const t=el("text",{class:"t",x:11,y:36,fill:`var(--${k}-ink)`},g);t.textContent=trunc(q.n,25);
    const top=q.r.find(r=>r[3]==="Blueprint")||q.r.find(r=>(r[2]==="Epic"||r[2]==="Legendary")&&!LOW.has(r[3]))||q.r[0];
    const s=el("text",{class:"s",x:11,y:52,fill:`var(--${k}-ink)`},g);s.textContent=top?trunc(top[0],30):"";
    let bx=W-10;
    if(done.has(i)){el("circle",{class:"chk",cx:bx-7,cy:12,r:7},g);el("path",{d:`M${bx-10.5} 12l2.5 2.5 4.5-5`,fill:"none",stroke:"var(--panel)","stroke-width":"1.8"},g);bx-=20}
    if(q.tier==="bp"){el("rect",{class:"bpb",x:bx-24,y:5,width:24,height:14,rx:3},g);const b=el("text",{class:"bpt",x:bx-12,y:15.5,"text-anchor":"middle"},g);b.textContent="BP"}
    else if(q.tier==="ep"){el("rect",{class:"epb",x:bx-36,y:5,width:36,height:14,rx:3},g);const b=el("text",{class:"ept",x:bx-18,y:15.5,"text-anchor":"middle"},g);b.textContent="EPIC"}
  });
  const goodLeft=DATA.filter(d=>d.tier&&!done.has(d.i)).length;
  document.getElementById("count").textContent=`${done.size} / ${ids.length} done · ${DATA.filter(d=>avail(d.i)).length} up next · ${goodLeft} good rewards left${mapSel?` · ${planCount(mapSel)} up next on ${mapSel} + ${DATA.filter(d=>avail(d.i)&&anyMap(d.i)).length} any map`:""}${window.ATLAS_DATA.label?" · "+window.ATLAS_DATA.label:""}`;
  mapCounts();
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
  const a=area(),nx=ids.filter(i=>avail(i)&&shown.has(Q[i].t)&&onMap(i));
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
function up(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size){svg.classList.remove("drag");if(downId&&moved<6){backTo=null;open(downId)}downId=null}}
svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
svg.addEventListener("wheel",e=>{e.preventDefault();touched=true;const r=svg.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(-e.deltaY*.0015))},{passive:false});
svg.addEventListener("keydown",e=>{const n=e.target.closest&&e.target.closest(".qn");if(n&&(e.key==="Enter"||e.key===" ")){e.preventDefault();backTo=null;open(n.dataset.id)}});
const mid=()=>{const r=svg.getBoundingClientRect();return[r.width/2,r.height/2]};
document.getElementById("zin").onclick=()=>{touched=true;zoomAt(...mid(),1.25)};
document.getElementById("zout").onclick=()=>{touched=true;zoomAt(...mid(),.8)};
document.getElementById("fit").onclick=()=>{touched=true;fit()};

const tbox=document.getElementById("traders");
Object.keys(TR).forEach(t=>{const b=document.createElement("button");b.className="tchip";b.dataset.t=t;b.setAttribute("aria-pressed","true");
  const n=DATA.filter(d=>d.t===t).length;b.innerHTML=`<span class="sw" style="background:var(--${TR[t]})"></span>${t} <span class="q">${n}</span>`;
  b.onclick=()=>{shown.has(t)?shown.delete(t):shown.add(t);b.setAttribute("aria-pressed",shown.has(t));flabel();draw()};tbox.appendChild(b)});
const gb=document.getElementById("good");gb.onclick=()=>{goodOnly=!goodOnly;gb.setAttribute("aria-pressed",goodOnly);flabel();draw()};
const ab=document.getElementById("avail");ab.onclick=()=>{availOnly=!availOnly;ab.setAttribute("aria-pressed",availOnly);flabel();draw()};
// Plan a raid by map: one chip per map with how many up-next quests you can progress there.
const RAID_MAPS=["Dam Battlegrounds","Buried City","Spaceport","Blue Gate","Stella Montis","Riven Tides","Pendola Pass"];
const mbox=document.getElementById("mapsel");
RAID_MAPS.forEach(m=>{const b=document.createElement("button");b.className="tchip mchip";b.dataset.map=m;b.setAttribute("aria-pressed","false");
  b.innerHTML=`${m} <span class="q"></span>`;
  b.onclick=()=>{mapSel=mapSel===m?null:m;mbox.querySelectorAll(".mchip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.map===mapSel));flabel();
    if(mapSel){openPlan();hdr.classList.remove("open");ft.setAttribute("aria-expanded","false")}
    else{if(panel.querySelector("#plan")||backTo==="plan"){panel.hidden=true;sel=null;backTo=null}draw()}
    touched=false;home()};
  mbox.appendChild(b)});
// Chip counts only quests tied to that map; any-map quests are lit on every map but not counted.
const anyMap=i=>Array.isArray(Q[i].m)&&Q[i].m.length===0;
const onlyMap=(i,m)=>Array.isArray(Q[i].m)&&Q[i].m.includes(m);
// Up-next quests for a map: tagged with it, or needing a condition that's live there now.
const planCount=m=>DATA.filter(d=>avail(d.i)&&(onlyMap(d.i,m)||(!Array.isArray(d.m)&&liveFor(d.i,m).length))).length;
function mapCounts(){mbox.querySelectorAll(".mchip").forEach(c=>{const m=c.dataset.map,n=planCount(m),live=condNow(m);
  c.querySelector(".q").textContent=n;c.classList.toggle("live",live.length>0);
  c.title=`${n} up-next quest${n===1?"":"s"} on ${m} (any-map quests not counted)${live.length?`. Now: ${live.map(e=>e.name).join(", ")}`:""}`})}
// ---- Live map conditions: /api/conditions (this site's Worker, from MetaForge's schedule) ----
let COND=null,condErr=false;
let region=(()=>{try{return /^America\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone)?"north-america":"europe"}catch(e){return "north-america"}})();
const REGION_NAME={"north-america":"North America","europe":"Europe"};
function tfmt(t){const d=new Date(t);return d.toLocaleString([],d.toDateString()===new Date().toDateString()?{hour:"numeric",minute:"2-digit"}:{weekday:"short",hour:"numeric",minute:"2-digit"})}
const condNow=(m,t=Date.now())=>COND?COND.events.filter(e=>e.map===m&&e.start<=t&&t<e.end):[];
function condNext(m,t=Date.now()){const n=COND?COND.events.filter(e=>e.map===m&&e.start>t):[];return n.length?n.filter(e=>e.start===n[0].start):[]}
const condsOf=i=>Array.isArray(Q[i].c)?Q[i].c:[];
const liveFor=(i,m,t=Date.now())=>condNow(m,t).filter(e=>condsOf(i).includes(e.name));
// Status line for a quest that needs a condition (Frigate, Matriarch...).
function condQuestNote(i){const c=condsOf(i);if(!c.length)return "";const need=`Needs ${c.map(esc).join(" or ")}.`;
  if(condErr)return `${need} Live map conditions are unavailable right now.`;if(!COND)return `${need} Checking live map conditions…`;
  const t=Date.now(),act=COND.events.filter(e=>c.includes(e.name)&&e.start<=t&&t<e.end),nxt=COND.events.filter(e=>c.includes(e.name)&&e.start>t).slice(0,3);
  return `${need} ${act.length?`<strong>Active now:</strong> ${act.map(e=>`${esc(e.name)} on ${esc(e.map)} until ${tfmt(e.end)}`).join("; ")}.`:"Not active on any map right now."}${nxt.length?` <strong>Next:</strong> ${nxt.map(e=>`${esc(e.map)} ${tfmt(e.start)}`).join(", ")}.`:""}`}
function planNowLine(m){if(condErr)return "Live map conditions are unavailable right now.";if(!COND)return "Checking live map conditions…";
  const a=condNow(m),n=condNext(m);
  return `${a.length?`<strong>Now:</strong> ${a.map(e=>`${esc(e.name)} until ${tfmt(e.end)}`).join(", ")}`:"No map condition right now"}${n.length?` · <strong>Next:</strong> ${n.map(e=>esc(e.name)).join(", ")} at ${tfmt(n[0].start)}`:""}.`}
let condAt=0;
async function loadConditions(){condAt=Date.now();
  try{const r=await fetch(`/api/conditions?region=${region}`,{cache:"no-cache"});if(!r.ok)throw 0;const d=await r.json();if(!Array.isArray(d.events))throw 0;COND=d;condErr=false}
  catch(e){condErr=true}
  mapCounts();if(panel.querySelector("#plan"))openPlan();
  const lc=document.getElementById("livecond");if(lc&&sel)lc.innerHTML=condQuestNote(sel)}
setInterval(()=>{if(!document.hidden)loadConditions()},5*60e3);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-condAt>5*60e3)loadConditions()});
// Phone: filters live behind this button; its label shows how many are on.
const ft=document.getElementById("ftog"),hdr=document.querySelector("header");
function flabel(){const n=(Object.keys(TR).length-shown.size)+(goodOnly?1:0)+(availOnly?1:0)+(mapSel?1:0);ft.textContent=n?`Filters · ${n}`:"Filters";
  Store.set(FILTERS_KEY,JSON.stringify({hide:Object.keys(TR).filter(t=>!shown.has(t)),good:goodOnly,avail:availOnly,map:mapSel,region}))}
const FILTERS_KEY="speranza-atlas-filters";
// Restore last visit's filters (before the first draw).
try{const f=JSON.parse(Store.get(FILTERS_KEY)||"null");if(f){
  (f.hide||[]).forEach(t=>{if(TR[t])shown.delete(t)});goodOnly=!!f.good;availOnly=!!f.avail;mapSel=RAID_MAPS.includes(f.map)?f.map:null;if(REGION_NAME[f.region])region=f.region;
  tbox.querySelectorAll(".tchip").forEach(b=>b.setAttribute("aria-pressed",shown.has(b.dataset.t)));
  gb.setAttribute("aria-pressed",goodOnly);ab.setAttribute("aria-pressed",availOnly);
  mbox.querySelectorAll(".mchip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.map===mapSel));
  ft.textContent=(()=>{const n=(Object.keys(TR).length-shown.size)+(goodOnly?1:0)+(availOnly?1:0)+(mapSel?1:0);return n?`Filters · ${n}`:"Filters"})()}}catch(e){}
ft.onclick=()=>{const o=!hdr.classList.contains("open");hdr.classList.toggle("open",o);ft.setAttribute("aria-expanded",o)};
const rb=document.getElementById("reset");let armed=null;
rb.onclick=()=>{if(armed){clearTimeout(armed);armed=null;done.clear();save();steps={};saveSteps();rb.textContent="Reset progress";sel?open(sel,true):(draw(),home());return}
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
function pick(k){const x=hits[k];if(!x)return;hideSugg();find.blur();backTo=null;open(x.q,false,x.ri,x.qi)}
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
// Maps named in a quest's name or objectives, in the order they come up, each linked to
// its MetaForge interactive map (URLs checked Oct 18, 2026). No map named → the map index.
const MF="https://metaforge.app/arc-raiders/map";
const MAPS=[["Dam Battlegrounds","dam",/\bDam Battlegrounds\b|\bThe Dam\b/],["Buried City","buried-city",/\bBuried City\b/],
  ["Spaceport","spaceport",/\bSpaceport\b/],["Blue Gate","blue-gate",/\bBlue Gate\b/],["Stella Montis","stella-montis",/\bStella Montis\b/],
  ["Riven Tides","riven-tides",/\bRiven Tides\b/],["Pendola Pass","pendola-pass",/\bPendola Pass\b/]];
function mapsIn(q){const t=[q.n,...q.o].join("\n");return MAPS.map(m=>({m,at:t.search(m[2])})).filter(x=>x.at>=0).sort((a,b)=>a.at-b.at).map(x=>x.m)}
function mapLinks(q){const t=[q.n,...q.o].join("\n");
  const ms=Array.isArray(q.m)?MAPS.filter(m=>q.m.includes(m[0])).map(m=>({m,at:t.search(m[2])})).sort((a,b)=>(a.at<0?1e9:a.at)-(b.at<0?1e9:b.at)).map(x=>x.m):mapsIn(q);
  const note=Array.isArray(q.m)&&!q.m.length?'<p class="note">Can be done on any map.</p>':!Array.isArray(q.m)?`<p class="note" id="livecond">${condQuestNote(q.i)||"Needs a map condition (like the Frigate or a boss event), so check what's active before you queue."}</p>`:"";
  const a=(h,t)=>`<a class="ext" href="${h}" target="_blank" rel="noopener">${t} ↗</a>`;
  return `<div><p class="lbl">Interactive map${ms.length>1?"s":""}</p>${note}<div class="links"${note?' style="margin-top:6px"':""}>${
    ms.length?ms.map(([n,s])=>a(`${MF}/${s}`,n)).join(""):a(MF,"All maps on MetaForge")}</div></div>`}
// hl: reward index to highlight (reward search). hq: bring-item index (needed-for search).
function open(i,keep,hl,hq){sel=i;const q=Q[i],k=TR[q.t];
  const st=done.has(i)?"Done":avail(i)?"Up next":"Locked";
  const anc=[...pending(i)];const focus=hl!=null||hq!=null;
  panel.innerHTML=`
  ${backTo?`<div class="row"><button id="back">← ${backTo==="items"?"Items to keep":"Raid plan: "+esc(mapSel||"")}</button></div>`:""}
  <div class="row"><div class="chips"><span class="chip" style="background:var(--${k}-bg);color:var(--${k}-ink);border-color:var(--${k})">${q.t}</span><span class="chip">${st}</span>${q.one?'<span class="chip">One raid</span>':""}${q.tier==="bp"?'<span class="bdg bp">BP</span>':q.tier==="ep"?'<span class="bdg ep">EPIC</span>':""}</div>
  <button class="close" id="cls">Close</button></div>
  <h2>${esc(q.n)}</h2>
  ${hl!=null&&q.r[hl]?`<p class="note">Reward <strong>${esc(q.r[hl][0])}</strong> comes from this quest.</p>`:""}
  ${hq!=null&&q.q[hq]?`<p class="note">This quest needs <strong>${q.q[hq][1]}× ${esc(q.q[hq][0])}</strong>.</p>`:""}
  ${!done.has(i)?(anc.length?`<details class="path"${hl!=null?" open":""}><summary><strong>${anc.length}</strong> quest${anc.length>1?"s":""} left before this unlocks. The route is highlighted on the map.</summary><ol>${pathOrder(anc).map(a=>`<li><button data-go="${a}">${esc(Q[a].n)}</button> <span class="q">${esc(Q[a].t)}</span></li>`).join("")}</ol></details>`:'<p class="route">Available now.</p>'):""}
  <div><p class="lbl">Objectives${done.has(i)?"":` <span id="stepn">${stepCount(i)}/${q.o.length}</span>`}</p>${done.has(i)?`<ol>${q.o.map(o=>`<li>${esc(o)}</li>`).join("")}</ol>`:`<ol class="steps">${q.o.map((o,x)=>stepLi(i,x)).join("")}</ol><p class="note" id="allsteps"${stepCount(i)===q.o.length?"":" hidden"} style="margin-top:6px">All steps ticked. Tap Mark done once you've turned it in.</p>`}${q.one?'<p class="note" style="margin-top:6px">Everything has to be done in a single raid.</p>':""}</div>
  ${q.q.length?`<div><p class="lbl">Bring</p><ul class="bring">${q.q.map((r,qi)=>`<li${qi===hq?' class="hit"':""}>${r[1]}× ${esc(r[0])}</li>`).join("")}</ul>${!done.has(i)&&backTo!=="items"?'<button class="linkish" id="allitems">All items to keep</button>':""}</div>`:""}
  ${q.g.length?`<div><p class="lbl">Given on accept</p><ul>${q.g.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
  <div><p class="lbl">Rewards</p><ul class="rw">${q.r.map((r,ri)=>`<li${ri===hl?' class="hit"':""}><span class="rar" style="color:var(${RC[r[2]]||"--muted"})">${esc(r[2]||r[3])}</span><span>${esc(r[0])}${r[3]==="Blueprint"?' <span class="bdg bp">BP</span>':""}</span><span class="q">×${r[1]}</span></li>`).join("")}${q.x?`<li><span class="rar" style="color:var(--muted)">XP</span><span class="q">${q.x.toLocaleString()}</span></li>`:""}</ul></div>
  ${q.p.length?`<div><p class="lbl">Requires${q.p.length>1?" (all)":""}</p><div class="links">${btns(q.p)}</div></div>`:""}
  ${q.unl.length?`<div><p class="lbl">Unlocks</p><div class="links">${btns(q.unl)}</div></div>`:""}
  <div class="row"><button class="donebtn" id="tog" aria-pressed="${done.has(i)}">${done.has(i)?"Marked done":"Mark done"}</button>
  ${!done.has(i)&&anc.length?`<button id="here">I'm on this quest</button>`:""}</div>
  ${mapLinks(q)}
  <div class="row"><a class="ext" href="https://arcraiders.wiki/wiki/Special:Search?search=${encodeURIComponent(q.n)}&go=Go" target="_blank" rel="noopener">Wiki page ↗</a></div>
  <p class="note">Items you bring are handed in. Squad progress is shared.</p>`;
  panel.hidden=false;panel.scrollTop=0;document.getElementById("hint").hidden=true;draw();if(!keep)(focus?frameRoute(i,anc):centerOn(i));
  document.getElementById("cls").onclick=()=>{panel.hidden=true;sel=null;backTo=null;draw()};
  const bi=document.getElementById("back");if(bi)bi.onclick=()=>backTo==="items"?openItems():openPlan();
  const ai=document.getElementById("allitems");if(ai)ai.onclick=()=>openItems();
  document.getElementById("tog").onclick=()=>{if(done.has(i))done.delete(i);else{done.add(i);delete steps[i];saveSteps()}save();open(i,true)};
  wireSteps(panel,()=>{const n=stepCount(i),c=document.getElementById("stepn");if(c)c.textContent=`${n}/${q.o.length}`;
    const a=document.getElementById("allsteps");if(a)a.hidden=n!==q.o.length});
  const h=document.getElementById("here");if(h)h.onclick=()=>{ancestors(i).forEach(a=>done.add(a));save();open(i,true)};
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>open(b.dataset.go));
}

if(window.dagre){layout();draw();home();loadConditions();addEventListener("resize",()=>{if(!sel&&!touched)home()});setTimeout(checkShared,0)}
else{document.querySelector(".board").insertAdjacentHTML("beforeend",'<div class="err">The layout library didn\'t load. Reload the page to try again.</div>')}

// About screen: unofficial disclaimer, progress sharing, data version, sources.
document.getElementById("about").onclick=()=>{
  sel=null;backTo=null;draw();
  const D=window.ATLAS_DATA;
  panel.innerHTML=`
  <div class="row"><div class="chips"><span class="chip">About</span></div><button class="close" id="cls">Close</button></div>
  <h2>Speranza Quest Atlas</h2>
  <p class="note"><strong>Unofficial fan-made tool.</strong> Not affiliated with, endorsed by, or sponsored by Embark Studios. Arc Raiders is a trademark of Embark Studios AB.</p>
  <div><p class="lbl">Your progress</p><p class="note">Saved only in this browser. No account, no ads, no tracking. Clearing your browser data resets it. Live map conditions come through this site's server from MetaForge; nothing about you or your progress is sent.</p>
  <div class="row" style="margin-top:8px"><button id="share2">Share progress</button></div><p class="share-msg" id="sharemsg2"></p>
  <p class="note" style="margin-top:6px">Opens on any phone or computer, or send it to your squad.</p>
  <div class="row" style="margin-top:10px"><input type="url" id="plink" placeholder="Paste a progress link" aria-label="Paste a progress link" style="flex:1;min-width:0"><button id="pload">Load</button></div><p class="share-msg" id="ploadmsg"></p></div>
  <div><p class="lbl">Use it like an app</p>${installHelp()}</div>
  <div><p class="lbl">Quest data</p><p class="note">${esc(D.label||"")}${D.label?" · ":""}version ${esc(D.version)} · ${D.quests.length} quests</p></div>
  <div><p class="lbl">Sources</p><p class="note">Quest details compiled from community resources: <a href="https://arcraiders.wiki" target="_blank" rel="noopener">Arc Raiders Wiki</a> and <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener">MetaForge</a>. Live map conditions: MetaForge's event schedule. Spot an error? It may be from an older patch.</p></div>
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
  sel=null;backTo=null;draw();
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
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{backTo="items";open(b.dataset.go)});
}
document.getElementById("items").onclick=openItems;

// ---- Objective steps (shared by the quest drawer and the raid plan) ----
function stepLi(i,x){const on=stepDone(i,x);
  return `<li${on?' class="got"':""}><label class="step"><input type="checkbox" data-q="${i}" data-step="${x}"${on?" checked":""}><span>${esc(Q[i].o[x])}</span></label></li>`}
function wireSteps(root,after){root.querySelectorAll("input[data-step]").forEach(cb=>cb.onchange=()=>{
  setStep(cb.dataset.q,+cb.dataset.step,cb.checked);cb.closest("li").classList.toggle("got",cb.checked);draw();after&&after(cb.dataset.q)})}

// ---- Raid plan: what to do on the picked map ----
// Shows this map's steps for each up-next quest. A step that names a different map
// (and not this one) is hidden and counted as "on other maps".
function stepsHere(i,m){const mine=MAPS.find(x=>x[0]===m),others=MAPS.filter(x=>x[0]!==m);
  return Q[i].o.map((o,x)=>x).filter(x=>{const o=Q[i].o[x];return (mine&&mine[2].test(o))||!others.some(r=>r[2].test(o))})}
function openPlan(){
  if(!mapSel){panel.hidden=true;return}
  const keepScroll=panel.querySelector("#plan")?panel.scrollTop:0;
  sel=null;backTo=null;draw();
  const m=mapSel,up=i=>avail(i);
  const cond=ids.filter(i=>up(i)&&!Array.isArray(Q[i].m)),condHere=cond.filter(i=>liveFor(i,m).length),condElse=cond.filter(i=>!condHere.includes(i));
  const here=[...condHere,...pathOrder(ids.filter(i=>up(i)&&onlyMap(i,m)))],any=pathOrder(ids.filter(i=>up(i)&&anyMap(i)));
  const other=region==="north-america"?"europe":"north-america";
  const card=i=>{const q=Q[i],k=TR[q.t],xs=stepsHere(i,m),hidden=q.o.length-xs.length;
    return `<li class="pq">
      <div class="row"><button class="pqn" data-go="${i}">${esc(q.n)}</button><span class="chip" style="background:var(--${k}-bg);color:var(--${k}-ink);border-color:var(--${k})">${esc(q.t)}</span>${q.one?'<span class="chip">One raid</span>':""}${liveFor(i,m).map(e=>`<span class="chip livechip">${esc(e.name)} until ${tfmt(e.end)}</span>`).join("")}</div>
      <ol class="steps">${xs.map(x=>stepLi(i,x)).join("")}</ol>
      ${hidden?`<p class="note">+${hidden} step${hidden>1?"s":""} on other maps</p>`:""}
      ${q.q.length?`<p class="note"><strong>Bring:</strong> ${q.q.map(r=>`${r[1]}× ${esc(r[0])}`).join(", ")}</p>`:""}
      <div class="row"><button class="donebtn" data-done="${i}" aria-pressed="false">Mark done</button></div></li>`};
  const slug=(MAPS.find(x=>x[0]===m)||[])[1];
  panel.innerHTML=`
  <div class="row" id="plan"><div class="chips"><span class="chip">Raid plan</span></div><button class="close" id="cls">Close</button></div>
  <h2>${esc(m)}</h2>
  <p class="note" id="plannow">${planNowLine(m)}</p>
  <p class="note">${here.length} up-next quest${here.length===1?"":"s"} on this map${any.length?`, plus ${any.length} you can do on any map`:""}. Tick steps as you go.</p>
  ${here.length?`<ul class="plan">${here.map(card).join("")}</ul>`:`<p class="note">Nothing up next is tied to ${esc(m)}. Try another map, or work on the any-map quests below.</p>`}
  ${any.length?`<details class="path anymap"${here.length?"":" open"}><summary>Any map (${any.length})</summary><ul class="plan">${any.map(card).join("")}</ul></details>`:""}
  ${condElse.length?`<p class="note">Needs a map condition: ${condElse.map(i=>{const nx=COND?COND.events.find(e=>condsOf(i).includes(e.name)&&e.start>Date.now()):null;
      return `<button class="linkish inl" data-go="${i}">${esc(Q[i].n)}</button>${nx?` (next: ${esc(nx.name)} on ${esc(nx.map)} ${tfmt(nx.start)})`:""}`}).join(", ")}.</p>`:""}
  ${slug?`<div class="row"><a class="ext" href="${MF}/${slug}" target="_blank" rel="noopener">${esc(m)} map ↗</a></div>`:""}
  <p class="note">Map conditions for ${REGION_NAME[region]}, from <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener">MetaForge</a>. <button class="linkish inl" id="regionsw">Switch to ${REGION_NAME[other]}</button></p>`;
  panel.hidden=false;document.getElementById("hint").hidden=true;panel.scrollTop=keepScroll;
  document.getElementById("cls").onclick=()=>{panel.hidden=true};
  wireSteps(panel);
  panel.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{backTo="plan";open(b.dataset.go)});
  panel.querySelectorAll("[data-done]").forEach(b=>b.onclick=()=>{const i=b.dataset.done;done.add(i);delete steps[i];saveSteps();save();openPlan()});
  document.getElementById("regionsw").onclick=()=>{region=other;flabel();COND=null;condErr=false;openPlan();loadConditions()};
}

// "/" jumps to search (desktop), unless you're already typing somewhere.
addEventListener("keydown",e=>{if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target;
  if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable))return;e.preventDefault();find.focus();find.select()});
