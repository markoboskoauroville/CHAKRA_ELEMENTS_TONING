# Makes the five element loops from the kept Suno v8 stage takes (DJMANTRA_ECSTATIC_DANCE align.json):
# trims the BlackHole silence at both ends, folds the last XF seconds over the first (equal-power), so the
# file loops without a seam. Volume untouched.
import soundfile as sf, numpy as np, sys, os, subprocess
SRC=os.path.expanduser("~/Developer/DJMANTRA_ECSTATIC_DANCE/tools/toning/suno/takes/v8")
OUT=sys.argv[1]
takes=[("earth","1-AAA-take2"),("water","2-UUU-take1"),("fire","3-III-take1"),("air","4-OOO-take1"),("ether","5-A-U-I-O-take1")]
XF=4.0
for name,f in takes:
    x,sr=sf.read(f"{SRC}/{f}.wav",always_2d=True)
    m=np.abs(x).max(axis=1)
    thr=10**(-50/20)
    idx=np.where(m>thr)[0]
    a,b=idx[0],idx[-1]+1
    x=x[a:b]
    n=int(XF*sr)
    t=np.linspace(0,np.pi/2,n)[:,None]
    head=x[:n]*np.sin(t)+x[-n:]*np.cos(t)
    y=np.concatenate([head,x[n:-n]])
    peak=np.abs(y).max()
    tmp=f"{OUT}/{name}.wav"; sf.write(tmp,y,sr,subtype="PCM_24")
    subprocess.run(["ffmpeg","-v","error","-y","-i",tmp,"-c:a","libopus","-b:a","128k",f"{OUT}/{name}.ogg"],check=True)
    os.remove(tmp)
    print(name,f,f"trim {a/sr:.2f}-{b/sr:.2f}s loop {len(y)/sr:.1f}s peak {20*np.log10(peak):.1f} dBFS")
