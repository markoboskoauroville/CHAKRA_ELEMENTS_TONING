# A picture of the Suno tab, taken inside Firefox (BiDi captureScreenshot): nothing on Marko's screen changes.
import base64, importlib.machinery, importlib.util, os, sys
path = os.path.expanduser('~/.local/bin/firefoxctl')
ldr = importlib.machinery.SourceFileLoader('firefoxctl', path)
spec = importlib.util.spec_from_loader('firefoxctl', ldr)
fc = importlib.util.module_from_spec(spec); ldr.exec_module(fc)
b = fc.Bidi()
try:
    ctx = b.pick(sys.argv[2] if len(sys.argv) > 2 else 'suno.com')['ctx']
    r = b.call('browsingContext.captureScreenshot', {'context': ctx})
    open(sys.argv[1], 'wb').write(base64.b64decode(r['data'])); print('saved', sys.argv[1])
finally:
    b.close()
