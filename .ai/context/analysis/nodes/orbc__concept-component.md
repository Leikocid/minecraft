---
type: "concept-component"
node_id: "L0-orbc"
source_channel: "rollout"
analysis_version: 3
title: "L0-orbc · Orbital Cannon core"
aliases: ["L0-orbc"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 540
size_chars: 3055
tags: ["is_a:component", "relates_to:L0-lgnd", "relates_to:L0-pntr", "relates_to:L0-ring", "relates_to:L0-adr-orbc", "relates_to:L0-adr-ochg", "relates_to:L0-xcx8", "relates_to:L0-xcx13", "relates_to:L0-xq5", "orbital", "stage5", "not-implemented", "blocked:L0-xq5"]
level: 1
---
# L0-orbc · Orbital Cannon core

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-pntr", "L0-ring", "L0-adr-orbc", "L0-adr-ochg", "L0-xcx8", "L0-xcx13", "L0-xq5"]`

**State (2026-09-29):** not implemented. There is no `src/orbital/` and no `andrew:orbital_cannon` item. The framework that it plugs into is shipped: `src/legendary/{registry,hands,cooldown,hud,craftgate,retention,recovery}.ts`. **Task creation is blocked by `L0-xq5`/`L0-xcx8`**, the LMB reach question.

## Responsibility
The weapon shell shared by both attacks. It covers:
- the item, recipe and lang;
- the input and the target;
- the gate that decides whether an activation succeeds;
- the shared cooldown and the HUD entry;
- the **charge**: spawn, fall, contact, Void and lifecycle.

It owns no block or entity effect. Detonation is handed to `pntr` (LMB) or `ring` (RMB) through the charge contract (`L0-orbc-r014`).

## Not owned (referenced by id, not restated)
Owned by `lgnd`:
- the craft gate and the single Survival craft (ACs 1–2, `L0-xcx9`);
- retention on death, loss/Void return of the *item* and the last holder (`L0-xcx10`/`xcx11`, `L0-adr-hold`);
- cooldown storage (`cooldown.ts`, `cooldownKey`);
- hand resolution (`hands.ts`).

Owned by `pntr`/`ring`: the column and ring effects, drops and legendary protection in the blast.

## Inputs
- `world.afterEvents.itemUse`, `itemUseOn`/`playerInteractWithBlock` (RMB).
- `world.afterEvents.entityHitBlock` with a player damager, and `beforeEvents.playerBreakBlock` cancel (LMB). See `L0-adr-orbc` and the amendment `L0-orbc-ad01`.
- `Player.getBlockFromViewDirection({maxDistance: 10})`, `Dimension.heightRange`, `entityLoad`, and world startup.

## Outputs
- A cooldown write (`andrew:cd_orbital_cannon`, 600 ticks) through `lgnd` `startCooldown`.
- `andrew:orbital_charge` entities, moved by one bounded job per attack.
- `onDetonate(dimension, point, ownerId, mode)` calls to `pntr`/`ring`.
- An Action Bar segment through the shared `hud.ts`.

## Artifacts
- **Entities:** `ent1` item, `ent2` attack/target lock, `ent3` charge.
- **Processes:** `p001` activation, `p002` flight and detonation, `p003` lifecycle and cleanup.
- **Rules:** `r001`–`r014`.
- **ACs:** Orbital AC-3/4/5/6/16/18/19 plus item, HUD, input and dedup ACs. Each is split into `bds` or `ipad` (C-9).
- **ADRs:** `ad01` target source, `ad02` charge motion, `ad03` in-memory attacks with orphan sweep.
- **Assumptions:** `as01`–`as08`.
- **Contradictions:** `cx01` HUD wording, `cx02` touch aim point, `cx03` Nether roof clamp.

## Stage-5 order
`lgnd` delta → `orbc` with a stub effect (`onDetonate` logs, plays one sound) → `pntr` → `ring`. The stub lets AC-3/4/5/6/16/18/19 go green on BDS before any block is removed.

## Constraints honoured
- C-2: stable API 2.10.0 only.
- C-5a′: no permanent tick loop; the job ends with its last charge.
- C-7′: no duplication.
- C-15: priority order.
- C-16: limitation notes go in `src/orbital/` comments.
- C-17: cooldown.
- C-19: no leftovers.
- C-20: two-player tests.
