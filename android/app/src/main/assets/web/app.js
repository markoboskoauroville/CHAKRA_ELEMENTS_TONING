// Mantra Room (Mantra Meditation Room): the interface. The sound is native (Native.*, PlaybackService); the page plays a
// silent mirror of the same file only to feed the visuals (butterchurn and the element drawings), kept in step with the
// native position.
"use strict";
const N = window.Native || { // a stub so the page also opens in a desktop browser
  play(){}, pause(){}, resume(){}, stop(){}, seek(){}, setTimer(){}, bell(){}, immersive(){}, keepAwake(){}, openUrl(u){ window.open(u); },
  display(){ return "{}"; }, state(){ return JSON.stringify({id:"",playing:false,pos:0,dur:0,timerLeft:0}); }, version(){ return "dev"; } };
const RELEASES = "https://github.com/markoboskoauroville/MANTRA_ROOM/releases/latest";
const $ = s => document.querySelector(s);
const store = { get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
                set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const fmt = ms => { const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };

// ---------------------------------------------------------------- screens
let current = "elements";
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
// the throat, then OM), then back to the start screen. Visuals: the MilkDrop screen.
// two styles per sound: "voice" = Mantra Voice (his strong toning voice), "raga" = Indian Raga (the long Suno songs)
const HAS_RAGA=new Set(["earth","water","fire","air","ether"]);
const songId=(id,style)=>`${id}-${style||(HAS_RAGA.has(id)?"raga":"voice")}`;
const JOURNEY=[["guide","The guide"],["earth","Earth · A"],["water","Water · U"],["fire","Fire · I"],["air","Air · O"],["ether","Ether · A-U-I-O"],["aum","OM"]];
const journey={on:false, ix:0, t0:0};
function journeyPlay(ix){
  journey.ix=ix; journey.t0=Date.now();
  let [id,name]=JOURNEY[ix]; if(id!=="guide") id=songId(id);
  N.play(id, false, id==="guide" ? "Chakra toning · the guide" : name); mirror.load(id, false);
  $("#presetName").textContent = `${ix+1} / ${JOURNEY.length} · ${name}`;
}
function journeyTick(){
  let [id]=JOURNEY[journey.ix]; if(id!=="guide") id=songId(id);
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
  const wasJourney=journey.on; journey.on=false; if(wasJourney || backTo==="start") openElements(); else show("home"); }
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

// ---------------------------------------------------------------- ELEMENTS: the stripes (five elements and OM)
const stripeCanvases=[]; let stripesRaf=0;
function buildStripes(){
  const box=$("#stripes"); box.innerHTML="";
  ELEMENTS.forEach(el=>{
    // one stripe = two halves with no gap: Mantra Voice (left) and Indian Raga (right); the chakra symbol, without
    // petals, sits exactly on the seam between them (Marko 10.11.2026), everything centred
    const d=document.createElement("div"); d.className="stripe";
    d.style.background = el.rainbow
      ? "linear-gradient(90deg,rgba(200,16,46,.22),rgba(255,138,43,.22),rgba(233,200,74,.22),rgba(47,180,90,.22),rgba(56,182,236,.22),rgba(90,162,240,.22),rgba(159,122,224,.22))"
      : el.nohue ? "#000" : rgba(el.color, 0.22);
    const c=document.createElement("canvas"); d.appendChild(c);
    [["voice","Mantra Voice"],["raga","Indian Raga"]].forEach(([style,cap])=>{
      const h=document.createElement("button"); h.className="half "+style;
      const ok = style==="voice" || HAS_RAGA.has(el.id);
      h.setAttribute("aria-label", `${el.name} ${cap}`+(ok?"":" (not recorded yet)"));
      h.innerHTML=`<span class="vowel"></span><span class="cap"></span>`;
      h.querySelector(".vowel").textContent=el.vowel;
      h.querySelector(".vowel").style.color = el.rainbow ? "#FFFFFF" : el.color;
      h.querySelector(".cap").textContent = ok ? cap : cap+" · soon";
      if(ok) h.onclick=()=>openElement(el,style); else h.classList.add("soon");
      d.appendChild(h);
    });
    box.appendChild(d); stripeCanvases.push({c,el});
  });
}
function openElements(){ show("elements"); N.immersive(false);
  const dpr=Math.min(3, window.devicePixelRatio||1);
  stripeCanvases.forEach(({c})=>{ c.width=Math.round(c.clientWidth*dpr); c.height=Math.round(c.clientHeight*dpr); });
  cancelAnimationFrame(stripesRaf); const t0=performance.now();
  const loop=now=>{ if(current!=="elements") return; const t=(now-t0)/1000;
    stripeCanvases.forEach(({c,el})=>{ const x=c.getContext("2d"); x.clearRect(0,0,c.width,c.height); if(el.nohue) mist(x,c.width,c.height,t,el.id,0.05); yantra(x,el,c.width,c.height,t); });
    stripesRaf=requestAnimationFrame(loop); };
  stripesRaf=requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- ONE ELEMENT, full screen, looping
let openEl=null, elRaf=0, elLabelTimer=0;
function openElement(el, style){
  style = style || (HAS_RAGA.has(el.id)?"raga":"voice"); const sid=songId(el.id,style);
  mirror.ensure(); openEl=el; show("element"); N.immersive(true); N.keepAwake(true);
  const c=$("#elCanvas"); const k=Math.min(2, window.devicePixelRatio||1); c.width=c.clientWidth*k; c.height=c.clientHeight*k;
  N.play(sid, true, el.title+(style==="raga"?" · Indian Raga":" · Mantra Voice")); N.setTimer(timerMin); startSession(el.id); mirror.load(sid, true);
  const lab=$("#elLabel"); lab.innerHTML = `Sing ${el.vowel} with the melody<small>tap to return</small>`; lab.classList.remove("hide");
  clearTimeout(elLabelTimer); elLabelTimer=setTimeout(()=>lab.classList.add("hide"), 7000);
  // ONE design for every sound (Marko 10.11.2026): a dark glowing ball, the colour in the centre fading to black at the
  // edges; only its BRIGHTNESS breathes, between 0% and PULSE_MAX, very slowly (pranayama tempo); the hue never changes.
  // The rainbow is a radial gradient: the root colour in the centre, the rest as rings outward. Drawn by a fragment
  // shader on the GPU (WebGL), time and brightness are uniforms; temporal dithering keeps the 0-20% range free of steps.
  cancelAnimationFrame(elRaf); const t0=performance.now();
  ballGL=ballGL||new BallGL(c, 0.48, 0.62); ballGL.set(el);
  fps.reset();
  const loop=now=>{ if(current!=="element") return; const t=(now-t0)/1000;
    ballGL.draw(breathLevel(t)*PULSE_MAX, t); fps.tick(now);
    elRaf=requestAnimationFrame(loop); };
  elRaf=requestAnimationFrame(loop);
}
let ballGL=null;
// measured frames per second, shown for a few seconds under the label and written to the log (adb logcat, "MRFPS")
const fps={n:0,t:0,v:0,reset(){this.n=0;this.t=0;this.v=0;},
  tick(now){ if(!this.t) this.t=now; this.n++; if(now-this.t>=1000){ this.v=Math.round(this.n*1000/(now-this.t)); this.n=0; this.t=now;
    let d={}; try{ d=JSON.parse(N.display()); }catch(e){}
    const txt=`${this.v} fps · display ${(d.rates||[]).join("/")} Hz, asked ${d.chosen||"?"} Hz · ${d.model||""}`;
    const el=$("#fpsLine"); if(el) el.textContent=txt; console.log("MRFPS "+txt); } } };
class BallGL{
  constructor(canvas, cy, rad){
    this.c=canvas; const gl=this.gl=canvas.getContext("webgl",{antialias:false,alpha:false,preserveDrawingBuffer:false}); this.cy=cy; this.rad=rad;
    const vs="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs=`precision highp float;
uniform vec2 res; uniform float lvl; uniform float time; uniform vec3 col; uniform float rainbow; uniform vec3 rb[7]; uniform float cy; uniform float rad;
float hash(vec2 q){ return fract(sin(dot(q,vec2(12.9898,78.233))+time*1.7)*43758.5453); }
void main(){
  vec2 f=gl_FragCoord.xy; f.y=res.y-f.y;
  float d=length(f-vec2(res.x*.5,res.y*cy))/(max(res.x,res.y)*rad);
  vec3 c;
  if(rainbow>.5){
    float k=clamp(d/.85,0.,1.)*6.; int i=int(floor(min(k,5.999))); float m=smoothstep(0.,1.,fract(min(k,5.999)));
    vec3 a=rb[0],b=rb[1]; for(int j=0;j<6;j++){ if(j==i){ a=rb[j]; b=rb[j+1]; } }
    c=mix(a,b,m)*smoothstep(1.,.85,d);
  } else {
    float w = d<.35 ? mix(1.,.55,d/.35) : d<.7 ? mix(.55,.12,(d-.35)/.35) : mix(.12,0.,clamp((d-.7)/.3,0.,1.));
    c=col*w;
  }
  c=pow(max(c*lvl,0.),vec3(1./2.2)); // lvl is LIGHT (0..20% of full light); the screen shows it gamma-encoded, dark but visible
  c+= (hash(f)+hash(f+7.3)-1.)/255.;
  gl_FragColor=vec4(max(c,0.),1.);
}`;
    const mk=(t,src)=>{ const sh=gl.createShader(t); gl.shaderSource(sh,src); gl.compileShader(sh); return sh; };
    const pr=this.pr=gl.createProgram(); gl.attachShader(pr,mk(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr); gl.useProgram(pr);
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,"p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.u=n=>gl.getUniformLocation(pr,n);
    const rgb=h=>{ const n=parseInt(h.slice(1),16); return [(n>>16)/255,((n>>8)&255)/255,(n&255)/255]; };
    this.rgb=rgb; gl.uniform3fv(this.u("rb[0]"),new Float32Array(RAINBOW7.flatMap(rgb)));
    gl.uniform1f(this.u("cy"),cy); gl.uniform1f(this.u("rad"),rad);
    this.uRes=this.u("res"); this.uLvl=this.u("lvl"); this.uTime=this.u("time");
  }
  set(el){ const gl=this.gl; gl.uniform3fv(this.u("col"),this.rgb(el.ball||el.color)); gl.uniform1f(this.u("rainbow"),el.rainbow?1:0); }
  draw(lvl,t){ const gl=this.gl; gl.viewport(0,0,this.c.width,this.c.height); gl.uniform2f(this.uRes,this.c.width,this.c.height); gl.uniform1f(this.uLvl,lvl); gl.uniform1f(this.uTime,t%1000); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); }
}
// breathing light: in 6 s, hold 2 s, out 6 s, hold 2 s (a 16 s cycle), eased; returns 0..1
const PULSE_MAX=0.20, BREATH_IN=6, BREATH_HOLD=2, BREATH_OUT=6;
function breathLevel(t){
  const T=BREATH_IN+BREATH_HOLD+BREATH_OUT+BREATH_HOLD, u=t%T, ease=v=>0.5-0.5*Math.cos(Math.PI*v);
  if(u<BREATH_IN) return ease(u/BREATH_IN);
  if(u<BREATH_IN+BREATH_HOLD) return 1;
  if(u<BREATH_IN+BREATH_HOLD+BREATH_OUT) return 1-ease((u-BREATH_IN-BREATH_HOLD)/BREATH_OUT);
  return 0;
}
// the colour at brightness f (0..1 of full), hue unchanged
function dim(hex,f){ const n=parseInt(hex.slice(1),16); return `rgb(${Math.round((n>>16)*f)},${Math.round(((n>>8)&255)*f)},${Math.round((n&255)*f)})`; }
// ---------------------------------------------------------------- ROOM LIGHTS (mock-up, no Bluetooth)
let roomEl=ELEMENTS[0], roomOn=false, roomRaf=0;
const ROOM_LIGHTS=["Aputure 1 · north wall","Aputure 2 · east wall","Aputure 3 · south wall","Aputure 4 · west wall"];
let roomGL=null;
function renderRoom(){
  $("#roomState").textContent = roomOn ? "Connected (mock-up): 4 lights follow the preview" : "Not connected";
  $("#roomConnect .cardTitle").textContent = roomOn ? "Disconnect" : "Connect to the room";
  $("#roomLights").innerHTML = roomOn ? ROOM_LIGHTS.map(n=>`<button class="sel">${n}</button>`).join("") : "";
  const rs=$("#roomSounds"); rs.innerHTML="";
  ELEMENTS.forEach(el=>{ const b=document.createElement("button"); b.textContent=el.vowel; if(el===roomEl) b.className="sel"; b.onclick=()=>{ roomEl=el; renderRoom(); }; rs.appendChild(b); });
}
function openRoom(){ show("room"); renderRoom(); cancelAnimationFrame(roomRaf); const t0=performance.now();
  const cv=$("#roomBall"); cv.width=300; cv.height=300; let shown=null;
  const loop=now=>{ if(current!=="room") return; if(!roomGL) roomGL=new BallGL(cv,0.5,0.62); if(shown!==roomEl){ roomGL.set(roomEl); shown=roomEl; }
    roomGL.draw(breathLevel((now-t0)/1000)*PULSE_MAX,(now-t0)/1000); roomRaf=requestAnimationFrame(loop); };
  roomRaf=requestAnimationFrame(loop); }
$("#toRoom").onclick=openRoom; $("#roomClose").onclick=()=>show("home");
$("#roomConnect").onclick=()=>{ roomOn=!roomOn; renderRoom(); };

function closeElement(){ N.stop(2500); N.setTimer(0); mirror.stop(); endSession(); N.keepAwake(false); openEl=null; openElements(); }
$("#element").onclick=closeElement;


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
// The ball takes the logotype's colours, violet, white and gold (Marko 10.11.2026), in a different mix for each pattern:
// [heart, middle, edge] of its glow. Grey when small, the glow grows in with the in-breath.
const V="#8B2BFF", W="#D8D2E2", G="#D4AF37";   // the white is a soft mist white, never glaring
const BREATH_COLOR={coherent:[W,"#E7D6FF",V], box:[G,W,G], "478":[V,"#E7D6FF",W], sama:[W,"#F2E6C2",G], ujjayi:[G,W,V],
  nadi:[W,W,"#B17DFF"], bhramari:[G,"#F2E6C2",W], kapal:[G,G,"#B17DFF"], custom:[V,W,G]};
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
  const [c1,c2,c3]=BREATH_COLOR[breath.id]||[W,W,V];
  $("#breathGlow").style.background=`radial-gradient(circle,${c1}99,${c2}70 38%,${c3}55 58%,${c3}12 70%,transparent 74%)`;
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
const MODE_NAMES={journey:"Journey",aum:"OM",guide:"Guide",breath:"Breath",earth:"Earth",water:"Water",fire:"Fire",air:"Air",ether:"Ether"};
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
$("#philoClose").onclick=()=>show("edu");
$("#timerClose").onclick=()=>show("home");

// ---------------------------------------------------------------- home, back
$("#toModules").onclick=()=>show("home");
$("#exploreClose").onclick=openElements;
$("#toJourney").onclick=startJourney;
$("#toGuide").onclick=()=>{ backTo="home"; openGuide(false); };
$("#toPhilo").onclick=()=>show("philo");
$("#toEdu").onclick=()=>show("edu");
$("#eduClose").onclick=()=>show("home");
$("#toTimer").onclick=()=>{ renderTimer(); show("timer"); };
$("#toJournal").onclick=openSettings;
$("#toElements").onclick=openElements;
$("#toOrder").onclick=()=>show("order");
$("#orderClose").onclick=()=>show("edu");
document.querySelectorAll("#pagoda .floor").forEach(g=>g.addEventListener("click",()=>{ const el=ELEMENTS.find(e=>e.id===g.dataset.el); if(el){ openElement(el); } }));
$("#toBreath").onclick=()=>{ show("breath"); renderBreathChoice(); };
$("#toSettings").onclick=()=>{ $("#version").textContent="v"+N.version(); show("settings"); };
window.appBack=()=>{
  if($("#styleSheet").classList.contains("on")){ $("#styleSheet").classList.remove("on"); return true; }
  if(current==="guide"){ closeGuide(); return true; }
  if(current==="element"){ closeElement(); return true; }
  if(current==="breath"){ closeBreath(); return true; }
  if(current==="order"||current==="philo"){ show("edu"); return true; }
  if(current==="home"){ openElements(); return true; }
  if(current!=="elements"){ show("home"); return true; }
  return false;
};
window.addEventListener("resize", ()=>{ if(current==="guide") sizeMilk(); });
buildStripes(); renderTimer(); renderStreak(); openElements();
rainbowRow($("#timerChoice"),"button");
