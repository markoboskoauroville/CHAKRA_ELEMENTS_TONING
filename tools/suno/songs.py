# The five element songs for Suno (Marko 10.11.2026: "five new long Suno songs, one per element").
# Same family as "Chakra Toning raga (held notes)" (Suno 39d41591-e755-4dd3-a9d3-cb78e3b0e7c9, V6): its instruments,
# its pentatonic F G A C D on a D drone, its held-note toning, but no spoken guide at all: only the sung vowel.
import json, sys
BASE = ("Indian classical devotional toning for meditation, very slow free tempo; {voice}; "
        "sitar weaving softly between the held notes, tanpura drone and shruti box sustain D, slow gentle tabla theka very soft; "
        "five-note pentatonic F G A C D, A=440; voice warm, dry and upfront, natural instruments; steady, no build, no drop, "
        "about eight minutes, ending with tabla stopping, then sitar fading, then tanpura fading, the shruti box drone fading last")
EXCLUDE = "spoken word, narration, melisma, vibrato, runs, ornamentation, EDM, drum kit, female vocals, rap, autotune, cathedral reverb"
SONGS = [
 ("earth", "Chakra Toning · Earth (A)", "F", "Aaaaaaaaaaaaaaaaaaaaaah",
  "male baritone holds the vowel A on ONE constant low note F, monotone, sustained single held notes with breath pauses between, grounded and heavy like the earth"),
 ("water", "Chakra Toning · Water (U)", "G", "Ooooooooooooooooooooooh",
  "male baritone holds the vowel U on ONE constant note G, monotone, sustained single held notes with breath pauses between, soft and flowing like water"),
 ("fire", "Chakra Toning · Fire (I)", "A", "Eeeeeeeeeeeeeeeeeeeeeee",
  "male baritone holds the vowel I (ee) on ONE constant note A, monotone, sustained single held notes with breath pauses between, bright and projected outwards like fire"),
 ("air", "Chakra Toning · Air (O)", "C", "Ohhhhhhhhhhhhhhhhhhhhhh",
  "male baritone holds the vowel O on ONE constant note C, monotone, sustained single held notes with breath pauses between, open and warm like the heart"),
 ("ether", "Chakra Toning · Ether (A-U-I-O)", "F G A C D", None,
  "solo male baritone with male choir support, free slow improvisation across the five notes F G A C D on all the vowels A U I O, the choir sustaining chords underneath with layered octave doubles"),
 ("om", "Chakra Toning · OM", "D", "Ooooooooooommmmmmmmmmmmm",
  "a classical OM chant: male baritone sings OM very long on the note D, the O open and full, closing slowly into a long humming M, with a quiet male choir doubling it an octave below"),
]
def lyrics(key, note, line):
    out = ["[Intro, no voice: tanpura and shruti box on D, sitar softly]", ""]
    for k in range(8):
        if line:
            out.append(f"[Solo male voice with a quiet male choir, OM sung very long on the note {note}, the M hummed with closed lips, tabla soft]" if key=="om" else f"[Solo male voice, sung ONE constant held note {note}, monotone, no melody, no vibrato, steady like a drone, tabla soft]")
            out += [line] * 6
        else:
            out.append("[Solo male voice with male choir support, free slow improvisation across F G A C D, all the vowels, choir sustaining chords]")
            rot = ["Aaaah, ooooh, eeeee, ohhhh", "Ooooh, eeeee, ohhhh, aaaah", "Eeeee, ohhhh, aaaah, ooooh", "Ohhhh, aaaah, ooooh, eeeee"]
            out += [rot[(k + i) % 4] for i in range(6)]
        out += ["", "[Interlude, no voice: sitar and soft tabla, shruti box on D]", ""]
    out += ["[Outro, no voice: the tabla stops, the sitar fades, the tanpura fades, the shruti box alone on D fading slowly to silence]", "[End]"]
    return "\n".join(out)
specs = []
for key, title, note, line, voice in SONGS:
    style = BASE.format(voice=voice)
    assert len(style) <= 1000, (key, len(style))
    specs.append({"key": key, "title": title, "style": style, "exclude": EXCLUDE, "lyrics": lyrics(key, note, line)})
json.dump(specs, open(sys.argv[1] if len(sys.argv) > 1 else "songs.json", "w"), indent=1, ensure_ascii=False)
for s in specs: print(s["key"], len(s["style"]), len(s["lyrics"]))
