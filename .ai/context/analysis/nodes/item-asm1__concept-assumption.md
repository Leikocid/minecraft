---
type: "concept-assumption"
node_id: "L0-item-asm1"
source_channel: "rollout"
aliases: ["L0-item-asm1"]
part_of: ["L0-item"]
is_a: ["assumption"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1410
tags: ["assumption","must-ask","blocker"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["assumption"]` · `relates_to: ["L0-item-r001", "L0-item-ac03"]`

**Assumption (`MUST_ASK`, item-scoped instance of parent ASM-005/Q-007):** `minecraft:enchantable` with `slot: "sword"` functions correctly on an item that has **no** `minecraft:durability` component, on Bedrock 1.26.51 / `@minecraft/server` 2.10.0.

**Basis.** The pickaxe already encodes the identical hypothesis (`slot: "pickaxe"`, durability omitted) and Stage 1's decision only fixed the *verification method* ("test empirically first"), not the outcome — this analysis cannot read the result from the repository. The sword is a second, independent instance of the same untested hypothesis, with a different slot value.

**Impact if wrong.** §1's two requirements ("infinite durability" and "vanilla enchantments allowed") become mutually exclusive for the sword specifically. Fallback would require adding `minecraft:durability` with break-protection (e.g. auto-repair), or dropping enchantability — either changes `L0-item-r001` and invalidates `L0-item-ac03`. It would also strengthen (not create) the case that the pickaxe's own enchantability claim needs re-verification.

**Recommendation.** Test the sword's `slot: "sword"` case explicitly rather than assuming the pickaxe's `slot: "pickaxe"` result (if ever recorded) transfers — the two slots are handled by separate engine code paths.
