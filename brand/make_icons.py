# Rasterises the logotype (same geometry as logo.svg) for the favicons: transparent, the mark only (favicons.md).
import sys
from PIL import Image, ImageDraw
N=1024; k=N/64
def disc(d,r,fill,stroke=None,sw=0):
    c=32*k; R=r*k
    d.ellipse([c-R,c-R,c+R,c+R],fill=fill,outline=stroke,width=round(sw*k) if stroke else 0)
im=Image.new("RGBA",(N,N),(0,0,0,0)); d=ImageDraw.Draw(im)
c=32*k; R=30.6*k; w=round(2.6*k)
d.ellipse([c-R-w/2,c-R-w/2,c+R+w/2,c+R+w/2],outline="#4B0082",width=w)
disc(d,27.4,"#D4AF37")
disc(d,21+0.7,"#14161A"); disc(d,21-0.7,"#F4F7F8")
disc(d,15.6+0.7,"#14161A"); disc(d,15.6-0.7,"#FFE7BF")
disc(d,10.6+0.7,"#14161A"); disc(d,10.6-0.7,"#FFFFFF")
cols=["#C8102E","#FF8A2B","#E9C84A","#2FB45A","#38B6EC","#5AA2F0","#9F7AE0"]
R6=6.2*k
for i,col in enumerate(cols):   # the rainbow as seven slices, so every colour shows even at 16 px
    d.pieslice([c-R6,c-R6,c+R6,c+R6],-90+i*360/7,-90+(i+1)*360/7,fill=col)
out=sys.argv[1]
for s,n in [(16,"favicon-16.png"),(32,"favicon-32.png"),(48,"favicon-48.png"),(180,"icon-180.png"),(192,"icon-192.png"),(512,"icon-512.png")]:
    im.resize((s,s),Image.LANCZOS).save(f"{out}/{n}")
im.resize((256,256),Image.LANCZOS).save(f"{out}/favicon.ico",sizes=[(16,16),(32,32),(48,48)])
im.resize((256,256),Image.LANCZOS).save(f"{out}/../brand-preview.png")
