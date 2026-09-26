---
type: "concept-component"
node_id: "L0-scyt"
source_channel: "rollout"
analysis_version: 1
title: "Scythe of Calamity (`andrew:scythe_of_calamity`) — shipped Stage 3, targets mobs too"
aliases: ["L0-scyt"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 4620
tags: ["is_a:component", "scythe-of-calamity", "stage-3", "shipped", "mob-targeting", "relates_to:L0-lgnd", "relates_to:L0-sprj", "relates_to:L0-sitm", "relates_to:L0-infr", "delta:2026-09-26"]
level: 1
---
# Scythe of Calamity (`andrew:scythe_of_calamity`) — shipped Stage 3, targets mobs too

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-sprj", "L0-sitm", "L0-infr", "L0-webs"]`

src: `src/scythe/*.ts`, `src/legendary/{registry,hidden}.ts`, `packs/behavior/{items,recipes}/scythe_of_calamity.json` @ 302fba4 · spec: `docs/Scythe_of_Calamity_Spec_v1_RU_EN.docx` · decisions: `decision-scythe-*` (7).

**Status (checked 2026-09-26):** shipped. Stage 3 merged at `da09c10` (build 0.4.0). Mob targeting was added in `4b74f2f` (0.4.1), and visible hits in `302fba4` (0.4.2). There are 13 `andrew:scythe_*` GameTests, and all are green on BDS 1.26.51.1. `npm test` passes 285/285.

## Responsibility
This is the second legendary weapon. On Use, it locks the **nearest visible target** within 20 blocks. **Players outrank every mob**, and a mob is chosen only when no visible player qualifies (`L0-scyt-ad04`, operator decision 2026-09-25, which reverses spec §3). It then fires **3 virtual homing projectiles** that pass through blocks. Each hit deals **exactly 3 HP** and launches the target about 10 blocks up. The volley ends early when the target leaves a **20-block horizontal** radius around the frozen launch point. A volley with ≥1 hit costs the full 30 s cooldown, and a volley with 0 hits costs nothing.

## Code map
| File | Role |
|---|---|
| `src/scythe/targeting-rules.ts` | Pure: `eligibleCandidates`, `pickTarget` (player tier, ε 0.5, gaze), `rayCells`, `isHiddenAt` |
| `src/scythe/targeting.ts` | Engine: `gatherCandidates`, `hasLineOfSight`, `selectTarget`, the itemUse and playerInteractWithBlock trigger with per-tick de-dup |
| `src/scythe/volley-rules.ts` | Pure tuning and verdicts: 3 projectiles, 10-tick stagger, 0.8 b/t, hit radius 1.0, 200-tick timeout, horizontal leash |
| `src/scythe/volley.ts` | Engine: one `runInterval` per volley, `strike` (damage event plus exact correction, `L0-scyt-ad06`), the `end` cooldown verdict |
| `src/legendary/registry.ts` | `SCYTHE_OF_CALAMITY` def: prefix `sc`, abilityKey `scythe_of_calamity`, 600-tick cooldown, craft gate and refund |
| `src/legendary/hidden.ts` | `isHiddenFromTargeting` (`andrew:hidden_until`), `/andrew:hide` test command |

## Inputs
- Use (`itemUse`, and `playerInteractWithBlock` with `isFirstEvent`), de-duplicated per player per tick, then `resolveActivation` (hand priority, cooldown, busy).
- All players, plus the entities with a health component within 20 blocks of the owner (`L0-scyt-ad01`).
- `andrew:hidden_until` on players.

## Outputs
- A miss: action bar `andrew.scythe.no_target` («Здесь нет цели» / "There is no target here"). No cooldown and no busy.
- A hit: `launchVolley(owner, target: Entity)`, which sets busy. The first hit arms the cooldown, and the end re-arms it when hits ≥ 1.
- Effects only on the locked target: `applyDamage` plus a health correction, and `applyKnockback(0,0,1.35)`.
- **Never** block writes or projectile entities.

## Rules
`r001` candidates (players and mobs) · `r002` player tier → nearest → gaze · `r003` a miss is free · `r004` blocks untouched · `r005` exactly 3 HP, delivered visibly · `r006` launch 1.35, about 10 blocks · `r007` 20-block horizontal leash · `r008` only the locked target · `r009` item and recipe (shipped JSON).

## Dependencies
`L0-lgnd` (registry, cooldown/busy, hands, craft gate, retention). It is shipped, and the Scythe is its second def. `L0-infr` (BDS GameTest, channel `bds`; iPad look, channel `ipad`). The `L0-sitm` and `L0-sprj` children describe the pre-implementation design and are **stale** against the code (`L0-scyt-cx04`).

## Open issues
- `L0-scyt-cx03`: the shipped item JSON is a hoe (tags, digger, group) and has no `allow_off_hand`, which breaks `L0-sitm-adr2` and the off-hand half of AC-16.
- `L0-scyt-cx04`: the `L0-sprj` and prior contract text (players only, 3D leash, event-driven invalidation) do not match the code.
- `L0-scyt-cx05`: the tuning in `L0-adr-scyt` (0.5 b/t, 5-tick stagger) is not what shipped (0.8 b/t, 10 ticks).
- `L0-scyt-cx01`: graph hygiene, still open.
- CTR-014: Shadow Blade does not exist. The hidden seam is verified through `/andrew:hide` and the GameTest `scythe_skips_hidden`.
- Operational note: GameTests share the container with the LAN server. A connected real player outranks a test cow and fails the Scythe tests (see `302fba4`, and memory "BDS runs vs LAN server").

## Constraints honoured
C-2 (stable API only), C-4 (`andrew:` ids, RU/EN), C-5 (targeting only on press; the interval lives only while a volley does), C-7 (no entities, so no orphans), C-10.
