---
type: "concept-architecture-decision"
node_id: "L0-orbc-ad01"
source_channel: "rollout"
analysis_version: 3
title: "ADR-orbc-01 · Target source: the event's block when there is one, else the view-direction raycast"
aliases: ["L0-orbc-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1803
tags: ["is_a:architecture-decision", "status:proposed", "amends:L0-adr-orbc", "relates_to:L0-xcx8", "relates_to:L0-orbc-cx02", "relates_to:L0-xq5"]
level: 2
---
# ADR-orbc-01 · Target source: the event's block when there is one, else the view-direction raycast

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-adr-orbc", "L0-xcx8", "L0-orbc-cx02", "L0-xq5"]`

**Status:** proposed. It amends `L0-adr-orbc` §2.

**Context.**
- `L0-adr-orbc` resolves every activation with one `getBlockFromViewDirection({maxDistance: 10})` and ignores the event's block.
- On the iPad's default touch scheme, a tap selects the block **under the finger**, and `itemUseOn`, `playerInteractWithBlock` and `entityHitBlock` report that block. The view direction points at the screen centre, which can be a different block (`cx02`).
- Ignoring the event block would fire at a block the player never highlighted. That breaks "the vanilla highlight is the marker" (§6).

**Decision.**
1. If the event carries a block (`itemUseOn.block`, `playerInteractWithBlock.block`, `entityHitBlock.hitBlock`) and its distance from the eye is ≤ 10, that block is the target. It passes through the same `isTargetable` filter as the ray.
2. Otherwise, for plain `itemUse` in the air, or on a crosshair or controller, use `getBlockFromViewDirection({maxDistance: 10, includeLiquidBlocks: false, includePassableBlocks: false})`.
3. Both paths feed one `lockTarget()` function. There is one rule for both modes (`r003`).

**Rejected.**
- *View ray only* (`L0-adr-orbc`): it mis-aims on touch.
- *Event block only*: this loses RMB 6–10 on keyboard, mouse and crosshair, where `itemUse` fires with no block.

**Consequences.** On default touch, both modes are effectively limited to the reach, because touch only reports taps within reach. The 6–10 range on the iPad needs the crosshair ("split controls") layout. This goes into `xq5` and the deviation notes (`r013`).
