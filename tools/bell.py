# A soft singing-bowl bell, synthesized (inharmonic partials, slow decay, a slight beat), 9 s, mono.
import numpy as np, soundfile as sf, sys, subprocess
sr=48000; T=9.0; t=np.arange(int(sr*T))/sr
f0=196.0  # G3
parts=[(1.0,1.0,0.0,1.6),(2.76,0.45,0.9,1.1),(5.40,0.22,1.7,0.7),(8.93,0.10,2.3,0.45)]
y=np.zeros_like(t)
for r,a,beat,dec in parts:
    f=f0*r
    env=np.exp(-t/(dec*T/4.0))
    y+=a*env*np.sin(2*np.pi*f*t)*(1+0.15*np.sin(2*np.pi*beat*t))
att=np.minimum(1,t/0.012)
y*=att
y=y/np.abs(y).max()*0.5
sf.write("bell.wav",y,sr)
subprocess.run(["ffmpeg","-v","error","-y","-i","bell.wav","-c:a","libopus","-b:a","96k",sys.argv[1]],check=True)
