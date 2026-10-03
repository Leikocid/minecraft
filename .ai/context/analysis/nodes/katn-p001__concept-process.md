---
type: "concept-process"
node_id: "L0-katn-p001"
source_channel: "rollout"
analysis_version: 6
title: "P-katn-001: Teleport activation"
aliases: ["L0-katn-p001"]
is_a: ["process"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 3066
tags: ["process", "katana", "teleport", "is_a:process", "relates_to:L0-lgnd-p004", "relates_to:L0-adr-ktob", "relates_to:L0-xasm18", "relates_to:L0-xasm19"]
level: 2
---
---
title: "P-katn-001: Teleport activation (Use → trace → safe cell → teleport → cooldown)"
is_a: ["process"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-p005", "L0-adr-ktob", "L0-katn-ad01", "L0-xasm18", "L0-xasm19", "L0-katn-as01", "L0-katn-as02", "L0-katn-r002", "L0-katn-r003", "L0-katn-r004", "L0-katn-r005"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
# P-katn-001: Teleport activation

1. **Trigger.** `world.afterEvents.itemUse`, and `playerInteractWithBlock` for a press that lands on a block. The two events for one press are collapsed into one activation, as in `src/websword/trap.ts:43`. The tapped block is a trigger only; it is never the aim (`L0-katn-as02`).
2. **Resolve.** `resolveActivation(player)?.def === DRAGON_KATANA`, otherwise return.
   - The framework picks the main hand first, then a ready off hand (`L0-lgnd-p004`).
   - On cooldown the result is `undefined`, so the press is a **no-op**: no teleport, no timer write, no message. The HUD already shows the seconds (`L0-katn-r005`).
3. **Capture.** `A = player.location`, `H = player.getHeadLocation()`, `d = player.getViewDirection()`, `rot = player.getRotation()`, `dim = player.dimension`. These are fixed at use time (§5 "fixed at the moment of use").
4. **Readability.** Walk the segment `H → H + 20·d` at each chunk crossing and at the y bounds. The first unreadable point (unloaded chunk, or outside `dim.heightRange`) shortens `maxDistance` to just before it (C-24, `L0-katn-r003`).
5. **Trace.** `dim.getBlockFromRay(H, d, { maxDistance, includePassableBlocks: false, includeLiquidBlocks: false })` (`L0-adr-ktob` §1).
   - A hit gives `E` = the hit point pulled back 0.3 toward `H`, plus the hit face.
   - No hit gives `E = H + maxDistance·d`, a point in the air (`L0-xasm18`).
6. **Desired feet.** Floor hit (face Up): the feet cell is the cell above the hit block. Any other case: `F* = E − (0, 1.62, 0)`, so the head lands where the player looked (`L0-katn-as01`).
7. **Safe-cell search** (`L0-katn-r004`): candidates nearest first; the first that fits wins. None fits → return: **no teleport, no cooldown**, silent (`L0-xasm19` §3).
8. **Teleport.** `player.teleport(centre(F), { rotation: rot })`, **without** the `dimension` option (`L0-lgnd-r017` §3, reconciled at reduce v6). It runs in the same tick, in the same dimension, and keeps the facing. No block is read for writing; no block is edited (`L0-katn-r002`).
9. **Cooldown.** `startCooldown(player, "dragon_katana")` in the same turn. A later same-tick `itemUse` for the same press then resolves to `undefined`. No busy window: the ability is instant, so a hand switch afterwards changes nothing (§9).
10. **Fall flag.** `armFallFlag(player)` (`L0-katn-p002`).
11. **Trail.** `emitTrail(dim, A + (0,1,0), B + (0,1,0))` (`L0-katn-r007`).

**Failure modes.** Every step before 8 that returns leaves nothing behind. Step 8 throwing (the player left that tick) → no cooldown, no flag, no trail. The order is teleport, then `startCooldown`, then flag, then trail, so the cooldown is only ever charged for a teleport that happened.
