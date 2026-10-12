---
type: "concept-process"
node_id: "L0-pear-pr03"
source_channel: "rollout"
analysis_version: 11
title: "Process: bound use → verified teleport (C-44)"
aliases: ["L0-pear-pr03"]
is_a: ["process"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 3103
tags: ["v11", "pearl-rod", "process", "teleport", "C-44"]
level: 2
---
# Process: bound use → verified teleport (C-44)

**Is a:** process. **Part of:** L0-pear. **Relates to:** L0-pear-ru01, L0-pear-ru02, L0-pear-ad01, L0-xasm42, L0-pear-cx02.

## 1. Gate (`world.beforeEvents.itemUse`, synchronous, read-only)
- The item is marked and bound, `pr_owner === source.id` and `pr_epoch === source's epoch` → `cancel = true`, then `system.run(start)`.
- The same is true but a teleport is already pending for this player → cancel, and send "already travelling".
- Anything else → no action, and the vanilla cast proceeds (`L0-pear-pr02`).
- **Fallback if the probe shows a cancel does not stop the cast** (`L0-pear-cx02`): let the cast happen, remove the hook at `entitySpawn` +0, and run the same `start`. The iPad sees a one-tick line flicker.

## 2. Start (next tick)
- If the player is riding, dismount them (`xq12` item 4 default).
- If the destination dimension is not the player's own and the probe refused cross-dimension travel, send "other dimensions unsupported" and keep the binding.
- Allocate one slot from the world ticking-area budget (`L0-pear-ad01`). If no slot is free, send "server busy, try again" and keep the binding.
- Add `tickingarea add <x-1> 0 <z-1> <x+1> 0 <z+1> andrew_pearl_<slot>` in the destination dimension. The area covers the plate's chunk plus the neighbour chunks the 8-cell search can touch.
- Register a pending record `{rodId, slot, deadline = now + 200}`.

## 3. Wait (shared interval)
Poll `isChunkLoaded` on the plate cell and its 8 neighbours.
- **Timeout:** release the slot, send "destination did not load", keep the binding.
- **Player died** (epoch changed) or **went offline:** release, then end silently (death) or log only.

## 4. Validate
1. Re-find the rod by `rodId` in the player's inventory. If it is not there, release, send "the rod left your inventory" and stop. The binding stays on that rod.
2. Read the cell. If the typeId differs from `pr_type`, or the world generation differs from `pr_gen`, release, **clear the binding**, refresh the lore, and send "plate gone or replaced — bind again".
3. Safe spot (rule `L0-pear-ru02`): try the plate cell first, then its 8 horizontal neighbours in a fixed order. If none is safe, release, keep the binding, and send "destination unsafe".

## 5. Teleport and read back
1. `player.teleport(spot centre, { dimension })`. A self-teleport resets the fall distance and zeroes velocity.
2. In the same tick, read `player.dimension.id` and `player.location`. Success requires the same dimension and a distance under 0.5.
3. **Success:** clear the binding on the rod found in step 4.1, set the lore to "unbound", release the slot, send "Arrived" and play `mob.endermen.portal` at the destination.
4. **Read-back mismatch:** release, keep the binding, and send "teleport failed". The player is wherever the engine left them, and that is reported, not hidden.

## Invariants
- Every path releases the ticking area. A crash is covered by sweeping `andrew_pearl_*` at startup.
- No path claims success without a matching read-back.
- No distance cap is applied beyond the world border.
