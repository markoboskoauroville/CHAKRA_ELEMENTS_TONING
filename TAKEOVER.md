# TAKEOVER: Chakra and Elements Toning (Mantra)

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
  When they exist: replace `assets/web/audio/<element>.ogg`, keep the names, raise appVersion.

## Where it stands (10.11.2026)

- Public repository (Marko's yes). Release **v2** Latest, workflow green. v1 tested on the Pixel 7 emulator
  (Pixel_7_API_35): home, Guide with MilkDrop and its controls, Elements (five stripes), Fire full screen looping,
  Breath, playback going on with the screen locked (foreground media service). v2 = colours kept true + smaller APK.
- Website chakra-and-elements-toning.pages.dev, folder `site/`, deployed by `.github/workflows/site.yml` (Cloudflare
  Pages) once the secret CLOUDFLARE_API_TOKEN is on the repo (Marko's paste). Pictures: hero and lifestyle by Gemini
  (Nano Banana) in his Chrome; the three cards are the app's own emulator screenshots. Donation bowl, SEO, counter
  `data-dl-app="chakratoning"` on both buttons, which open GitHub releases/latest. Card 22 on markobosko.pages.dev #/kod.
- Not tested by a hand: how loud the guide and loops are on a real phone, the feel of the taps, the lock screen
  controls pressed by a finger.
