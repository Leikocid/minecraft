---
type: "concept-assumption"
node_id: "L0-item-asm2"
source_channel: "rollout"
aliases: ["L0-item-asm2"]
part_of: ["L0-item"]
is_a: ["assumption"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1400
tags: ["assumption","damage","tags"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["assumption"]` · `relates_to: ["L0-item-ent1", "L0-item-ac04"]`

**Assumption:** the correct explicit values to replicate vanilla Diamond Sword parity are its known vanilla damage value and the tag set `["minecraft:is_sword", "minecraft:sword", "minecraft:weapon"]` on `minecraft:tags`.

**Basis.** §1 only says *«урон алмазного меча»* (Diamond Sword's damage) without stating a number, and this repository holds no vanilla item definitions to copy from directly (only the custom pickaxe, which is a tool, not a weapon, and carries different tags). The values above come from general Bedrock domain knowledge, not from anything verifiable in this KV.

**Impact if wrong.** Medium. A wrong damage number fails `L0-item-ac04` directly and is easy to correct once measured in-game. Wrong or missing weapon tags are subtler — some vanilla systems (mob equipment preference, certain enchant restrictions, hostile-mob AI weapon checks) key off tags rather than the item type, so an incomplete tag set could produce behavior that passes the stated acceptance tests but still "feels" like a non-sword to other game systems.

**Recommendation.** Verify the actual current damage constant and tag set for `minecraft:diamond_sword` against the target game version (1.26.51) before finalizing `L0-item-ent1`, rather than trusting this assumption into implementation.
