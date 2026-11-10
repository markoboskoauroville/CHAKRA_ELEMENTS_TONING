# The Croatian page /hr/ from the English master site/index.html (one source, two languages; hreflang both ways).
# Run after every change to site/index.html: python3 tools/build_site.py
import os
U = "https://mantraroom.pages.dev/"
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
s = open(os.path.join(root, "index.html")).read()
R = [
 ('<html lang="en" data-lang="en">', '<html lang="hr" data-lang="hr">'),
 ('<title>Mantra Room: the Mantra Meditation Room and its sing-along app for Android</title>',
  '<title>Mantra Room: Mantra meditacijska soba i aplikacija za pjevanje za Android</title>'),
 ('<meta name="description" content="Sing along and meditate in sound: six songs, one vowel each (A, U, I, O, A-U-I-O, OM). Follow the melody with your voice. Free for Android, offline, no account.">',
  '<meta name="description" content="Pjevaj i meditiraj u zvuku: šest pjesama, svaka sa svojim vokalom (A, U, I, O, A-U-I-O, OM). Prati melodiju svojim glasom. Besplatno za Android, bez interneta, bez računa.">'),
 (f'<link rel="canonical" href="{U}">', f'<link rel="canonical" href="{U}hr/">'),
 (f'<meta property="og:url" content="{U}">', f'<meta property="og:url" content="{U}hr/">'),
 ('<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="hr_HR">',
  '<meta property="og:locale" content="hr_HR">\n<meta property="og:locale:alternate" content="en_US">'),
 ('<meta property="og:title" content="Mantra Room: enter the room, choose your sound, sing along">',
  '<meta property="og:title" content="Mantra Room: uđi u sobu, izaberi zvuk, pjevaj">'),
 ('<meta property="og:description" content="Six songs, one vowel each: sing along with the melody and meditate in the sound. Free, offline, no account.">',
  '<meta property="og:description" content="Šest pjesama, svaka sa svojim vokalom: pjevaj s melodijom i meditiraj u zvuku. Besplatno, bez interneta, bez računa.">'),
 ('<meta name="twitter:description" content="Six songs, one vowel each: sing along with the melody and meditate in the sound. Free, offline, no account.">',
  '<meta name="twitter:description" content="Šest pjesama, svaka sa svojim vokalom: pjevaj s melodijom i meditiraj u zvuku. Besplatno, bez interneta, bez računa.">'),
]
for a, b in R:
    assert a in s, a[:70]
    s = s.replace(a, b)
os.makedirs(os.path.join(root, "hr"), exist_ok=True)
open(os.path.join(root, "hr", "index.html"), "w").write(s)
open(os.path.join(root, "sitemap.xml"), "w").write(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>{U}</loc><xhtml:link rel="alternate" hreflang="en" href="{U}"/><xhtml:link rel="alternate" hreflang="hr" href="{U}hr/"/></url>
  <url><loc>{U}hr/</loc><xhtml:link rel="alternate" hreflang="en" href="{U}"/><xhtml:link rel="alternate" hreflang="hr" href="{U}hr/"/></url>
</urlset>
''')
print("site/hr/index.html and sitemap.xml written")
