---
type: "concept-acceptance-criterion"
node_id: "L0-item-ac04"
source_channel: "rollout"
aliases: ["L0-item-ac04"]
part_of: ["L0-item"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 573
tags: ["acceptance-criterion","passive-behavior"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-item-r004"]`

GIVEN a player holding a Web Sword, WHEN they perform a plain melee attack (not the item-Use ability) against an entity, THEN damage dealt equals vanilla Diamond Sword damage (adjusted only by any applied compatible enchantments), AND no Cobweb is placed anywhere, AND no cooldown timer starts or is consumed.

**Source:** §7, §13 (test 6). Shared boundary with `L0-trap`/`L0-cool` — this AC fails if either sibling reacts to the attack event instead of the Use event.
