#!/usr/bin/env bash
set -eu
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")/.."

CO_AUTHOR='Co-authored-by: Cursor <cursoragent@cursor.com>'

msg_for() {
  f="$1"
  base=$(basename "$f")
  name="${base%.*}"

  case "$f" in
    .env.example)
      echo "Add environment variable template for local setup."
      ;;
    README.md)
      echo "Update project README for Swahili Trail tourism app."
      ;;
    package.json)
      echo "Add app dependencies and fetch-place-photos script."
      ;;
    package-lock.json)
      echo "Sync package-lock with installed dependencies."
      ;;
    next.config.ts)
      echo "Allow remote image hosts used by places and events."
      ;;
    src/app/favicon.ico)
      echo "Remove default Next.js favicon in favor of brand icons."
      ;;
    src/app/globals.css)
      echo "Add coastal design tokens and theme styles."
      ;;
    src/app/layout.tsx)
      echo "Wire root layout with fonts, theme, and shell."
      ;;
    src/app/page.tsx)
      echo "Rebuild homepage hero with Coast Now and coastal sections."
      ;;
    public/places/*)
      echo "Add Google Places photo for ${name}."
      ;;
    public/brand/*)
      echo "Add brand asset ${base}."
      ;;
    public/favicon.svg|public/favicon-32.png)
      echo "Add site favicon ${base}."
      ;;
    scripts/fetch-place-photos.mjs)
      echo "Add script to download Google Places photos locally."
      ;;
    scripts/place-photo-targets.json)
      echo "Add place photo fetch targets for coast venues."
      ;;
    scripts/place-photo-fetch-log.json)
      echo "Record place photo fetch results for debugging."
      ;;
    scripts/commit-each-file.sh)
      echo "Add helper script to commit files individually."
      ;;
    src/proxy.ts)
      echo "Add Clerk auth proxy for protected routes."
      ;;
    supabase/schema.sql)
      echo "Add Supabase schema for trips and analytics."
      ;;
    src/app/api/*)
      echo "Add API route ${f#src/app/api/}."
      ;;
    src/components/*)
      echo "Add UI component ${f#src/components/}."
      ;;
    src/lib/data/*)
      echo "Add coastal data module ${base}."
      ;;
    src/lib/*)
      echo "Add library module ${f#src/lib/}."
      ;;
    src/app/*)
      echo "Add app route ${f#src/app/}."
      ;;
    *)
      echo "Add ${f}."
      ;;
  esac
}

TMP=$(mktemp)
git status -u --porcelain > "$TMP"

# Append .env.example (gitignored by .env*) — template only, not secrets
if [ -f .env.example ]; then
  printf '?? .env.example\n' >> "$TMP"
fi

# Also include this helper if present
if [ -f scripts/commit-each-file.sh ]; then
  if ! grep -q 'commit-each-file.sh' "$TMP"; then
    printf '?? scripts/commit-each-file.sh\n' >> "$TMP"
  fi
fi

count=0
failed=0

while IFS= read -r line; do
  [ -n "$line" ] || continue
  f="${line#???}"
  [ -n "$f" ] || continue

  subject=$(msg_for "$f")

  if [ "$f" = ".env.example" ]; then
    git add -f -- "$f"
  else
    git add -- "$f"
  fi

  if git diff --cached --quiet; then
    echo "SKIP empty $f"
    continue
  fi

  if git commit -m "$(cat <<EOF
${subject}

${CO_AUTHOR}
EOF
)"; then
    count=$((count + 1))
    echo "OK [$count] $f"
  else
    failed=$((failed + 1))
    echo "FAIL commit $f"
    git reset HEAD -- "$f" >/dev/null 2>&1 || true
  fi
done < "$TMP"

rm -f "$TMP"

echo "=== DONE commits=$count failed=$failed ==="
echo "remaining: $(git status --short | wc -l | tr -d ' ')"
git log --oneline | head -20
echo "--- last commit body ---"
git log -1 --format='%B'
