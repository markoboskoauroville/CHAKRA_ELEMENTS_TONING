# The app's icon (Marko 10.11.2026): the first screen, the six stripes, cut in a circle. Gold earth, water, fire and air
# on black with a faint mist (each a slightly different dark), the throat's rainbow, violet OM. Writes:
#   brand/icon.svg (site logo and SVG favicon), site favicons (PNG, ICO), the launcher foreground template.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
SL=[("earth","#D4AF37"),("water","#101418"),("fire","#17130E"),("air","#121614"),("ether",None),("om","#7F00FF")]
RB=["#C8102E","#FF8A2B","#E9C84A","#2FB45A","#38B6EC","#4B0082","#9F7AE0"]
def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
N=1024; im=Image.new("RGBA",(N,N),(0,0,0,0)); d=ImageDraw.Draw(im)
h=N/6
for i,(k,c) in enumerate(SL):
    y0,y1=round(i*h),round((i+1)*h)
    if c: d.rectangle([0,y0,N,y1],fill=hx(c)+(255,))
    else:
        for x in range(N):
            t=x/(N-1)*(len(RB)-1); j=min(int(t),len(RB)-2); f=t-j; a,b=hx(RB[j]),hx(RB[j+1])
            d.line([(x,y0),(x,y1)],fill=tuple(round(a[q]*(1-f)+b[q]*f) for q in range(3))+(255,))
# faint mist on the three dark slices, and a soft gloss of light on water
mist=Image.new("RGBA",(N,N),(0,0,0,0)); md=ImageDraw.Draw(mist)
for i,(cx,cy,r,a) in enumerate([(0.30,1.5,0.22,24),(0.72,1.45,0.18,18),(0.55,2.55,0.20,22),(0.25,2.45,0.14,16),(0.62,3.5,0.24,22),(0.30,3.55,0.16,15)]):
    md.ellipse([(cx-r)*N,(cy*h)-r*N*0.45,(cx+r)*N,(cy*h)+r*N*0.45],fill=(255,255,255,a))
mist=mist.filter(ImageFilter.GaussianBlur(N*0.03))
band=Image.new("L",(N,N),0); ImageDraw.Draw(band).rectangle([0,round(h),N,round(4*h)],fill=255)
im.paste(mist,(0,0),Image.composite(mist.split()[3],Image.new("L",(N,N),0),band))
# thin separators
for i in range(1,6): d.line([(0,round(i*h)),(N,round(i*h))],fill=(0,0,0,255),width=6)
mask=Image.new("L",(N,N),0); ImageDraw.Draw(mask).ellipse([0,0,N-1,N-1],fill=255)
out=Image.new("RGBA",(N,N),(0,0,0,0)); out.paste(im,(0,0),mask)
site=sys.argv[1]
for s,n in [(16,"favicon-16.png"),(32,"favicon-32.png"),(48,"favicon-48.png"),(180,"icon-180.png"),(192,"icon-192.png"),(512,"icon-512.png")]:
    out.resize((s,s),Image.LANCZOS).save(f"{site}/{n}")
out.resize((256,256),Image.LANCZOS).save(f"{site}/favicon.ico",sizes=[(16,16),(32,32),(48,48)])
out.save("icon-1024.png")
# SVG
rects=[]
for i,(k,c) in enumerate(SL):
    y=i*64/6
    fill=c if c else "url(#rb)"
    rects.append(f'<rect x="0" y="{y:.3f}" width="64" height="{64/6+0.02:.3f}" fill="{fill}"/>')
stops="".join(f'<stop offset="{i/6:.3f}" stop-color="{c}"/>' for i,c in enumerate(RB))
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Chakra and Elements Toning">
  <!-- the first screen of the app, the six stripes, cut in a circle (Marko 10.11.2026) -->
  <defs><clipPath id="c"><circle cx="32" cy="32" r="32"/></clipPath><linearGradient id="rb">{stops}</linearGradient>
  <radialGradient id="m"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <g clip-path="url(#c)">
    {"".join(rects)}
    <ellipse cx="20" cy="16" rx="14" ry="5" fill="url(#m)"/><ellipse cx="38" cy="27" rx="13" ry="5" fill="url(#m)"/><ellipse cx="24" cy="37" rx="15" ry="5" fill="url(#m)"/>
    <g stroke="#000" stroke-width=".4">{"".join(f'<line x1="0" x2="64" y1="{i*64/6:.3f}" y2="{i*64/6:.3f}"/>' for i in range(1,6))}</g>
  </g>
</svg>
'''
open("icon.svg","w").write(svg)
# launcher foreground template (vector drawable): the same, smaller, centred above the version digits
cx,cy,R=54,45.5,17
def band(i):
    y0=cy-R+i*2*R/6; y1=y0+2*R/6
    return f"M{cx-R},{y0:.3f} H{cx+R} V{y1+0.05:.3f} H{cx-R} Z"
P=[]
for i,(k,c) in enumerate(SL):
    if c: P.append(f'        <path android:fillColor="{c}" android:pathData="{band(i)}" />')
    else:
        items="".join(f'\n                    <item android:offset="{j/6:.3f}" android:color="{col}" />' for j,col in enumerate(RB))
        P.append(f'''        <path android:pathData="{band(i)}">
            <aapt:attr name="android:fillColor">
                <gradient android:type="linear" android:startX="{cx-R}" android:startY="0" android:endX="{cx+R}" android:endY="0">{items}
                </gradient>
            </aapt:attr>
        </path>''')
for i,(ex,ey,rx,ry) in enumerate([(cx-4.5,cy-R+1.5*2*R/6,4.5,1.4),(cx+2,cy-R+2.5*2*R/6,4,1.3),(cx-3,cy-R+3.5*2*R/6,4.5,1.3)]):
    P.append(f'        <path android:fillColor="#1FFFFFFF" android:pathData="M{ex-rx:.2f},{ey:.2f} a{rx},{ry} 0 1 0 {2*rx},0 a{rx},{ry} 0 1 0 {-2*rx},0 Z" />')
vd=f'''<?xml version="1.0" encoding="utf-8"?>
<!--
     Chakra and Elements Toning (Mantra), the launcher icon (Marko 10.11.2026): the first screen, the six stripes, cut in a
     circle (brand/icon.svg, brand/stripes_icon.py). THIS IS A TEMPLATE: the build writes the version digits at the
     VERSION line (version-visible.md).
-->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <group>
        <clip-path android:pathData="M{cx-R},{cy} a{R},{R} 0 1 0 {2*R},0 a{R},{R} 0 1 0 {-2*R},0 Z" />
{chr(10).join(P)}
    </group>
    <!--VERSION-->
</vector>
'''
open("../android/app/src/main/icon/ic_launcher_foreground.xml","w").write(vd)
