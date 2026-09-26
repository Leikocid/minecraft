---
type: "concept-component"
node_id: "L0-lgnd"
source_channel: "rollout"
analysis_version: 2
title: "Legendary weapon framework (shipped `src/legendary/`)"
aliases: ["L0-lgnd"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 5314
tags: ["is_a:component", "as-built", "reconcile"]
level: 1
---
---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-sitm", "L0-stgt", "L0-sprj", "L0-sqat", "L0-scyt"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/scythe/volley.ts", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2", "scytheofcalamityspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-2"]
---
# Legendary weapon framework (shipped `src/legendary/`)

**Responsibility.** Implement each general rule for legendary weapons (Scythe §1, §6; Web Sword §3, §4, §8–§10) once, in `src/legendary/`, for the Web Sword and the Scythe of Calamity.

## Current state (verified in code, 2026-09-26)
This replaces the 2026-09-24 note that "`src/legendary/` does not exist". It was built by `LG-CORE-01-AA` (392253d), `LG-KEEP-02-AA` (ed7558b, e38cb75) and `SC-TGT-01-AA` (120bdd5). `src/websword/` now holds only `trap.ts` and `cube.ts`. The shims planned in `ad06` were **not** built: the old modules were deleted and `src/main.ts` imports `src/legendary/*` directly.

| File | What it does as built |
|---|---|
| `registry.ts` | Static `LEGENDARIES = [WEB_SWORD, SCYTHE_OF_CALAMITY]` (no `registerLegendary()`), `keysFor(def)`, `cooldownKey` = `andrew:cd_<abilityKey>`, `busyKey` = `andrew:busy_<abilityKey>` |
| `state.ts` | Mark `{origin, owner, id, ownerName?}` under `andrew:<prefix>_*`. No `gen`, no `holder`. `pending` holds a **single** mark per weapon. `findMarked` returns the first match only. |
| `rules.ts` | Pure `craftDecision`, `cooldownRemaining`, `parseMark`/`serializeMark` |
| `craftgate.ts` | Per-weapon one-per-world gate, refund (`def.refund`) and broadcast |
| `retention.ts` | Death retention: path A (inventory container), path B (8-block drop sweep), restore on `playerSpawn` guarded by `carriesInstance` |
| `recovery.ts` | Loss return. Watches item entities from `entitySpawn` and `entityLoad` with a 40-tick interval that runs only while something is watched. It removes items below `heightRange.min` itself. A pickup is inferred from `playerInventoryItemChange`, a scan of online player inventories, or a container at or below the spot. The item returns to the **mark's `owner`**. If the owner is offline, the mark goes to `andrew:<p>_owed`, a map keyed by player id with one mark per player. |
| `cooldown.ts` | `remainingMs/remainingTicks/isReady/startCooldown/clearCooldown/setBusy(ms)/clearBusy/isBusy`, all on `Date.now()` |
| `hands.ts` | `heldLegendaries` (main, then off), `resolveActivation` (the first held legendary that is ready and not busy) |
| `hud.ts` | One 10-tick interval. It shows `andrew.legendary.cooldown` / `andrew.legendary.ready` for each held weapon, and "Ready" stays up **continuously**. There is no `active` segment, and nothing is written when no legendary is held. |
| `hidden.ts` | `isHiddenFromTargeting` reads `andrew:hidden_until` (epoch ms), plus `/andrew:hide <seconds> [target]` |
| `commands.ts` | One command per def: `/andrew:websword` and `/andrew:scythe` `<give|reset> [target]`. There is no `/andrew:legendary`. |

Each weapon module still subscribes to `itemUse` and `playerInteractWithBlock` itself (`trap.ts`, `scythe/targeting.ts`). It then acts only if `resolveActivation(player)?.def` is its own def. So there is no central dispatcher, but the priority decision lives in one place.

## Owns
Registry and keys, instance mark, craft gate and refund, death retention, loss return (owed ledger), cooldown and busy timers, the hand-priority resolver, the single HUD, the hidden predicate plus `/andrew:hide`, and the operator commands.

## Published contracts
- `LegendaryDef {itemId, keyPrefix, abilityKey, nameKey, cooldownTicks, craftGate, refund, textPrefix, command}`.
- `cooldown.*(player, abilityKey)` as listed above.
- `resolveActivation(player)`.
- `isHiddenFromTargeting(player)`.

## Does NOT own
What an ability does (`trap.ts`/`cube.ts`, `L0-stgt`, `L0-sprj`), item JSON, recipes and lang strings (`L0-sitm`), and Shadow Blade.

## Spec ↔ code reconciliation (this pass)
- **Resolved by decision and matched by code:**
  - `cx01`: Ready is continuous for both weapons (decision-legendary-ready-hud).
  - Loss return covers the Web Sword too (decision-resolve-cool-ctr1).
  - Hand priority is implemented, and busy counts as not ready (decision-legendary-hand-priority).
  - `andrew:hidden_until` is in ms (decision-scythe-hidden-target).
- **New divergences:**
  - `cx07`: the 0.3.0 cooldown key is orphaned.
  - `cx08`: neither item declares `minecraft:allow_off_hand`, so the off-hand half of hand priority and of the HUD cannot happen.
  - `cx09`: loss return goes to the owner and has no generation guard.
  - `cx10`: death with several marked copies of one weapon.
- **Design superseded by as-built** (`ad07`):
  - Busy is a durable deadline, not memory-only (`ad05`).
  - Keys are the `andrew:cd_*` / `andrew:busy_*` family.
  - The shims (`ad06`) and the central dispatcher (`ad04` mechanics) were not built.
  - The registry is static.

## Risk
Web Sword regression is covered by the existing `andrew:websword_*` GameTests, which are run from `src/gametest/main.ts` against the framework. `ac11`'s grep guard no longer matches the code: keys are built in `registry.ts`/`recovery.ts`/`hidden.ts`, not only in `state.ts`.
