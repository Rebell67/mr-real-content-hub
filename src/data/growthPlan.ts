import type { ContentFormatId, Platform } from '../types';

// ---------------------------------------------------------------------------
// Der Wachstums-Fahrplan für Mr Real – abgeleitet aus dem echten Metricool-
// Snapshot (Stand 11.07.2026): 2.347 Follower, IG trägt 89%, ein TikTok-
// Ausreißer am 06.07 (+95 Follower / 33k Views). Fokus: maximale Reichweite
// und Follower-Wachstum über kurzes, meinungsstarkes Video.
// ---------------------------------------------------------------------------

export interface GrowthLever {
  id: string;
  emoji: string;
  title: string;
  insight: string; // was die echten Daten sagen
  action: string; // was konkret zu tun ist
  color: string;
}

export const GROWTH_LEVERS: GrowthLever[] = [
  {
    id: 'tiktok',
    emoji: '🚀',
    title: 'TikTok-Offensive – dein größter Hebel',
    insight:
      'Am 06.07 kamen an EINEM Tag +95 Follower und 33.000 Views – dein bisher stärkstes Signal. TikTok hat bei dir das mit Abstand höchste virale Potenzial, ist aber noch klein (187 Follower).',
    action:
      'Ab sofort täglich 1 TikTok. Analysiere das 06.07-Video (Thema, Hook, Länge, Audio) und baue 5 Varianten davon. TikTok belohnt Menge + Konstanz stärker als jede andere Plattform.',
    color: '#22D3EE',
  },
  {
    id: 'instagram',
    emoji: '📸',
    title: 'Instagram Reels als Wachstums-Motor',
    insight:
      'Instagram ist mit 2.087 Followern dein Fundament (89%) und wächst am stabilsten. Reels mit hoher Reichweite (z.B. 12.500 am 14.06) zeigen: Video zieht, statische Posts nicht.',
    action:
      'Täglich 1 Reel (kein Foto-Content für Wachstum). Jeden Reel mit Broad-Hook öffnen, der auch Nicht-Käufer stoppt. Reels = 100% deiner IG-Energie bis zum Ziel.',
    color: '#E4477E',
  },
  {
    id: 'recycling',
    emoji: '♻️',
    title: '1 Dreh → 4 Plattformen',
    insight:
      'Du produzierst zu wenig für zu wenige Kanäle. YouTube (57) und Facebook (16) laufen quasi leer, obwohl der Content schon existiert.',
    action:
      'Jedes Video ohne Mehraufwand als TikTok + IG Reel + YouTube Short + FB Reel ausspielen. Gleicher Dreh, 4x Reichweite. Untertitel immer einbrennen (viele schauen ohne Ton).',
    color: '#12D99A',
  },
  {
    id: 'hooks',
    emoji: '🪝',
    title: 'Hook-Maschine statt Zufall',
    insight:
      'Deine Reichweiten-Ausschläge korrelieren klar mit starken, polarisierenden Aufhängern – nicht mit dem Thema an sich. Der Hook entscheidet über 90% der Reichweite.',
    action:
      'Erste 1,5 Sekunden = steile These oder „Du"-Ansprache mit Konsequenz. Schreibe pro Video 3 Hook-Varianten, nimm die drastischste. Kein „Heute erkläre ich euch…“.',
    color: '#F7C14B',
  },
];

export interface WeekdayPlan {
  day: string;
  format: ContentFormatId;
  focus: string;
  platforms: Platform[];
}

// Fester Wochen-Rhythmus: 1 Video/Tag, reichweiten-lastig.
export const WEEKLY_RHYTHM: WeekdayPlan[] = [
  { day: 'Mo', format: 'hot-take', focus: 'Steile Wochen-Meinung (Reichweite)', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'] },
  { day: 'Di', format: 'explainer', focus: 'Erklär-Stück mit Rechnung (Saves)', platforms: ['instagram', 'tiktok', 'youtube'] },
  { day: 'Mi', format: 'myth-buster', focus: 'Mythos-Check (Shares + Diskussion)', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'] },
  { day: 'Do', format: 'explainer', focus: 'Zahlen/Vergleich (Autorität)', platforms: ['instagram', 'tiktok'] },
  { day: 'Fr', format: 'hot-take', focus: 'Kontroverser Freitags-Take', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'] },
  { day: 'Sa', format: 'story', focus: 'Persönliche Story / Makleralltag (Bindung)', platforms: ['instagram', 'tiktok'] },
  { day: 'So', format: 'behind-the-scenes', focus: 'Behind the Scenes / nahbar', platforms: ['tiktok', 'instagram'] },
];

export interface PlannedContent {
  day: number; // 1..14
  weekday: string;
  title: string;
  hook: string;
  format: ContentFormatId;
  platforms: Platform[];
  goal: 'reichweite' | 'follower' | 'bindung' | 'autorität';
}

// Konkreter 14-Tage-Startplan – sofort umsetzbar.
export const CONTENT_CALENDAR: PlannedContent[] = [
  { day: 1, weekday: 'Mo', title: 'Mieten ist rausgeworfenes Geld?', hook: 'Der teuerste Satz, den deine Eltern dir beigebracht haben.', format: 'hot-take', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'], goal: 'reichweite' },
  { day: 2, weekday: 'Di', title: 'So viel Wohnung für 1.500 €/Monat', hook: 'Deine Rate → dein Kaufpreis. Live gerechnet in 45 Sekunden.', format: 'explainer', platforms: ['instagram', 'tiktok', 'youtube'], goal: 'follower' },
  { day: 3, weekday: 'Mi', title: '„Ohne Erbe keine Immobilie" – Mythos', hook: '„Ich erbe ja nichts" – die teuerste Ausrede deines Lebens.', format: 'myth-buster', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'], goal: 'reichweite' },
  { day: 4, weekday: 'Do', title: '400.000 € in Wien vs. Graz', hook: 'Gleiches Geld, zwei Städte – der Unterschied schockiert.', format: 'explainer', platforms: ['instagram', 'tiktok'], goal: 'autorität' },
  { day: 5, weekday: 'Fr', title: 'Makler sind überflüssig?', hook: '„Wozu noch Makler?" – meine ehrliche, unbequeme Antwort.', format: 'hot-take', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'], goal: 'reichweite' },
  { day: 6, weekday: 'Sa', title: 'Mein 30.000-€-Fehler', hook: 'Ein Satz bei der Besichtigung hat mir einen Deal zerstört.', format: 'story', platforms: ['instagram', 'tiktok'], goal: 'bindung' },
  { day: 7, weekday: 'So', title: 'Besichtigung: Schimmel entlarven', hook: 'Diese 3 Stellen verraten jeden vertuschten Wasserschaden.', format: 'behind-the-scenes', platforms: ['tiktok', 'instagram'], goal: 'follower' },
  { day: 8, weekday: 'Mo', title: 'Mit 25 die erste Wohnung', hook: 'Kein Erbe, Durchschnittsgehalt – trotzdem Eigentum. So.', format: 'hot-take', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'], goal: 'reichweite' },
  { day: 9, weekday: 'Di', title: 'Die versteckten 10% Nebenkosten', hook: 'Der Kaufpreis ist nur der Anfang – das übersehen fast alle.', format: 'explainer', platforms: ['instagram', 'tiktok', 'youtube'], goal: 'follower' },
  { day: 10, weekday: 'Mi', title: '3 Lügen in jedem Inserat', hook: '„Ruhige Lage", „gemütlich", „Anfragen erbeten" – Klartext.', format: 'myth-buster', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'], goal: 'reichweite' },
  { day: 11, weekday: 'Do', title: 'Miete vs. Kauf: 250.000 €', hook: '20 Jahre mieten oder kaufen? Ich rechne es gnadenlos vor.', format: 'explainer', platforms: ['instagram', 'tiktok'], goal: 'autorität' },
  { day: 12, weekday: 'Fr', title: 'Wer jetzt nicht kauft…', hook: 'Wer mit 30 keinen Plan für Eigentum hat, gräbt sich sein Grab.', format: 'hot-take', platforms: ['tiktok', 'instagram', 'youtube', 'facebook'], goal: 'reichweite' },
  { day: 13, weekday: 'Sa', title: 'Ein Tag als Makler', hook: '5 Besichtigungen, 1 Bieterkrieg – so lief mein Samstag.', format: 'story', platforms: ['instagram', 'tiktok'], goal: 'bindung' },
  { day: 14, weekday: 'So', title: 'Ich bewerte eure Wohnungen', hook: 'Schickt mir euer Inserat – ich sage schonungslos, was es wert ist.', format: 'behind-the-scenes', platforms: ['tiktok', 'instagram'], goal: 'follower' },
];

export interface ReachRule {
  title: string;
  detail: string;
}

export const REACH_RULES: ReachRule[] = [
  { title: 'Hook in 1,5 Sekunden', detail: 'These oder „Du“-Ansprache sofort. Kein Intro, kein „Servus, heute…“.' },
  { title: 'Untertitel immer einbrennen', detail: 'Der Großteil schaut ohne Ton. Ohne Text = keine Reichweite.' },
  { title: 'Trend-Audio auf TikTok', detail: 'Aktuellen Sound leise drunterlegen – pusht die Ausspielung spürbar.' },
  { title: 'Erster Kommentar von dir', detail: 'Stelle direkt eine Frage, die zum Antworten zwingt. Kommentare = Reichweite.' },
  { title: 'Klarer Follow-CTA am Ende', detail: '„Folge für Teil 2“ – Wachstum passiert nur mit expliziter Aufforderung.' },
  { title: '9–21 Uhr posten', detail: 'In den Peak-Fenstern posten (siehe Analytics-Heatmap), nicht nachts.' },
  { title: 'Serien statt Einzelstücke', detail: 'Wiederkehrende Formate mit gleichem Titel-Layout = Wiedererkennung + Abo.' },
  { title: 'Antworte in Stunde 1', detail: 'Auf jeden frühen Kommentar reagieren – hält das Video im Push-Fenster.' },
];

export interface Milestone {
  month: string;
  target: number;
  note: string;
}

// Ambitionierte, aber gestaffelte Leiter Richtung 20.000.
export const GROWTH_MILESTONES: Milestone[] = [
  { month: 'Ende Juli', target: 3200, note: 'Rhythmus etablieren: 1 Video/Tag über alle Kanäle.' },
  { month: 'Ende August', target: 5500, note: 'Erste virale Wiederholung des TikTok-Effekts.' },
  { month: 'Ende September', target: 9000, note: '2–3 Formate haben sich als Reichweiten-Bringer etabliert.' },
  { month: 'Ende Oktober', target: 13000, note: 'Serien laufen, Cross-Posting sitzt, YouTube zieht an.' },
  { month: 'Ende November', target: 17000, note: 'Skalierung: beste Hooks systematisch recyceln.' },
  { month: '31. Dezember', target: 20000, note: 'Zielkorridor – erreichbar mit konstanter viraler Trefferquote.' },
];
