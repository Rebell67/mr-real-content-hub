# Mr Real · Video-Studio (HyperFrames)

Schnitt- und Motion-Studio für die Reels von **@mr.r3al** – gebaut auf
[HyperFrames](https://hyperframes.heygen.com) (HTML → MP4). Videos sind HTML-Kompositionen:
Claude Code kann sie schreiben und schneiden, du kannst sie im Studio-Editor im Browser
anfassen (Texte ändern, Clips ziehen/trimmen) und als MP4 rendern.

## Einrichtung

```bash
cd video-studio
npm run setup     # Skills für Claude Code, Chrome (Render), Whisper (Transkription)
```

Voraussetzungen: Node ≥ 22, FFmpeg, cmake + C-Compiler (für den Whisper-Build).
In Claude-Code-Cloud-Sessions erledigt das der SessionStart-Hook (`.claude/hooks/session-start.sh`)
automatisch – Whisper/Chrome laufen dabei im Hintergrund (Log: `/tmp/video-studio-setup.log`).

## Arbeitsablauf

| Schritt | Befehl |
|---|---|
| Rohmaterial ablegen | Clip nach `assets/footage/` kopieren (wird nicht committet) |
| Transkribieren (Deutsch) | `npm run transcribe -- assets/footage/mein-clip.mp4` → `transcript.json` |
| Als Untertitel-Datei | `npm run transcribe -- assets/footage/mein-clip.mp4 --to srt -o renders/mein-clip.srt` |
| Vorschau / Editor | `npm run dev` → http://localhost:3002 |
| Prüfen | `npm run check` (Lint, Layout, Kontrast …) |
| Standbilder | `npm run snapshot -- --at 1.5,5,18.5` |
| Rendern | `npm run render` → `renders/reel.mp4` |

Whisper nutzt das **mehrsprachige** Modell `small` mit `--language de`. Für bessere Qualität:
`npm run transcribe -- <clip> --model medium` (größer, langsamer); `large-v3` für Bestqualität.

### Mit Claude Code

Im Ordner `video-studio/` einfach beschreiben, was du willst – Claude nutzt die
HyperFrames-Skills (`/hyperframes`), z. B.:

- „Nimm `assets/footage/besichtigung.mp4`, setz Hook ‚3 Fragen vor jeder Besichtigung' und rendere das Reel."
- „Füg Untertitel im Mr-Real-Stil zu `assets/footage/q-and-a.mp4` hinzu." (→ `/embedded-captions`)
- „Mach aus dem Talking-Head Clip ein Reel mit Kennzahlen-Einblendungen." (→ `/talking-head-recut`)
- „Schneid die Pausen raus und mach bei 0:12 einen Punch-in."

## Reel-Vorlage (`index.html`, 9:16, 20 s)

| Spur | Baustein | Zeit | Anpassen über |
|---|---|---|---|
| 0 | A-Roll (Video mit Ton) | 0–20 s | Variable `aroll` bzw. `src` |
| 1 | `compositions/mr-hook.html` | 0–3,2 s | `kicker`, `hook` |
| 2 | `compositions/mr-lower-third.html` | 3,5–8 s | `name`, `role` |
| 3 | `compositions/mr-cta.html` | 16,5–20 s | `handle`, `cta`, `button` |
| 4 | `compositions/mr-progress.html` | 0–20 s | `length` (= Reel-Länge) |

Texte pro Reel stehen in `data-variable-values` der jeweiligen Spur. Alle Bausteine nehmen
außerdem `accent` (Standard: Brand-Grün `#00C389`). Ändert sich die Reel-Länge, `data-duration`
von Root, A-Roll und Fortschrittsbalken (+ `length`) anpassen und die CTA ans Ende schieben.

Schriften: Inter + Space Grotesk (lokal in `assets/fonts/`, SIL OFL) – identisch mit dem Content Hub.
Ohne eigenen Clip läuft ein dunkler Platzhalter (`assets/placeholder/`).
