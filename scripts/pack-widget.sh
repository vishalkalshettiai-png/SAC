#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/planning-line-race-resources.zip"
rm -f "$out"
(
  cd "$root/sac-widget"
  zip -j "$out" planningTable.js planningTable_styling.js
)
echo "Wrote $out"
