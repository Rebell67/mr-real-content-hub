# Mr Real · Content OS

Ein internes „Betriebssystem" für die Content-Produktion, Analyse und Wachstums­strategie der Immobilien-Personal-Brand **Mr Real** (`@mr.r3al`).

Kein generisches Social-Media-Dashboard, sondern ein Werkzeug, das aus Daten **Entscheidungen, Empfehlungen, Content-Ideen und konkrete nächste Schritte** ableitet – mit dem Ziel: **20.000 Follower bis 31.12.** und dauerhaft **500k–1 Mio. Impressionen / Monat**.

---

## Features

| Bereich | Was es leistet |
|---|---|
| **Cockpit** | KPI-Überblick, Zielprognose (schaffe ich die 20k?), Impressionen-Gauge, Reichweiten-Trend, Prioritäten des Tages, Top-Content & Format-Performance. |
| **Analytics** | Plattform-übergreifende & einzelne Analyse (IG / TikTok / YT Shorts / FB), Follower-Wachstum, Impressionen/Reichweite, Plattform-Vergleichstabelle, Posting-Zeiten-Heatmap. |
| **Redaktionsplan** | Kanban-Pipeline (Idee → Skript → Dreh → Schnitt → Geplant) + Monats-Kalender. |
| **Ideen & Formate** | Wiederkehrende Formate mit strategischem Zweck, kuratierter Ideen-Pool, Ideen-Generator (Format × Thema → Hook). |
| **Strategie** | Nordstern, datenbasierte Empfehlungen mit konkreter Handlung & erwartetem Impact, empfohlener Content-Mix, Monats-Meilensteine. |
| **Bibliothek** | Durchsuchbares Content-Archiv mit Filtern, Sortierung und Detail-Ansicht inkl. Performance & Learnings. |
| **Daten & Setup** | Datenquellen-Umschaltung, Metricool-API-Konfiguration, CSV/JSON-Import (Drag & Drop) und Export. |

---

## Tech-Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** (eigenes „Mr Real"-Design-System, Dark-First)
- **Recharts** für Charts, **lucide-react** für Icons
- **React Router** für Navigation
- Keine Backend-Abhängigkeit – läuft vollständig im Browser

## Schnellstart

```bash
npm install
npm run dev      # Dev-Server (http://localhost:5173)
npm run build    # Produktions-Build
npm run preview  # Build lokal ansehen
```

---

## Architektur der Datenschicht

Alle Daten fließen durch **eine einzige austauschbare Schnittstelle** – die UI kennt die Quelle nicht. Quelle wechseln = eine Zeile ändern, kein UI-Umbau.

```
src/
├─ types/            # Domänen-Modell (Platform, Post, DailyMetric, Goal …)
├─ services/
│  ├─ DataService.ts       # Interface – der einzige Daten-„Seam"
│  ├─ MockDataService.ts   # Deterministische Demo-Daten (Default)
│  └─ MetricoolService.ts  # Metricool-Anbindung (vorbereitet)
├─ data/             # Mock-Generator, Formate, Ideen-Bank
├─ lib/
│  ├─ analytics.ts   # KPIs, Zielprognose, Format-Performance, Empfehlungs-Engine
│  ├─ dataIO.ts      # CSV/JSON Import & Export
│  └─ format.ts      # Zahlen-/Datumsformatierung (de-AT)
├─ state/HubContext.tsx     # Lädt Daten, hält State, Quelle umschalten
├─ components/       # UI-Primitives, Layout, Charts
└─ pages/            # Cockpit, Analytics, Planner, Ideas, Strategy, Library, Settings
```

### Data-Service-Interface

```ts
interface DataService {
  id: string;
  label: string;
  isConfigured(): boolean;
  fetchHubData(): Promise<HubData>;
}
```

`HubData` normalisiert alles in ein plattform-agnostisches Format – egal ob die
Daten aus Metricool, einem nativen Plattform-Export oder einem CSV kommen.

---

## Metricool anbinden

Die Abruf- und Normalisierungs-Schicht ist bereits vorhanden
(`src/services/MetricoolService.ts`). So wird sie live geschaltet:

1. In der App **Daten & Setup → Metricool-Verbindung** öffnen und `API Token`,
   `User ID` und `Brand/Blog ID` hinterlegen.
2. Den Live-Pfad in `MetricoolService.fetchHubData()` aktivieren – pro Netzwerk
   werden die Timelines abgerufen und über `normalizeMetricoolTimeline()` in
   `DailyMetric[]` überführt (Mapping ist im Code dokumentiert).
3. Datenquelle in den Einstellungen auf **Metricool API** stellen.

> **Sicherheitshinweis:** Aktuell wird der Token nur im `localStorage` gehalten.
> Für den Produktivbetrieb sollte der Abruf über ein Backend/Proxy laufen, damit
> der Token nicht im Client liegt. Der `MetricoolService` ist so geschnitten,
> dass nur die `fetch`-Adresse getauscht werden muss.

## Eigene Daten importieren (CSV / JSON)

**Daten & Setup → Import & Export**, Datei per Drag & Drop ablegen.

Erwartete CSV-Spalten:

```
date, platform, followers, impressions, reach, engagements, profileViews
2026-07-10, instagram, 4210, 28400, 18900, 1520, 410
2026-07-10, tiktok,    3180, 41200, 26100, 2890, 0
```

- `platform` akzeptiert `instagram|tiktok|youtube|facebook` (auch `ig`, `tt`, `yt`, `fb`).
- `followerChange` wird automatisch aus aufeinanderfolgenden Followerzahlen berechnet.
- Eine Vorlage lässt sich direkt in der App herunterladen.
- JSON: entweder ein `DailyMetric[]`-Array oder ein komplettes `HubData`-Objekt.

---

## Beispieldaten

Die mitgelieferten Demo-Daten sind **deterministisch** (fester Seed) und bewusst so
kalibriert, dass der Account *mitten auf dem Weg* ist: ~10.800 Follower auf einer
Kurve, die knapp unter 20k landet, und ~455k Impressionen/Monat – so werden
Zielprognose und Empfehlungen greifbar. Vier Beispiel-Posts basieren auf realen
Mr-Real-Entwürfen („50.000 gespart – reicht das?", „Wohnen zur Miete, kaufen als
Investment", „Du schaufelst dir dein eigenes Grab", „Ohne Erbe keine Immobilie").
