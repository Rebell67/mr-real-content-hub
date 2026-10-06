# Mr Real · Video-Studio

Reels für @mr.r3al (Immobilien, deutschsprachig, 9:16). Der User liefert **Rohclips**, Claude schneidet daraus
fertige Reels im Mr-Real-Stil. **Vor jedem Schnitt `STYLE.md` lesen** – dort steht der (wachsende) Stil.

## Playbook: Rohclip → Reel

1. **Vorbereiten** – `npm run new-reel -- <rohclip> <slug>` → `reels/<slug>/` mit `assets/tight.mp4`
   (Pausen + Füllwörter raus, 1080×1920, 30 fps, SDR, −14 LUFS), `transcript.json` (Wort-Timing), `edit.json`.
   Fehlen Skills/Chrome/Whisper → `npm run setup`.
2. **Inhalt schneiden** – `transcript.json` lesen: Versprecher/doppelte Anläufe finden (letzten sauberen Take
   behalten), stärksten Satz als Hook prüfen, Überlänge kürzen. Schnitte als Clip-Fenster in der Komposition
   (`data-media-start` + `data-duration`, siehe `/hyperframes-core` → `creator-editing-recipes.md`),
   Untertitel-Timing entsprechend verschieben.
3. **Komposition bauen** (`reels/<slug>/index.html`, `/general-video` + `/hyperframes-core`):
   - A-Roll = `assets/tight.mp4` (bzw. mehrere Fenster daraus)
   - Zooms/Punch-ins auf Schlüsselwörter → `/hyperframes-keyframes` (Wrapper animieren, nicht den Clip)
   - Hook-Karte, Bauchbinde, CTA, Fortschrittsbalken aus `compositions/mr-*.html`
   - Zahlen/Beträge als Grafiken → `/hyperframes-animation`, `/hyperframes-registry` (vorher Katalog suchen)
   - Untertitel im Stil aus `STYLE.md`; für „Wort hinter der Person" (Matte) → `/embedded-captions`
   - Musik aus `assets/music/` (oder `/media-use` resolve), mit Ducking unter der Stimme → `/hyperframes-audio`
   - SFX (Whoosh/Pop) über `/media-use`
4. **Prüfen** – `npm run check` muss sauber sein; `npm run snapshot -- --at …` an Schlüsselstellen ansehen
   (Gesicht frei? Text in der Safe-Zone? IG-UI unten/rechts frei?).
5. **Rendern** – `npm run render` → `reels/<slug>/renders/<slug>.mp4`, dem User schicken. Ziel ist immer ein
   **fix fertiges** Reel zum direkten Posten.
   Will der User in CapCut nachbessern: `npm run capcut -- reels/<slug>` → `reels/<slug>/capcut/`
   (fertiges MP4, Video-Ebene, transparente Overlay-Ebene als ProRes-MOV, SRT, Musik/SFX, LIESMICH.txt).
6. **Feedback einarbeiten** – Änderungen umsetzen und **`STYLE.md` aktualisieren** (Regel bestätigen/ändern +
   Zeile im Feedback-Log). So wird der Stil mit jedem Reel genauer.

## Konventionen

- **Ebenen für den CapCut-Export** (in jedem Reel einhalten): A-Roll/B-Roll-`<video>` mit `data-capcut="base"`,
  Musik-`<audio>` mit `data-capcut="music"`, SFX-`<audio>` mit `data-capcut="sfx"`. Alles andere (Untertitel,
  Karten, Grafiken) als **Sub-Composition-Slot** (leeres `<div data-composition-src=…>`) auf Root-Ebene –
  nur so lässt es sich als Overlay-Ebene abtrennen. (`data-layer` ist von HyperFrames reserviert.)

- Sprache aller Bildschirmtexte: Deutsch (de-AT). Transkription immer mit `--language de` und einem
  mehrsprachigen Whisper-Modell (`small`/`medium`/`large-v3`, **nie** `*.en`). Transkript vor Untertiteln
  gegenlesen und Fachbegriffe/Zahlen korrigieren.
- Branding: Hintergrund `#080A0F`/`#0B0E14`, Akzent `#00C389`, Gold `#F7C14B`; Schriften Inter + Space Grotesk
  aus `assets/fonts/` (Pfade root-relativ `assets/fonts/...`, auch in `compositions/`).
- Wiederverwendbare Bausteine in `compositions/mr-*.html` (Master im Studio-Root; `new-reel` kopiert sie ins
  Reel). Bewährt sich ein neues Element über mehrere Reels, als `mr-*`-Baustein in den Master übernehmen.
- Footage (`raw.*`, `tight.mp4`), Renders und Snapshots sind gitignored; committet werden Kompositionen,
  Transkripte, `edit.json`, `STYLE.md`.
- `index.html` im Studio-Root ist die Vorlage/Spielwiese für Bausteine, nicht ein konkretes Reel.

---

# HyperFrames Composition Project

## Skills — USE THESE FIRST

**Always invoke the relevant skill before writing or modifying compositions.** Skills encode framework-specific patterns (e.g., `window.__timelines` registration, `data-*` attribute semantics, shader-compatible CSS rules) that are NOT in generic web docs. Skipping them produces broken compositions.

**Doing anything with HyperFrames?** Start at `/hyperframes` — it tells you what HyperFrames can do and which skill or workflow handles your intent (make a video, TTS / BGM, prep footage, author / animate, render, install blocks), confirms your brief up front (the intent layer), and routes every "make me a…" request (a video, a deck, a composition port) to the right workflow. Read it first, especially when there's no project context to orient you. The workflows it routes to:

- `/product-launch-video` — any **website** URL or brief / script → a product launch / SaaS / promo video, or a site tour / showcase featuring the site's own captured visuals.
- `/faceless-explainer` — arbitrary text (topic / article / notes), **no URL, no website capture** → 60-90s faceless explainer.
- `/embedded-captions` — an existing talking-head video (MP4) → the same footage with captions / subtitles added (rail + embed, or pure-cinematic embed); the footage itself is untouched.
- `/talking-head-recut` — an existing talking-head / interview / podcast video (MP4) → the same footage **packaged with designed graphic overlays** (kinetic titles, lower-thirds, data callouts, pull-quotes, side panels, pip) synced to the transcript; the clip plays unchanged underneath. (Plain captions/subtitles → `/embedded-captions`.)
- `/pr-to-video` — a GitHub PR (URL / `owner/repo#N` / "this PR") → 30-90s code-change explainer (changelog / feature reveal / fix / refactor).
- `/motion-graphics` — a short (typically under 10s) design-led **motion graphic**, motion-is-the-message, no narration: kinetic type, a stat / number count-up, a chart, a logo sting, a lower-third / overlay, or an animated tweet / headline / captured-page highlight; rendered to MP4 or a transparent overlay. Longer / narrated / custom → `/general-video`.
- `/music-to-video` — a **music track** (audio file, video to pull audio from, or one generated from a mood brief) → beat-synced video (lyric / slideshow / kinetic promo). Music drives pacing; user-supplied images / videos are cut onto the same beat grid.
- `/slideshow` — a **presentation / pitch deck / interactive deck** — discrete slides, fragment reveals, branching, hotspot navigation, presenter mode. Output is a navigable deck, not a rendered video.
- `/general-video` — fallback for any other video (title card, longer brand / sizzle reel, multi-scene montage, static loop, custom composition) and the home of **companion mode** — co-create with the full HyperFrames toolbox; the original hyperframes authoring flow, any length.

**Porting an existing composition?** `/remotion-to-hyperframes` translates a Remotion (React) composition into HyperFrames HTML — a source migration, separate from the creation workflows above.

The domain skills (`/hyperframes-core`, `/hyperframes-animation`, `/hyperframes-keyframes`, `/hyperframes-creative`, `/hyperframes-cli`, `/media-use`, `/hyperframes-audio`, `/hyperframes-registry`, `/figma`) and the full capability map live inside `/hyperframes` — it is the single source of truth for which skill handles which intent.

**Changing how real footage or images look or reveal?** Load `/media-use` and read its `references/media-treatments.md` before editing, even when the request only says dark, flat, boring, retro, private, or “make the reveal cooler.” It governs how footage is treated, never whether media may be used. Use canonical media treatments and seek-safe motion; do not improvise equivalent CSS/SVG filters or overlays.

> **Tailwind v4 projects** (`hyperframes init --tailwind`): see `/hyperframes-core` → `references/tailwind.md`.

> **Using a HyperFrames plugin?** Load skills from that installed bundle and follow
> its `hyperframes/references/plugin-installation.md` execution rules. Update via
> the plugin manager, not the standalone commands below.
>
> **Standalone skill missing or stale?** Run `npx hyperframes skills update <name>` to install/refresh
> the specific skill you need (the `/hyperframes` router does this automatically before
> entering a workflow), or bare `npx hyperframes skills update` to refresh the core set plus
> everything already installed — neither pulls the full set. Restart the agent session so
> newly installed skills load.

## Commands

```bash
npm run dev          # human-operated foreground preview (blocks until stopped)
npx hyperframes preview --background  # agent-safe persistent Studio preview
npx hyperframes preview --status      # verify the persistent preview is listening
npx hyperframes preview --stop        # stop it when review is finished
npm run check        # lint + runtime + layout + motion + contrast (one command)
npm run render       # render to MP4
npm run publish      # publish and get a shareable link
npx hyperframes lint --verbose  # include info-level findings
npx hyperframes lint --json     # machine-readable output for CI
npx hyperframes docs <topic> # reference docs in terminal
```

> **Agents must use `npx hyperframes preview --background` for Studio handoff.** Do not rely
> on a shell/tool `run_in_background` wrapper around `npm run dev`: that foreground process
> remains owned by the invoking session and can disappear while the browser stays open,
> leaving refreshes at `ERR_CONNECTION_TIMED_OUT`. Verify with `preview --status`, keep it
> alive through review, and stop it explicitly with `preview --stop` afterward.

> **Back from the desktop app.** Once this project was opened in the HyperFrames desktop app, run `npx hyperframes catch-up` before your next change here: it lists what the person asked Framey in the app and which files changed since.

> **Pinned CLI version.** These scripts pin an exact `hyperframes@X.Y.Z` so this project re-renders identically over time. Weeks later that pin lags fixes shipped since. To move up: `npx hyperframes@latest upgrade --project . --check` (shows the delta), then `npx hyperframes@latest upgrade --project .` to rewrite the pins. Always unpinned — the pinned script re-runs the old version against itself.

## Documentation

**For quick reference**, use the local CLI docs command (no network required):

```bash
npx hyperframes docs <topic>
```

Topics: `data-attributes`, `gsap`, `compositions`, `rendering`, `examples`, `troubleshooting`

**For full documentation**, discover pages via the machine-readable index — do NOT guess URLs:

```
https://hyperframes.heygen.com/llms.txt
```

## Project Structure

- `index.html` — main composition (root timeline)
- `compositions/` — sub-compositions referenced via `data-composition-src`
- `meta.json` — project metadata (id, name)
- `transcript.json` — whisper word-level transcript (if generated)

## Linting — ALWAYS RUN AFTER CHANGES

After creating or editing any `.html` composition, **always** run the full check before considering the task complete:

```bash
npm run check
```

Fix all errors before presenting the result. Warnings should be reviewed before rendering.

## Key Rules

1. Every timed element needs `data-start` and a duration. `data-start` is what marks it as timed; `data-track-index` is an optional Studio display lane the render never reads
2. Give timed visual elements `class="clip"`. The framework keys visibility off `data-start`, not the class, but the shared `.clip` CSS is what gives a scene its full-frame box, and `lint` warns without it
3. Register one paused root timeline per composition on `window.__timelines`:
   ```js
   window.__timelines = window.__timelines || {};
   window.__timelines["composition-id"] = gsap.timeline({ paused: true });
   ```
   Scene timelines manually added to this root must not be paused. A paused
   child does not advance when the root is seeked. The runtime activates
   registered composition siblings, not arbitrary nested scene timelines.
4. A video with sound keeps it on the `<video>` (`data-has-audio="true"`, no `muted`). Use a separate `<audio>` for music, voiceover, replacement audio, J/L cuts, or audio detached in Studio. Silent footage and b-roll: `muted`.
5. Sub-compositions use `data-composition-src="compositions/file.html"` to reference other HTML files
6. Only deterministic logic — no `Date.now()`, no `Math.random()`, no network fetches
