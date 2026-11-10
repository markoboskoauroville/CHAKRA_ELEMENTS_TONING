// The five elements: their vowel, chakra, colour (MANTRA_MANIFEST chakra-colors.md) and a symbolic drawing.
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
 { id:"earth", vowel:"A", name:"Earth", chakra:"Root · grounding", color:"#D4AF37", title:"Earth · A · the root",
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
 { id:"water", vowel:"U", name:"Water", chakra:"Sacral · creativity", color:"#F3EEE2", title:"Water · U · below the navel",
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
 { id:"fire", vowel:"I", name:"Fire", chakra:"Navel · energy", color:"#C8102E", title:"Fire · I · the navel",
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h*(a.faint?0.5:0.52), s=Math.min(w,h)*(a.faint?0.75:0.42), L=a.level||0, al=a.faint?0.13:0.85;
     ctx.lineWidth=a.faint?1.4:3; // the downward triangle of the navel chakra
     for(let k=0;k<(a.faint?2:4);k++){ const q=s*(1-k*0.18)*(1+L*0.15+0.02*Math.sin(t*1.3+k));
       ctx.strokeStyle=rgba(this.color,al*(1-k*0.2)); ctx.beginPath();
       ctx.moveTo(cx-q/2,cy-q*0.29); ctx.lineTo(cx+q/2,cy-q*0.29); ctx.lineTo(cx,cy+q*0.58); ctx.closePath(); ctx.stroke(); }
     const n=a.faint?24:120; // rising sparks
     for(let i=0;i<n;i++){ const sp=0.3+((i*37)%10)/10, life=((t*sp*0.25+i*0.137)%1);
       const x=cx+Math.sin(i*12.9+t*0.7)*s*0.6*(1-life), y=h*(1-life)-(a.faint?0:L*40);
       ctx.fillStyle=rgba(i%3?this.color:"#FF8A2B",(a.faint?0.12:0.6)*(1-life)); ctx.beginPath(); ctx.arc(x,y,(a.faint?1.5:2.5+L*4)*(1-life),0,7); ctx.fill(); }
     if(!a.faint) ring(ctx,cx,cy,s*0.36,a,(x,o)=>rgba(this.color,o),t);
   }},
 { id:"air", vowel:"O", name:"Air", chakra:"Heart · love", color:"#2FB45A", title:"Air · O · the heart",
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
 { id:"ether", vowel:"A-U-I-O", name:"Ether", chakra:"Throat · truth", color:"#5AA2F0", rainbow:true, title:"Ether · A-U-I-O · the throat",
   draw(ctx,w,h,t,a){
     const cx=w/2, cy=h/2, r=Math.min(w,h)*(a.faint?0.40:0.24)*(1+(a.level||0)*0.2), al=a.faint?0.13:0.8;
     ctx.lineWidth=a.faint?1.3:2.5; // the sixteen petals of the throat, every colour, turning slowly
     for(let i=0;i<16;i++){ const g=i/16*Math.PI*2+t*0.04;
       ctx.strokeStyle=rgba(rainbowAt(i/16+t*0.01),al);
       ctx.beginPath(); ctx.ellipse(cx+Math.cos(g)*r*0.62,cy+Math.sin(g)*r*0.62,r*0.38,r*0.12,g,0,Math.PI*2); ctx.stroke(); }
     ctx.strokeStyle=rgba("#FFFFFF",a.faint?0.08:0.4); ctx.beginPath(); ctx.arc(cx,cy,r*0.25,0,7); ctx.stroke();
     if(!a.faint) ring(ctx,cx,cy,r*1.12,a,(x,o)=>rgba(rainbowAt(x+t*0.02),o),t);
   }},
];
