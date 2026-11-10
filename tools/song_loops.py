# The long Suno element songs → the app's loops (assets/web/audio/<element>.ogg).
# python3 tools/song_loops.py <element> <song file> [<element> <song file> ...]
# One whole take each (one-take-audio): trims the recorded silence at both ends, a 4 s fade in and a 6 s fade out
# (volume only, nothing cut out or joined), so the loop breathes out and in again. Opus 80 kbps stereo.
import os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "android/app/src/main/assets/web/audio")
FIN, FOUT = 4.0, 6.0
a = sys.argv[1:]
for name, src in zip(a[0::2], a[1::2]):
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, "in.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ar", "48000", wav], check=True)
        x, sr = sf.read(wav, always_2d=True)
        idx = np.where(np.abs(x).max(axis=1) > 10 ** (-50 / 20))[0]
        x = x[idx[0]:idx[-1] + 1]
        y = x.copy()
        a, b = int(FIN * sr), int(FOUT * sr)
        y[:a] *= np.sin(np.linspace(0, np.pi / 2, a))[:, None] ** 2
        y[-b:] *= np.cos(np.linspace(0, np.pi / 2, b))[:, None] ** 2
        tmp = os.path.join(d, "loop.wav"); sf.write(tmp, y, sr, subtype="PCM_24")
        dst = os.path.join(OUT, f"{name}.ogg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-c:a", "libopus", "-b:a", "80k", dst], check=True)
        print(name, f"loop {len(y)/sr/60:.1f} min, peak {20*np.log10(np.abs(y).max()):.1f} dBFS, {os.path.getsize(dst)/1e6:.1f} MB")
