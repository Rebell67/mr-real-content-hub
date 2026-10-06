#!/usr/bin/env bash
# Cloud-Sessions starten in einem frischen Container: Video-Studio-Werkzeuge nachinstallieren.
set -euo pipefail
[[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]] || exit 0

SETUP="$CLAUDE_PROJECT_DIR/video-studio/scripts/setup.sh"
# Skills synchron (schnell), damit /hyperframes in dieser Session verfügbar ist.
bash "$SETUP" --skills || true
# Chrome + Whisper (Build dauert einige Minuten) im Hintergrund.
nohup bash "$SETUP" >/tmp/video-studio-setup.log 2>&1 &
