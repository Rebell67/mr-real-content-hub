# Mr Real Content OS – bei Vercel hosten (Live-Version)

Kostenlos. Dauer: ~10 Minuten. Am Code muss nichts geändert werden.

## 1. Vercel-Konto & Projekt importieren
1. Auf **vercel.com** → **Sign Up** → **Continue with GitHub** (das GitHub-Konto nehmen, in dem `mr-real-content-hub` liegt).
2. GitHub-Zugriff erlauben (mind. für das Repo `mr-real-content-hub`).
3. Dashboard → **Add New… → Project**.
4. `mr-real-content-hub` auswählen → **Import**.
5. Vercel erkennt automatisch: Framework **Vite**, Build `npm run build`, Output `dist`. **Nichts ändern.**
6. **Deploy** klicken → 1–2 Min warten → fertige URL, z. B. `mr-real-content-hub.vercel.app`.

## 2. Schlüssel setzen (für die Live-Funktionen)
Projekt → **Settings → Environment Variables**. Jeweils Name + Value, „Production" ankreuzen, Save. Danach einmal **Redeploy** (Deployments → … → Redeploy).

| Variable | Wofür | Pflicht? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude schreibt Skripte in deinem Stil + bewertet die News | Für KI-Skripte **ja** (Key von console.anthropic.com, Pay-per-use) |
| `NEWS_FEEDS` | Eigene RSS-Feeds statt Standard | nein |
| `TRENDS_PROVIDER_URL` + `TRENDS_API_KEY` | Live-Outlier-Trends (z. B. EnsembleData) | nein (kostenpflichtig) |
| `METRICOOL_USER_TOKEN` / `METRICOOL_USER_ID` / `METRICOOL_BLOG_ID` | Metricool-Live-Zahlen | nein (Advanced-Abo) |

**Wichtig:** Der `ANTHROPIC_API_KEY` ist NICHT dein claude.ai-Chat-Abo. Er kommt von **console.anthropic.com → API Keys** und wird nutzungsabhängig abgerechnet (Cent-Beträge pro Skript).

Der **News-Radar läuft auch OHNE jeden Key** – dann werden echte, tagesaktuelle Meldungen nur heuristisch (statt per Claude) bewertet.

## 3. Was danach automatisch läuft
- **News-Radar**: bei jedem Refresh echte, tagesaktuelle Meldungen (gratis via RSS).
- **Skript erstellen / Skript daraus**: Claude schreibt live in deinem Stil (mit `ANTHROPIC_API_KEY`).
- **Auto-Deploy**: jeder Git-Push aktualisiert die Seite von selbst.

## 4. Privat halten
- **noindex** ist bereits eingebaut → Google/Bing listen die Seite nicht.
- Echter **Passwortschutz**: Vercel → Settings → **Deployment Protection**. Zuverlässiger Passwortschutz für die Live-Seite ist ein **Pro-Feature**; im Free-Plan ist v. a. der unauffindbare Link + noindex die einfache Lösung.
