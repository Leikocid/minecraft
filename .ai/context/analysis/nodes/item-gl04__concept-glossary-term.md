---
type: "concept-glossary-term"
node_id: "L0-item-gl04"
source_channel: "rollout"
aliases: ["L0-item-gl04"]
part_of: ["L0-item"]
is_a: ["glossary-term"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 428
tags: ["glossary"]
level: 2
---

**Durability Omission Pattern**

This project's established idiom for "infinite durability": rather than assigning a very large numeric value to `minecraft:durability`, the component is **omitted from the item definition entirely**. First used on `andrew:miners_pickaxe`; the Web Sword repeats the pattern. Its interaction with `minecraft:enchantable` is unverified on this Bedrock build — see ASM-005/Q-007 and `L0-item-asm1`.
