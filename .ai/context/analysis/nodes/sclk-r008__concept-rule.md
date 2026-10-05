---
type: "concept-rule"
node_id: "L0-sclk-r008"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r008"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 625
tags: ["rule", "durability", "T18", "item"]
level: 2
---
**R-sclk-008 · Infinite durability (§1, §3, T18)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-ent1", "L0-adr-scbs"]`

- Under option A (`adr-scbs`), the item JSON has **no `minecraft:durability`** component, so shots, melee and use never create a damage value. `ItemStack.getComponent("minecraft:durability")` is `undefined`.
- Under option B (a fallback, `lgnd`-owned): after each shot, the script resets `durability.damage = 0` on the marked stack. T18 then goes to `lgnd` (plan routing).
- An anvil cannot "repair" it, and Unbreaking or Mending change nothing. Both are allowed (r005).
