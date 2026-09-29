---
type: "concept-architecture-decision"
node_id: "L0-adr-ochg"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-ochg · Script-driven charges and programmatic explosions instead of primed TNT"
aliases: ["L0-adr-ochg", "Orbital charge ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0", "L0-orbc", "L0-pntr", "L0-ring", "L0-xasm7"]
see_also: ["orbitalcannonspecv1ruen-part-3"]
priority: 540
size_chars: 2329
tags: ["title:ADR-L0-ochg · Script-driven charges and programmatic explosions instead of primed TNT", "alias:L0-adr-ochg", "alias:Orbital charge ADR", "is_a:architecture-decision", "relates_to:L0", "relates_to:L0-orbc", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-xasm7", "see_also:orbitalcannonspecv1ruen-part-3", "status:proposed", "cross-component"]
level: 1
---
# ADR-L0-ochg · Script-driven charges and programmatic explosions instead of primed TNT

**Status:** proposed. **Context.**
- Orbital §8 and §10 need charges that pass through entities, stop on the first *block*, are not pushed by neighbouring blasts, drop nothing and cause no fire.
- Vanilla `minecraft:tnt` gets knocked back by other explosions, chain-primes other TNT, drops blocks, and cannot be told to ignore entities.
- §12 explicitly allows "controlled script-driven charge entities/visuals and programmatic explosions".

**Decision.**
1. **The charge is a script-moved, visual-only entity.** `andrew:orbital_charge`: TNT geometry (scaled ~1.2 for LMB, 1.0 for RMB), no collision with entities, `minecraft:pushable` false, `knockback_resistance` 1, no physics, no damage sensor effects. The script teleports it down each tick at a fixed speed, and each step checks only the block cells it crosses. When a charge is in a solid cell at spawn, it detonates in that tick.
2. **One bounded job per attack** moves all of that attack's charges. The job ends when the last charge is gone. That keeps C-5a′.
3. **RMB detonation** uses `dimension.createExplosion(point, 4, {breaksBlocks: !underwater, causesFire: false, allowUnderwater: true, source: owner})`, so TNT damage and self-damage come from the engine. **Drop suppression:** *withdrawn in v3 reduce; see `L0-adr-odrp`* (a scoped `doTileDrops=false` around the synchronous blasts). The original snapshot-diff of new item entities also deleted death drops and mob loot (`L0-ring-cx01`).
4. **LMB detonation** does not use an explosion. `pntr` removes the blocks directly (`setType(air)`), plays one explosion sound, and runs the particle job.
5. **Lifecycle.** Charges are tagged with the attack id. On `entityLoad` of an orphan charge (after an unload or restart), remove it. The cooldown is never touched.

**Rejected.**
- Vanilla primed TNT: it chain-reacts and gets pushed, and drops can't be controlled.
- Falling blocks: entity-stoppable and drops sand-like items.
- A pure particle "virtual" charge with no entity: no visible TNT, which fails §9/§10 visual identity on iPad.

**Risk.** `createExplosion` knockback still moves players and mobs; that is wanted. Whether the engine gives item drops for blocks broken by a script explosion must be measured on BDS 1.26.51.1. That is a probe item for `ring`.
