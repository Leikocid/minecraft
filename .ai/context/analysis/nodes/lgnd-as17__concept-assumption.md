---
type: "concept-assumption"
node_id: "L0-lgnd-as17"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-as17"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 1033
tags: ["v6", "katana", "CAN_ASSUME"]
level: 2
---
---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad14", "L0-lgnd-as02", "L0-xasm22"]
---
**ASM-lgnd-17: The Katana's def names are `dk` / `dragon_katana` / `andrew:katana` / `andrew.katana`, and its refund is the recipe's non-sword ingredients plus a plain diamond sword.**

The spec does not name any of the keys. They follow the precedents:
- `ws`, `sc` and `oc` are the two-letter initials of the full name;
- the command is the short weapon name (`websword`, `scythe`, `orbital`).

The refund mirrors the Web Sword's, which returns its consumed diamond sword. The returned sword is **plain**: the enchantments and damage of the consumed sword are not read, because the token pipeline cannot see the consumed ingredient (`L0-xasm22`).

**Impact if wrong.**
- **Names:** none until the first world ships. After that they are frozen (`r006`).
- **The refund must restore an enchanted sword:** this needs a craft-time ingredient read, which stable 2.10.0 does not offer. It would be a C-16 deviation, raised on L0.
