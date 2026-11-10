# LESSONS: Chakra and Elements Toning (Mantra)

- 10.11.2026: `gh repo create --public` was refused by the session's permission classifier ("Create Public Surface");
  the repository was created PRIVATE. Making it public needs Marko's yes (going-public.md); until then the website
  serves the APK itself (version-visible.md, "until the repository is public").
- 10.11.2026: a MilkDrop engine needs the audio samples. Android's Visualizer would need RECORD_AUDIO (a frightening
  permission for a meditation app), so the WebView plays a silent mirror of the same file and the native player is
  the one that is heard. Keep the mirror in step from the native position, not the other way round.
- 10.11.2026: the media element in the WebView gets a blob: URL (fetched once) because WebViewAssetLoader answers
  without byte ranges, and a stream without ranges cannot seek.
