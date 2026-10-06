# SFX-Bibliothek

Basis: 20 Effekte aus HyperFrames/media-use (Pixabay Content License – kommerziell frei, siehe `CREDITS.md`).
Varianten (`pop-high`, `pop-low`, `whoosh-fast`, `whoosh-deep`, `whoosh-reverse`, `tick`, `counter-roll`,
`impact-short`, `glitch-short`, `riser-short`) sind daraus abgeleitet (Pitch/Trim/Reverse).
Alle Dateien sind auf **−20 dBFS Spitzen-RMS** normalisiert (Lautstärke 1.0 ≈ 5 dB unter der Stimme).
`riser`: Höhepunkt bei **3,4 s** (danach Stille) · `riser-short`: Höhepunkt bei **2,3 s**.
Eigene Effekte einfach hier ablegen (vorher ebenfalls normalisieren) (nur lizenzfreie/gekaufte!) und unten eintragen.

## Lexikon: Ereignis → Sound

| Ereignis im Bild | Sound |
|---|---|
| Karte/Element fliegt rein | `whoosh-fast`, `whoosh` |
| Element poppt auf (Badge, Icon, Kachel) | `pop`, `pop-high` (abwechseln!) |
| Element verschwindet / wird eingesaugt | `whoosh-reverse`, `pop-low` |
| Wort/Heading tippt sich ein | `typing`, `key-press` |
| Klick/Auswahl/Hervorhebung | `click`, `click-soft` |
| Zähler läuft hoch | `counter-roll` (+ `ping` am Ende) |
| Zahl/Ergebnis landet | `ping`, `sparkle` |
| Punch-in-Zoom / Headline-Slam | `impact-short`, `impact-bass-1` |
| Szenenwechsel (hell ↔ dunkel) | `whoosh-deep`, `whoosh-cinematic` |
| Aufbau zur Pointe | `riser-short` (endet auf der Pointe) |
| Falsch / Fehler / rotes X | `error`, `glitch-short` |
| Erfolg / Häkchen | `chime`, `notification` |
| Glitch-Übergang | `glitch-1`, `glitch-3` |

Standard-Lautstärken stehen in `scripts/sfx.mjs` (`DEFAULT_VOL`); pro Cue mit `"v"` überschreibbar.
