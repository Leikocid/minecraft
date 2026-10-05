---
type: "concept-architecture-decision"
node_id: "L0-adr-sctr"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ADR-L0-sctr · Crater and sculk (status: proposed)"
aliases: ["L0-adr-sctr"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 2359
tags: ["v7", "sculk-crossbow", "status:proposed"]
---
---
title: "ADR-L0-sctr · Crater and sculk: a scripted, bounded, protected carve with a shared deny list"
aliases: ["L0-adr-sctr", "Sculk crater carve"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-orbc", "L0-lgnd", "L0-xcx25", "L0-xasm24", "L0-xasm25"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/orbital/penetrator-keep.ts", "src/legendary/recovery.ts"]
---
# ADR-L0-sctr · Crater and sculk (status: proposed)

**Context.** §6, §7, §11 and §14 ask for an irregular crater of up to about 5×5×(2–3) with no explosion damage, then permanent plain sculk around it. The edits are event-driven, synced and saved. With Multishot and Quick Charge, one player can cause about 3 carves every ~0.6 s.

**Decision (proposed).**
1. **Shape.** A pure, node-tested `craterCells(impact, face, seed)`. It returns cells inside a 5×5 footprint and down to 3 deep: an ellipsoid with radius jitter, seeded per bolt so a GameTest can replay it. The centre column is always at least 2 deep. The **patch** is `sculkCells(…)`: the top exposed solid full-block faces within ≤ 5×5, with a ragged edge.
2. **Order in the hit tick:**
   1. clip the box to loaded chunks and the height range (C-12);
   2. `protectLegendariesIn(dimension, box)` (`recovery.ts:679`);
   3. set each crater cell to air if it is not on the deny list and not a liquid;
   4. turn each patch cell into `minecraft:sculk`.

   There are no item drops (`xasm25`) and no entity damage. Each bolt does at most 75 + 25 `setType` calls. A per-tick budget (for example 300 calls) queues overflow to the next tick of the shared interval, keeping the order per bolt.
3. **The deny list is shared.** `penetrator-keep.ts` (the Orbital LMB Survival-unbreakable list, `L0-xasm6`) moves to a neutral module, for example `src/terrain/keep.ts`. Both weapons import it, with no change in behaviour for the Orbital (C-7, `xcx25`).

**Rejected.**
- **`dimension.createExplosion`.** It always damages entities, breaks blocks by blast resistance rather than to the bounds asked for, and drops items (§6, T12).
- **Spreading the carve over a `runJob`.** The engine fact: starting `runJob` stalls the next tick by 15–30 ms. The interval budget achieves the same thing without that.
- **A per-weapon copy of the deny list.** It would drift (C-7).
