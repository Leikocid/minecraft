---
type: "concept-component"
node_id: "L0-pick"
source_channel: "rollout"
analysis_version: 2
title: "Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt)"
aliases: ["L0-pick"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 3389
tags: ["is_a:component", "relates_to:L0-infr"]
level: 1
---
# Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-infr"]`

**Responsibility:** One custom item, `andrew:miners_pickaxe`, that serves as the compatibility probe for the whole add-on stack (Behavior Pack + Resource Pack + stable `@minecraft/server` Script API) before Stage 2's PvP add-on is built. It proves a custom tool item can be crafted, enchanted, and given non-vanilla dig/drop behavior on the operator's actual installed Bedrock version, with nothing else in scope. [src: minerspickaxetestspec]

**Inputs:**
- Crafting-table recipe consuming 3× Iron Ingot, 2× Raw Gold, 2× Stick (see `L0-pick-r005`, `L0-pick-ent1`).
- `world.beforeEvents.playerBreakBlock` on any block, filtered to when the pickaxe is the held tool (`src/autosmelt.ts`).

**Outputs:**
- One `andrew:miners_pickaxe` item, visible in Creative (Equipment → pickaxe group) and via `/give`, RU+EN localized name.
- Diamond-pickaxe-speed breaking of any `is_pickaxe_item_destructible` block (`L0-pick-r001`).
- Pickaxe-slot enchantability without a durability component — infinite use by omission (`L0-pick-r002`).
- Auto-smelt: 7 ore/debris block ids drop their smelted product directly instead of the raw material (`L0-pick-r003`).

**Deliberately out of scope for Stage 1** (per raw spec, confirmed unchanged by the implementation): durability, Fortune multiplication of auto-smelt yield, Silk Touch override, exact parity with every diamond-pickaxe mining tag beyond the three representative tag families actually tested.

**Dependency:** gated behind Stage 0 (infrastructure) closing every criterion first — ai-kit rejects cross-epic dependencies, which is the enforcement mechanism, not a process rule anyone has to remember [src: concept-constraint C-11, `L0-infr`].

**Resolved issue inherited from raw sources (not re-filed here):** contradiction CTR-4 already covers this component — the raw spec's compatibility target (`@minecraft/server` 2.9.0 / `min_engine_version` 1.26.0) is superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` (2.10.0 / [1,26,50]) and matches the live implementation. CTR-4 is closed by `decision-resolve-cool-ctr4`; the pin is enforced by `scripts/validate.mjs` against `scripts/targets.mjs`.

**Verification split** (inherited from parent, applies here): craft/digger/auto-smelt logic is proven on BDS in Docker; Creative placement, icon and RU/EN name rendering are proven only on iPad [src: concept-constraint C-6, C-9]. Both channels are green for Stage 1 — DEMO-S1, operator-accepted 2026-09-21 (see `decision-q-007-enchantable-without-durability-podtverzhde`).

**Evidence base for this deep-dive:** raw spec `minerspickaxetestspec` (`docs/Miners_Pickaxe_Test_Spec.docx`); live source `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `src/autosmelt.ts`; test coverage `src/gametest/main.ts` (`pickaxe_digs_at_diamond_speed`, `pickaxe_autosmelt`, `pickaxe_keeps_vanilla_drops`) and `src/selftest/main.ts` (`pickaxe-item-stack`, `pickaxe-enchantable`, `pickaxe-no-durability`).

**Children:** rules `L0-pick-r001`..`r005`; entities `L0-pick-ent1`, `ent2`; acceptance criteria `L0-pick-ac01`..`ac07`; glossary `L0-pick-gl01`..`gl05`; assumptions `L0-pick-asm1`..`asm3`; ADR `L0-pick-ad01`.
