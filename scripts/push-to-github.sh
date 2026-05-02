#!/usr/bin/env bash
# push-to-github.sh — sync current state to GitHub
# Usage: bash scripts/push-to-github.sh "commit message"
#        bash scripts/push-to-github.sh  (uses timestamp message)

set -e

MSG="${1:-"chore: auto-sync $(date '+%Y-%m-%d %H:%M')"}"

echo "🔄 Staging all changes..."
git add -A

# Only commit if there's something to commit
if git diff --cached --quiet; then
  echo "✅ Nothing to commit — working tree clean"
else
  git commit -m "$MSG"
  echo "✅ Committed: $MSG"
fi

echo "🚀 Pushing to GitHub..."
git push github main 2>&1

echo "✅ Pushed to https://github.com/JBlizzard-sketch/nairobi-resto-os"
