---
type: "concept-assumption"
node_id: "L0-pntr-as02"
source_channel: "rollout"
analysis_version: 5
title: "AS-pntr-02 · `setType` gives no drops or XP"
aliases: ["L0-pntr-as02"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 899
tags: ["title:AS-pntr-02 · setType on containers/spawners gives no drops or XP", "is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-pntr-r004"]
level: 2
---
# AS-pntr-02 · `setType` gives no drops or XP

**Gap.** The stable API docs do not say whether `Block.setType` on a block with a block entity (chest, shulker, spawner) spills its contents or XP.

**Assumption (CAN_ASSUME).**
- `setType` replaces the block silently: no item entities and no XP orbs.
- `pntr` still calls `container.clearAll()` first as belt-and-braces (`L0-pntr-r004`).

**Probe.** A BDS gametest places a filled chest, a shulker box, a spawner and a furnace with fuel/output in the column, fires the LMB, then counts `minecraft:item` and `minecraft:xp_orb` entities in the column AABB. The count must be 0.

**Impact if wrong.**
- The furnace XP or a spawner's orb would leak. The fix is a post-job sweep of *new* item or XP entities in the column AABB that skips legendaries, reusing `ring`'s snapshot method (`L0-adr-ochg`).
- The cost is small, but it adds entity scans to C-5a′.
