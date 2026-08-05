#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# This runs unattended from cron in a shared working directory. Without pinning
# to main first, it silently commits/pushes onto whatever branch a human or
# agent last happened to leave checked out here (this has actually happened —
# a stats commit once landed on a feature branch instead of main). Refuse to
# run against a dirty tree (that state belongs to whoever left it) and always
# start from a clean, up-to-date main.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is dirty; leaving it alone and skipping this run." >&2
  exit 1
fi
git fetch origin main --quiet
git checkout main --quiet
git reset --hard origin/main --quiet

node scripts/update-validation-stats.mjs
npm run build-ai-discovery
npm run build-content
npm run check-facts
npm run check-links

if git diff --quiet -- external-validation.html assets/validation/stats.json assets/validation/clone-history.json data/site-facts.json llms.txt data/content-catalog.json; then
  echo "No validation stats changes."
  exit 0
fi

git add external-validation.html assets/validation/stats.json assets/validation/clone-history.json data/site-facts.json llms.txt data/content-catalog.json
git commit -m "Update validation statistics"
git push origin main
