---
type: "concept-process"
node_id: "L0-pear-pr02"
source_channel: "rollout"
analysis_version: 11
title: "Process: binding (the hook enters a plate)"
aliases: ["L0-pear-pr02"]
is_a: ["process"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 2730
tags: ["v11", "pearl-rod", "process", "binding", "fishing-hook"]
level: 2
---
# Process: binding (the hook enters a plate)

**Is a:** process. **Part of:** L0-pear. **Relates to:** L0-xasm41, L0-pear-ent1, L0-pear-ent2, L0-trdt / L0-uwbw (`entitySpawn` +0 correlation).

## Track the hook
1. **Cast:** `world.afterEvents.itemUse` is raised for a marked rod whose binding is **not** honoured for this user. That covers an unbound rod, a stranger, or an epoch mismatch; those are normal vanilla casts (`xasm42`).
2. **Correlate:** in the same tick (`entitySpawn` +0), a `minecraft:fishing_hook` within 3 blocks of the user's eyes is taken as that player's hook.
   - If the probe shows the projectile owner is readable, the owner is used and the 3-block match is dropped.
3. **Track:** record `{hookId → playerId, rodId}`. While at least one hook is tracked, the shared interval runs the check below. Otherwise the check costs nothing.

## Check (each tick per tracked hook)
- **Hook gone** (reeled, removed, or the rod switched away): untrack it, then apply the durability hold to the rod (`L0-pear-ru04`).
- **Otherwise** read the block at `floor(hook.location)`.
- **Bind** when all of these hold:
  - the typeId ends in `pressure_plate`;
  - `hook.y − cell.y ≤ 0.25`, **or** the hook is stopped (|v| < 0.05);
  - the hook is not riding an entity.

  The 0.25 threshold is calibrated per plate type by the probe (`xasm41`).
- **Do not bind** on: a hook above a plate cell in flight; a hook resting on a block next to a plate; a hook in water over a plate.

## Bind
1. Find the rod by `rodId` in the player's inventory (the selected slot first). If it is not found, untrack the hook and bind nothing. A rod thrown away mid-cast does not bind.
2. Write the record onto that rod: `{dim, pos = plate cell, type, owner = player.id, epoch = player's andrew:life_epoch, gen = world gen(cell)}`. Add the cell to `andrew:pg_watch`.
3. Refresh the lore to "bound: …" and write the stack back to its slot. One `setItem` both persists the properties and reapplies damage 0.
4. Call `hook.remove()`. The client's cast pose resetting is an iPad and probe item. If the pose sticks, it is a reported limitation, with a fallback of a one-tick slot swap.
5. Send the actionbar line "Удочка привязана к плите" / "Rod bound to plate".

## Overwrite
Any binding on a rod replaces the previous one, whoever made it. Bindings on other rods are untouched.

## Probe-dependent forks
- **`projectileHitBlock` on the hook:** if it fires and names the support block, it may be used as an early trigger. The cell rule above stays authoritative.
- **Plates with a 1-pixel height**, light and heavy weighted included: all plates share the cell rule, and the scenario list enumerates `BlockTypes.getAll()` filtered by `/pressure_plate$/`.
