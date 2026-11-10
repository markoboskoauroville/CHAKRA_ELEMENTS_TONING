# Records one Suno song whole through BlackHole 2ch (Suno refuses the audio files on this account).
# python3 record.py <name> <clip id> <seconds> <out.wav>
# Before: output/system/input/volume read; output → BlackHole 2ch at 100; after (even on failure): all put back.
# sox starts first, 3 s of silence, then a real BiDi click on the song page's Play; 4 s of silence after the end.
import importlib.machinery, importlib.util, os, subprocess, sys, time
name, cid, secs, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
path = os.path.expanduser('~/.local/bin/firefoxctl')
ldr = importlib.machinery.SourceFileLoader('firefoxctl', path)
spec = importlib.util.spec_from_loader('firefoxctl', ldr)
fc = importlib.util.module_from_spec(spec); ldr.exec_module(fc)
sas = lambda *a: subprocess.run(["SwitchAudioSource", *a], capture_output=True, text=True).stdout.rstrip("\n")   # keep "ADAM Audio D3V  " (two spaces)
before = {t: sas("-c", "-t", t) for t in ("output", "system", "input")}
vol = subprocess.run(["osascript", "-e", "output volume of (get volume settings)"], capture_output=True, text=True).stdout.strip()

def bidi(fn, tries=8):
    for i in range(tries):
        try:
            b = fc.Bidi()
        except SystemExit:
            time.sleep(4); continue
        try:
            return fn(b)
        finally:
            b.close()
    raise SystemExit("no BiDi session")

def open_song(b):
    ctx = b.pick('suno.com')['ctx']
    b.call('browsingContext.navigate', {'context': ctx, 'url': f'https://suno.com/song/{cid}', 'wait': 'complete'})
    time.sleep(5)
    return ctx

def press_play(b):
    ctx = b.pick('suno.com')['ctx']
    r = b.js(ctx, """(() => { const bs=[...document.querySelectorAll('button')].filter(x=>/^play/i.test(x.getAttribute('aria-label')||''));
        const e=bs.find(x=>x.getBoundingClientRect().top<700)||bs[0]; if(!e) return null; e.scrollIntoView({block:'center'});
        const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2), n:bs.length} })()""")
    if not r: raise SystemExit("no Play button")
    b.call('input.performActions', {'context': ctx, 'actions': [{'type': 'pointer', 'id': 'm',
        'parameters': {'pointerType': 'mouse'}, 'actions': [
        {'type': 'pointerMove', 'x': r['x'], 'y': r['y'], 'origin': 'viewport'},
        {'type': 'pointerDown', 'button': 0}, {'type': 'pointerUp', 'button': 0}]}]})
    return r

def pause(b):
    ctx = b.pick('suno.com')['ctx']
    return b.js(ctx, "(()=>{document.querySelectorAll('audio').forEach(a=>a.pause());return 'paused'})()")

try:
    bidi(open_song)
    sas("-t", "output", "-s", "BlackHole 2ch"); sas("-t", "system", "-s", "BlackHole 2ch")
    subprocess.run(["osascript", "-e", "set volume output volume 100"])
    rec = subprocess.Popen(["sox", "-q", "-t", "coreaudio", "BlackHole 2ch", "-r", "48000", "-c", "2", "-b", "24", out,
                            "trim", "0", str(secs + 7)])
    time.sleep(3)
    print(name, "play", bidi(press_play), flush=True)
    time.sleep(4)
    print("now playing:", bidi(lambda b: b.js(b.pick('suno.com')['ctx'], "(()=>{const m=navigator.mediaSession&&navigator.mediaSession.metadata;return m?m.title:'?'})()")), flush=True)
    rec.wait()
    bidi(pause)
finally:
    sas("-t", "output", "-s", before["output"]); sas("-t", "system", "-s", before["system"]); sas("-t", "input", "-s", before["input"])
    subprocess.run(["osascript", "-e", f"set volume output volume {vol}"])
    print("audio back on", sas("-c", "-t", "output"), "| system", sas("-c", "-t", "system"), "| input", sas("-c", "-t", "input"), "| volume", vol)
