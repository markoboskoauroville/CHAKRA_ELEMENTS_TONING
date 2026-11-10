# The page icon (Marko 10.11.2026): the heart chakra, a circle with the six-pointed star inside (Anahata). Air has no
# hue: soft white lines on black with a faint mist glow. Writes brand/heart.svg, site/logo.svg and the site favicons.
import sys, math
from PIL import Image, ImageDraw, ImageFilter
def tri(c, r, down):
    return [(c+r*math.cos((math.pi/2 if down else -math.pi/2)+i*2*math.pi/3), c+r*math.sin((math.pi/2 if down else -math.pi/2)+i*2*math.pi/3)) for i in range(3)]
N=1024; k=N/64; c=N/2
im=Image.new("RGBA",(N,N),(0,0,0,0)); d=ImageDraw.Draw(im)
d.ellipse([0,0,N-1,N-1],fill=(10,11,13,255))
glow=Image.new("RGBA",(N,N),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([c-20*k,c-20*k,c+20*k,c+20*k],fill=(255,255,255,40))
glow=glow.filter(ImageFilter.GaussianBlur(9*k)); im.alpha_composite(glow)
mask=Image.new("L",(N,N),0); ImageDraw.Draw(mask).ellipse([0,0,N-1,N-1],fill=255)
lines=Image.new("RGBA",(N,N),(0,0,0,0)); ld=ImageDraw.Draw(lines); w=round(3.2*k); col=(238,240,244,235)
ld.ellipse([c-25*k,c-25*k,c+25*k,c+25*k],outline=col,width=w)
for down in (False,True):
    p=tri(c,20.5*k,down); ld.line(p+[p[0]],fill=col,width=w,joint="curve")
soft=lines.filter(ImageFilter.GaussianBlur(2.5*k)); im.alpha_composite(soft); im.alpha_composite(lines)
out=Image.new("RGBA",(N,N),(0,0,0,0)); out.paste(im,(0,0),mask)
site=sys.argv[1]
for s,n in [(16,"favicon-16.png"),(32,"favicon-32.png"),(48,"favicon-48.png"),(180,"icon-180.png"),(192,"icon-192.png"),(512,"icon-512.png")]:
    out.resize((s,s),Image.LANCZOS).save(f"{site}/{n}")
out.resize((256,256),Image.LANCZOS).save(f"{site}/favicon.ico",sizes=[(16,16),(32,32),(48,48)])
def pts(down): return " ".join(f"{32+20.5*math.cos((math.pi/2 if down else -math.pi/2)+i*2*math.pi/3):.2f},{32+20.5*math.sin((math.pi/2 if down else -math.pi/2)+i*2*math.pi/3):.2f}" for i in range(3))
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Chakra and Elements Toning: the heart chakra">
  <!-- Marko 10.11.2026: the heart chakra circle with the six-pointed star inside; air has no hue: soft white on black -->
  <defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
  <circle cx="32" cy="32" r="32" fill="#0A0B0D"/><circle cx="32" cy="32" r="24" fill="url(#g)"/>
  <g fill="none" stroke="#EEF0F4" stroke-width="3.2" stroke-linejoin="round" opacity=".55" filter="url(#b)">
    <circle cx="32" cy="32" r="25"/><polygon points="{pts(False)}"/><polygon points="{pts(True)}"/></g>
  <g fill="none" stroke="#EEF0F4" stroke-width="3.2" stroke-linejoin="round" opacity=".92">
    <circle cx="32" cy="32" r="25"/><polygon points="{pts(False)}"/><polygon points="{pts(True)}"/></g>
</svg>
'''
open("heart.svg","w").write(svg); open(f"{site}/logo.svg","w").write(svg)
