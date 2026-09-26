---
type: "concept-rule"
node_id: "L0-pick-r002"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-pick-r002"]
is_a: ["rule"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 1374
tags: ["is_a:rule", "enchantability", "durability"]
level: 2
---
**Rule R2 — Pickaxe-slot enchantability without a durability component.**

`andrew:miners_pickaxe` declares `minecraft:enchantable` with `slot: "pickaxe"`, `value: 10`, and declares **no** `minecraft:durability` component at all (not "very high durability" — the component is absent). This is the Stage 1 prototype's chosen way to get "infinite durability": omission, not a huge number.

Confirmed empirically on the actual target engine, not just declared in JSON: `SELFTEST-01-AA` (in-engine self-test on BDS 1.26.51.1) checks `ItemEnchantableComponent.canAddEnchantment === true` and that `EnchantmentSlot.Pickaxe` is among the enchantable slots, with `minecraft:durability` absent. Operator accepted the matching iPad check for DEMO-S1 on 2026-09-21. This closed decision `decision-q-007-enchantable-without-durability-podtverzhde` — before that check, "does Bedrock allow an enchantable item with no durability component" was an open risk, not an assumption.

**Invariant:** if a future task adds `minecraft:durability` to this item (e.g. to later support Unbreaking-only balance), `pickaxe-no-durability` (selftest) and the GameTest mining scenario's own durability-absence assertion must be updated together — they currently encode "no durability" as a hard pass/fail, not a default. [src: `packs/behavior/items/miners_pickaxe.json`; `src/selftest/main.ts` L127-150]
