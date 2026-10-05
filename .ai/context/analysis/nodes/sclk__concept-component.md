---
type: "concept-component"
node_id: "L0-sclk"
source_channel: "rollout"
analysis_version: 7
title: "Sculk Crossbow (`andrew:sculk_crossbow`): component v1"
aliases: ["L0-sclk"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 4163
tags: ["component", "legendary", "sculk-crossbow", "def-5", "probe-gated"]
level: 1
---
# Sculk Crossbow (`andrew:sculk_crossbow`): component v1

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-orbc", "L0-pntr", "L0-magn", "L0-scyt", "L0-katn", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xq7"]`

Source: `docs/Sculk_Crossbow_Spec_v1_RU_EN.docx` (raw `sculkcrossbowspecv1ruen-part-1..4`, priority 610). Legendary def #5. It is the first legendary with **no active ability, no cooldown and no HUD line** (`L0-xcx24`).

## Responsibility
A passive ranged legendary. Every projectile its holder fires is replaced at spawn by one `andrew:sculk_bolt`. The bolt flies physically, with a Warden-style Sonic Boom trail, and resolves exactly once (C-26):
- **entity hit:** fixed `SONIC_BOOM_DAMAGE` = 10 HP through armour, the shield and the invulnerability window (C-28), plus a sculk patch under the target, with no crater;
- **block hit:** an irregular crater ≤ 5×5×3 plus a ring of plain sculk ≤ 5×5, with no entity damage (C-27);
- **expiry:** after 100 ticks, on leaving loaded chunks, or in the Void, nothing happens.

## What `sclk` owns, and what it does not
| Owned here | Delegated (cited, not restated) |
|---|---|
| the item def JSON, icon, RP texture, RU/EN item and tooltip lang | craft gate, first-craft broadcast, token swap and refund → `lgnd` (R-lgnd-001: one implementation) |
| the recipe JSON (echo shard / deepslate / crossbow → token) | death retention, hazard protection, Void return, Creative/`/give` copies → `lgnd` (T19, T20; `xasm26`) |
| the bolt entity (BP + RP), the shot→bolt swap, the flight, the trail | the no-ability def shape → `lgnd` v7 (`xcx24`) |
| hit resolution, damage, patch, crater, carve queue | `protectLegendariesIn` → `lgnd` (`recovery.ts`) |
| enforcing that Piercing is stripped | magnetism → `magn` (def-driven, `xasm26`) |
| moving the deny list from `penetrator-keep.ts` to `src/terrain/keep.ts` (`xcx25`) | the Orbital carve itself → `orbc`/`pntr` (unchanged) |
| the probe and the outcomes of the three ADRs | |

## Inputs
- `world.afterEvents.entitySpawn` (or `projectileShoot`, per the probe) for arrow-type projectiles whose owner holds `andrew:sculk_crossbow`.
- `projectileHitEntity` and `projectileHitBlock`, filtered to `andrew:sculk_bolt`.
- The shared interval (one `runInterval`, never `runJob`) for trail emission, lifetime and the carve queue.
- `playerInventoryItemChange` and held-item changes, used to strip Piercing.

## Outputs
- Health changes on the struck entity only, via `applyDamage` + `setCurrentValue`, with kill credit to the owner.
- Block edits: air for the crater and `minecraft:sculk` for the patch. These are ordinary world changes, synced and saved.
- `minecraft:sonic_explosion` particles (or an RP look-alike, `L0-sclk-ad02`) along each bolt's path.
- `[andrew] sculk:` log lines, which GameTests and the probe read as witnesses.

## Stage-7 order (from the plan)
1. Probe on checks (19136): `L0-sclk-p001`. It gates `adr-scbs`/`adr-scdm`. A failed gate supersedes the ADR before any build task.
2. `lgnd` v7 (no-ability def, def #5).
3. Item, token, recipe, RP.
4. Bolt pipeline and damage.
5. Crater and sculk, together with the deny-list extraction (Orbital scenarios as its gate).

## Child artifacts
- **Processes:** p001 probe · p002 shot→bolt · p003 flight/trail/expiry · p004 entity hit · p005 block hit/carve · p006 craft wiring.
- **Rules:** r001–r010.
- **Entities:** ent1 item · ent2 bolt entity · ent3 bolt record · ent4 carve plan.
- **ACs:** ac01–ac20 = T01–T20 (T01–T03, T19 and T20 as crossbow call sites of `lgnd`), ac21 probe, ac22 Orbital regression, ac23–ac27 iPad.
- **Decisions:** ad01–ad04 · **Assumptions:** as01–as05 · **Contradictions:** cx01–cx02 · **Glossary:** gl01–gl06 · **Constraints:** cons.

## Seams the reduce re-checks
- Orbital protection stays green after the deny-list move.
- The magnet's GameTests include def #5.
- A Katana ray stops on sculk (a full solid block).
- Crater vs a structure `protect` box: check, do not assume (`xasm25` says structures get no protection).
