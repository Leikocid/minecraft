---
type: "concept-process"
node_id: "L0-infr-p002"
source_channel: "rollout"
analysis_version: 1
title: "Process: BDS one-shot check (`npm run bds:check`)"
aliases: ["L0-infr-p002"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 2086
tags: ["is_a:process"]
level: 2
---
# Process: BDS one-shot check (`npm run bds:check`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]`

## Flow (scripts/bds-check.mjs, staging shared with bds-up via bds-lib.mjs)
1. Assert `docker/bds/compose.yaml`'s `VERSION` equals `BDS_VERSION` in `targets.mjs` (`assertComposePinsVersion`), and that the Docker daemon is reachable.
2. `npm run build` (unless `--no-build`).
3. Unpack `dist/andrew.mcaddon` plus load `packs/selftest` straight from the working tree (never from the archive — it's dev-only and excluded from it by design). `--break-selftest` rebundles the selftest script with a deliberately-failing fixture compiled in, for negative testing.
4. Stage the BDS data dir with all three packs attached to the world, `compose(['down'])` to drop any stale container/log, start the server, and wait for both `SCRIPT_LOADED` and `SELFTEST_DONE` markers (or a timeout, default 300s).
5. Save the full log to `dist/bds-check.log`, stop the container.
6. `analyzeLog()` derives PASS/FAIL from the log text alone and the process exits 1 on FAIL, 0 on PASS.

## Verdict signals (analyzeLog)
- **Positive**: a `"Pack Stack"` log line naming the behavior-pack and selftest-pack uuids; the `SCRIPT_LOADED` marker; the resource pack's uuid configured and *not* rejected.
- **Negative**: any `Configured pack … was not found and was ignored` line naming one of the three uuids; any `ERROR`/`WARN` line that names "andrew" or one of the three uuids and isn't the add-on's own `console.warn` output (tagged `[Scripting] [andrew] `); any `[Scripting]` line matching `error|exception|failed|cannot|unable|not found`.
- **In-engine selftest**: `[selftest] FAIL …` lines fail the run; the final `[selftest] DONE passed=N failed=M` line's counters are authoritative over the individual lines (a truncated log can't hide a real failure as a pass), and `failed=0 passed=0` is itself a failure (the check ran nothing).

## World
Creative, level `andrew` (the default) — re-staged from the seed `server.properties` on every run so a leftover `bds:up` Survival session never leaks into it.
