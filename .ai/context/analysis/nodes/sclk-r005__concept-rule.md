---
type: "concept-rule"
node_id: "L0-sclk-r005"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-r005"]
is_a: ["rule"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1029
tags: ["rule", "enchantments", "piercing", "T14", "T15", "T16"]
level: 2
---
**R-sclk-005 · Enchantments (§8)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["rule"]` · `relates_to: ["L0-sclk-ad01", "L0-sclk-cx01", "L0-adr-scbs", "L0-sclk-as05"]`

- **Allowed:** Quick Charge (I–III), Multishot, Unbreaking (no effect, since there is no durability) and Mending (no effect).
- **Piercing is forbidden.**
  - Any `andrew:sculk_crossbow` stack found with `piercing` loses it. This is checked on `playerInventoryItemChange`, on a held-item change and on craft-token delivery.
  - The stack keeps its other enchantments. No XP is refunded.
  - Log `sculk: stripped piercing from <player>`.
- Even before a strip lands, Piercing never changes an outcome. A bolt resolves once (r001), so a pierce-through is impossible by construction.
- **Quick Charge** shortens the required charge time. Natively it is the vanilla 1.25 s − 0.25 s × level. When emulated (`as05`), the release-speed gate (r006) takes the same table.
- **Multishot** gives three bolts: native or emulated at ±10° yaw (`as05`), one arrow consumed.
