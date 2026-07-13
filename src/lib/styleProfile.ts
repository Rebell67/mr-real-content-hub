// ---------------------------------------------------------------------------
// Stil-Profil für Mr Real.
//
// Dieses Profil beschreibt Mr Reals Stimme und wird dem Skript-Generator als
// Vorlage mitgegeben – so klingen die Skripte nach IHM, nicht generisch.
// Editierbar in „Daten & Setup" und im Browser (localStorage) gespeichert.
// ---------------------------------------------------------------------------

export type Dialect = 'hochdeutsch' | 'leicht-oesterreichisch' | 'oesterreichisch';

export interface StyleProfile {
  tone: string;
  dialect: Dialect;
  signature: string; // fester Abschluss / CTA-Ton
  catchphrases: string[];
  avoid: string[];
  examples: string[]; // echte Zeilen in seiner Stimme = Stil-Anker für Claude
}

// Default aus Mr Reals Positionierung + seinen echten Entwürfen abgeleitet.
export const DEFAULT_STYLE: StyleProfile = {
  tone: 'Direkt, meinungsstark und selbstbewusst – aber nahbar und ehrlich. Kein Corporate-Sprech, keine Maklerwerbung. Du sprichst den Zuschauer immer mit „du" an und kommst schnell auf den Punkt.',
  dialect: 'leicht-oesterreichisch',
  signature: 'Folge für ehrliche Immobilien-Insights aus Österreich – ohne Maklergeschwätz.',
  catchphrases: ['Lass uns ehrlich rechnen.', 'Klartext:', 'Das sagt dir sonst keiner.'],
  avoid: ['Fachchinesisch', 'Behördendeutsch', 'übertriebene Superlative', 'Maklerwerbung', 'gestelzte Sätze'],
  // Mr Reals echte Hooks – dienen Claude als Stimm-Vorlage:
  examples: [
    'Du hast 50.000 € gespart und denkst, du kannst kaufen? Lass uns ehrlich rechnen.',
    'Der Trick der Reichen: Sie mieten, wo sie leben – und kaufen, wo es Rendite gibt.',
    'Wer mit 30 noch keinen Plan für Eigentum hat, gräbt sich finanziell sein eigenes Grab.',
    '„Ich erbe ja nichts" – die teuerste Ausrede deines Lebens. Hier ist der Gegenbeweis.',
  ],
};

const LS_STYLE = 'mrreal.style';

export function loadStyle(): StyleProfile {
  try {
    const raw = localStorage.getItem(LS_STYLE);
    if (raw) return { ...DEFAULT_STYLE, ...(JSON.parse(raw) as Partial<StyleProfile>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_STYLE;
}

export function saveStyle(style: StyleProfile): void {
  try {
    localStorage.setItem(LS_STYLE, JSON.stringify(style));
  } catch {
    /* storage voll – ignorieren */
  }
}

export function resetStyle(): void {
  try {
    localStorage.removeItem(LS_STYLE);
  } catch {
    /* ignore */
  }
}

const DIALECT_TEXT: Record<Dialect, string> = {
  hochdeutsch: 'Schreibe in klarem, modernem Hochdeutsch.',
  'leicht-oesterreichisch':
    'Schreibe in Hochdeutsch mit leicht österreichischem Einschlag (natürliche AT-Formulierungen, „eh", „passt") – sparsam und immer gut verständlich.',
  oesterreichisch:
    'Schreibe locker österreichisch gefärbt (Austriazismen, umgangssprachlich), aber weiterhin klar verständlich.',
};

// Baut den Stil-Block für den Claude-System-Prompt (eine Quelle der Wahrheit).
export function styleToPromptBlock(style: StyleProfile): string {
  const lines: string[] = [];
  lines.push('SCHREIB-STIL VON MR REAL – halte dich strikt daran:');
  lines.push(`- Ton: ${style.tone}`);
  lines.push(`- Sprache: ${DIALECT_TEXT[style.dialect]}`);
  if (style.catchphrases.length) {
    lines.push(`- Typische Wendungen (gelegentlich, nicht erzwungen einbauen): ${style.catchphrases.join(' · ')}`);
  }
  if (style.avoid.length) {
    lines.push(`- Unbedingt vermeiden: ${style.avoid.join(', ')}.`);
  }
  if (style.signature) {
    lines.push(`- Der CTA am Ende soll im Geist von: „${style.signature}" sein.`);
  }
  if (style.examples.length) {
    lines.push('- So klingt Mr Real (nutze diese Zeilen als Stimm-Vorlage, aber kopiere sie nicht wörtlich):');
    for (const ex of style.examples) lines.push(`  • ${ex}`);
  }
  return lines.join('\n');
}
