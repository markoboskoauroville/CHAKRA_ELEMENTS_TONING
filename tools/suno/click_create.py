# Presses Suno's Create with a real (WebDriver BiDi) pointer click inside Firefox: a JavaScript .click() is ignored
# by Suno (10.11.2026: nothing was created, no credits taken). Never moves Marko's own pointer.
import importlib.machinery, importlib.util, os, sys, time
path = os.path.expanduser('~/.local/bin/firefoxctl')
ldr = importlib.machinery.SourceFileLoader('firefoxctl', path)
spec = importlib.util.spec_from_loader('firefoxctl', ldr)
fc = importlib.util.module_from_spec(spec); ldr.exec_module(fc)
b = fc.Bidi()
try:
    ctx = b.pick('suno.com')['ctx']
    r = b.js(ctx, """(() => { const e=document.querySelector('button[aria-label="Create song"]'); if(!e||e.disabled) return null;
        e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2), y:Math.round(r.y+r.height/2)} })()""")
    if not r: sys.exit('Create not found or disabled')
    b.call('input.performActions', {'context': ctx, 'actions': [{'type': 'pointer', 'id': 'm',
        'parameters': {'pointerType': 'mouse'}, 'actions': [
        {'type': 'pointerMove', 'x': r['x'], 'y': r['y'], 'origin': 'viewport'},
        {'type': 'pointerDown', 'button': 0}, {'type': 'pointerUp', 'button': 0}]}]})
    print('pressed Create at', r)
finally:
    b.close()
