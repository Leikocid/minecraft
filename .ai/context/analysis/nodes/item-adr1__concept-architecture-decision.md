---
type: "concept-architecture-decision"
node_id: "L0-item-adr1"
source_channel: "rollout"
aliases: ["L0-item-adr1"]
part_of: ["L0-item"]
is_a: ["architecture-decision"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1764
tags: ["architecture-decision","item-definition"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-item-ent1", "L0-item-asm2"]`

## ADR (item-local) — Diamond Sword parity via explicit component replication, not inheritance

**Context.** §1 describes the Web Sword as "based on Diamond Sword" for damage and combat feel. Bedrock's stable custom-item format has no subclassing or override mechanism for vanilla items — every custom item is an independent `minecraft:item` JSON document.

**Decision.** Define `andrew:web_sword` as a fully standalone item definition (same pattern as `andrew:miners_pickaxe`) that **explicitly restates** every vanilla-parity component needed for Diamond Sword feel: `minecraft:damage`, `minecraft:enchantable` (`slot: "sword"`), `minecraft:hand_equipped`, `minecraft:max_stack_size: 1`, and the sword/weapon tag set — rather than attempting to reference, override, or wrap the vanilla `minecraft:diamond_sword` identifier.

**Rejected alternatives.**
- *Overriding the vanilla `minecraft:diamond_sword` identifier directly* — would silently reskin every existing Diamond Sword in the world/inventories, and violates the project's namespaced-identifier convention (decision-namespace-addona-andrew-asm-002-q-002).
- *Component inheritance/aliasing from a vanilla item* — no such mechanism exists in the stable Bedrock item format; rejected as infeasible, not merely undesirable.

**Consequence.** Parity is a **point-in-time copy**, not a live reference. A future game-version balance change to vanilla Diamond Sword will not automatically propagate to `andrew:web_sword`. This should be re-checked whenever `min_engine_version`/`@minecraft/server` is bumped (C-1, C-2) — flag as a regression-check item for `L0-qatg` at that time, not now.
