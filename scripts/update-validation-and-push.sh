#!/usr/bin/env bash
set -euo pipefail

# Never switch/reset the shared human checkout: main may belong to a worktree.
# A failed refresh leaves that checkout and all previously published data intact.
source_root="$(cd "$(dirname "$0")/.." && pwd)"
if git -C "$source_root" rev-parse --git-dir >/dev/null 2>&1; then
  remote_url="$(git -C "$source_root" remote get-url origin)"
else
  # Also supports installation as the existing cron job's standalone launcher.
  remote_url="https://github.com/anpa1200/anpa1200.github.io.git"
fi
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/1200km-validation-XXXXXX")"
trap 'rm -rf -- "$work_dir"' EXIT

git clone --quiet --single-branch --branch main "$remote_url" "$work_dir/site"
cd "$work_dir/site"
npm ci --ignore-scripts
node scripts/update-validation-stats.mjs
npm run build-ai-discovery
npm run build-content
npm run check-release-source

git add external-validation.html assets/validation/stats.json assets/validation/clone-history.json assets/validation/clone-traffic.json data/content-catalog.json llms.txt sitemap.xml sitemap-all.xml
if git diff --cached --quiet; then
  echo "No validation stats changes."
  exit 0
fi
git diff --cached --check
if [[ "${1:-}" == "--dry-run" ]]; then
  git diff --cached --stat
  echo "Dry run complete; no commit or push."
  exit 0
fi
git commit -m "Refresh validation metrics and dated clone observations"
# Ordinary fast-forward push: races/protection failures stop the run; no force.
git push origin HEAD:main
