#!/usr/bin/env bash
# Fertiges Reel auf Social-Lautheit bringen (−14 LUFS, True Peak −1 dB), Bild unverändert.
#   bash scripts/loudnorm.sh renders/reel.mp4
set -euo pipefail
in="$1"; tmp="${in%.mp4}.norm.mp4"
stats=$(ffmpeg -hide_banner -nostdin -i "$in" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$stats" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -nostdin -y -i "$in" -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$tmp"
mv "$tmp" "$in"
echo "✓ $(ffmpeg -hide_banner -nostdin -i "$in" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | xargs) → $in"
