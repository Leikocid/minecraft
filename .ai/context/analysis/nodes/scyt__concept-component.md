---
type: "concept-component"
node_id: "L0-scyt"
source_channel: "rollout"
analysis_version: 1
title: "Scythe of Calamity (`andrew:scythe_of_calamity`)"
aliases: ["L0-scyt"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 4443
tags: ["is_a:component", "scythe-of-calamity", "stage-2", "relates_to:L0-lgnd", "relates_to:L0-sprj", "relates_to:L0-sitm", "relates_to:L0-infr"]
level: 1
---
# Scythe of Calamity (`andrew:scythe_of_calamity`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-sprj", "L0-sitm", "L0-infr", "L0-webs"]` · sources: `scytheofcalamityspecv1ruen-part-1`, `scytheofcalamityspecv1ruen-part-2` (docs/Scythe_of_Calamity_Spec_v1_RU_EN.docx).

**Status:** no code yet. Checked 2026-09-24: `src/` has only `websword/`, `autosmelt.ts` and the test harnesses, and nothing in `packs/` mentions the Scythe. This deep-dive seeds Stage-2 planning.

## Responsibility
This is the second legendary weapon. It is a PvP ability: on Use, the Scythe locks the **nearest visible player** within 20 blocks and fires **3 homing projectiles** that pass through blocks. Each hit deals **exactly 3 HP true damage** and launches the target about **10 blocks** up. The attack ends early if the target leaves a **20-block leash** centred on the launch point. The cooldown outcome depends on whether any hit landed. All temporary state is cleaned up.

## Sub-scopes (the live KV holds partial children under other prefixes)
| Sub-scope | Owner node | What it holds |
|---|---|---|
| Item JSON, recipe, melee, enchant slot, RP assets | `L0-sitm` (ADRs `sitm-adr1/2`, `sitm-asm3`) | slot = sword, no digger or tool tags |
| Activation + target acquisition | **this node** (`L0-scyt-p001`, `r001`–`r003`). The earlier `L0-stgt`/`L0-sctg` have no live artifacts. | candidate filter, tie-break, no-target path |
| Volley flight, hits, true damage, launch, leash, outcome FSM, tick loop | `L0-sprj` (`r005`–`r008`, `ad01`–`ad03`, `ac05`–`ac14`) | this node restates only the contract (`r004`–`r008`) |
| Craft gate, announcement, retention, Void return, cooldown store, HUD, hand priority | `L0-lgnd` | the Scythe registers a `LegendaryDef` |

## Inputs
- `world.afterEvents.itemUse` where `itemStack.typeId === "andrew:scythe_of_calamity"` and the source is a `Player` (`L0-scyt-ad03`). The event goes through the `L0-lgnd` dispatcher, which applies hand priority, busy and cooldown.
- The owner's location, view direction and dimension. The players in that dimension within 20 blocks (`L0-scyt-ad01`).
- The `isHiddenByShadowBlade(player)` predicate. It is a stub that returns `false` until Shadow Blade exists (ASM-024, CTR-014).

## Outputs
- Either a localized no-target message (`andrew.scythe_of_calamity.no_target`) with no cooldown and no busy state,
- or one **Volley** handed to `L0-sprj` (`launchVolley(owner, target, launchPoint)`), which returns exactly one outcome and possibly one `cooldown.start(owner, "scythe")` through `L0-lgnd`.
- Effects on the target only: health minus 3 per hit, and upward knockback.
- **Never**: block writes, engine projectile entities, or damage to mobs or other players.

## Key rules (this node)
`r001` candidate filter · `r002` nearest plus view-angle tie-break · `r003` no target means no cost · `r004` blocks untouched · `r005` exact 3 HP true damage · `r006` launch about 10 blocks, fall damage kept · `r007` leash centred on the launch point · `r008` only the locked target can be hit · `r009` item stats and recipe.

## Dependencies and ordering
1. `L0-lgnd` must first be generalised from `src/websword/*` into a registry. That includes per-weapon cooldown keys (CTR-013), the steady HUD in both hands (CTR-017) and busy (ASM-017). The Scythe cannot ship on the current Web-Sword-only store.
2. `L0-infr`: GameTest and BDS on 1.26.51.1 cover the ACs in channel `bds`. The icon, names and particle look are covered on channel `ipad` (C-9).
3. C-11: Stage 2 Web Sword is closed (commit `f22896a`), so Scythe work may start.

## Open issues affecting this component
- CTR-014 / Q-020: AC-3 (Shadow Blade) cannot be verified end to end.
- `cool-ctr2`: the enchant slot. Resolved in design by `L0-sitm-adr1` (sword).
- CTR-015: the hoe base versus the Use trigger. Resolved in design by `L0-sitm-adr2` (no hoe tag).
- `L0-sprj-cx01/cx02`: when the cooldown is committed, and the lethal branch of true damage.
- `L0-scyt-cx01`: missing component nodes and targeting nodes in the graph.
- `L0-scyt-cx02`: the tuning numbers for projectile speed and lifetime disagree.
- Q-022: does the `pvp` gamerule affect candidates? The default is no.

## Constraints honoured
C-2 (stable 2.10.0 only), C-4 (`andrew:` ids, RU and EN), C-5 (targeting only at activation, and a tick loop only while volleys exist), C-7 (no orphans), C-10 (no world mutation in before-events).
