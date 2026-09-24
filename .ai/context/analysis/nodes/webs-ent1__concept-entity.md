---
type: "concept-entity"
node_id: "L0-webs-ent1"
source_channel: "rollout"
analysis_version: 1
level: 2
title: "WebSwordItem"
aliases: ["L0-webs-ent1"]
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1230
tags: ["entity", "item"]
---
---
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r001", "L0-lgnd-ent1"]
---
# WebSwordItem

The Web Sword's own item definition — the per-weapon payload registered into `L0-lgnd`'s shared `LegendaryDef` registry (`L0-lgnd-ent1`), not a separate identity system.

**Attributes.**
- `id`: `andrew:web_sword`
- `baseDamage`: mirrors the current BDS build's vanilla `diamond_sword` melee damage (read at build/implementation time, not hard-coded from an assumed value)
- `durability`: none — infinite, item never breaks
- `enchantable.slot`: `sword`
- `menuCategory`: equipment / sword group; visible in Creative "All" and Creative Search; `/give`-able
- `recipe`: shaped, 4× `minecraft:web` + 1× `minecraft:diamond_sword` (any durability/enchantment) around empty corners → 1× `andrew:web_sword`; the sword ingredient's durability/enchantments are consumed, not transferred

**Relationship to the framework.** The craft-gate (one-per-world), the instance mark (`L0-lgnd-ent2`) and death retention that make a *specific crafted copy* legendary are all `L0-lgnd`'s. `WebSwordItem` here is only the static item-type definition (`web_sword.json` + `recipe.json`), shared by every copy (crafted, admin-given, or creative).
