---
type: "concept-process"
node_id: "L0-infr-p006"
source_channel: "rollout"
analysis_version: 2
title: "Process: Worldgen/placement GameTest lane + statistical chunk-roll check"
aliases: ["L0-infr-p006"]
is_a: ["process"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 2009
tags: ["is_a:process", "relates_to:L0-infr-p003", "relates_to:L0-adr-strc", "relates_to:L0-strf", "v2-delta"]
level: 2
---
# Process: Worldgen/placement GameTest lane + statistical chunk-roll check

**Links:** `part_of: ["L0-infr"]` · `is_a: ["process"]` · `relates_to: ["L0-infr-p003", "L0-adr-strc", "L0-strf"]`

## Purpose
Prove, without a human or an iPad, that a compiled structure template places correctly on the real engine (all 4 rotations, correct block-entity data) and that the per-chunk generation rate `strf` implements matches its configured constant (1 % Windmill / 2 % Airship / 5 % Warden City & Bastion, pending `L0-xq2`) — both from engine state, on the same `gametest` world/Beta-APIs pattern as the Pickaxe lane (`L0-infr-p003`, `L0-infr-d002`).

## Flow
1. **Placement check** — for each of the 4 templates × 4 rotations, `world.structureManager.place()` at a known origin in the `gametest` world; a script re-counts in-world block entities (chests, `mob_spawner` + entity id, shrieker `can_summon`) against the compiled template's own counts.
2. **Statistical chunk-roll check** — a real 1–5 % rate can't be observed by exploring a normal-sized test world, so the harness drives `strf`'s own roll function (`hash(worldSalt, dim, cx, cz, structureId) < chance`, `L0-adr-strc`) directly over a large synthetic sample of chunk coordinates (sample size and tolerance not spec'd — `L0-infr-as03`) and asserts the observed success rate falls inside that tolerance band of the configured constant.
3. **Verdict** — same `analyzeLog()`-style PASS/FAIL-from-log pattern as `bds:check`; exit 0/1.

## Trigger
A new mode of `npm run bds:gametest` (e.g. `-- --suite structures`), sharing `bds-gametest.mjs`'s world-boot/Beta-APIs/NBT-patch machinery with the Pickaxe lane.

## Boundary
This lane *measures* `strf`'s roll and placement behavior; it does not implement the roll, the collision heuristic, or the discovery loop — those are `L0-strf`'s (`L0-adr-strc`). The harness must call `strf`'s roll function directly rather than reimplementing the hash, or it risks validating a drifted copy instead of the real thing.
