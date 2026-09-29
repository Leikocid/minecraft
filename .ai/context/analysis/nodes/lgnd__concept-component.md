---
type: "concept-component"
node_id: "L0-lgnd"
source_channel: "rollout"
analysis_version: 3
title: "Legendary weapon framework (shipped `src/legendary/`) — v3 delta"
aliases: ["L0-lgnd"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 540
size_chars: 4530
tags: ["v3-delta", "orbital-cannon"]
level: 1
---
---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-adr-orbc", "L0-adr-hold", "L0-adr-wpn2", "L0-adr-ochg", "L0-xcx9", "L0-xcx10", "L0-xcx11", "L0-xq3"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/scythe/volley.ts", "src/orbital/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3"]
---
# Legendary weapon framework (shipped `src/legendary/`) — v3 delta

**Responsibility.** Every general legendary rule is implemented once, in `src/legendary/`, for three weapons: the Web Sword, the Scythe of Calamity and (v3) the Orbital Cannon. The general rules are Scythe §1 and §6, Web Sword §3, §4 and §8–§10, and Orbital §4, §5 and §7.

## Current state (verified in code, 2026-09-29)
The as-built shape in `L0-lgnd-ad07` still holds. No `src/legendary/` commit has landed since `120bdd5`. The **v2 backlog from `L0-adr-wpn2` has not shipped** (`L0-lgnd-cx11`):
- There is no `gen` on the mark or in the ledger.
- `_owed` is still a map `ownerId → one mark` (`recovery.ts:253`).
- `retention.ts` does not read the `Offhand` slot.
- No item JSON declares `minecraft:allow_off_hand`.
- `grep -rn orbital src/` finds nothing, so the Cannon is not started.

## v3 delta (this pass)
| # | Change | Artifacts |
|---|---|---|
| 1 | Add `ORBITAL_CANNON` to the static `LEGENDARIES`: `oc` / `orbital_cannon`, 600 ticks, refund 4 TNT + 1 Fishing Rod, `andrew:orbital` | `ent1`, `ac17`, `L0-adr-orbc` |
| 2 | Activation **mode**: `resolveActivation(player, mode)` with `"use" \| "attack"` and a per-def `activations`. Attack reads the main hand only. | `ad09`, `r015`, `p009`, `ac16` |
| 3 | Craft provenance: a recipe outputs a hidden **craft token** item. Plain `andrew:<weapon>` stacks (vanilla `/give`, Creative) never claim or refund (`xcx9`). | `ad08`, `r014`, `p001`, `ac15` |
| 4 | Loss return goes to the **last holder** (`holder` in the mark), with `owed` as a list keyed by holder (`xcx11`, answers `xq3`, realises `L0-adr-hold`) | `ad11`, `ent2`, `ent4`, `p003`, `ac08`, `ac18` |
| 5 | "Not destroyed" policy in three tiers: *prevent* (script-caused) → *spill* (vanilla container break) → *return* (fire, lava, cactus, TNT, Void). There is also a container-destruction rule (`xcx10`). | `ad10`, `r012`, `r013`, `ac09`, `ac20` |
| 6 | `protectLegendariesIn(dimension, volume)`, published for `pntr`/`ring` to call before they remove blocks or detonate | `p008`, `ac19` |
| 7 | The unshipped `wpn2` backlog (`gen`, owed list, off-hand read) is a **prerequisite** of 4 and 5 | `cx11` |

## Owns (unchanged, plus v3)
Everything it owned before, plus:
- the activation-mode resolver;
- craft tokens (the gate's half: the token → marked swap);
- the holder field;
- the destruction policy;
- `protectLegendariesIn`.

## Published contracts (v3)
- `LegendaryDef` gains `activations: ReadonlyArray<"use"|"attack">` (default `["use"]`) and `craftTokenId?: string`.
- `resolveActivation(player, mode = "use")`.
- `protectLegendariesIn(dimension, volume, opts?) → {moved, returned}`.
- `isLegendaryItemEntity(entity)`, which `ring` uses for drop suppression (`L0-adr-ochg` §3).
- `cooldown.*` and `isHiddenFromTargeting` are unchanged. The HUD gains a per-weapon key lookup: `andrew.<prefix>.ready/cooldown` if defined, else the shared `andrew.legendary.*` keys (which render `%s: Ready` / `%s: %s s`). The Cannon uses its own keys to render "Orbital Cannon — Ready" / "— 27s" (Orbital §7; `L0-adr-oded`).

## Does NOT own
- What an ability does: `trap.ts`, the Scythe volley, and the Cannon's charges and effects (`L0-orbc`, `L0-pntr`, `L0-ring`).
- The LMB target raycast and the Creative break cancel (`L0-orbc`).
- Item, entity and recipe JSON, including the token items' JSON (`webs`, `scyt`, `orbc`). `lgnd` only states the contract those files must meet (`r014`).

## Sequencing
One `lgnd` v3 task, in this order:
1. the `wpn2` backlog;
2. `holder`;
3. the tokens;
4. activation mode + the Cannon def;
5. `protectLegendariesIn`.

The `orbc` core tasks depend on items 4–5. They are also blocked on `L0-xq5` (LMB reach).

## Risk
- The token recipe change touches the shipped Web Sword and Scythe recipes. GameTests that simulate a craft by inserting an unmarked `andrew:web_sword` must insert the token instead. This is harness wiring, not an assertion (`L0-adr-lgnd` cx04 reading). `ac11` still gates it.
- A legendary nested inside a shulker box or bundle is invisible to every protection (`cx12`).
