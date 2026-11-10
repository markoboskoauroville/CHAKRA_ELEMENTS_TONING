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
let current = "start";
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
  if(journey.on) journeyTick();
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

// ---------------------------------------------------------------- THE JOURNEY (Play on the start screen)
// The guide that explains everything, then each element song once, in the natural order (earth at the bottom up to
// the throat, then Om), then back to the start screen. Visuals: the MilkDrop screen.
const JOURNEY=[["guide","The guide"],["earth","Earth · A"],["water","Water · U"],["fire","Fire · I"],["air","Air · O"],["ether","Ether · A-U-I-O"],["aum","Om · AUM"]];
const journey={on:false, ix:0, t0:0};
function journeyPlay(ix){
  journey.ix=ix; journey.t0=Date.now();
  const [id,name]=JOURNEY[ix];
  N.play(id, false, id==="guide" ? "Chakra toning · the guide" : name); mirror.load(id, false);
  $("#presetName").textContent = `${ix+1} / ${JOURNEY.length} · ${name}`;
}
function journeyTick(){
  const [id]=JOURNEY[journey.ix];
  if(Date.now()-journey.t0 < 4000 || st.id!==id || st.playing || !st.dur) return;
  if(st.pos < st.dur-1500) return;                       // paused by hand or by the timer: wait
  if(journey.ix+1 < JOURNEY.length) journeyPlay(journey.ix+1); else endJourney();
}
function startJourney(){ journey.on=true; openGuide(true); journeyPlay(0); }
function endJourney(){ journey.on=false; closeGuide(); }

// The rainbow, left to right: every row of labels takes these colours in order (Marko 10.11.2026).
const RAINBOW7=["#E8364F","#FF8A2B","#E9C84A","#2FB45A","#38B6EC","#7B6CF0","#B58CF0"];
function rainbowRow(container, selector){ [...container.querySelectorAll(selector)].forEach((b,i)=>{ b.style.color=RAINBOW7[i%7]; }); }

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
  if(!journey.on) $("#presetName").textContent = STYLES[styleIx].name;
  renderStyleList(); renderVizBar();
}
function renderVizBar(){
  const L=$("#vizList"); if(!L) return;
  if(!L.childElementCount){ CALM.forEach(([n],i)=>{ const b=document.createElement("button"); b.textContent=n; b.onclick=()=>{ setStyle(i,2); pokeOverlay(); }; L.appendChild(b); });
    rainbowRow(L,"button"); }
  [...L.children].forEach((b,i)=>b.classList.toggle("sel", i===styleIx));
  const sel=L.children[styleIx]; if(sel) sel.scrollIntoView({inline:"center",block:"nearest"});
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

async function openGuide(forJourney){
  mirror.ensure(); show("guide"); N.immersive(true); N.keepAwake(true);
  sizeMilk();
  if(!viz && BC){ const c=$("#milk");
    viz = BC.createVisualizer(mirror.ctx, c, {width:c.width, height:c.height, pixelRatio:1, textureRatio:1});
    viz.connectAudio(mirror.src); }
  setStyle(styleIx, 0); autoStyles();
  if(!forJourney){ journey.on=false; N.play("guide", false, "Chakra toning · the guide"); mirror.load("guide", false); }
  N.setTimer(timerMin); startSession(forJourney ? "journey" : "guide");
  cancelAnimationFrame(vizRaf); const loop=()=>{ if(current!=="guide") return; if(viz) viz.render(); vizRaf=requestAnimationFrame(loop); }; loop();
  pokeOverlay();
}
function closeGuide(){ if(journey.on) backTo="start"; N.stop(1500); N.setTimer(0); mirror.stop(); clearInterval(autoTimer); endSession();
  N.immersive(false); N.keepAwake(false); $("#styleSheet").classList.remove("on");
  const wasJourney=journey.on; journey.on=false; show(wasJourney || backTo==="start" ? "start" : "home"); }
let backTo="home";
function guideUi(){
  $("#guidePlay").textContent = st.playing ? "Pause" : "Play";
  $("#guideTime").textContent = fmt(st.pos); $("#guideDur").textContent = fmt(st.dur);
  $("#guideBar").style.width = st.dur ? (100*st.pos/st.dur)+"%" : "0";
  $("#guideTimer").textContent = st.timerLeft>0 ? "◷ "+fmt(st.timerLeft) : (timerMin? "◷ off" : "");
}
$("#guidePlay").onclick=()=>{ pokeOverlay();
  if(st.playing) N.pause(); else if(st.id && st.id===mirror.id) N.resume();
  else if(journey.on) journeyPlay(journey.ix); else { N.play("guide",false,"Chakra toning · the guide"); N.setTimer(timerMin); mirror.load("guide",false); } };
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
  // the element's own colour (or light) fills the screen, and breathes a little with the voice; nothing else
  const BG={earth:["#D4AF37","#8A6E16"], water:["#E9EFF2","#7E8C93"], fire:["#FFF6E6","#E8C890"], air:["#F2F6F4","#AEB8B3"], aum:["#8B2BFF","#3A0070"]};
  cancelAnimationFrame(elRaf); const t0=performance.now(); let lv=0;
  const loop=now=>{ if(current!=="element") return; const t=(now-t0)/1000, a=mirror.read(); lv=lv*0.9+a.level*0.1;
    const W=c.width, H=c.height;
    if(el.rainbow){ const g=x.createLinearGradient(0,0,0,H); RAINBOW7.forEach((col,i)=>g.addColorStop(i/6,col)); x.fillStyle=g; x.fillRect(0,0,W,H); }
    else { const [c1,c2]=BG[el.id]||["#333","#111"]; const r=Math.max(W,H)*(0.55+0.08*Math.sin(t*0.4)+lv*0.25);
      const g=x.createRadialGradient(W/2,H*0.48,0,W/2,H*0.48,r); g.addColorStop(0,c1); g.addColorStop(1,c2); x.fillStyle=g; x.fillRect(0,0,W,H);
      if(el.id==="water"){ x.fillStyle=`rgba(255,255,255,${0.10+lv*0.2})`; for(let k=0;k<6;k++){ x.fillRect(0,H*(0.2+k*0.12)+Math.sin(t*0.6+k)*8,W,2); } } }
    elRaf=requestAnimationFrame(loop); };
  elRaf=requestAnimationFrame(loop);
}
function closeElement(){ N.stop(2500); N.setTimer(0); mirror.stop(); endSession(); N.keepAwake(false); openEl=null; openElements(); }
$("#element").onclick=closeElement;
$("#elementsClose").onclick=()=>show("home");

// ---------------------------------------------------------------- BREATH
// Patterns: [in, hold, out, hold] in seconds (sources in TAKEOVER "Breath patterns"). kind: pranayama or modern.
const PATTERNS=[
 {id:"coherent", name:"Coherent", t:[5.5,0,5.5,0], kind:"modern", info:"Resonance breathing, about 5.5 breaths a minute. Calm, even, no holds."},
 {id:"box", name:"Box", t:[4,4,4,4], kind:"modern", info:"Four equal sides: in, hold, out, hold."},
 {id:"478", name:"4·7·8", t:[4,7,8,0], kind:"modern", info:"In through the nose 4, hold 7, out through the mouth 8. Four rounds to begin."},
 {id:"sama", name:"Sama Vritti", t:[4,0,4,0], kind:"pranayama", info:"Equal breath: the inhale as long as the exhale."},
 {id:"ujjayi", name:"Ujjayi", t:[4,0,6,0], kind:"pranayama", info:"Ocean breath: a soft sound in the throat, the exhale longer than the inhale."},
 {id:"nadi", name:"Nadi Shodhana", t:[4,0,4,0], kind:"pranayama", sides:true, info:"Alternate nostril: in left, out right, in right, out left. Thumb and ring finger close the sides."},
 {id:"bhramari", name:"Bhramari", t:[4,0,8,0], kind:"pranayama", hum:true, info:"Bee breath: in through the nose, out with a soft humming, lips closed."},
 {id:"kapal", name:"Kapalabhati", t:[0.4,0,0.6,0], kind:"pranayama", rounds:30, info:"Skull-shining breath: short active exhales, passive inhales, 30 strokes, then rest. Not in pregnancy, with high blood pressure, heart or eye conditions, or after surgery; stop if dizzy."},
 {id:"custom", name:"Custom", t:null, kind:"yours", info:"Your own timing: in, hold, out, hold."},
];
const BREATH_COLOR={coherent:"#8EC9FF",box:"#D4AF37","478":"#9F7AE0",sama:"#FFF1D8",ujjayi:"#5AA2F0",nadi:"#C9D6FF",bhramari:"#FF8A2B",kapal:"#FF5A3C",custom:"#7F00FF"};
const breath = { running:false, id:store.get("breathId","coherent"), custom:store.get("breathCustom",[4,2,6,2]), t0:0, raf:0, cue:store.get("breathCue",false), lastPhase:-1, bellDone:false };
function patNow(){ const P=PATTERNS.find(p=>p.id===breath.id)||PATTERNS[0]; return {...P, t: P.id==="custom" ? breath.custom.map(Number) : P.t}; }
function renderBreathChoice(){
  const L=$("#patternList");
  if(!L.childElementCount) PATTERNS.forEach(P=>{ const b=document.createElement("button"); b.dataset.id=P.id;
    const tt=P.t?P.t.filter((x,i)=>x||i%2===0).join("·"):"in · hold · out · hold";
    b.innerHTML=`${P.name}<small>${P.id==="kapal"?"30 strokes, then rest":tt} · ${P.kind}</small>`;
    b.onclick=()=>{ breath.id=P.id; store.set("breathId",P.id); renderBreathChoice(); if(breath.running){ breath.t0=performance.now(); breath.lastPhase=-1; } }; L.appendChild(b); });
  L.querySelectorAll("button").forEach(b=>b.classList.toggle("sel", b.dataset.id===breath.id));
  rainbowRow(L,"button");
  $("#customRow").classList.toggle("hide", breath.id!=="custom");
  ["cIn","cH1","cOut","cH2"].forEach((k,i)=>{ const e=$("#"+k); e.value=breath.custom[i]; e.onchange=()=>{ breath.custom[i]=Math.max(i%2?0:1, +e.value||0); store.set("breathCustom",breath.custom); }; });
  $("#breathInfo").textContent=patNow().info;
  const c=BREATH_COLOR[breath.id]||"#FFFFFF"; $("#breathGlow").style.background=`radial-gradient(circle,${c}cc,${c}55 45%,${c}10 70%,transparent 74%)`;
  $("#breathCue").classList.toggle("on", breath.cue);
}
$("#breathCue").onclick=()=>{ breath.cue=!breath.cue; store.set("breathCue",breath.cue); renderBreathChoice(); };
let cueCtx=null;
function cue(freq){ // a soft, short sine tone at each new phase, only when asked for
  if(!breath.cue) return;
  try{ cueCtx=cueCtx||new (window.AudioContext||window.webkitAudioContext)(); const o=cueCtx.createOscillator(), g=cueCtx.createGain(), n=cueCtx.currentTime;
    o.frequency.value=freq; g.gain.setValueAtTime(0,n); g.gain.linearRampToValueAtTime(0.08,n+0.05); g.gain.exponentialRampToValueAtTime(0.0001,n+0.9);
    o.connect(g); g.connect(cueCtx.destination); o.start(n); o.stop(n+1); }catch(e){}
}
const NADI=["left","right","right","left"];
function breathLoop(now){
  if(current!=="breath" || !breath.running) return;
  const P=patNow(), [i,h1,o,h2]=P.t, cyc=i+h1+o+h2, el=(now-breath.t0)/1000;
  let s, w, left, ph;
  if(P.rounds){ // Kapalabhati: 30 strokes, then 30 s of natural breath
    const work=P.rounds*cyc, round=work+30, tr=el%round;
    if(tr<work){ const k=Math.floor(tr/cyc), t=tr%cyc; ph=t<i?0:2; s=ph===0?0.62:0.5; w=ph===0?"In":"Out, sharp"; left=P.rounds-k; }
    else { ph=4; s=0.5+0.06*Math.sin(tr); w="Rest, breathe freely"; left=Math.ceil(round-tr); }
  } else {
    const t=el%cyc, k=Math.floor(el/cyc);
    if(t<i){ ph=0; s=0.5+0.5*Math.sin(t/i*Math.PI/2); w="Breathe in"; left=Math.ceil(i-t); }
    else if(t<i+h1){ ph=1; s=1; w="Hold"; left=Math.ceil(i+h1-t); }
    else if(t<i+h1+o){ ph=2; s=0.5+0.5*Math.cos((t-i-h1)/o*Math.PI/2); w=P.hum?"Breathe out, humming":"Breathe out"; left=Math.ceil(i+h1+o-t); }
    else { ph=3; s=0.5; w="Hold"; left=Math.ceil(cyc-t); }
    if(P.sides && ph!==1 && ph!==3){ w += " · " + NADI[(k%2)*2 + (ph===0?0:1)]; }
  }
  if(ph!==breath.lastPhase){ breath.lastPhase=ph; if(!P.rounds) cue([396,0,264,0,330][ph]||0); }
  $("#breathCircle").style.transform=`scale(${s})`; $("#breathWord").textContent=w;
  const g=$("#breathGlow"); g.style.transform=`scale(${s})`; g.style.opacity=Math.max(0,(s-0.5)/0.5).toFixed(3);
  $("#breathNum").textContent = P.rounds ? (ph===4?left:left) : left;
  $("#breathClock").textContent = timerMin ? `${fmt(now-breath.t0)} / ${timerMin}:00` : fmt(now-breath.t0);
  if(timerMin && !breath.bellDone && el>=timerMin*60){ breath.bellDone=true; N.bell(); stopBreath(); return; }
  breath.raf=requestAnimationFrame(breathLoop);
}
function stopBreath(){ breath.running=false; endSession(); N.keepAwake(false); $("#breathGlow").style.opacity=0; $("#breathWord").textContent="Tap to begin"; $("#breathNum").textContent=""; $("#breathCircle").style.transform="scale(.5)"; }
$("#breath .breathStage").onclick=()=>{
  if(breath.running){ stopBreath(); return; }
  breath.running=true; breath.bellDone=false; breath.lastPhase=-1; breath.t0=performance.now(); startSession("breath"); N.keepAwake(true); breath.raf=requestAnimationFrame(breathLoop); };
function closeBreath(){ if(breath.running){ stopBreath(); } show("home"); }
$("#breathClose").onclick=closeBreath;

// ---------------------------------------------------------------- SETTINGS / ABOUT
const MODE_NAMES={journey:"Journey",aum:"Om",guide:"Guide",breath:"Breath",earth:"Earth",water:"Water",fire:"Fire",air:"Air",ether:"Ether"};
function openSettings(){
  const log=store.get("log",[]); const total=log.reduce((a,x)=>a+x.s,0);
  $("#logSummary").textContent = log.length ? `${log.length} sessions, ${Math.round(total/60)} minutes in all.` : "No sessions yet. Every session of a minute or more is written here, on this phone only.";
  const L=$("#logList"); L.innerHTML="";
  log.slice(-60).reverse().forEach(x=>{ const r=document.createElement("div"); r.innerHTML="<span></span><span></span>";
    r.children[0].textContent=`${x.d.split("-").reverse().map(Number).join(".")}  ${MODE_NAMES[x.m]||x.m}`; r.children[1].textContent=`${Math.round(x.s/60)} min`; L.appendChild(r); });
  show("journal"); renderStreak();
}
$("#version").textContent = "v"+N.version();
$("#version").onclick=()=>N.openUrl(RELEASES);
$("#settingsClose").onclick=()=>show("home");
$("#journalClose").onclick=()=>show("home");
$("#philoClose").onclick=()=>show("home");
$("#timerClose").onclick=()=>show("home");

// ---------------------------------------------------------------- home, back
$("#startPlay").onclick=startJourney;
$("#toExplore").onclick=()=>show("home");
$("#exploreClose").onclick=()=>show("start");
$("#toGuide").onclick=()=>{ backTo="home"; openGuide(false); };
$("#toPhilo").onclick=()=>show("philo");
$("#toTimer").onclick=()=>{ renderTimer(); show("timer"); };
$("#toJournal").onclick=openSettings;
$("#toElements").onclick=openElements;
$("#toOrder").onclick=()=>show("order");
$("#orderClose").onclick=()=>show("home");
document.querySelectorAll("#pagoda .floor").forEach(g=>g.addEventListener("click",()=>{ const el=ELEMENTS.find(e=>e.id===g.dataset.el); if(el){ openElement(el); } }));
$("#toBreath").onclick=()=>{ show("breath"); renderBreathChoice(); };
$("#toSettings").onclick=()=>{ $("#version").textContent="v"+N.version(); show("settings"); };
window.appBack=()=>{
  if($("#styleSheet").classList.contains("on")){ $("#styleSheet").classList.remove("on"); return true; }
  if(current==="guide"){ closeGuide(); return true; }
  if(current==="element"){ closeElement(); return true; }
  if(current==="breath"){ closeBreath(); return true; }
  if(current==="order"){ show("home"); return true; }
  if(current==="home"){ show("start"); return true; }
  if(current!=="start"){ show("home"); return true; }
  return false;
};
window.addEventListener("resize", ()=>{ if(current==="guide") sizeMilk(); });
buildStripes(); renderTimer(); renderStreak();
rainbowRow($("#timerChoice"),"button");
