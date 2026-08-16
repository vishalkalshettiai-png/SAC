#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

pack() {
  local out="$1"
  shift
  rm -f "$out"
  (
    cd "$root/sac-widget"
    zip -j "$out" "$@"
  )
  echo "Wrote $out"
}

pack "$root/planning-line-race-resources.zip" planningTable.js planningTable_styling.js
pack "$root/planning-table-resources.zip" sacPlanningTable.js sacPlanningTable_styling.js
pack "$root/export-pdf-resources.zip" exportPdfButton.js exportPdfButton_styling.js

echo "Done. Upload the JSON files and resource zips to SAC Custom Widgets."
