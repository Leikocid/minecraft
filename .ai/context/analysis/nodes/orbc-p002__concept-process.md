---
type: "concept-process"
node_id: "L0-orbc-p002"
source_channel: "rollout"
analysis_version: 5
title: "Process · Charge flight and detonation"
aliases: ["L0-orbc-p002"]
is_a: ["process"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 2134
tags: ["is_a:process", "relates_to:L0-orbc-ent3", "relates_to:L0-orbc-r007", "relates_to:L0-orbc-r008", "relates_to:L0-orbc-r009", "relates_to:L0-orbc-r014", "relates_to:L0-orbc-ad02"]
level: 2
---
# Process · Charge flight and detonation

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["process"]` · `relates_to: ["L0-orbc-ent3", "L0-orbc-r007", "L0-orbc-r008", "L0-orbc-r009", "L0-orbc-r014", "L0-orbc-ad02"]`

## Spawn (the activation tick)
1. For each column (x, z), set `p = (x+0.5, spawnY, z+0.5)`.
2. `dim.spawnEntity("andrew:orbital_charge", p)`. Tag it `andrew:oc_charge` and `andrew:oc_attack:<id>`, and set `andrew:scale`.
3. **Inside-solid check.** If `isContact(dim.getBlock(floor(p)))`, detonate now at that cell (`r008`, AC-5). There is no fall.

## Fall (the job, every tick, `ad02`)
For each live charge:
1. If `!entity.isValid`, the charge is **lost** (`r011`). Drop it with no effect.
2. Set `ny = y − FALL_SPEED` (`as02`).
3. **Sweep.** Visit every block cell with Y from `floor(y)−1` down to `floor(ny)` in column (x, z). The first cell where `isContact` holds is the **contact cell**.
   - Entities are never consulted, so charges pass through players and mobs (AC-6).
4. Each registered interceptor sees the step's segment (`from`, `to`); `true` ends the charge `intercepted`, no effect (`L0-adr-ufoi`).
5. On contact:
   - Detonation point = the contact block's location. That is the block hit, not the air above it.
   - Call `onDetonate(dim, point, ownerId, mode)` (`r014`), then remove the entity.
6. If there is no contact and `ny < heightRange.min`, the charge is **voided** (`r009`). Remove it with no effect.
7. If there is no contact and the next cell is not loaded (`dim.getBlock` returns undefined or throws `LocationInUnloadedChunkError`), treat the charge as **lost**.
8. Otherwise `entity.teleport({x, y: ny, z})` and store `y = ny`.

## Termination
- The job ends when every attack has no charges. There is no idle loop (C-5a′).
- **Safety timeout:** after 20 s (400 ticks) from `createdTick`, remove any remaining charges as lost, and log a warning. It is a guard against a stuck path; it is not a feature.

## Ordering
- Charges of one RMB attack are independent. Detonating one never moves, removes or triggers another, because the charges have no collision and no physics and ignore damage (AC-12 support for `ring`).
- Detonations in one tick run in charge order. That order is irrelevant, because the effects are position-only.
