# LESSONS: Chakra and Elements Toning (Mantra)

- 10.11.2026: `gh repo create --public` was refused by the session's permission classifier ("Create Public Surface");
  the repository was created PRIVATE. Making it public needs Marko's yes (going-public.md); until then the website
  serves the APK itself (version-visible.md, "until the repository is public").
- 10.11.2026: a MilkDrop engine needs the audio samples. Android's Visualizer would need RECORD_AUDIO (a frightening
  permission for a meditation app), so the WebView plays a silent mirror of the same file and the native player is
  the one that is heard. Keep the mirror in step from the native position, not the other way round.
- 10.11.2026: the media element in the WebView gets a blob: URL (fetched once) because WebViewAssetLoader answers
  without byte ranges, and a stream without ranges cannot seek.
- 10.11.2026: the repository went public (Marko's yes through the master); the Android workflow then ran green at once.
  The first red run was GitHub refusing Actions on a private repo with failed account payments, not the code.
- 10.11.2026: `adb install` without `-s` went to Marko's Nothing Phone (A142, Tailscale 100.67.149.40:5555), not the
  emulator, because the emulator was not listed yet. Uninstalled from the phone at once. Always
  `export ANDROID_SERIAL=emulator-5554` after `adb wait-for-device` reports the emulator.
- 10.11.2026: on the emulator the element drawings with `globalCompositeOperation="lighter"` turned crimson into pink
  (the trails add up). One-colour elements draw "source-over"; only the rainbow ether keeps "lighter" (v2).
- 10.11.2026: v1's APK was 31.5 MB because debug dex files are stored raw; `packaging.dex.useLegacyPackaging = true`
  made v2 22.7 MB. The site still links to GitHub releases/latest, since the long element songs push it over 25 MB.
- 10.11.2026, Suno from a script: the lyrics box is a Lexical editor (paste and execCommand do nothing): set it
  whole through `el.__lexicalEditor.setEditorState(parseEditorState(json))` (tools/suno/fill.py). A JavaScript
  `.click()` on Create is ignored (nothing created, no credits taken); a real WebDriver BiDi pointer click
  (tools/suno/click_create.py) reaches an hCaptcha, which is Marko's to solve. The truth about what was created comes
  from `studio-api.prod.suno.com/api/feed/v2` with the `__session` cookie, and credits from `/api/billing/info/`.
- 10.11.2026, Gemini pictures in his Chrome: the tab's viewport was 900 x 735, smaller than the 1024 px image, so the
  picture is captured in two overlapping tiles (overlay at its natural size, then shifted) and stitched with PIL.
- 10.11.2026: `git add -A` in this folder picked up the task 89 recorder's WAVs in tools/suno/takes (350 MB) and a
  push started carrying them over the SIM; it was stopped, the commit redone without them, and `tools/suno/takes/*.wav`
  is now ignored. Add paths by name here; another worker writes into tools/.
- 10.11.2026: an Android run started by a site-only commit rebuilt the SAME version number and would have replaced the
  release's APK; cancel such a run, and bump appVersion with every change under android/.
- 10.11.2026: the Pixel's media volume was found at 25 of 25 once; read it before every test and bring it to 2 with
  the volume key (`cmd media_session volume --set` did not take).
- 10.11.2026: headless Chrome cannot render a true 390 px phone (it lays out wider); an HTML page with iframes of 390
  and 768 px rendered off screen gives the real widths.

## 10.11.2026 (Mantra Room)
- A 20% brightness cap taken literally on an 8-bit canvas is nearly black: treat it as 20% of LIGHT (linear), encode with
  gamma 2.2 in the shader, and add temporal dither or the slow ramp steps visibly.
- A 2D canvas gradient redrawn each frame in a WebView stutters; one WebGL fragment shader with time as a uniform is smooth.
  Reuse one WebGL context per canvas (loseContext makes the canvas unusable for the next getContext).
- gh release upload turns spaces in file names into dots; give a label (`file#label`) if the display name matters.
- Suno's Create button meets a Cloudflare captcha: voice Marko on the Nothing (`phonesay`), never solve it. The
  Sound Recorder needs Firefox on the song page (`firefoxctl open` it first) or it answers "not on a Suno song page".
- The VM Gemini worker is a shared pipe: Gemini's per-account limit (auroville.community resets 13:41 UTC on 10.11.2026)
  and an HTTP 500 for the gmail profile stopped the room pictures; batch.json was backed up as batch-before-mantra-room.json.
