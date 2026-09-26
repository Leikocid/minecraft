---
type: "concept-assumption"
node_id: "L0-scyt-as04"
source_channel: "rollout"
analysis_version: 1
title: "ASM-scyt-04 — \"Mob\" = any entity with a health component, including passive animals, villagers, pets and armour stands `CAN_ASSUME`"
aliases: ["L0-scyt-as04"]
is_a: ["assumption"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 901
tags: ["is_a:assumption", "assumption", "mob-targeting", "delta:2026-09-26"]
level: 2
---
# ASM-scyt-04 — "Mob" = any entity with a health component, including passive animals, villagers, pets and armour stands `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-ad04", "L0-scyt-r001"]`

**Assumed:** the operator's «на мобов тоже» means every living entity. There is no hostile-only filter and no exclusion of the owner's tamed pets, villagers, iron golems or armour stands. Anything with `minecraft:health` in range can be locked once no visible player qualifies.

**Basis:** `decision-scythe-targets-mobs` names only the health component as the discriminator.

**Impact if wrong:** a volley can go into the owner's own wolf or a village's villager. Hitting a golem aggros it, and a villager hit affects trading reputation. The fix is a type/family exclusion list in `gatherCandidates`, with a table test row. The ask belongs to the operator.
