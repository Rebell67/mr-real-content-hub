import type { ContentIdea } from '../types';
import { assembleScript, generateScript, type Script } from '../lib/scriptGenerator';

export type ScriptSource = 'ai' | 'template';

export interface ScriptResult {
  script: Script;
  source: ScriptSource;
  note?: string;
}

// Fordert ein Skript an: zuerst der echte Claude-Pfad (/api/script), sonst
// die Offline-Vorlage. So funktioniert der Knopf überall – in der gehosteten
// App mit KI, in der Einzeldatei mit der Vorlage.
export async function requestScript(idea: ContentIdea): Promise<ScriptResult> {
  try {
    const res = await fetch('/api/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: idea.title,
        hook: idea.hook,
        format: idea.format,
        angle: idea.angle,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { source: string; sections: Record<string, string> };
      if (data?.sections) {
        return { script: assembleScript(idea, data.sections), source: 'ai' };
      }
    }
    // 404 (keine API / Offline-Datei) oder 503 (kein Key) → still auf Vorlage zurückfallen.
  } catch {
    /* Netzwerk nicht verfügbar (Offline-Datei) – Vorlage nutzen */
  }

  return {
    script: generateScript(idea),
    source: 'template',
    note: 'Vorlage (kein Claude-Zugang aktiv – in gehosteter Version schreibt Claude live)',
  };
}
