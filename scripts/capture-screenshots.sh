#!/usr/bin/env bash
#
# Documentation capture. Launches the built app once per screenshot under a
# virtual framebuffer, lands it on a named screen via the dev-only screenshot
# flags (see apps/desktop/src/main/screenshot-mode.ts), and photographs the
# X root window with ImageMagick.
#
# Requires: xvfb-run, ImageMagick (`import`), a completed `npm run build:all`.
# Each launch gets a throwaway --user-data-dir so captures never read or write
# the real profile.
#
#   ./scripts/capture-screenshots.sh [name-filter]
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/docs/screenshots"
FILTER="${1:-}"
mkdir -p "$OUT"

# name|width|height|settle-seconds|extra flags
SHOTS=(
  "command-center-light|1920|1080|9|--initial-screen=command-center --theme=light"
  "command-center-dark|1920|1080|9|--initial-screen=command-center --theme=dark"

  "job-discovery-light|1920|1080|9|--initial-screen=job-discovery --theme=light"
  "job-discovery-dark|1920|1080|9|--initial-screen=job-discovery --theme=dark"

  "job-intelligence-light|1920|1080|9|--initial-screen=job-discovery --theme=light --initial-params=jobId=job-meridian-secplat"
  "job-intelligence-dark|1920|1080|9|--initial-screen=job-discovery --theme=dark --initial-params=jobId=job-meridian-secplat"

  "career-vault-light|1920|1080|9|--initial-screen=career-vault --theme=light --initial-params=factId=f-resp-k8s-exposure"
  "career-vault-dark|1920|1080|9|--initial-screen=career-vault --theme=dark --initial-params=factId=f-resp-k8s-exposure"

  "resume-studio-light|1920|1080|9|--initial-screen=resume-studio --theme=light"
  "resume-studio-dark|1920|1080|9|--initial-screen=resume-studio --theme=dark"

  "resume-studio-refusal-light|1920|1080|9|--initial-screen=resume-studio --theme=light --initial-params=strategyId=devsecops,jobId=job-halcyon-devsecops"
  "resume-studio-refusal-dark|1920|1080|9|--initial-screen=resume-studio --theme=dark --initial-params=strategyId=devsecops,jobId=job-halcyon-devsecops"

  "application-workspace-light|1920|1080|20|--initial-screen=workspace --theme=light --initial-params=applicationId=app-halcyon --screenshot-run"
  "application-workspace-dark|1920|1080|20|--initial-screen=workspace --theme=dark --initial-params=applicationId=app-halcyon --screenshot-run"
  "application-workspace-1366x768|1366|768|20|--initial-screen=workspace --theme=dark --initial-params=applicationId=app-halcyon --screenshot-run"

  "outreach-light|1920|1080|9|--initial-screen=outreach --theme=light --initial-params=contactId=oc-meridian-dana"
  "outreach-dark|1920|1080|9|--initial-screen=outreach --theme=dark --initial-params=contactId=oc-meridian-dana"

  "crm-pipeline-light|1920|1080|9|--initial-screen=applications --theme=light --initial-params=applicationId=app-halcyon"
  "crm-pipeline-dark|1920|1080|9|--initial-screen=applications --theme=dark --initial-params=applicationId=app-halcyon"

  "crm-table-light|1920|1080|9|--initial-screen=applications --theme=light --screenshot-open=crm-table --initial-params=applicationId=app-halcyon"
  "crm-table-dark|1920|1080|9|--initial-screen=applications --theme=dark --screenshot-open=crm-table --initial-params=applicationId=app-halcyon"

  "analytics-light|1920|1080|9|--initial-screen=analytics --theme=light"
  "analytics-dark|1920|1080|9|--initial-screen=analytics --theme=dark"

  "autonomy-settings-light|1920|1080|9|--initial-screen=autonomy --theme=light"
  "autonomy-settings-dark|1920|1080|9|--initial-screen=autonomy --theme=dark"
)

capture() {
  local name="$1" w="$2" h="$3" settle="$4" flags="$5"
  local profile
  profile="$(mktemp -d /tmp/jc-shot-XXXXXX)"

  cat > "$profile/run.sh" <<INNER
#!/bin/bash
npx electron . --no-sandbox --disable-gpu \
  --user-data-dir="$profile/profile" \
  --capture-size=${w}x${h} $flags > "$profile/app.log" 2>&1 &
APP=\$!
sleep $settle
import -window root "$OUT/$name.png" 2>>"$profile/app.log"
kill \$APP 2>/dev/null
wait \$APP 2>/dev/null
INNER
  chmod +x "$profile/run.sh"

  ( cd "$ROOT" && xvfb-run -a --server-args="-screen 0 ${w}x${h}x24" "$profile/run.sh" ) >/dev/null 2>&1

  if [ -f "$OUT/$name.png" ]; then
    printf '  %-34s %s\n' "$name" "$(identify -format '%wx%h %[colors]c %b' "$OUT/$name.png" 2>/dev/null)"
  else
    printf '  %-34s FAILED\n' "$name"
    tail -5 "$profile/app.log" 2>/dev/null | sed 's/^/      /'
  fi
  rm -rf "$profile"
}

echo "Capturing into $OUT"
for row in "${SHOTS[@]}"; do
  IFS='|' read -r name w h settle flags <<< "$row"
  [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]] && continue
  capture "$name" "$w" "$h" "$settle" "$flags"
done
echo "Done."
