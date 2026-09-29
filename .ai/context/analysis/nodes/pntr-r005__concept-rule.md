---
type: "concept-rule"
node_id: "L0-pntr-r005"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-r005"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1161
tags: ["title:Protect legendaries before removing a container", "is_a:rule", "relates_to:L0-lgnd", "relates_to:L0-xcx10", "relates_to:L0-pntr-cx01", "relates_to:L0-pntr-as05", "constraint:C-7′", "constraint:C-15", "ac:8"]
level: 2
---
**Rule R-pntr-5 · Legendaries survive the column.**

Before a container cell is cleared, `pntr` calls `lgnd.protectLegendariesIn(dim, cellVolume)`, which is proposed in `L0-xcx10`. That call:
- moves every legendary out of the container;
- re-drops it at a safe spot **outside** the column footprint, using `lgnd`'s logic for the item entity and the holder.

The protect call, `clearAll()` and `setType(air)` for one container happen **in one synchronous step with no `yield` in between**. That way no player, hopper or second job can move items between "protected" and "cleared" (C-7′: no loss, no copy).

`pntr` does not restate retention, loss return, or holder rules. Those are `lgnd-*`. Legendary *item entities* already lying in the column are not touched, so they fall and `lgnd` recovery covers the Void.

**Known gaps:**
- Item frames have no stable API (`L0-pntr-cx01`).
- Legendaries nested inside a shulker-box *item* inside a container (`L0-pntr-as05`).

Priority: C-15 rank 1 (no loss or duplication) overrides the visual "instant" requirement. If protection throws, the container cell is **kept** and the error is logged. It is not removed blind.
