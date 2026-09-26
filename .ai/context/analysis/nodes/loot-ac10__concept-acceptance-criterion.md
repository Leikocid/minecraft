---
type: "concept-acceptance-criterion"
node_id: "L0-loot-ac10"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 381
tags: ["is_a:acceptance-criterion", "relates_to:L0-loot-p002", "relates_to:L0-bast", "source:spec-14-AC55"]
level: 2
---
GIVEN Mini Bastion's 10 chests, WHEN their contents are inspected, THEN the 3 central treasure chests draw from vanilla `chests/bastion_treasure` and the 7 distributed chests draw from vanilla `chests/bastion_other`, with no custom-table influence on either.

Source: spec §14 addendum, AC55 (loot portion — chest counts/gold blocks/guards belong to `L0-bast`, not this component).
