// Chakra and Elements Toning (Mantra): the interface. The sound is native (Native.*, PlaybackService); the page plays a
// silent mirror of the same file only to feed the visuals (butterchurn and the element drawings), kept in step with the
// native position.
"use strict";
const N = window.Native || { // a stub so the page also opens in a desktop browser
  play(){}, pause(){}, resume(){}, stop(){}, seek(){}, setTimer(){}, bell(){}, immersive(){}, keepAwake(){}, openUrl(u){ window.open(u); },
  state(){ return JSON.stringify({id:"",playing:false,pos:0,dur:0,timerLeft:0}); }, version(){ return "dev"; } };
const RELEASES = "https://github.com/markoboskoauroville/CHAKRA_ELEMENTS_TONING/releases/latest";
const $ = s => document.querySelector(s);
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
                set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const fmt = ms => { const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };

// ---------------------------------------------------------------- screens
let current = "home";
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("on", s.id===id)); current=id; }

// ---------------------------------------------------------------- the silent mirror
const mirror = {
  ctx:null, el:null, src:null, analyser:null, id:"", urls:{},
  ensure(){
    if(this.ctx) { if(this.ctx.state==="suspended") this.ctx.resume(); return; }
    this.ctx = new (window.AudioContext||window.webkitAudioContext)();
    this.el = new Audio(); this.el.preload="auto";
    this.src = this.ctx.createMediaElementSource(this.el);
    this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 1024; this.analyser.smoothingTimeConstant = 0.8;
    const mute = this.ctx.createGain(); mute.gain.value = 0;      // the phone hears the native player only
    this.src.connect(this.analyser); this.src.connect(mute); mute.connect(this.ctx.destination);
  },
  async load(id, loop){
    this.ensure(); this.id = id;
    const file = id==="guide" ? "audio/guide.mp3" : `audio/${id}.ogg`;
    if(!this.urls[id]){ const r = await fetch(file); this.urls[id] = URL.createObjectURL(await r.blob()); } // a blob seeks freely
    if(this.id!==id) return;
    this.el.loop = loop; this.el.src = this.urls[id]; this.el.currentTime = 0;
    try { await this.el.play(); } catch(e) {}
  },
  stop(){ this.id=""; if(this.el){ this.el.pause(); } },
  bins:new Uint8Array(512), wave:new Uint8Array(1024),
  read(){ if(!this.analyser) return {level:0,bins:null};
    this.analyser.getByteFrequencyData(this.bins); this.analyser.getByteTimeDomainData(this.wave);
    let s=0; for(let i=0;i<this.wave.length;i+=4){ const v=(this.wave[i]-128)/128; s+=v*v; }
    return { level: Math.min(1, Math.sqrt(s/(this.wave.length/4))*3), bins:this.bins }; }
};

// ---------------------------------------------------------------- state from the native player, the log
let st = {id:"",playing:false,pos:0,dur:0,timerLeft:0};
let session = null; // {mode, seconds}
function startSession(mode){ endSession(); session = {mode, seconds:0}; }
function endSession(){
  if(session && session.seconds >= 60){
    const log = store.get("log", []);
    log.push({ d: new Date().toISOString().slice(0,10), m: session.mode, s: Math.round(session.seconds) });
    store.set("log", log.slice(-1000));
  }
  session = null; renderStreak();
}
setInterval(()=>{
  try { st = JSON.parse(N.state()); } catch(e) {}
  if(session && (st.playing || session.mode==="breath" && breath.running)) session.seconds += 0.5;
  const el = mirror.el;
  if(el && mirror.id && st.id===mirror.id){
    if(st.playing && el.paused) el.play().catch(()=>{});
    if(!st.playing && !el.paused) el.pause();
    const want = st.pos/1000;
    if(st.playing && isFinite(el.duration) && Math.abs(el.currentTime-want) > 0.3 && want < el.duration) el.currentTime = want;
  }
  if(current==="guide") guideUi();
}, 500);
document.addEventListener("visibilitychange", ()=>{ if(document.hidden && mirror.el) mirror.el.pause(); });

function dayKey(d){ return d.toISOString().slice(0,10); }
function renderStreak(){
  const log = store.get("log", []);
  const days = new Set(log.map(x=>x.d));
  let streak=0; const d=new Date();
  if(!days.has(dayKey(d))) d.setDate(d.getDate()-1);
  while(days.has(dayKey(d))){ streak++; d.setDate(d.getDate()-1); }
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-6);
  const week = log.filter(x=>x.d>=dayKey(weekAgo)).reduce((a,x)=>a+x.s,0);
  $("#streak").textContent = log.length===0 ? "Your first session waits. A few minutes is enough."
    : `${streak} ${streak===1?"day":"days"} in a row · ${Math.round(week/60)} min this week`;
}

// ---------------------------------------------------------------- timer
let timerMin = store.get("timer", 10);
function renderTimer(){ document.querySelectorAll("#timerChoice button").forEach(b=>b.classList.toggle("sel", +b.dataset.min===timerMin)); }
document.querySelectorAll("#timerChoice button").forEach(b=>b.onclick=()=>{ timerMin=+b.dataset.min; store.set("timer",timerMin); renderTimer(); });

// ---------------------------------------------------------------- GUIDE: MilkDrop
const BC = window.butterchurn && (window.butterchurn.default || window.butterchurn);
const BP = window.butterchurnPresets && (window.butterchurnPresets.default || window.butterchurnPresets);
const ALL = BP ? BP.getPresets() : {};
const CALM = [ // calm presets with friendly names first; every other preset under "All"
  ["Mandala","Phat+fiShbRaiN+Eo.S_Mandala_Chasers_remix"],
  ["Lotus","Aderrasi - Songflower (Moss Posy)"],
  ["Stained glass","Eo.S. + Zylot - skylight (Stained Glass Majesty mix)"],
  ["Angel flight","martin - angel flight"],
  ["Castle in the air","martin - castle in the air"],
  ["Spiral","Flexi - infused with the spiral"],
  ["Mother of pearl","cope + martin - mother-of-pearl"],
  ["Star ornament","Zylot - Star Ornament"],
  ["Nebula","TonyMilkdrop - Magellan's Nebula [Flexi - you enter first + multiverse]"],
  ["Frosty caves","martin - frosty caves 2"],
  ["Potion of spirits","Aderrasi - Potion of Spirits"],
  ["Sunflower","suksma - Rovastar - Sunflower Passion (Enlightment Mix)_Phat_edit + flexi und martin shaders - circumflex in character classes in regular expression"],
].filter(([,k])=>ALL[k]);
const calmKeys = new Set(CALM.map(x=>x[1]));
const STYLES = CALM.map(([n,k])=>({name:n,key:k,calm:true}))
  .concat(Object.keys(ALL).filter(k=>!calmKeys.has(k)).map(k=>({name:k,key:k,calm:false})));
let styleIx = Math.min(store.get("style",0), Math.max(0,STYLES.length-1));
let viz=null, vizRaf=0, autoTimer=0, overlayTimer=0;

function sizeMilk(){
  const c=$("#milk"), w=c.clientWidth, h=c.clientHeight, k=Math.min(1, window.devicePixelRatio||1)*0.8;
  c.width=Math.round(w*k); c.height=Math.round(h*k);
  if(viz) viz.setRendererSize(c.width, c.height);
}
function setStyle(ix, blend){
  if(!STYLES.length) return;
  styleIx = (ix+STYLES.length)%STYLES.length; store.set("style", styleIx);
  if(viz) viz.loadPreset(ALL[STYLES[styleIx].key], blend==null?3:blend);
  $("#presetName").textContent = STYLES[styleIx].name;
  renderStyleList();
}
function renderStyleList(){
  const L=$("#styleList"); L.innerHTML="";
  const add=(txt)=>{ const g=document.createElement("div"); g.className="group"; g.textContent=txt; L.appendChild(g); };
  add("Calm"); STYLES.forEach((s,i)=>{ if(i===CALM.length) add("All MilkDrop presets");
    const b=document.createElement("button"); b.textContent=s.name; if(i===styleIx) b.className="sel";
    b.onclick=()=>{ setStyle(i,2); $("#styleSheet").classList.remove("on"); }; L.appendChild(b); });
}
function autoStyles(){ clearInterval(autoTimer); if($("#autoStyle").checked) autoTimer=setInterval(()=>setStyle(styleIx+1,6), 40000); }
function pokeOverlay(){ const o=$("#guideOverlay"); o.classList.remove("hide"); clearTimeout(overlayTimer);
  overlayTimer=setTimeout(()=>{ if(st.playing && !$("#styleSheet").classList.contains("on")) o.classList.add("hide"); }, 5000); }

async function openGuide(){
  mirror.ensure(); show("guide"); N.immersive(true); N.keepAwake(true);
  sizeMilk();
  if(!viz && BC){ const c=$("#milk");
    viz = BC.createVisualizer(mirror.ctx, c, {width:c.width, height:c.height, pixelRatio:1, textureRatio:1});
    viz.connectAudio(mirror.src); }
  setStyle(styleIx, 0); autoStyles();
  N.play("guide", false, "Chakra toning · the guide"); N.setTimer(timerMin);
  startSession("guide");
  mirror.load("guide", false);
  cancelAnimationFrame(vizRaf); const loop=()=>{ if(current!=="guide") return; if(viz) viz.render(); vizRaf=requestAnimationFrame(loop); }; loop();
  pokeOverlay();
}
function closeGuide(){ N.stop(1500); N.setTimer(0); mirror.stop(); clearInterval(autoTimer); endSession();
  N.immersive(false); N.keepAwake(false); $("#styleSheet").classList.remove("on"); show("home"); }
function guideUi(){
  $("#guidePlay").textContent = st.playing ? "Pause" : "Play";
  $("#guideTime").textContent = fmt(st.pos); $("#guideDur").textContent = fmt(st.dur);
  $("#guideBar").style.width = st.dur ? (100*st.pos/st.dur)+"%" : "0";
  $("#guideTimer").textContent = st.timerLeft>0 ? "◷ "+fmt(st.timerLeft) : (timerMin? "◷ off" : "");
}
$("#guidePlay").onclick=()=>{ pokeOverlay();
  if(st.playing) N.pause(); else if(st.id==="guide") N.resume(); else { N.play("guide",false,"Chakra toning · the guide"); N.setTimer(timerMin); mirror.load("guide",false); } };
$("#guideProgress").onclick=e=>{ const r=e.currentTarget.getBoundingClientRect(); N.seek((e.clientX-r.left)/r.width*st.dur); pokeOverlay(); };
$("#milk").onclick=pokeOverlay;
$("#stylePrev").onclick=()=>{ setStyle(styleIx-1,2); pokeOverlay(); };
$("#styleOpen").onclick=()=>{ $("#styleSheet").classList.add("on"); pokeOverlay(); const s=$("#styleList .sel"); if(s) s.scrollIntoView({block:"center"}); };
$("#styleClose").onclick=()=>$("#styleSheet").classList.remove("on");
$("#autoStyle").onchange=()=>{ store.set("auto",$("#autoStyle").checked); autoStyles(); };
$("#autoStyle").checked = store.get("auto", true);
$("#guideClose").onclick=closeGuide;
$("#guideTimer").onclick=()=>{ // one tap cycles the timer of this session
  const opts=[0,5,10,20,30,45]; timerMin=opts[(opts.indexOf(timerMin)+1)%opts.length]; store.set("timer",timerMin); renderTimer();
  N.setTimer(timerMin); pokeOverlay(); };

// ---------------------------------------------------------------- ELEMENTS: the stripes (five elements and AUM)
const stripeCanvases=[]; let stripesRaf=0;
function buildStripes(){
  const box=$("#stripes"); box.innerHTML="";
  ELEMENTS.forEach(el=>{
    const d=document.createElement("button"); d.className="stripe"; d.setAttribute("aria-label", el.name);
    d.style.background = el.rainbow
      ? "linear-gradient(90deg,rgba(200,16,46,.22),rgba(255,138,43,.22),rgba(233,200,74,.22),rgba(47,180,90,.22),rgba(56,182,236,.22),rgba(90,162,240,.22),rgba(159,122,224,.22))"
      : el.nohue   // no hue of their own (Marko 10.11.2026): water a reflection, fire a light, air a haze
        ? ({water:"linear-gradient(180deg,rgba(220,230,234,.13),rgba(220,230,234,.03) 55%,rgba(220,230,234,.10))",
            fire:"radial-gradient(ellipse at 50% 120%,rgba(255,241,216,.20),rgba(255,241,216,.02) 70%)",
            air:"radial-gradient(ellipse at 50% 50%,rgba(238,244,241,.12),rgba(238,244,241,.02) 75%)"})[el.id]
        : rgba(el.color, 0.22);
    const c=document.createElement("canvas"); d.appendChild(c);
    const lab=document.createElement("div"); lab.className="sLabel";
    lab.innerHTML=`<span class="vowel"></span><span class="name"></span>`;
    lab.querySelector(".vowel").textContent=el.vowel;
    lab.querySelector(".vowel").style.color = el.rainbow ? "#FFFFFF" : el.color;
    lab.querySelector(".name").innerHTML = `${el.name}<small>${el.chakra}</small>`;
    d.appendChild(lab); d.onclick=()=>openElement(el);
    box.appendChild(d); stripeCanvases.push({c,el});
  });
}
function openElements(){ show("elements"); N.immersive(false);
  stripeCanvases.forEach(({c})=>{ c.width=c.clientWidth; c.height=c.clientHeight; });
  cancelAnimationFrame(stripesRaf); const t0=performance.now();
  const loop=now=>{ if(current!=="elements") return; const t=(now-t0)/1000;
    stripeCanvases.forEach(({c,el})=>{ const x=c.getContext("2d"); x.clearRect(0,0,c.width,c.height); el.draw(x,c.width,c.height,t,{faint:true,level:0.08+0.05*Math.sin(t*0.6)}); });
    stripesRaf=requestAnimationFrame(loop); };
  stripesRaf=requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- ONE ELEMENT, full screen, looping
let openEl=null, elRaf=0, elLabelTimer=0;
function openElement(el){
  mirror.ensure(); openEl=el; show("element"); N.immersive(true); N.keepAwake(true);
  const c=$("#elCanvas"); const k=Math.min(2, window.devicePixelRatio||1); c.width=c.clientWidth*k; c.height=c.clientHeight*k;
  const x=c.getContext("2d"); x.fillStyle="#000"; x.fillRect(0,0,c.width,c.height);
  N.play(el.id, true, el.title); N.setTimer(timerMin); startSession(el.id); mirror.load(el.id, true);
  const lab=$("#elLabel"); lab.innerHTML = `${el.name} · sing ${el.vowel}<small>${el.line}</small><small>tap to return</small>`; lab.classList.remove("hide");
  clearTimeout(elLabelTimer); elLabelTimer=setTimeout(()=>lab.classList.add("hide"), 7000);
  cancelAnimationFrame(elRaf); const t0=performance.now();
  const loop=now=>{ if(current!=="element") return; const t=(now-t0)/1000, a=mirror.read();
    x.fillStyle="rgba(0,0,0,0.16)"; x.fillRect(0,0,c.width,c.height);   // soft trails
    x.save(); x.globalCompositeOperation = el.rainbow ? "lighter" : "source-over"; // "lighter" turned crimson pink (v1 on the emulator); one colour stays itself
    el.draw(x,c.width,c.height,t,{faint:false,level:a.level,bins:a.bins}); x.restore();
    elRaf=requestAnimationFrame(loop); };
  elRaf=requestAnimationFrame(loop);
}
function closeElement(){ N.stop(2500); N.setTimer(0); mirror.stop(); endSession(); N.keepAwake(false); openEl=null; openElements(); }
$("#element").onclick=closeElement;
$("#elementsClose").onclick=()=>show("home");

// ---------------------------------------------------------------- BREATH
const breath = { running:false, p:store.get("breathP","4,0,6,0"), t0:0, raf:0 };
function renderBreathChoice(){ document.querySelectorAll("#breathChoice button").forEach(b=>b.classList.toggle("sel", b.dataset.p===breath.p)); }
document.querySelectorAll("#breathChoice button").forEach(b=>b.onclick=()=>{ breath.p=b.dataset.p; store.set("breathP",breath.p); renderBreathChoice(); if(breath.running){ breath.t0=performance.now(); } });
function breathLoop(now){
  if(current!=="breath" || !breath.running) return;
  const [i,h1,o,h2]=breath.p.split(",").map(Number), cyc=i+h1+o+h2, t=((now-breath.t0)/1000)%cyc;
  let s, w;
  if(t<i){ s=0.55+0.45*Math.sin(t/i*Math.PI/2); w="Breathe in"; }
  else if(t<i+h1){ s=1; w="Hold"; }
  else if(t<i+h1+o){ s=0.55+0.45*Math.cos((t-i-h1)/o*Math.PI/2); w="Breathe out"; }
  else { s=0.55; w="Hold"; }
  $("#breathCircle").style.transform=`scale(${s})`; $("#breathWord").textContent=w;
  $("#breathClock").textContent=fmt(now-breath.t0);
  breath.raf=requestAnimationFrame(breathLoop);
}
$("#breath .breathStage").onclick=()=>{
  if(breath.running){ breath.running=false; endSession(); N.keepAwake(false); $("#breathWord").textContent="Tap to begin"; $("#breathCircle").style.transform="scale(.55)"; return; }
  breath.running=true; breath.t0=performance.now(); startSession("breath"); N.keepAwake(true); breath.raf=requestAnimationFrame(breathLoop); };
function closeBreath(){ if(breath.running){ breath.running=false; endSession(); N.keepAwake(false); } show("home"); }
$("#breathClose").onclick=closeBreath;

// ---------------------------------------------------------------- SETTINGS / ABOUT
const MODE_NAMES={guide:"Guide",breath:"Breath",earth:"Earth",water:"Water",fire:"Fire",air:"Air",ether:"Ether"};
function openSettings(){
  const log=store.get("log",[]); const total=log.reduce((a,x)=>a+x.s,0);
  $("#logSummary").textContent = log.length ? `${log.length} sessions, ${Math.round(total/60)} minutes in all.` : "No sessions yet. Every session of a minute or more is written here, on this phone only.";
  const L=$("#logList"); L.innerHTML="";
  log.slice(-60).reverse().forEach(x=>{ const r=document.createElement("div"); r.innerHTML="<span></span><span></span>";
    r.children[0].textContent=`${x.d.split("-").reverse().map(Number).join(".")}  ${MODE_NAMES[x.m]||x.m}`; r.children[1].textContent=`${Math.round(x.s/60)} min`; L.appendChild(r); });
  show("settings");
}
$("#version").textContent = "v"+N.version();
$("#version").onclick=()=>N.openUrl(RELEASES);
$("#settingsClose").onclick=()=>show("home");

// ---------------------------------------------------------------- home, back
$("#toGuide").onclick=openGuide;
$("#toElements").onclick=openElements;
$("#toOrder").onclick=()=>show("order");
$("#orderClose").onclick=()=>show("home");
document.querySelectorAll("#pagoda .floor").forEach(g=>g.addEventListener("click",()=>{ const el=ELEMENTS.find(e=>e.id===g.dataset.el); if(el){ openElement(el); } }));
$("#toBreath").onclick=()=>{ show("breath"); renderBreathChoice(); };
$("#toSettings").onclick=openSettings;
window.appBack=()=>{
  if($("#styleSheet").classList.contains("on")){ $("#styleSheet").classList.remove("on"); return true; }
  if(current==="guide"){ closeGuide(); return true; }
  if(current==="element"){ closeElement(); return true; }
  if(current==="breath"){ closeBreath(); return true; }
  if(current==="order"){ show("home"); return true; }
  if(current!=="home"){ show("home"); return true; }
  return false;
};
window.addEventListener("resize", ()=>{ if(current==="guide") sizeMilk(); });
buildStripes(); renderTimer(); renderStreak();
