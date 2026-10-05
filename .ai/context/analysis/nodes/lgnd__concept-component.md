---
type: "concept-component"
node_id: "L0-lgnd"
source_channel: "rollout"
analysis_version: 7
title: "Legendary weapon framework (`src/legendary/`), v7: as built at 1.6.1, plus the passive def and the Sculk Crossbow delta"
aliases: ["L0-lgnd"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 5116
tags: ["v7", "sculk-crossbow", "legendary"]
level: 1
---
# Legendary weapon framework (`src/legendary/`), v7: as built at 1.6.1, plus the passive def and the Sculk Crossbow delta

Related: L0-sclk, L0-katn, L0-magn, L0-orbc, L0-webs, L0-scyt, L0-xcx11, L0-xcx24, L0-adr-scbs, L0-adr-hold, L0-xasm26, L0-lgnd-ad15, L0-lgnd-ad16, L0-lgnd-ad17, L0-lgnd-cx15, L0-lgnd-cx16, L0-lgnd-r016, L0-lgnd-r018.

**Responsibility.** Every general legendary rule is implemented once, for every def in `LEGENDARIES`: the token craft gate and first-craft broadcast, marks and generation, death retention, loss return and the owed list, `protectLegendariesIn`, hand priority (`resolveActivation`), cooldown and busy, the HUD, `hidden_until`, and the type predicates `isLegendaryStack` / `isLegendaryWeaponStack`.

## As built at 1.6.1 (read from code 2026-10-05)
- **Four defs** (`registry.ts`): Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk` (shipped 1.5.0, `KATA-LGND-01-AA`). The Katana needed no framework code (`ad14` held).
- **Every def has an ability.** `abilityKey` and `cooldownTicks` are required fields (`registry.ts:12-15`). The HUD draws a line for every held def (`hud.ts:37-56`), and `resolveActivation` lets any held, ready def claim a Use (`hands.ts:35-42`).
- **Legendary weapons are magnetic** (operator tuning, 1.6.0, `de0fc68`). The magnet uses `isLegendaryWeaponStack` (weapons, never tokens): ground, container slots, late drops, a player holding one (`magnet-hold.ts:117-136`), and a mob or armour stand holding one (`magnet-select.ts:179`, `:320`). The UFO AC 13 "never pulled" rule is retired. See `r016` and `ac21`.
- **Armour stand in the Void** is closed in code (`decision-resolve-l0-lgnd-cx14`: stand watcher plus two return guards, `recovery.ts:326`, `:433`).
- **Return target is still `mark.owner`.** `lost()` targets `w.mark.owner` (`recovery.ts:490`), and the protect hand-back and owed entry use it too (`:877-879`). `decision-resolve-l0-xcx11` (2026-09-29) chose the last holder and named `LGND-GEN-01-AA`. That task is archived, but the mark has no holder field (`state.ts`). See `cx16`.

## v7 delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Passive def: a def may have no ability. Then it has no timer key, no Use claim and no HUD line. Defs #1–#4 keep byte-identical keys and behaviour | `ad15`, `ent1`, `r018`, `ac26` (closes `L0-xcx24`) |
| 2 | Def #5 `SCULK_CROSSBOW`: `andrew:sculk_crossbow`, token `andrew:sculk_crossbow_crafted`, refund 2 echo shard + 2 deepslate + 1 crossbow, command `andrew:crossbow`, passive | `ad16`, `as18`, `ac25` |
| 3 | **Key prefix: not `sc`.** `sc` is the Scythe's; reuse would share the craft flag, marks, pending and owed. Proposed `sk` | `cx15`, `as18` |
| 4 | No per-weapon code in retention, recovery, the Void paths, `protectLegendariesIn`, commands or the magnet: each iterates `LEGENDARIES` or calls `defForStack`/`defForToken` | `ad16`, `ac27` |
| 5 | Return target for T19/T20/Void: `mark.owner` until the holder task ships, as for the Katana. Tests call one `returnTarget(mark)` helper so the holder task changes one function | `ad17`, `ac27`, `cx16` |
| 6 | Magnet: the crossbow is pulled like the other four. Not a spec breach (the crossbow spec does not list the magnet as a hazard) | `r016`, `ac21` |

**Fallback, stated as larger.** If the `sclk` probe rejects a custom shooter and `L0-adr-scbs` falls back to the vanilla `minecraft:crossbow` (option B), identity can no longer be by type. `isLegendaryStack`, `isLegendaryWeaponStack`, `defForStack`, `heldLegendaries`, the magnet's `hasitem` holder tags (which cannot read dynamic properties), the craft gate (the recipe *input* is the same type), retention and the GameTests all become mark-aware. That is a framework rewrite of identity, not a def. It needs its own L0 decision and is **not** planned by this pass (`ad16` §Fallback).

## Published contracts
- `LEGENDARIES`, `defForStack`, `defForToken`, `defForAbility` (active defs only), `isLegendaryStack`, `isLegendaryWeaponStack`, **`hasAbility(def)`** (new).
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `heldLegendaries(player)` (still returns passive defs; retention-neutral), `resolveActivation(player)` (active defs only).
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`; `sclk`'s crater calls it before carving (`L0-xcx25`).
- `isLegendaryItemEntity`, `isHiddenFromTargeting`, `hideFromTargeting`.

## Does NOT own
The crossbow item JSON, token, recipe, lang, bolt pipeline, damage, crater, durability (custom base) and Piercing exclusion (`sclk`). The magnet's selection (`magn`).

## Next tasks
1. **LGND-PASSIVE** (before `sclk` item): `ad15` type split, `hasAbility`, HUD/resolver skips, registry test. Gate: the existing legendary GameTests and `npm test` pass with no assertion edits (`ac26`).
2. **Def #5** lands with the `sclk` item task: the entry, the uniqueness and key asserts, the crossbow instances of the framework GameTests (`ac25`, `ac27`).
3. **LGND-HOLD** (separate, unblocked by the decision): the holder field per `ad11`; `ac18` plus the holder clauses of `ac08`, `ac09`, `ac24`, `ac27`.
