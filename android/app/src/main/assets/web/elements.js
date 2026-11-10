// The five elements and OM: their vowel, chakra, colour (MANTRA_MANIFEST chakra-colors.md, Marko 10.11.2026: only
// Earth has a true colour, gold; Water is reflection, Fire is energy, Air is connection, none of them a hue; the throat
// is every colour; OM is pure violet) and a symbolic drawing. `line` is the philosophy, one sentence.
// draw(ctx, w, h, t, a): a.faint = the stripe background (no audio, very faint); otherwise the full-screen view,
// a.level 0..1 and a.bins (frequency bytes) from the analyser. Everything is drawn in the element's colour.
const RAINBOW = ["#C8102E","#FF8A2B","#E9C84A","#2FB45A","#38B6EC","#5AA2F0","#9F7AE0"];

function rgba(hex, al){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${al})`; }
function rainbowAt(x){ // x 0..1 around the circle → a colour of the throat's rainbow
  const k=((x%1)+1)%1*RAINBOW.length; return RAINBOW[Math.floor(k)%RAINBOW.length]; }

// a ring of frequency bars around the centre: the shared heartbeat of every full-screen element
function ring(ctx, cx, cy, r, a, colorAt, t){
  if(!a.bins) return;
  const n=96, step=Math.floor(a.bins.length*0.6/n)||1;
  ctx.lineWidth=Math.max(2,r*0.018); ctx.lineCap="round";
  for(let i=0;i<n;i++){
    const v=a.bins[i*step]/255, ang=i/n*Math.PI*2+t*0.05;
    const r2=r+v*r*0.55;
    ctx.strokeStyle=colorAt(i/n,0.25+v*0.6);
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r); ctx.lineTo(cx+Math.cos(ang)*r2,cy+Math.sin(ang)*r2); ctx.stroke();
  }
}

const ELEMENTS = [
 { id:"earth", vowel:"A", name:"Earth", chakra:"Grounding · gold", color:"#D4AF37", title:"Earth · A · the root",
   line:"Grounding. The gold of living matter: the body, our work, the joy of being here.",
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h/2, base=Math.min(w,h)*(a.faint?0.9:0.32), al=a.faint?0.10:0.8, L=a.level||0;
     ctx.lineWidth=a.faint?1.2:2;
     for(let k=0;k<(a.faint?5:7);k++){ // nested squares, the earth's own shape, breathing slowly
       const s=base*(0.35+k*0.13)*(1+0.03*Math.sin(t*0.5+k)+L*0.12), rot=(k%2?1:-1)*t*0.02+Math.PI/4*(k%2);
       ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
       ctx.strokeStyle=rgba(this.color,al*(1-k*0.1)); ctx.strokeRect(-s/2,-s/2,s,s); ctx.restore();
     }
     if(!a.faint){ ring(ctx,cx,cy,base*0.62,a,(x,o)=>rgba(this.color,o),t);
       for(let i=0;i<40;i++){ const y=((i*97+t*12)%h), x=(i*233)%w; ctx.fillStyle=rgba(this.color,0.25); ctx.fillRect(x,h-y,2,2); } }
   }},
 { id:"water", vowel:"U", name:"Water", chakra:"Creativity · reflection", color:"#DCE6EA", nohue:true, title:"Water · U · below the navel",
   line:"Creativity. Creative energy takes the shape of what holds it, the mood within us; without ground it has nowhere to land.",
   draw(ctx,w,h,t,a){
     const L=a.level||0, lines=a.faint?6:14, al=a.faint?0.09:0.55;
     ctx.lineWidth=a.faint?1.2:1.8;
     for(let k=0;k<lines;k++){ // waves, no edges
       const y0=h*(0.15+0.7*k/(lines-1)), amp=(a.faint?h*0.05:h*0.025)*(1+L*3)*(0.6+0.4*Math.sin(k));
       ctx.strokeStyle=rgba(this.color,al*(0.5+0.5*Math.sin(k*0.7+t*0.3)));
       ctx.beginPath();
       for(let x=0;x<=w;x+=8){ const y=y0+Math.sin(x/w*Math.PI*2*1.5+t*0.6+k*0.8)*amp+Math.sin(x/w*9+t*0.9)*amp*0.25; x?ctx.lineTo(x,y):ctx.moveTo(x,y); }
       ctx.stroke();
     }
     if(!a.faint){ const cx=w/2, cy=h/2, r=Math.min(w,h)*0.18; // the crescent of the sacral chakra
       ctx.strokeStyle=rgba(this.color,0.7); ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r*(1+L*0.3),0.15*Math.PI,0.85*Math.PI); ctx.stroke();
       ring(ctx,cx,cy,r*1.5,a,(x,o)=>rgba(this.color,o*0.8),t); }
   }},
 { id:"fire", vowel:"I", name:"Fire", chakra:"Strength · pure energy", color:"#FFF1D8", nohue:true, title:"Fire · I · the navel",
   line:"Strength. The pure energy of the body, kindled to do the work the vision asks for.",
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h*(a.faint?0.5:0.52), s=Math.min(w,h)*(a.faint?0.75:0.42), L=a.level||0, al=a.faint?0.13:0.85;
     ctx.lineWidth=a.faint?1.4:3; // the downward triangle of the navel chakra
     for(let k=0;k<(a.faint?2:4);k++){ const q=s*(1-k*0.18)*(1+L*0.15+0.02*Math.sin(t*1.3+k));
       ctx.strokeStyle=rgba(this.color,al*(1-k*0.2)); ctx.beginPath();
       ctx.moveTo(cx-q/2,cy-q*0.29); ctx.lineTo(cx+q/2,cy-q*0.29); ctx.lineTo(cx,cy+q*0.58); ctx.closePath(); ctx.stroke(); }
     const n=a.faint?24:120; // rising sparks
     for(let i=0;i<n;i++){ const sp=0.3+((i*37)%10)/10, life=((t*sp*0.25+i*0.137)%1);
       const x=cx+Math.sin(i*12.9+t*0.7)*s*0.6*(1-life), y=h*(1-life)-(a.faint?0:L*40);
       ctx.fillStyle=rgba(i%3?this.color:"#FFFFFF",(a.faint?0.12:0.6)*(1-life)); ctx.beginPath(); ctx.arc(x,y,(a.faint?1.5:2.5+L*4)*(1-life),0,7); ctx.fill(); }
     if(!a.faint) ring(ctx,cx,cy,s*0.36,a,(x,o)=>rgba(this.color,o),t);
   }},
 { id:"air", vowel:"O", name:"Air", chakra:"Connection · beyond sight", color:"#EEF4F1", nohue:true, title:"Air · O · the heart",
   line:"Connection. Beyond sight we feel one another; all work ends in serving each other's growth.",
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h/2, r=Math.min(w,h)*(a.faint?0.42:0.26)*(1+(a.level||0)*0.2), al=a.faint?0.11:0.8;
     ctx.lineWidth=a.faint?1.2:2.5; ctx.strokeStyle=rgba(this.color,al);
     for(const off of [0,Math.PI]){ ctx.beginPath(); // two triangles: the six-pointed star of the heart
       for(let i=0;i<3;i++){ const g=off-Math.PI/2+i*Math.PI*2/3+t*0.03; const x=cx+Math.cos(g)*r, y=cy+Math.sin(g)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.closePath(); ctx.stroke(); }
     const n=a.faint?5:12; // drifting breaths of wind
     for(let k=0;k<n;k++){ ctx.strokeStyle=rgba(this.color,(a.faint?0.07:0.3)); ctx.beginPath();
       for(let x=0;x<=w;x+=10){ const y=h*(k+0.5)/n+Math.sin(x/w*4+t*0.4+k)*h*0.03+Math.cos(x/w*2-t*0.25+k*2)*h*0.02; x?ctx.lineTo(x,y):ctx.moveTo(x,y);} ctx.stroke(); }
     if(!a.faint) ring(ctx,cx,cy,r*1.15,a,(x,o)=>rgba(this.color,o),t);
   }},
 { id:"ether", vowel:"A-U-I-O", name:"Ether", chakra:"Expression · every colour", color:"#5AA2F0", rainbow:true, title:"Ether · A-U-I-O · the throat",
   line:"Expression. Your truth in every colour: simple enough for a child, deep enough for a philosopher.",
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h/2, r=Math.min(w,h)*(a.faint?0.40:0.24)*(1+(a.level||0)*0.2), al=a.faint?0.13:0.8;
     ctx.lineWidth=a.faint?1.3:2.5; // the sixteen petals of the throat, every colour, turning slowly
     for(let i=0;i<16;i++){ const g=i/16*Math.PI*2+t*0.04;
       ctx.strokeStyle=rgba(rainbowAt(i/16+t*0.01),al);
       ctx.beginPath(); ctx.ellipse(cx+Math.cos(g)*r*0.62,cy+Math.sin(g)*r*0.62,r*0.38,r*0.12,g,0,Math.PI*2); ctx.stroke(); }
     ctx.strokeStyle=rgba("#FFFFFF",a.faint?0.08:0.4); ctx.beginPath(); ctx.arc(cx,cy,r*0.25,0,7); ctx.stroke();
     if(!a.faint) ring(ctx,cx,cy,r*1.12,a,(x,o)=>rgba(rainbowAt(x+t*0.02),o),t);
   }},
 { id:"aum", vowel:"OM", name:"Vision", chakra:"Third eye · violet", color:"#7F00FF", title:"OM · the third eye",
   line:"Vision. The creative seeing from which everything begins.",
   // rung 6 of the DJ Mantra toning ladder (djmantra.pages.dev): OM, from yoga; pure violet, vision (Marko 10.11.2026)
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h/2, r=Math.min(w,h)*(a.faint?0.30:0.20)*(1+(a.level||0)*0.2), al=a.faint?0.10:0.75;
     ctx.lineWidth=a.faint?1.2:2.5; ctx.strokeStyle=rgba(this.color,al);
     ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();               // the circle of the third eye
     for(const s of [-1,1]){ ctx.beginPath();                                      // its two petals, left and right
       ctx.ellipse(cx+s*r*1.55,cy,r*0.62,r*0.36*(1+0.05*Math.sin(t*0.4)),0,0,Math.PI*2); ctx.stroke(); }
     ctx.fillStyle=rgba(this.color,a.faint?0.12:0.8); ctx.beginPath(); ctx.arc(cx,cy,r*0.12*(1+(a.level||0)),0,Math.PI*2); ctx.fill(); // the point
     if(!a.faint) ring(ctx,cx,cy,r*1.25,a,(x,o)=>rgba(this.color,o*0.7),t);
   }},
];

// ---------------------------------------------------------------- THE CHAKRA SYMBOLS behind the stripes
// Marko 10.11.2026: "find the chakra's symbols, put them behind in better quality". Drawn as pure geometry after the
// yantras of the Sat-chakra-nirupana (Arthur Avalon / John Woodroffe, The Serpent Power, 1919): Muladhara 4 petals and
// the square of earth; Svadhisthana 6 petals and the crescent moon of water; Manipura 10 petals and the triangle of fire
// (pointing down in the chakra yantra; the tattva card of Tejas points up); Anahata 12 petals and the six-pointed star of
// air; Vishuddha 16 petals and the full moon of space in a triangle; Ajna 2 petals and the syllable OM.
// Fine lines, a soft glow, a slow breath and turn; sharp at any size (the canvas is drawn at the screen's pixel density).
const YANTRA={ earth:{petals:4}, water:{petals:6}, fire:{petals:10}, air:{petals:12}, ether:{petals:16}, aum:{petals:2} };
function yantra(ctx, el, W, H, t){
  const k=W/ctx.canvas.clientWidth||1, cx=W*0.80, cy=H*0.5, R=Math.min(H*0.40, W*0.18)*(1+0.025*Math.sin(t*0.5));
  const col=el.id==="aum"?"#B58CF0":(el.rainbow?"#FFFFFF":el.color), lw=1.3*k, rot=t*0.02;
  const P=YANTRA[el.id]; if(!P) return;
  ctx.save(); ctx.translate(cx,cy); ctx.lineWidth=lw; ctx.lineJoin="round"; ctx.shadowBlur=9*k;
  const stroke=(c,a)=>{ ctx.strokeStyle=rgba(c,a); ctx.shadowColor=rgba(c,a*0.9); };
  // no petals (Marko 10.11.2026: "remove petals. Keep only symbols inside the petals"): the symbol alone
  const r0=R*0.92;
  // the yantra of the element inside
  const r=r0*0.86; stroke(el.rainbow?"#FFFFFF":col, 0.55); ctx.beginPath();
  const tri=(rr,down)=>{ for(let i=0;i<3;i++){ const a=(down?Math.PI/2:-Math.PI/2)+i*Math.PI*2/3; i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } ctx.closePath(); };
  if(el.id==="earth"){ const s=r*0.70; ctx.rect(-s,-s,2*s,2*s); ctx.stroke(); ctx.beginPath(); tri(s*0.62,true); ctx.stroke(); }
  else if(el.id==="water"){ ctx.arc(0,0,r*0.82,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); // the crescent, horns up
    ctx.arc(0,r*0.12,r*0.5,0.12*Math.PI,0.88*Math.PI); ctx.arc(0,-r*0.05,r*0.42,0.82*Math.PI,0.18*Math.PI,true); ctx.closePath(); ctx.stroke(); }
  else if(el.id==="fire"){ tri(r*0.92,true); ctx.stroke(); }
  else if(el.id==="air"){ tri(r*0.9,false); ctx.stroke(); ctx.beginPath(); tri(r*0.9,true); ctx.stroke(); }
  else if(el.id==="ether"){ tri(r*0.95,true); ctx.stroke(); ctx.beginPath(); ctx.arc(0,r*0.08,r*0.36,0,Math.PI*2); ctx.stroke(); }
  else if(el.id==="aum"){ ctx.arc(0,0,r*0.78,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=12*k; ctx.fillStyle=rgba("#D9C4FF",0.55); ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.font=`${Math.round(r*0.95)}px "Noto Sans Devanagari", sans-serif`; ctx.fillText("ॐ",0,r*0.04); }
  ctx.restore();
}

// ---------------------------------------------------------------- MIST (Marko 10.11.2026: "dark mode black with faint
// white kind of clouds or mist over it"): water, fire and air live on black; they differ by motion, not brightness.
// water drifts sideways like a reflection, fire rises, air turns slowly around.
const MIST_SEEDS=[...Array(9)].map((_,i)=>({x:((i*0.379)%1), y:((i*0.613+0.2)%1), r:0.35+((i*0.271)%1)*0.45, s:0.6+((i*0.457)%1)*0.8}));
function mist(ctx, W, H, t, kind, strength){
  ctx.save(); ctx.globalCompositeOperation="lighter";
  MIST_SEEDS.forEach((m,i)=>{
    let x=m.x, y=m.y;
    if(kind==="water"){ x=(m.x + t*0.012*m.s)%1.3-0.15; y=m.y+0.03*Math.sin(t*0.3+i); }
    else if(kind==="fire"){ y=1.2-((m.y + t*0.015*m.s)%1.4); x=m.x+0.04*Math.sin(t*0.5+i); }
    else { const a=t*0.03*m.s+i; x=0.5+Math.cos(a)*0.35*m.r*1.6; y=0.5+Math.sin(a)*0.3*m.r*1.6; }
    const R=Math.max(W,H)*m.r*0.5, g=ctx.createRadialGradient(x*W,y*H,0,x*W,y*H,R);
    const al=strength*(0.55+0.45*Math.sin(t*0.2+i*1.7));
    g.addColorStop(0,`rgba(255,255,255,${al.toFixed(3)})`); g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  });
  ctx.restore();
}
