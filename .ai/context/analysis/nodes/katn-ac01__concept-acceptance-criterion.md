---
type: "concept-acceptance-criterion"
node_id: "L0-katn-ac01"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1019
tags: ["acceptance-criterion", "katana", "channel:bds", "T01", "T02", "T03", "is_a:acceptance-criterion", "relates_to:L0-lgnd-p001"]
level: 2
---
---
title: "AC-katn-01 (T01, bds + build): the Katana recipe yields the craft token (gate assertions: L0-lgnd-ac23)"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p001", "L0-lgnd-ac23", "L0-katn-r001", "L0-xasm22"]
---
The rule is owned by `L0-lgnd-p001`. **The gate, flag, refund, restart, Creative/`/give` and broadcast assertions (T01–T03) are `L0-lgnd-ac23`** (reconciled at reduce v6: this card used to repeat them). `katn` owns only the recipe JSON that feeds the gate:
- **Shape.** GIVEN a Crafter loaded by `/replaceitem` with `. G . / P S P / . G .` (G golden apple, P ender pearl, S diamond sword, any damage or enchantment), WHEN it fires, THEN it outputs exactly one `andrew:dragon_katana_crafted` token and never the item itself.
- **Negative controls.** An iron sword in the centre, an enchanted golden apple for G, or a mirrored or shifted layout produces nothing.
- **Build.** `packs/behavior/recipes/dragon_katana*.json` names only `andrew:dragon_katana_crafted` as output (a node grep test).
