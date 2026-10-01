#!/usr/bin/env bash
# Baut die installierbare ZIP des WordPress-Plugins nach dist/immo-rebellen-bewertung.zip
set -euo pipefail
cd "$(dirname "$0")/../wordpress"
mkdir -p ../dist
rm -f ../dist/immo-rebellen-bewertung.zip
zip -rq ../dist/immo-rebellen-bewertung.zip immo-rebellen-bewertung -x '*.DS_Store'
echo "dist/immo-rebellen-bewertung.zip"
