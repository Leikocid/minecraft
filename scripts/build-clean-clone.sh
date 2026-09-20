#!/usr/bin/env bash
# npm run build:clean-clone
#
# Proves AC-S0-1 ("from a clean clone") for real: clones the current repo
# into a fresh temp directory, runs npm ci && npm run build there, and
# compares the resulting archive's file list against a local build.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/andrew-clean-clone.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "▶ clean clone: $REPO_DIR -> $TMP_DIR/repo"
git clone --quiet "$REPO_DIR" "$TMP_DIR/repo"

echo "▶ npm ci (clean clone)"
(cd "$TMP_DIR/repo" && npm ci --silent)

echo "▶ npm run build (clean clone)"
(cd "$TMP_DIR/repo" && npm run build --silent)

CLEAN_ARCHIVE="$TMP_DIR/repo/dist/andrew.mcaddon"
LOCAL_ARCHIVE="$REPO_DIR/dist/andrew.mcaddon"

if [ ! -f "$LOCAL_ARCHIVE" ]; then
  echo "▶ local archive missing, building locally for comparison"
  (cd "$REPO_DIR" && npm run build --silent)
fi

echo "▶ comparing archive file lists"
CLEAN_LIST="$(unzip -Z1 "$CLEAN_ARCHIVE" | sort)"
LOCAL_LIST="$(unzip -Z1 "$LOCAL_ARCHIVE" | sort)"

if [ "$CLEAN_LIST" != "$LOCAL_LIST" ]; then
  echo "✗ archive file list mismatch between clean clone and local build"
  echo "--- clean clone ($CLEAN_ARCHIVE) ---"
  echo "$CLEAN_LIST"
  echo "--- local ($LOCAL_ARCHIVE) ---"
  echo "$LOCAL_LIST"
  exit 1
fi

FILE_COUNT="$(echo "$CLEAN_LIST" | wc -l | tr -d ' ')"
echo "✓ clean clone build matches local build ($FILE_COUNT entries)"
