#!/usr/bin/env bash
# Richtet das Video-Studio auf einer frischen Maschine ein:
#   1. HyperFrames-Skills für Claude Code (~/.claude/skills)
#   2. Chrome Headless Shell zum Rendern
#   3. Whisper (whisper.cpp + mehrsprachiges Modell) für Transkription
#
#   bash video-studio/scripts/setup.sh            # alles
#   bash video-studio/scripts/setup.sh --skills   # nur Skills (schnell)
#
# Idempotent: bereits installierte Teile werden übersprungen.
set -euo pipefail

HF="hyperframes@0.8.138"
WHISPER_MODEL="${WHISPER_MODEL:-small}"   # mehrsprachig (Deutsch!) – nicht *.en verwenden
STUDIO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="${HOME}/.cache/hyperframes"

echo "▸ HyperFrames-Skills aktualisieren"
npx --yes "$HF" skills update >/dev/null 2>&1 || echo "  (Skills-Update fehlgeschlagen – offline?)"

[[ "${1:-}" == "--skills" ]] && exit 0

echo "▸ Chrome für lokales Rendern"
npx --yes "$HF" browser ensure >/dev/null

if [[ -x "$CACHE/whisper/whisper.cpp/build/bin/whisper-cli" && -f "$CACHE/whisper/models/ggml-${WHISPER_MODEL}.bin" ]]; then
  echo "▸ Whisper bereits installiert ($WHISPER_MODEL)"
else
  echo "▸ Whisper installieren (baut whisper.cpp, lädt Modell '$WHISPER_MODEL') – dauert ein paar Minuten"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  # Kurzes Stück Stille transkribieren: löst Runtime-Build + Modell-Download aus.
  ffmpeg -hide_banner -loglevel error -f lavfi -i anullsrc=r=16000:cl=mono -t 1 "$tmp/silence.wav"
  npx --yes "$HF" transcribe "$tmp/silence.wav" -d "$tmp" --model "$WHISPER_MODEL" --language de >/dev/null
fi

echo "▸ Umgebung prüfen"
(cd "$STUDIO_DIR" && npx --yes "$HF" doctor | grep -E "FFmpeg|Chrome|whisper" || true)
echo "✓ Video-Studio bereit"
