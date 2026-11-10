# The Croatian page /hr/ from the English master site/index.html (one source, two languages; hreflang both ways).
# Run after every change to site/index.html: python3 tools/build_site.py
import os
U = "https://chakra-and-elements-toning.pages.dev/"
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
s = open(os.path.join(root, "index.html")).read()
R = [
 ('<html lang="en" data-lang="en">', '<html lang="hr" data-lang="hr">'),
 ('<title>Chakra and Elements Toning: free chakra toning meditation app for Android</title>',
  '<title>Chakra and Elements Toning: besplatna aplikacija za chakra toning meditaciju za Android</title>'),
 ('<meta name="description" content="Sing the five elements and OM with DJ Mantra\'s chakra toning: a guided toning with MilkDrop visuals, element sounds to sing along, a breath circle and a soft bell. Free, offline, no account.">',
  '<meta name="description" content="Pjevaj pet elemenata i OM uz chakra toning DJ Mantre: vođeni toning s MilkDrop slikama, zvukovi elemenata za pjevanje, krug za disanje i nježno zvono. Besplatno, bez interneta, bez računa.">'),
 (f'<link rel="canonical" href="{U}">', f'<link rel="canonical" href="{U}hr/">'),
 (f'<meta property="og:url" content="{U}">', f'<meta property="og:url" content="{U}hr/">'),
 ('<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="hr_HR">',
  '<meta property="og:locale" content="hr_HR">\n<meta property="og:locale:alternate" content="en_US">'),
 ('<meta property="og:title" content="Chakra and Elements Toning: sing the five elements and OM">',
  '<meta property="og:title" content="Chakra and Elements Toning: pjevaj pet elemenata i OM">'),
 ('<meta property="og:description" content="A free meditation app for Android on DJ Mantra\'s chakra toning. Offline, no account.">',
  '<meta property="og:description" content="Besplatna aplikacija za meditaciju za Android na chakra toningu DJ Mantre. Bez interneta, bez računa.">'),
 ('<meta name="twitter:description" content="A free meditation app for Android on DJ Mantra\'s chakra toning. Offline, no account.">',
  '<meta name="twitter:description" content="Besplatna aplikacija za meditaciju za Android na chakra toningu DJ Mantre. Bez interneta, bez računa.">'),
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
