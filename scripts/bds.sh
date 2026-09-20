#!/usr/bin/env bash
# Manual control of the dev Bedrock server (the LAN server the iPad joins).
#
#   npm run bds:up     start in the background
#   npm run bds:logs   follow the log (Ctrl-C to detach, server keeps running)
#   npm run bds:down   stop and remove the container
#
# For the automated one-shot check use `npm run bds:check` instead — it stages
# the packs and stops the server by itself.

set -euo pipefail

cmd="${1:?usage: bds.sh <up|down|logs>}"
composeFile="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/docker/bds/compose.yaml"

if ! docker info >/dev/null 2>&1; then
  echo "bds: the Docker daemon is not reachable — start Docker Desktop and retry." >&2
  exit 1
fi

case "$cmd" in
  up)
    docker compose -f "$composeFile" up -d
    echo "bds: server starting; follow it with 'npm run bds:logs'"
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
