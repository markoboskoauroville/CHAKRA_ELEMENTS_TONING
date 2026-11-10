# TAKEOVER: Mantra Room (Mantra Meditation Room), formerly Chakra and Elements Toning

**What it is.** An Android meditation app for a mindfulness audience, built on Marko's (DJ Mantra's) chakra toning.
Package `com.mantra.chakratoning`, launcher name "Chakra Toning (Mantra)", full name "Chakra and Elements Toning (Mantra)".
Born 10.11.2026 (Master session MAC_SES9_08-NOV, task 75). Requests word for word: `momentaryupdates.md`.

## The three modes and the extras

1. **Guide**: one button, the chakra toning mix (`assets/web/audio/guide.mp3` = DJMANTRA_ECSTATIC_DANCE
   `assets/toning/chakra-toning-mix.mp3`, "Chakra Toning raga (held notes)", 5:14, 320 kbps, untouched) plays with
   MilkDrop visuals. Style picker: twelve calm presets with plain names ("Mandala", "Lotus", "Stained glass" ...) and
   then all 100 presets; ‹ Style steps back; Auto changes the style every 40 s with a 6 s blend.
2. **Elements**: one portrait screen, five stripes in Marko's chakra colours (MANTRA_MANIFEST chakra-colors.md):
   Earth A gold, Water U milky white, Fire I crimson, Air O green, Ether A-U-I-O rainbow. Each stripe draws its
   symbol very faintly (squares, waves, downward triangle with sparks, six-pointed star, sixteen petals). A tap opens
   the element full screen, its song loops with an audio-reactive drawing in its colour, a tap returns.
3. **Breath**: a circle to breathe with: Calm 4·6, Box 4·4·4·4, 4·7·8.
- Session timer on the home screen (Off/5/10/20/30/45 min): 12 s fade, then a soft synthesized bowl bell.
- Background playback with lock-screen and notification controls (media3 MediaSessionService).
- Practice log and streak (days in a row, minutes this week), on the phone only (WebView localStorage).
- Offline, no account, **no INTERNET permission at all**.

## How it is built

- `android/app/src/main/java/.../MainActivity.kt`: one WebView (WebViewAssetLoader, https://appassets.androidplatform.net)
  shows `assets/web/` (index.html, app.css, app.js, elements.js). NORMAL mode pads by bars + cut-out; the two visual
  screens go full screen (bars hidden, swipe brings them back), system-bars.md §0.
- `PlaybackService.kt`: ExoPlayer in a MediaSession; play/pause/resume/stop with equal-power fades, the timer, the bell.
- **The visuals get the sound from a silent mirror**: the page plays the same file through Web Audio (blob URL, gain 0
  to the speaker) only to feed the analyser and butterchurn, re-synced to the native position when it drifts > 0.3 s.
  Native sound = reliable background play; the mirror = real audio data for MilkDrop without the RECORD_AUDIO permission
  that Android's Visualizer would need.
- Compiled ONLY by GitHub Actions (`.github/workflows/android.yml`, template android-gradle.yml), release vN Latest,
  signed by the secret ANDROID_DEBUG_KEYSTORE_B64 (the Mac's debug keystore, set 10.11.2026).
  Version: `android/gradle.properties` appVersion; drawn under the icon (version-visible.md) and at the foot of About
  (tap → releases/latest).

## MilkDrop engine choice and licences

- **butterchurn 2.6.7** (MIT, Jordan Berg): WebGL 2 MilkDrop in the WebView. Chosen over projectM (LGPL-2.1, native,
  NDK + GLES build in CI, the LGPL relinking duty for an app shipped as one APK) because it needs no native code,
  runs in every Android WebView with WebGL 2, and takes the audio straight from a Web Audio node.
- **butterchurn-presets 2.4.7** (MIT for the package, Jordan Berg). The presets themselves are MilkDrop community
  works (Geiss, Flexi, Martin, Rovastar, Zylot ...), distributed freely for twenty years; their authors stay in the
  names. The licence texts: `assets/web/vendor/LICENSE-*.txt`; credits in the app's About.
- The bell is synthesized here (`tools/bell.py`), no third-party sample.

## The element songs

- v1 uses the **existing Suno vocal-only stage songs** of the toning (DJMANTRA_ECSTATIC_DANCE
  `tools/toning/suno/takes/v8`, Covers of Marko's own vowels with a quiet Tibetan choir, no lyrics; the takes he kept:
  A take 2, U 1, I 1, O 1, A-U-I-O 1). `tools/loops.py` trims the silence and folds the last 4 s over the first so
  each loops without a seam (23–63 s each, volume untouched), Opus 128 kbps.
- **Five LONG songs from Suno** (one per element, same family as the raga, no spoken guide): Marko said yes on
  10.11.2026 ("Yes, about 50 credits"). Specs in `tools/suno/songs.py` (style ≤ 1000 characters, the raga's sitar,
  tanpura, shruti box on D and soft tabla; A on F, U on G, I on A, O on C, A-U-I-O improvised over F G A C D with the
  male choir; eight sung sections with instrumental interludes, about eight minutes). `tools/suno/fill.py <key>` fills
  the form in his Firefox, `click_create.py` presses Create with a real BiDi click, an hCaptcha then needs Marko.
  One attempt per song; he hears both clips before any regeneration.
  Made 10.11.2026 (60 credits, 11,945 → 11,885; Fire twice): Earth 5:35/5:08, Water 5:23/5:39, Fire 6:04/5:34 and
  6:04/5:43, Air 5:39/5:29, Ether 6:03/6:30. Suno's API answers "forbidden" for the audio files on this account:
  the chosen clip per element comes by his Download or a BlackHole recording, then `tools/song_loops.py`.
  When they exist: replace `assets/web/audio/<element>.ogg`, keep the names, raise appVersion.

## Where it stands (10.11.2026)

- Public repository (Marko's yes). Release **v2** Latest, workflow green. v1 tested on the Pixel 7 emulator
  (Pixel_7_API_35): home, Guide with MilkDrop and its controls, Elements (five stripes), Fire full screen looping,
  Breath, playback going on with the screen locked (foreground media service). v2 = colours kept true + smaller APK.
- Website **https://mantraroom.pages.dev** LIVE since 10.11.2026, folder `site/`, deployed by
  `.github/workflows/site.yml` (Cloudflare Pages; CLOUDFLARE_API_TOKEN pasted by Marko). Pictures: hero and lifestyle by Gemini
  (Nano Banana) in his Chrome; the three cards are the app's own emulator screenshots. Donation bowl, SEO, counter
  `data-dl-app="chakratoning"` on both buttons, which open GitHub releases/latest. Card 22 on markobosko.pages.dev #/kod.
- Not tested by a hand: how loud the guide and loops are on a real phone, the feel of the taps, the lock screen
  controls pressed by a finger.

## The philosophy (Marko 10.11.2026, requests 4 to 7): what the app and the site say, and where it comes from

- **Colours** (MANTRA_MANIFEST chakra-colors.md, rewritten 10.11.2026): Earth gold `#D4AF37` is the one true colour;
  Water is reflection (silver glint, `#DCE6EA` at low alpha), Fire is energy (warm white light `#FFF1D8`), Air is
  connection (a luminous haze `#EEF4F1`); the throat is the rainbow; OM is pure violet `#7F00FF`. The logotype's outer
  ring is indigo `#4B0082` because he said indigo for it ("an outer circle, which is pure and indigo color").
- **The flow**: OM (vision) → Water (creativity, mood) → Earth (grounding, so water can land) → Fire (the work of the
  vision) → Air (connection, serving each other's growth) → the throat (truth on every level). App: About → "The way of
  the sounds"; site: the same, EN and HR.
- **Nature first** (request 6): the opening paraphrases the Instagram video on his Nothing Phone (the lady, 3:29,
  transcript in tools/sources, gitignored): Sanatana Dharma begins with honouring nature (sun, moon, stars, rivers, trees,
  birds) and the body is a yantra, a small universe. Paraphrased, no long quotes.
- **The four levels of speech** for the throat: Vaikhari (spoken), Madhyama (inner, mental), Pashyanti (seeing, the
  image before words), Para (the silent source). Sources: Bhartrhari, *Vakyapadiya* (5th c.); the Tantric/Kashmir Shaiva
  tradition; overview: https://en.wikipedia.org/wiki/Vāc and https://en.wikipedia.org/wiki/Parā_vāk
- **The natural order** (request 5): earth at the bottom, water on earth, fire where there is water, air on top, space
  above; the Japanese five-ring pagoda, *gorintō*: cube = earth (chi), sphere = water (sui), pyramid = fire (ka),
  crescent = wind/air (fū), jewel = void/space (kū), stacked bottom to top. Sources:
  https://en.wikipedia.org/wiki/Gorintō ; https://en.wikipedia.org/wiki/Godai_(Japanese_philosophy) (the five elements,
  also the order of Musashi's *Book of Five Rings*); the five-storied pagoda (gojū-no-tō) carries the same meaning:
  https://en.wikipedia.org/wiki/Pagoda . App: "Natural order" screen (tap a floor = that element); site: a section with
  the same drawing. The pagoda video he first asked for was dropped (his correction: "There is no video").

## Breath patterns (request 8): timings and sources

| Pattern | In · hold · out · hold (s) | Kind | Source |
|---|---|---|---|
| Coherent (resonance) | 5.5 · 0 · 5.5 · 0 (about 5.5 breaths a minute) | modern | Brown & Gerbarg, *The Healing Power of the Breath* (2012); Lehrer & Gevirtz, Frontiers in Psychology 5:756 (2014) |
| Box | 4 · 4 · 4 · 4 | modern | Cleveland Clinic, "Box Breathing" (health.clevelandclinic.org) |
| 4·7·8 | 4 · 7 · 8 · 0 | modern | Andrew Weil, "Breathing Exercises: 4-7-8 Breath" (drweil.com) |
| Sama Vritti | 4 · 0 · 4 · 0 | pranayama | equal breath; B.K.S. Iyengar, *Light on Pranayama* (1981) |
| Ujjayi | 4 · 0 · 6 · 0 | pranayama | *Hatha Yoga Pradipika* 2.51–53; Iyengar, *Light on Pranayama* |
| Nadi Shodhana | 4 · 0 · 4 · 0, left/right cues | pranayama | *Hatha Yoga Pradipika* 2.7–10 (alternate nostril); Iyengar |
| Bhramari | 4 · 0 · 8 · 0, humming out | pranayama | *Hatha Yoga Pradipika* 2.68 |
| Kapalabhati | 0.4 · 0 · 0.6 · 0, 30 strokes, 30 s rest | pranayama (a kriya) | *Hatha Yoga Pradipika* 2.35; safety note in the app (pregnancy, blood pressure, heart, eyes, surgery, dizziness) |
| Custom | his own | yours | |

The countdown shows the seconds left in each phase; the circle grows on the in-breath, stays on the hold, shrinks on the
out-breath (sine easing); the home timer ends the session with the bowl bell; the ♫ key turns on a soft tone per phase.

## SEO checklist (request 7: "engine optimized ... as we go, optimize it"); every change to the site keeps all of it

1. One source `site/index.html` (EN); `python3 tools/build_site.py` writes `site/hr/index.html` and `sitemap.xml`. Run it
   after every change; both pages commit together.
2. Each page: its own `<title>` (≤ 65 characters) and meta description (≤ 160), canonical, hreflang en / hr / x-default.
3. Open Graph + Twitter card with `img/og.jpg` 1200 × 630, og:locale and the alternate.
4. JSON-LD `@graph`: MobileApplication, Organization (Mantra Productions), Person (Marko Bosko, DJ Mantra), WebSite with
   the DonateAction (the bowl).
5. One `<h1>`; sections with `<h2>`; every image has an alt that says what is in it; width and height on every image.
6. Images in WebP inside `<picture>` with the JPEG fallback; the hero preloaded with fetchpriority high; the rest lazy.
7. No render-blocking script: the counter and speechify-keys are `defer`; styles inline.
8. robots.txt allows everything and names the sitemap; the logotype (`logo.svg`) is also the SVG favicon.
9. After a deploy: curl 200 for /, /hr/, /sitemap.xml; a Lighthouse run; look at the page at phone and desktop width.

## The shape of the app since v9 (Marko 10.11.2026, requests 9 to 16)

- **First screen = the six stripes** (A Earth, U Water, I Fire, O Air, A-U-I-O the throat, OM). Tap one: it plays full
  screen on its own colour (earth gold, OM violet, throat rainbow; water, fire, air black with drifting mist). One quiet
  entry, three lines top right, opens **Additional modules**: Journey (the guide, then each element once, natural order),
  Pranayama, Education (Philosophy, Natural order), Elements, Guide, Timer and bell, Journal, About.
- **The symbols behind the stripes** are the chakra yantras of the *Sat-chakra-nirupana* as published by Arthur Avalon
  (John Woodroffe), *The Serpent Power* (1919): Muladhara 4 petals + square (earth); Svadhisthana 6 petals + crescent
  moon (water); Manipura 10 petals + triangle pointing down (fire); Anahata 12 petals + six-pointed star (air);
  Vishuddha 16 petals + full moon (space) in a triangle; Ajna 2 petals + OM. Note: the tattva card of fire (Tejas, as in
  the Hermetic tattva cards) is a triangle pointing UP; the app follows the chakra yantra (down) because the stripes are
  chakras. Overview: https://en.wikipedia.org/wiki/Chakra (the table of yantras) and the Woodroffe text
  (https://www.sacred-texts.com/tantra/sp/). Drawn as our own geometry (elements.js `yantra()`), not copied images.
- **The rainbow principle**: one white light through a prism (our own drawing, not any album art); labels in a row in
  rainbow order left to right; a title gets one rainbow stripe. **OM, never AUM.**
- **The logotype** (concentric circles, then the smooth violet-white-gold disc) was rejected for the app on 10.11.2026
  ("very ugly"); the launcher icon still uses the disc until a new mark is chosen; the site keeps it until he decides.

## Since v13 (10.11.2026, requests 21 to 24)

- **A sing-along**: each stripe shows its vowel and "Sing A with the melody"; the site's hero, SEO title/description and
  JSON-LD lead with singing along (six songs, one vowel each). The stripe symbols have no petals any more.
- **Icons**: the page icon (site title, favicons) is the heart chakra, a circle with the six-pointed star, soft white on
  black (brand/heart_icon.py). The launcher icon is still the stripes screen in a circle (brand/stripes_icon.py); Marko
  is asked whether to use one mark for both.
- **Songs in the app**: v15 has the long Suno songs for Earth, Water and Fire (task 89 recorder, tools/suno/takes, WAVs
  ignored by git; `tools/song_loops.py <element> <wav>` makes the Opus file with fades only). Air, Ether and OM follow.
  The OM song (spec in tools/suno/songs.py) waits on Suno's human check (blocker card b1a1c3fe5212).
- **Pin**: `adb shell am start -n com.mantra.chakratoning/.MainActivity --ez pin true` asks Nova to put the icon on the
  home screen (its own Add dialog, confirmed once).
- Lighthouse on the live site (mobile, 10.11.2026 evening): performance 100, accessibility 100, best practices 100, SEO 100.


## The makeover, 10.11.2026 (requests 25 to 30): Mantra Room

- **Names.** Repository `markoboskoauroville/MANTRA_ROOM` (renamed from CHAKRA_ELEMENTS_TONING, folder ~/Developer/MANTRA_ROOM).
  App name "Mantra Meditation Room", launcher "Mantra Room". applicationId `com.mantra.chakratoning` and the keystore are
  unchanged, so every version installs over the last. Site: https://mantraroom.pages.dev (Pages project `mantraroom`,
  `.github/workflows/site.yml`); the old chakra-and-elements-toning Pages project is deleted after the new one is verified.
- **The concept.** The app will live inside the Mantra Room: one colour, one armchair in the middle, laser projectors
  drawing dark-yellow line-art chakra symbols on four walls. You enter, the app waits, you choose your sound, and over
  Bluetooth the Aputure lights take the sound's colour and breathe with it. Also usable at home. "Room lights" in the
  app (Additional modules) is a MOCK-UP: no Bluetooth is used, nothing is sent.
- **The colour screen (v16 on).** One design for every sound: a dark glowing ball, colour in the centre fading to black;
  only brightness breathes, from 0 to 20% of full light (gamma-encoded so it is dark but visible), 6 s in, 2 s hold, 6 s
  out, 2 s hold, cosine eased; hue never changes. Colours: Earth gold, Water blue `#2E7FB8`, Fire crimson `#D8232F`, Air
  green `#2FB45A`, OM violet, A-U-I-O a RADIAL rainbow (root red in the centre, the rest as rings outward).
  Constants `PULSE_MAX`, `BREATH_*` at the top of that block in `app.js`.
- **GPU (v17 on, request 28).** The ball is a WebGL fragment shader (`BallGL` in app.js): time and brightness are uniforms,
  temporal dithering against banding. MainActivity picks the display mode nearest 60 Hz (`pickRefreshRate`, from
  Display.getSupportedModes) and tells the page (`Native.display()`); a faint line under the top edge and the log
  line `MRFPS` show the measured fps. Nothing A142: 60 fps, modes 60/90/120 Hz, asked 60.
- **Two song styles (v17 on, request 26).** Every stripe is split into two halves with no gap: left Mantra Voice, right
  Indian Raga, the symbol without petals exactly on the seam. Files `assets/web/audio/<id>-voice.ogg` and `<id>-raga.ogg`
  (id = earth, water, fire, air, ether, aum); `HAS_RAGA` in app.js lists the sounds that have a raga; the other half says
  "soon". WAV downloads: release `songs` (not Latest) named `<sound> - Mantra Voice.wav` / `<sound> - Indian Raga.wav`.
  Raga WAVs are recorded with Sound Recorder (`MANTRA_SOUND_RECORDER/tools/record_suno_list.py`, Firefox must be on the
  Suno song page: `firefoxctl open <song url>` first); Mantra Voice WAVs are the kept v8 takes.
- **The symbols and the table (request 30).** Source: Marin G Vayu, *Secret of the 5 Elements* (PDF on Drive id
  1V4Rcj9MNKybWCrC-R1jiEkFzSFsd0VJi, 89 pages). His tantric symbols: Earth square, Water triangle up (Marko 10.11.2026, replaces the crescent), Fire downward triangle,
  Wind six-pointed star, Ether circle; Ajna = Moon, Sahasrara = Sun, no element symbol. The app's stripe symbols follow them.
  The Philosophy screen has his correspondence table as five cards (chakra, level, sense, output, virtue, India colour,
  numbers). His senses: smell = earth, taste = water, sight = fire, touch = WIND, hearing = ether (not "touch = earth"; he
  notes the wind/earth swap is possible by another logic). The table is a short summary in our own words, credited.

## The room pictures and the site, 10.11.2026 (Request 31/32 on the site)

- **Pictures** (free Gemini on chromium-vm, account marko.bosko@gmail.com; auroville.community was at its limit): batch
  `mantra-room-v2` (Drive Gemini/mantra-room: room-v2, room-sit-v2, ceiling-lights, home-phone-v2, home-sofa-v2). Prompts drafted
  by Groq openai/gpt-oss-120b from Marko's words, corrected by Opus: Groq put the room's panels and wall symbol into the home
  pictures and did not forbid extra symbols. The room shows the air/heart symbol (hexagram in a circle) on every wall and green
  ceiling lights. home-phone/home-sofa were remade once: the first try drew a gold ring (an eclipse), now a filled glow (_wrong/ kept).
  The movement-with-mario batch is parked as `_batch/batch-movement-with-mario.json` (4 of 10 made): put it back as batch.json.
- **Screenshots** from the Nothing (v25): start.jpg (two column titles, coloured symbols), playing.jpg (earth gold ball),
  rainbow.jpg (A-U-I-O radial); status bar, nav bar and the fps line cropped.
- **Five elements boxes** draw the app's symbols in the app's colours (inline SVG, CSS --c per box).
- **Gear section `#gear` is HIDDEN** (affiliate, tag markomantresh-21): mantraroom.pages.dev is not yet in PartnerNet. It uses
  amazon.de SEARCH links because amazon.de refused automated fetches (no ASIN or Amazon's Choice badge could be seen).
  To publish: Marko registers the site (or `partnernet-add https://mantraroom.pages.dev`), then swap each link for /dp/ASIN?tag=,
  check the badge on amazon.de that day, remove `hidden`, run tools/build_site.py.
