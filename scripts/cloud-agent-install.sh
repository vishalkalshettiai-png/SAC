#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

node tests/planningTransform.test.js
node tests/sacPlanningTable.test.js
node tests/exportPdfButton.test.js
bash scripts/pack-widget.sh
