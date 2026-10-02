---
type: "concept-assumption"
node_id: "L0-orbc-as03"
source_channel: "rollout"
analysis_version: 5
title: "ASM-orbc-03 · What a \"block\" is for contact"
aliases: ["L0-orbc-as03"]
is_a: ["assumption"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1239
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-orbc-r008", "probe"]
level: 2
---
# ASM-orbc-03 · What a "block" is for contact

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r008", "L0-orbc-r003"]`

**Gap.** §8 says a charge detonates "on first contact with a block", and one spawned in a "solid block" triggers at once. "Solid" is not defined. `Block.isSolid` exists in stable, but its semantics for slabs, leaves, glass and similar blocks are not verified on 1.26.51.1.

**Assumption.**
- Contact means not air, not a liquid, and not in `PASS_THROUGH`.
- `PASS_THROUGH` holds:
  - short and tall grass, ferns, flowers, saplings and dead bush;
  - all torches, redstone wire and rails;
  - a snow layer of height 1;
  - vines, cobweb, sugar cane, kelp and seagrass;
  - fire and soul fire;
  - `structure_void` and `light_block`.
- Everything else is contact, including leaves, glass, slabs, carpets, fences and barriers.
- A unit test lists the set, and the target raycast (`r003`) skips the same passable blocks.

**Probe.** Compare `Block.isSolid` against this set on BDS. If they agree, use `!isSolid && !isLiquid` as pass-through.

**Impact if wrong.** A charge stops on a flower, which gives an effect 1 block high, or it passes through a leaf canopy. Minor, and a local fix.
