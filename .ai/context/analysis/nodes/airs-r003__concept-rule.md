---
type: "concept-rule"
node_id: "L0-airs-r003"
source_channel: "rollout"
analysis_version: 2
title: "Rule: independent generation is a 2 % roll validated over the whole rotated footprint, never terraformed or relocated"
aliases: ["L0-airs-r003"]
is_a: ["rule"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 1614
tags: ["is_a:rule", "worldgen", "validity", "altitude", "relates_to:L0-strf-r002", "relates_to:L0-strf-r005", "relates_to:L0-strf-r003", "relates_to:L0-strf-p002", "relates_to:L0-strf-as02", "relates_to:L0-strf-d004"]
level: 2
---
# Rule: independent generation is a 2 % roll validated over the whole rotated footprint, never terraformed or relocated

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Chance: 2 % per suitable Overworld chunk, one roll per chunk (`airs.def.chance = 0.02`, `L0-strf-r002`). Any land biome/terrain qualifies — forest, plains, mountains, ravines — subject only to footprint, altitude and collision (§5.5).
- Validity is `strf`'s `dryLand` profile sampled over the **whole rotated footprint**, not just the centre point (§5.4): liquid surface samples ≤ 10 % (`L0-strf-as02`), plus `strf`'s `altitude` profile and the generic 3D collision test with a 2-block margin (`L0-strf-r006`, `L0-strf-d004`).
- Altitude/ceiling: bottom Y ≥ `maxSurfaceY(footprint, including trees/leaves) + clearance`, clearance seeded in [40,70] and clamped down to 40 if the structure would otherwise clip the world ceiling; reject the candidate if it still cannot fit at clearance = 40 (`L0-strf-r005`, `-r003`, `-p002`; §5.4, test 31). `airs` contributes no numbers here beyond `verticalMode = "altitude"` — the solver itself is `strf`'s.
- On a failed roll, invalid site, or collision: cancel. `airs` never relocates the candidate to a neighbouring chunk and never terraforms the site (§5.5) — that liberty belongs only to `wind`'s guaranteed spawn path (`L0-strf-r005`).
- At most one independent Airship per candidate chunk (`L0-strf-r002` item 3). Two independent Airships may end up close together with no minimum distance rule between them; only a physical AABB overlap cancels one of them (§5.5, test 33's "no overlap" half).
