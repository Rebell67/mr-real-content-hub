# Mr Real · Reel-Stil (lebendes Dokument)

> Dieser Stil wird mit jedem Reel geschärft. **[v0]** = Startannahme, noch nicht gemeinsam bestätigt.
> **[daten]** = aus deinen eigenen Instagram-Zahlen abgeleitet. **[ref]** = aus einer Referenz übernommen, die „in die richtige Richtung" geht. **[✓]** = vom User bestätigt.
> Nach jedem Feedback: Regel bestätigen, ändern oder streichen und eine Zeile im Feedback-Log schreiben.
> Claude liest diese Datei vor jedem Schnitt.

## Profil-Daten @mr.r3al (Metricool, Feb–Okt 2026, ~240 Reels)

Was nachweislich funktioniert – daran richten wir die Schnitt-Formate aus:

| Format | Beispiel (Views) | Ø Sehdauer | Saves/Shares | Fazit |
|---|---|---|---|---|
| **News/Erklär (Talking Head)** | EZB-Zinswende (22k), ImmoESt-Anhebung (9,9k) | **17–20 s** | hoch (48/119, 80/74) | stärkstes Format für Autorität & Follower → **Hauptformat des Studios** |
| **Objekt-Tour mit Story-Hook** | „DAS bekommst du für knapp 1 MIO" (16,6k), „LEBEN wie ELON MUSK – 7,9 MIO" (11,8k) | **21 s** | hoch (43/114, 46/95) | Preis/Fakten als Grafik-Highlights → zweites Studio-Format |
| KI-Comedy | „Balkon und Katzen" (208k!), „Notfallbier" (9k, 310 Shares) | 8–10 s | Reichweite, wenig Saves | Reichweiten-Booster, kein Schnitt-Fokus |
| Sketch/POV-Comedy | 5–8k | 5–15 s | gering | ok für Reichweite |
| Podcast-/Talk-Ausschnitte (je 3–4 Varianten am selben Tag) | meist 100–600 | 3–7 s | ~0 | **schwächstes Format** → genau hier soll der Schnitt-Stil (Grafiken, SFX, Tempo) die Retention heben |

Abgeleitete Regeln:
- **[daten]** Hooks wie in den Top-Reels: Kontrast/Kehrtwende („Drei Jahre fielen die Zinsen. Gestern war Schluss."),
  Promi-Vergleich + Preis („LEBEN wie ELON MUSK – für 7,9 MIO"), Preis-Frage („DAS bekommst du für knapp 1 MIO").
- **[daten]** Zahlen sind der Star: Leitzins, %, €-Beträge, m² → immer als Grafik (Zähler, Karte), nie nur gesprochen.
- **[daten]** Ziel-Sehdauer: Talk-Clips von heute ~5 s auf **≥ 12 s** heben (Top-Erklärvideos schaffen 17–20 s).
- **[daten]** Objekt-Tour: Fakten-Karten (📍 Bezirk, m², Zimmer, Terrasse, Preis) im Takt der Schnitte einblenden,
  Preis am Schluss als großer Zähler-Moment.

## Grundgefühl

- **[v0]** Energisch, klar, kompetent – „der Immo-Insider, der dir in 30 Sekunden Geld spart".
  Premium statt Clickbait: sauber, dunkel, Brand-Grün als Signal.
- **[ref]** Das Video ist eine **Erklär-Show**: Die Person spricht, die Grafik *zeigt* jede Aussage mit.
  Kaum ein Satz ohne visuelle Entsprechung (Wort, Zahl, Karte, Icon, Collage).
- **[v0]** Länge: 20–60 s. Lieber kürzer und dichter.

## Schnitt

- **[v0]** Keine Pause länger als ~0,25 s hörbar (Pipeline schneidet ab 0,45 s Stille, lässt 0,12 s Luft).
- **[v0]** Füllwörter (äh, ähm, öh) raus. Versprecher/doppelte Anläufe: immer den **letzten** sauberen Take behalten.
- **[v0]** Der stärkste Satz ist der Hook – wenn er später kommt, nach vorne ziehen.
- **[ref]** Visueller Wechsel **alle 1–3 s** (neue Grafik, neues Wort, Zoom, Szenenwechsel).

## Zooms & Kamera

- **[v0]** Punch-in (100 → 112–120 %) auf Zahlen und Schlüsselwörter, hart (0,12 s); an jedem Jump-Cut Zoomstufe wechseln.
- **[v0]** Langsamer Push-in (100 → 105 %) in ruhigeren Passagen.
- **[ref]** Szenenwechsel als Kamera-Move: Person schrumpft in einen **Kreis/Bubble** unten, oben entsteht Raum für
  eine große Erklär-Grafik auf dunkler Bühne (Grid-Hintergrund) – und wieder zurück auf Vollbild.
- **[v0]** Gesicht im oberen-mittleren Bereich frei halten; Grafiken oben (y 200–700), Untertitel Brusthöhe.

## Untertitel

- **[ref]** **1–2 Wörter** pro Einblendung, zentriert auf Brusthöhe, ploppen im Sprechrhythmus.
  Fett (Space Grotesk 700), weiß mit Schatten/Kontur. (`npm run captions`)
- **[v0]** Schlüsselwörter Brand-Grün `#00C389`, Zahlen/Beträge/% Gold `#F7C14B`, stehen allein und poppen stärker.
- **[ref]** Während Hook-Karte und CTA keine Untertitel (Text würde doppelt stehen).
- Transkript vor dem Erzeugen gegenlesen (Fachbegriffe! z. B. „Grunderwerbsteuer").

## Grafiken & Animationen

- **[ref]** **Getippte Überschrift** über dem Kopf für jedes Kapitel/Kernwort (Buchstaben mit Blur reintippen) → `mr-heading`.
- **[ref]** **Zahlen werden animiert**: Zähler laufen hoch (Profilkarte mit Follower-/€-Zähler) → `mr-counter`.
- **[ref]** **Nummerierte Schritte** als glänzende Kachel (1/2/3, farbcodiert Gold/Silber/Bronze/Grün) → `mr-step`.
- **[ref]** Glänzende „App-Icon"-Kacheln (Glas/3D-Look) für Begriffe; können sich zusammensetzen (Puzzle).
- **[ref]** Collagen/Raster aus vielen Bildern, die reinfliegen; einzelne Kachel wird markiert, Rest abgedunkelt; %-Wert groß drüber.
- **[ref]** UI-Metaphern: Copy/Paste-Buttons, rotes X, Timeline-Leiste mit beschrifteten Segmenten, Suchleiste.
- **[ref]** Energie-Effekte sparsam an Höhepunkten (z. B. Blitz/Elektro-Linie, wenn eine Zahl „durchbricht").
- **[ref]** Outro: Logo + Suchleiste, in die der Handle getippt wird.
- **[v0]** Bewegungen: schnell rein (0,3–0,5 s, `power3.out`/`back.out`), kurz raus. Keine Dauer-Wackler.

## Sound

- **[✓]** **Extrem viele Soundeffekte.** Jedes sichtbare Ereignis bekommt einen Sound – Pop, Whoosh, Klick, Tippen,
  Zähler-Ticks, Impact, Ping. Richtwert: **≥ 2 SFX pro Sekunde Grafik-Aktivität**, praktisch nie eine Sekunde ohne.
  (Demo: 42 Effekte auf 20 s.) Lexikon: `assets/sfx/README.md`, Cue-Liste: `sfx.json` → `npm run sfx`.
- **[v0]** Effekte sitzen ~5–10 dB unter der Stimme (Bibliothek normalisiert); Impacts dürfen kurz gleichziehen.
- **[v0]** Gleiche Sounds variieren (pop / pop-high / pop-low abwechseln), damit es nicht mechanisch klingt.
- **[ref]** Dezentes Musikbett (Bass-Fundament) unter der ganzen Länge, geduckt unter der Stimme.
- **[v0]** Stimme auf −14 LUFS (macht die Pipeline).
- Offen: Musik im Video einbrennen oder Trend-Sound in der IG-App drüberlegen? (Lizenz!)

## Hook & Ende

- **[v0]** Hook-Karte in den ersten 0–3 s (Kicker + Hook-Satz), Fortschrittsbalken oben.
- **[ref]** Einstieg mit visuellem „Knall" (z. B. Collage explodiert ins Bild) in der ersten Sekunde.
- **[v0]** Ende: CTA-Karte „@mr.r3al – Folgen" ca. 2–3 s.

## Farben & Typo

- Hintergrund `#080A0F` / `#0B0E14`, Akzent Grün `#00C389`, Gold `#F7C14B`, Text `#F4F6F8`, Grau `#B8C2CF`.
- Schriften: Space Grotesk (Headlines, Untertitel), Inter (Fließtext).
- Offen: Die Referenz arbeitet mit **hellem** Studio-Hintergrund + dunkler Erklär-Bühne. Bleibt Mr Real dunkel,
  oder hell/dunkel im Wechsel? (hängt auch vom echten Drehort ab)

## Referenzen

| Datum | Was | Fazit |
|---|---|---|
| 2026-10-06 | Talking-Head-Erklärvideo (Social-Media-Wachstum, 2:08, deutsch) | „Noch nicht ganz mein Stil, aber richtige Richtung." Übernommen: Erklär-Show-Prinzip, getippte Überschriften, Zähler-Karte, nummerierte Kacheln, Kreis-Bubble-Szenenwechsel, 1–2-Wort-Untertitel, sehr dichte SFX. |

---

## Feedback-Log

| Datum | Reel | Was hat gefallen | Was ändern | Regel-Update |
|---|---|---|---|---|
| 2026-10-06 | (Referenz) | Animationen | – | „extrem viele SFX" → [✓] |
| 2026-10-07 | test-img0827 („Was kann Claude?", Selfie, Büro) | _ausstehend_ | _ausstehend_ | Erkenntnisse: helle Wand + weißes Hemd → Untertitel-Pille & Heading-Hinterlegung nötig; Whisper `medium` erkennt „Claude" korrekt (`small` → „Cloud") |
