---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad15"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-15: A passive def is a separate variant of `LegendaryDef`; active defs keep their fields as required"
aliases: ["L0-lgnd-ad15"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 2792
tags: ["v7", "sculk-crossbow", "passive-def", "resolves:L0-xcx24"]
level: 2
---
# AD-lgnd-15: A passive def is a separate variant of `LegendaryDef`; active defs keep their fields as required

Related: L0-xcx24, L0-lgnd-ent1, L0-lgnd-r018, L0-lgnd-ac26, L0-lgnd-p004, L0-lgnd-p005.

**Context.** Crossbow §1, §9 and §10 say the weapon has no ability, no cooldown and no readiness indicator. As built, `abilityKey` and `cooldownTicks` are required (`registry.ts:12-15`). `hudMessage` draws "Ready" for every held def (`hud.ts:37-56`). `resolveActivation` lets any held, ready def claim the Use (`hands.ts:35-42`), so a passive crossbow in the main hand would mask a Katana or a Cannon in the off hand. `startCooldown` falls back to 600 ticks for an unknown key (`cooldown.ts:48`). About 35 call sites read `WEB_SWORD.abilityKey`, `SCYTHE_OF_CALAMITY.abilityKey` and so on (`trap.ts:151`, `volley.ts:153-259`, and the GameTests).

**Decision.**
1. `LegendaryDef = ActiveLegendaryDef | PassiveLegendaryDef`. Both carry the common fields (`itemId`, `keyPrefix`, `nameKey`, `craftGate`, `craftTokenId`, `refund`, `textPrefix`, `command`).
   - `ActiveLegendaryDef` adds the required `abilityKey`, `cooldownTicks` and optional `hudKeys`. The fields are unchanged in name and value.
   - `PassiveLegendaryDef` adds `abilityKey?: never`. It has no `cooldownTicks` and no `hudKeys`.
2. `WEB_SWORD`, `SCYTHE_OF_CALAMITY`, `ORBITAL_CANNON` and `DRAGON_KATANA` are typed `ActiveLegendaryDef`, so every existing `X.abilityKey` call site compiles unchanged.
3. `hasAbility(def): def is ActiveLegendaryDef` is the one guard. It is used in:
   - `hud.ts`: skip a passive def; the dedupe set keys on `abilityKey` of active defs only;
   - `hands.ts` `resolveActivation`: skip a passive def, so an off-hand active def may answer (`r018`);
   - `defForAbility`: search active defs only.
4. `heldLegendaries` still returns passive defs. Nothing in retention, recovery or protection reads an ability.
5. No key is renamed. `andrew:cd_*` and `andrew:busy_*` for the four shipped abilities are byte-identical (C-17).

**Rejected.**
- (a) **An `ability: { key, cooldownTicks, hudKeys? }` block.** It is cleaner data, but it edits every `def.abilityKey` call site, including GameTest files whose assertions must stay untouched (the `ac11` gate).
- (b) **Optional flat fields** (`abilityKey?`, `cooldownTicks?`). Every caller then gets `string | undefined` and needs a `!` or a guard; the type no longer says which weapons have abilities.
- (c) **A dummy ability with 0 cooldown.** The HUD shows "Ready" forever, and the crossbow claims a Use in the main hand and masks the off hand. Both are spec breaches.

**Consequence.** One framework change, data-shaped, with behaviour for defs #1–#4 proven unchanged by the shipped suites. It is the only framework change the crossbow may ask for (L0 plan).
