---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 4
title: "Global Constraints"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 3000
tags: ["v4", "title:Global Constraints", "alias:L0-constraint", "is_a:constraint", "relates_to:L0", "relates_to:L0-lgnd-cx03", "see_also:ufomagnetspecv1ruen-part-3", "see_also:ufomagnetspecv1ruen-part-4", "see_also:constraints", "supersedes:L0-constraint@v3"]
level: 0
---
---
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-lgnd-cx03", "L0-adr-ufom", "L0-xasm16"]
see_also: ["constraints", "ufomagnetspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-4"]
supersedes: ["L0-constraint@v3"]
---
# Global Constraints

The following are carried unchanged:
- **C-1 … C-14** from v2: Bedrock only; stable `@minecraft/server` 2.10.0 through `scripts/targets.mjs`; retarget on error; `andrew:` + RU/EN; tick budgets C-5a/b/c; durable bounded state; no duplication; reproducible build; the `bds`/`ipad` split; before-events never mutate; stage gating; never write into unloaded chunks; structure blocks are ordinary; dimension locks.
- **C-5a′ and C-15 … C-20** from v3.

v4 adds or tightens the following:

| ID | Constraint | Source |
|---|---|---|
| C-5d | *(new)* **World events.** There is one shared `runInterval` per event family, so no per-entity timers and no `runJob` start inside a hot tick (`runJob` start stalls the next tick by 15–30 ms, as measured). With no saucer present, the loop only reads the clock once every ≥ 100 ticks. A heavy zone scan runs once per event, at magnet-on, as one `getBlocks` with `includeTypes` (≈ 9 ms measured, U7). It never runs per tick. The per-tick cost of an active event is measured and recorded before acceptance (UFO §14). | UFO §11, §14 |
| C-7″ | *(extended)* No duplication or loss through the **magnet**: block → exactly one item, door → one item, a container gives up iron stacks only, a moved holder keeps its contents, and a legendary is never pulled or separated from its holder. | UFO §5, §15; C-7′ |
| C-12′ | *(restated)* The magnet reads and writes only loaded chunks. It skips unavailable blocks silently, and the saucer path stays within 100 blocks of the centre (U8: an entity more than ~130 blocks from a loaded area is unloaded). | UFO §2, §3 |
| C-21 | *(new)* **Every durable deadline or schedule uses epoch ms (`Date.now()`)**: cooldowns, busy flags, `hidden_until`, the next UFO arrival. `system.currentTick` restarts with the script engine. `getAbsoluteTime()` stops under `dodaylightcycle false`. This settles the ASM-020 wording that `L0-lgnd-cx03` owed L0. | `lgnd-cx03`; UFO §2 |
| C-22 | *(new)* Product code filters `undefined` out of `getEntities` / `getPlayers` results, because simulated players come back as holes in product packs. | UFO §11; engine fact |
| C-23 | *(new)* A world event is **not persisted mid-flight**. On world load, leftover event entities are removed before anything else in the event runs. Only the schedule and the enable flag are durable. | UFO §10 |
| C-20′ | *(extended)* Event acceptance also uses ≥ 2 players. This covers random targeting, a pulled versus a non-pulled player, and the shooter named in the broadcast. | UFO §13; C-20 |
| C-15 | *(confirmed)* The UFO spec §15 repeats the same priority order. It now binds events as well as weapons. | UFO §15 |
