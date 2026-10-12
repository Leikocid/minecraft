---
type: "concept-architecture-decision"
node_id: "L0-ench-adr1"
source_channel: "rollout"
analysis_version: 10
title: "ADR-ench-1 · Eligibility and conflicts as a static table in `roll.ts`, checked against the engine on BDS"
aliases: ["L0-ench-adr1"]
is_a: ["architecture-decision"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1916
tags: ["v10", "enchanting", "status:proposed", "data-source"]
level: 2
---
# ADR-ench-1 · Eligibility and conflicts as a static table in `roll.ts`, checked against the engine on BDS

**is_a:** architecture-decision · **part_of:** L0-ench · **relates_to:** L0-adr-enrl, L0-ench-r001, L0-ench-r002, L0-ench-ac06

**Context.** The roller must be pure (`L0-adr-enrl`, C-39). The vanilla answer to "which enchantments may this item carry, and which pairs conflict" lives in the engine: `ItemEnchantableComponent.canAddEnchantment`, `slots` and `EnchantmentType.maxLevel`. The engine is not available in `node --test`.

**Decision.**
1. **A static map.** `ELIGIBILITY`, `MAX_LEVEL`, `TREASURE` and `CONFLICT_GROUPS` are literal data in `src/enchanting/roll.ts` (or a sibling `data.ts`), generated once from the probe's Q1.4 dump on 1.26.51 and committed.
2. **A `bds` parity scenario** (`ac06`) re-derives the same answers from the engine on every gate that reaches it. It fails on any mismatch, so a Bedrock update that changes the data turns the gate red rather than drifting silently.
3. **One RNG interface,** `() => number`. Tests inject an inline mulberry32. Production passes `Math.random`.
4. **One accessor for the forbidden lists,** `forbiddenFor(itemId)`. It unions `FORBIDDEN_ENCHANTMENTS` and the Sculk Crossbow's Piercing, and lives in a pure module (`r003`).

**Rejected.**
- **Deriving eligibility at runtime through `canAddEnchantment`.** That makes the roller impure, so the 1000-sample tests would need BDS. It contradicts `L0-adr-enrl`.
- **Hand-writing the table from wiki knowledge without a parity check.** Bedrock and Java differ: Bedrock already offers trident enchantments at the table, and the Mace's status is unverified. Errors would be silent.
- **Copying the forbidden lists into `roll.ts`.** That would create two sources of truth for C-37.
- **A seeded PRNG in production.** There is nothing to reproduce in play, and it would add state that must survive restarts.
