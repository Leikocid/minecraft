---
type: "concept-rule"
node_id: "L0-webs-r001"
source_channel: "rollout"
analysis_version: 1
level: 2
aliases: ["L0-webs-r001"]
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1034
tags: ["rule", "item", "recipe"]
---
---
is_a: ["rule"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent1"]
---
**Rule (R-webs-001 — Item & recipe identity).** `andrew:web_sword`: melee damage equal to the current BDS build's vanilla `diamond_sword` (read from the server's own vanilla data at implementation time, never hard-guessed — same posture as decision `web-sword-item-values`); no `minecraft:durability` component, infinite durability; `minecraft:enchantable` slot = `sword` (compatible vanilla sword enchantments apply); `menu_category` = equipment, sword group; visible in Creative Equipment, the "All" catalog, Creative Search, and via `/give`. Shaped recipe: row1 `[ , Cobweb, ]`, row2 `[Cobweb, Diamond Sword, Cobweb]`, row3 `[ , Cobweb, ]` → 1× Web Sword. The Diamond Sword ingredient may carry any durability/enchantments; none of it — or its identity — carries over to the result.

**Rationale.** Spec §1–2; closed by decision `web-sword-item-values`. Recipe correctness and damage/enchant-slot values are independently acceptance-tested (`L0-webs-ac01`).
