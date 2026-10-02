---
type: "concept-assumption"
node_id: "L0-sauc-as04"
source_channel: "rollout"
analysis_version: 5
title: "AS-sauc-4 · The 100-block limit is horizontal; a saucer 90 out is loaded, persists for 95 s, and renders on the iPad"
aliases: ["L0-sauc-as04"]
is_a: ["assumption"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1671
tags: ["is_a:assumption", "CAN_ASSUME", "U8", "visibility", "ipad", "relates_to:L0-sauc-r002", "relates_to:L0-sauc-ent1"]
level: 2
---
# AS-sauc-4 · The 100-block limit is horizontal; a saucer 90 out is loaded, persists for 95 s, and renders on the iPad

**Assumption.**
1. **The 100-block limit is horizontal.** UFO §2 says "not farther than 100 blocks from the centre". The 3D distance at spawn is √(90² + 50²) ≈ 103. U8 measured unloading against the *loaded area*, which is a horizontal chunk distance. The horizontal reading is therefore the intended one.
2. **The spawn point is usable.** A chunk 90 blocks (≈ 6 chunks) from an online target player is loaded under BDS defaults, so `spawnEntity` and per-tick teleports there succeed. In GameTest, simulated players load no chunks, so the scenario needs a `tickingarea` covering the path (or a test-only shortened radius that is flagged as such).
3. **No despawn.** A `minecraft:snowball`-runtime custom entity with no projectile component is not despawned or auto-removed within the 95 s event. The shipped charge only proves 20 s (`ATTACK_TIMEOUT_TICKS` = 400). Probe U8 / the U1 run held a probe for ~60 s.
4. **It renders at range.** The iPad client draws an entity ~95 blocks away if its chunk is within the client's render distance (≥ 6 chunks) and `visible_bounds` is large (`ent1`).

**Impact if wrong.**
- (1) The path has to shrink to ~80 horizontal, an AC-2 deviation note.
- (3) The saucer vanishes mid-event; `p001` treats that as an abort, and the event is lost.
- (4) The DoD line "saucer visible on approach" fails at low render distance. The spawn radius stays at 90, so the fix is the operator's render-distance setting or a deviation.
- Each item is checked by `ac01` (positions and validity over the full 95 s) or by `ac06` (iPad).
