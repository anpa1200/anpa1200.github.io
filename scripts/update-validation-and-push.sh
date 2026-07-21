#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node scripts/update-validation-stats.mjs
npm run check-facts
npm run check-links

if git diff --quiet -- external-validation.html assets/validation/stats.json data/site-facts.json; then
  echo "No validation stats changes."
  exit 0
fi

git add external-validation.html assets/validation/stats.json data/site-facts.json
git commit -m "Update validation statistics"
git push
