---
type: "concept-architecture-decision"
node_id: "L0-wind-ad01"
source_channel: "rollout"
analysis_version: 5
title: "ADR — The spawn search loads terrain with temporary ticking areas, window by window"
aliases: ["L0-wind-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 2275
tags: ["is_a:architecture-decision", "spawn-windmill", "ticking-area", "chunk-loading", "status:accepted", "relates_to:L0-wind-p002", "relates_to:L0-strf-r007", "relates_to:L0-adr-strc"]
level: 2
---
# ADR — The spawn search loads terrain with temporary ticking areas, window by window

**Links:** `part_of: ["L0-wind"]` · `is_a: ["architecture-decision"]` · `relates_to: [L0-wind-p002, L0-strf-r007, L0-adr-strc, L0-wind-as11]`
**Status:** accepted with a proviso on the area size (`decision-adr-l0-wind-ad01-accepted-s-ogovorkoy-o-razmere-`).

## Context
- §4.7 requires the spawn Windmill on the *first start*, searching up to 500 blocks (≈ 63×63 chunks). C-12: never read validity from or write into unloaded chunks.
- On a fresh BDS world no player is online; Bedrock keeps no always-loaded spawn chunks. Player-driven discovery (`L0-strf-p001`) would only see ~9×9 chunks around the first player, and "nearest within 500" could not be decided.
- Stable Script API has no chunk-load API; `runCommand("tickingarea add …")` is a stable command. Limits: 10 ticking areas per world, each ≤ 100 chunks (assumption `L0-wind-as11`).

## Decision
1. The search owns at most **2** ticking areas at a time, named `andrew_ws_<n>`, each a ≤ 10×10-chunk window.
2. Windows are visited in stage order (5×5 first, then outward rings). After adding a window, the job waits until a `getBlock` probe per chunk succeeds (timeout → skip window, log, count).
3. Terrain is sampled coarsely (every 4th column for the flatness pre-screen; full 35×35 only for shortlisted candidates).
4. When the site is chosen, its plot + band + airship ring (100 + 15 blocks) are held by one area until placement, init and the linked Airship attempt are done; then all `andrew_ws_*` areas are removed. On startup any leftover `andrew_ws_*` area is removed if the record is terminal.

## Rejected alternatives
- **Wait for players to explore.** Cannot guarantee the Windmill "at start" or decide "nearest"; a spawn in the ocean might never resolve.
- **Place blindly from heightmap guesses.** Violates C-12 and the no-damage rules.
- **One large ticking area.** Exceeds the 100-chunk limit; loading 4000 chunks at once stalls BDS.

## Consequences
- The first start takes longer (seconds to minutes, bounded by the `runJob` budget). Recorded in the deviation report.
- If ticking areas turn out not to work from script on BDS, fallback: search only within loaded chunks around the first player, widen as they move, and record the deviation.
