---
type: "concept-component"
node_id: "L0-strm"
source_channel: "rollout"
analysis_version: 8
title: "strm · Storm Blade + two vanilla recipes"
aliases: ["L0-strm"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 3815
tags: ["v8", "storm-blade", "vanilla-recipes", "component"]
level: 1
---
---
title: "strm · Storm Blade (`andrew:storm_blade`) + Elytra/Totem recipes"
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-katn", "L0-sclk", "L0-scyt", "L0-magn", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr", "L0-xcx26", "L0-xcx27", "L0-xq8", "L0-xasm29", "L0-xasm30", "L0-xasm31", "L0-xasm32"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/storm/", "src/legendary/registry.ts", "src/main.ts", "src/katana/plan.ts", "packs/behavior/items/storm_blade*.json", "packs/behavior/recipes/storm_blade.json", "packs/behavior/recipes/elytra.json", "packs/behavior/recipes/totem_of_undying.json"]
---
# strm · Storm Blade + two vanilla recipes

**Source:** "Storm Blade + Elytra + Totem of Undying v1" (§01–§07). Code base 1.8.0.

## Responsibility
1. **Legendary def #6**, the Storm Blade. It is a diamond-sword-class melee weapon with:
   - an **active** Use ability: a straight trace of ≤ 10 blocks that deals 10 HP pre-armour to the first living entity, with three visual strikes;
   - a **passive** melee proc: 30 % for +6 HP pre-armour and one visual strike.
2. **Two unlimited vanilla recipes**: 6 feathers + diamond chestplate → `minecraft:elytra`, and 8 gold ingots + emerald → `minecraft:totem_of_undying` (`L0-adr-sbvr`, C-31).

## What strm owns vs cites
| Area | Owner | Note |
|---|---|---|
| Craft-once gate, token swap, refund, broadcast, Creative/`/give` copies | `lgnd` (cited) | def-driven; strm only adds def #6 |
| Retention on death, chest stays, hazards, Void → last holder (incl. offline) | `lgnd` (cited) | `lgnd` scenarios gain def #6 |
| Hand priority (`resolveActivation`), HUD line, cooldown storage | `lgnd` (cited) | HUD text via lang keys |
| Magnet pick-up | `magn` (cited) | legendary scenarios include def #6 |
| Ray stepping, `TRACE_FLAGS` | `katn` | **imported** from `src/katana/plan.ts` (`L0-strm-adtr`) |
| Hurt-window technique | `sclk` | **mirrored**, not shared: armour damage ≠ true damage |
| Damage helper `src/storm/damage.ts` | strm | `L0-adr-sbdm`, C-29 |
| Trace, visuals, cooldown spend, passive roll | strm | `L0-adr-sblt`, C-30, C-32 |
| `elytra.json`, `totem_of_undying.json` | strm | no script and no gate |

## Inputs
- `itemUse` → `resolveActivation(player)` → `{ def: storm_blade, slot }`.
- `entityHitEntity` (+ the same tick's `entityHurt` for L) with the blade in the main hand.
- Dimension block/entity rays; an injectable `Rng` (`() => number`).

## Outputs
- `applyDamage` on exactly one target per event, with cause `entityAttack` and the wielder as `damagingEntity`.
- Particles and sound only: no entity is spawned, and there is no `lightning_bolt`.
- The cooldown is written through the def's cooldown key, on the active path only.

## Sub-artifacts
- Processes: `L0-strm-pact` (active), `L0-strm-ppas` (passive), `L0-strm-pprb` (probe).
- Rules: `L0-strm-rdmg` (damage), `L0-strm-rcd` (validity/cooldown), `L0-strm-rvis` (visuals).
- Entities: `L0-strm-edef` (def + item), `L0-strm-ercp` (the three recipes).
- ACs: `L0-strm-acr` (craft/legendary), `L0-strm-acd` (damage), `L0-strm-act` (trace/cooldown), `L0-strm-acv` (visuals/vanilla), `L0-strm-aci` (iPad).
- Decision `L0-strm-adtr`, assumption `L0-strm-asm1`, contradiction `L0-strm-cxkb`.

## Framework boundary (xasm32)
The only framework edits allowed are the def #6 entry in `registry.ts` and the subscriptions in `main.ts`. Exporting the Katana's private `trace` is a `katn` edit, not a framework edit (`L0-strm-adtr`). Any other change to `src/legendary/*` means a new L0 contradiction before the build.

## Build order (from the L0 plan)
1. Probe.
2. Vanilla recipes.
3. Def, item, token, recipe, RP and lang.
4. Damage helper with the hurt-window proof.
5. Active trace, visuals, cooldown and HUD.
6. Passive.
