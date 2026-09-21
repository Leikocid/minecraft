---
type: "concept-rule"
node_id: "L0-item-r001"
source_channel: "rollout"
aliases: ["L0-item-r001"]
part_of: ["L0-item"]
is_a: ["rule"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 937
tags: ["rule","damage","durability"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-item-ent1"]`

**Rule — Damage & durability parity.** `andrew:web_sword` must replicate vanilla Diamond Sword melee damage and must never lose durability. Implementation: an explicit `minecraft:damage` component matching Diamond Sword's value, and **omission** of `minecraft:durability` entirely — not a very-high numeric durability pool.

**Rationale.** §1: *«Обычный удар должен иметь урон алмазного меча»* + *«Прочность: бесконечная; предмет не должен ломаться»*. §13 tests both "no durability loss after extended use" and passive-hit damage parity as separate acceptance criteria.

**Precedent.** `packs/behavior/items/miners_pickaxe.json` already uses component-omission for infinite durability rather than a large numeric value — this is the established project idiom, not a new choice.

**Source:** §1, §13 AC-5; carries ASM-005/Q-007 (see `L0-item-asm1`).
