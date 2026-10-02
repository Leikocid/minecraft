---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad10"
source_channel: "rollout"
analysis_version: 5
title: "AD-lgnd-10: The \"not destroyed\" policy is prevent → spill → return, and the Cannon's effects must pre-empt it"
aliases: ["L0-lgnd-ad10"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2933
tags: ["v3-delta", "status:proposed", "resolves:L0-xcx10", "deviation:C-16"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-xcx10", "L0-lgnd-r012", "L0-lgnd-r013", "L0-lgnd-p008", "L0-lgnd-p003", "L0-lgnd-ad02", "L0-lgnd-as04", "L0-adr-ochg", "L0-xasm7", "L0-pntr", "L0-ring"]
---
# AD-lgnd-10: The "not destroyed" policy is prevent → spill → return, and the Cannon's effects must pre-empt it

**Context.**
- Orbital §5 is a general rule: a legendary is **not destroyed** by fire, lava, cactus, TNT, the Orbital Cannon or other ordinary means. If its container is destroyed, it survives or drops.
- As built, the rule is "destroyed means returned" (`recovery.ts`). The stable API offers no indestructible item entity (`as04`).
- The Cannon creates two new ways to lose one silently:
  - LMB `setType(air)` on a container erases its contents with no drop (`as12` item 3).
  - RMB drop suppression deletes new item entities (`L0-adr-ochg` §3).

**Decision: three tiers, the first applicable one wins.**
1. **Prevent (script-caused destruction).** Code in this add-on that removes blocks or detonates calls `protectLegendariesIn(dimension, volume)` (`p008`) first. That covers the Cannon LMB column, each RMB detonation, and any future effect. The helper moves live marked legendaries out of containers and off the ground in that volume, to a safe spot. The item stays in the world: it is the same stack, the same `gen`, and gets no message. This **meets** §5 literally for the Cannon.
2. **Spill (vanilla container destruction).** A player breaking a chest, vanilla TNT, a creeper, or a piston-free removal: vanilla spills the contents as item entities. The spilled legendary is then watched like any drop. No code runs.
3. **Return (item-entity destruction the engine does).** Fire, lava, cactus, a vanilla explosion hitting the item entity, despawn, or the Void: `p003` re-issues the item to the last holder with `gen + 1`. This is the documented deviation (C-16): "returned" instead of "not destroyed".

**Also decided.**
- RMB drop suppression **must** skip legendary item entities, using `isLegendaryItemEntity`, which `lgnd` publishes. `ring` owns the suppression.
- Tier 1 is mandatory for effects this add-on ships. The `ac19` GameTest fails if an effect removes a container holding a legendary without calling the helper.

**Rejected.**
- (a) **Return-only.** It does not meet §5 for the Cannon, which is the one destructive source the add-on controls. A chest's owner would also see their legendary teleport to a far-away player.
- (b) **Keep legendary item entities out of danger with a per-tick teleport.** That is a C-5 violation and has race windows (`ad02` rejected a).
- (c) **Forbid the Cannon from affecting containers that hold legendaries** (skip the block). It leaves floating chests in a column that must be cleared (§9), and it leaks which chests hold legendaries.

**Consequences.** `p008`, `r012`, `r013`, `ac19`, `ac20`. Nested containers are out of reach (`cx12`).
