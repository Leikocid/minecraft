---
type: "concept-assumption"
node_id: "L0-xasm35"
source_channel: "rollout"
analysis_version: 11
title: "ASM-L0-35 · How \"disallow Loyalty and Riptide\" is met"
aliases: ["L0-xasm35"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1471
tags: ["v9", "above-water-trident", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-35 · Loyalty/Riptide ban = trident enchant slot + script scrub; Channeling is inert"
aliases: ["L0-xasm35", "Trident enchant ban"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twth"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-35 · How "disallow Loyalty and Riptide" is met

**Assumption (CAN_ASSUME).**
- **Slot granularity.** Stable item JSON grants an enchant *slot*, not a per-enchantment list. Giving the item the trident slot admits Loyalty, Riptide, Channeling and Impaling at the table, the anvil and `/enchant`.
- **The ban.** It is enforced by a script scrub (C-37). Whenever a trident copy is observed (inventory change, re-insert after return, container pull) carrying Loyalty or Riptide, those two levels are removed and the rest are kept. The anvil may still consume the book; that is reported as a limitation.
- **Channeling.** Allowed but inert: the built-in strike already happens on every hit, and no second strike is added.
- **Impaling.** Allowed. It works only if the probe shows it affects a custom item; otherwise it is reported as inert.
- **Unbreaking and Mending.** Allowed and harmless, since the item has no durability.

**Impact if wrong.**
- If a stable per-enchantment exclusion exists, the scrub is replaced by data.
- If Andrey wants the anvil to refuse the book outright, there is no stable way to do it. That would be a client question.
