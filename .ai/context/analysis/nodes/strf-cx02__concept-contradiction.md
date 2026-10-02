---
type: "concept-contradiction"
node_id: "L0-strf-cx02"
source_channel: "rollout"
analysis_version: 5
title: "Contradiction — the spawn-area search radius (§4.7) vs discovery-only loading (C-5b, C-12)"
aliases: ["L0-strf-cx02"]
is_a: ["contradiction"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1592
tags: ["is_a:contradiction","category:invariant-violation","severity:medium","status:open","target:L0","relates_to:L0-wind","relates_to:L0-xcx4","title:Spawn Windmill search up to 500 blocks vs C-5b/C-12 player-driven loading","resolved"]
level: 2
closed_at: 2026-09-29
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-strf-cx02
---

# Contradiction — the spawn-area search radius (§4.7) vs discovery-only loading (C-5b, C-12)

**Statement A (§4.7.7–9, test 14).** On a new world's first start, search 5×5 chunks around world spawn, then outward up to **500 blocks**, choose the *nearest* valid site, and only then fall back to forced preparation. The Windmill "всё равно появится" (100 %).

**Statement B (C-5b, C-12, `L0-strf-r007`).** Chunks are evaluated only when a player's presence has loaded them, and nothing is read from or written into unloaded chunks.

**Conflict.** At first start only ~4–10 chunks around the player are loaded, and chunks 500 blocks out do not even exist yet. To find the *nearest* valid site within 500 blocks, `wind` must force-load (generate) up to ~3 000 chunks. The only stable means is `/tickingarea add` through `runCommand`, limited to 10 areas. That is neither "discovery from player positions" nor cheap. Waiting for the player to explore breaks "guaranteed at first start".

**Options.**
- (a) Amend C-5b: allow one bounded, one-time `tickingarea`-driven sweep for the spawn Windmill (rings of chunks, ≤ 10 areas at a time, removed afterwards). Cost: seconds of generation at world start.
- (b) Search only the loaded area around spawn (≈ 9×9 chunks), then force-prepare the best dry site found there. This deviates from "nearest valid ≤ 500 blocks" but keeps the 100 % guarantee.

**Recommendation.** (a) with a time cap of 60 s, falling back to (b) on timeout. Record either as a deviation. `wind` owns the policy; `strf` provides `isLoaded`/`searchRing` and the tickingarea helper.
