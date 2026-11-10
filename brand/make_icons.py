# Rasterises the logotype (logo.svg: one disc, gold heart, white between, violet outside, smooth) for the favicons:
# transparent around the disc, the mark only (favicons.md).
import sys, numpy as np
from PIL import Image
STOPS=[(0,"#D4AF37"),(.22,"#D9B74A"),(.40,"#F2E6C2"),(.56,"#FFFFFF"),(.72,"#E7D6FF"),(.86,"#B17DFF"),(1,"#7F00FF")]
def rgb(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
N=1024; y,x=np.mgrid[0:N,0:N]; c=(N-1)/2; R=N*31/64
d=np.hypot(x-c,y-c)/R
img=np.zeros((N,N,4))
pos=[p for p,_ in STOPS]; cols=[rgb(h) for _,h in STOPS]
dd=np.clip(d,0,1)
for ch in range(3): img[...,ch]=np.interp(dd,pos,[col[ch] for col in cols])
img[...,3]=np.clip((1-d)*R*1.0+0.5,0,1)*255     # an anti-aliased edge
im=Image.fromarray(img.astype(np.uint8),"RGBA")
out=sys.argv[1]
for s,n in [(16,"favicon-16.png"),(32,"favicon-32.png"),(48,"favicon-48.png"),(180,"icon-180.png"),(192,"icon-192.png"),(512,"icon-512.png")]:
    im.resize((s,s),Image.LANCZOS).save(f"{out}/{n}")
im.resize((256,256),Image.LANCZOS).save(f"{out}/favicon.ico",sizes=[(16,16),(32,32),(48,48)])
im.resize((256,256),Image.LANCZOS).save("preview.png")
