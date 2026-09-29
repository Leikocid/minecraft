---
type: "concept-process"
node_id: "L0-orbc-p003"
source_channel: "rollout"
analysis_version: 3
title: "Process · Attack lifecycle and orphan cleanup"
aliases: ["L0-orbc-p003"]
is_a: ["process"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1653
tags: ["is_a:process", "relates_to:L0-orbc-r010", "relates_to:L0-orbc-r011", "relates_to:L0-orbc-ad03", "relates_to:L0-adr-ochg"]
level: 2
---
# Process · Attack lifecycle and orphan cleanup

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["process"]` · `relates_to: ["L0-orbc-r010", "L0-orbc-r011", "L0-orbc-ad03", "L0-adr-ochg"]`

1. **Owner events are ignored on purpose.** The attack has no subscription to `entityDie`, `playerLeave`, `playerDimensionChange` or hand changes (`r010`, AC-18).
   - For RMB, `ring` resolves the explosion `source` at detonation: it uses the owner if `world.getEntity(ownerId)` is valid and in the same dimension, otherwise no source.
2. **Unload.** A charge whose entity becomes invalid, or whose next cell is unloaded, is dropped as lost (`p002` steps 1 and 6). There is no ticking area and no force-load (§11).
3. **Orphans.** A charge entity that exists in the world but is not in the in-memory registry is an **orphan**. It comes from a chunk that unloaded mid-flight and was reloaded later, or from a save made mid-flight. There are two sweeps:
   - `world.afterEvents.entityLoad` and `entitySpawn`: if `typeId === andrew:orbital_charge` and the attack tag is not live, `entity.remove()`.
   - At startup (`system.run` after world load): for each dimension, `getEntities({type: "andrew:orbital_charge"})` → remove all. After a restart no attack is live.
4. **Restart.** Nothing about attacks is saved. The cooldown lives in the `lgnd` dynamic property and survives (C-17, AC-19).
5. **Pack removal.** If the add-on is uninstalled, leftover charge entities become unknown and are dropped by the engine. No world corruption (C-15 rank 1).

Orphans never detonate, because detonation needs the in-memory attack. So a reloaded chunk can never produce a late blast.
