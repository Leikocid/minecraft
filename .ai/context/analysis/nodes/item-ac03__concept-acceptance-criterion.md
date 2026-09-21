---
type: "concept-acceptance-criterion"
node_id: "L0-item-ac03"
source_channel: "rollout"
aliases: ["L0-item-ac03"]
part_of: ["L0-item"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 662
tags: ["acceptance-criterion","durability"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r001", "L0-item-asm1"]`

GIVEN a Web Sword used through an extended play session (many hits landed, blocks broken, extended time held), WHEN its state is inspected, THEN it shows no durability bar, cannot be consumed by use, and remains fully functional indefinitely — because no `minecraft:durability` component is present on the item.

**Source:** §1, §13 (test 5). Depends on ASM-005/Q-007 resolving in the assumed direction (`L0-item-asm1`) — if enchantability and durability-omission turn out incompatible, this AC and `L0-item-r001` must be revisited together.
