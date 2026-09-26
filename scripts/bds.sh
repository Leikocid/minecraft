#!/usr/bin/env bash
# Manual control of the dev Bedrock server (the LAN server the iPad joins).
#
#   npm run bds:up     build, install the current packs, start in Survival+cheats
#   npm run bds:logs   follow the log (Ctrl-C to detach, server keeps running)
#   npm run bds:down   stop and remove the container
#
# For the automated one-shot check use `npm run bds:check` instead — it stages
# the packs itself, runs creative, and stops the server by itself.

set -euo pipefail

cmd="${1:?usage: bds.sh <up|down|logs>}"
shift || true
scriptDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# ANDREW_BDS_DIR picks the instance: bds (production, 19132) or bds-qa (19134).
instanceDir="${ANDREW_BDS_DIR:-bds}"
composeFile="$scriptDir/../docker/$instanceDir/compose.yaml"

if ! docker info >/dev/null 2>&1; then
  echo "bds: the Docker daemon is not reachable — start Docker Desktop and retry." >&2
  exit 1
fi

case "$cmd" in
  up)
    # Builds the add-on, installs the packs (same staging as bds:check) and
    # waits for the server to report a clean start before printing the
    # LAN address for the iPad — see scripts/bds-up.mjs.
    node "$scriptDir/bds-up.mjs" "$@"
    ;;
  down)
    docker compose -f "$composeFile" down
    ;;
  logs)
    docker compose -f "$composeFile" logs -f
    ;;
  *)
    echo "bds: unknown command '$cmd' (expected up, down or logs)" >&2
    exit 1
    ;;
esac
