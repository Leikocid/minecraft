---
type: "concept-component"
node_id: "L0-lgnd"
source_channel: "rollout"
analysis_version: 1
title: "Legendary weapon framework (craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization)"
aliases: ["L0-lgnd"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 5488
tags: ["component", "legendary", "anti-dup", "one-per-world", "cooldown", "hud", "localization"]
level: 1
needs_rebuild_marked_at: 2026-09-24T19:44:29.132Z
---
---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-sitm", "L0-stgt", "L0-sprj", "L0-sqat"]
governs_files: ["src/legendary/", "src/websword/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2", "scytheofcalamityspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-2"]
---
# Legendary weapon framework (craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization)

**Responsibility.** Implement each "general rule for legendary weapons" (*общие правила легендарных оружий*: Scythe §1, §6; Web Sword §3, §4, §8, §9, §10) exactly once, in a new `src/legendary/`. The shipped Web Sword (0.3.0, `src/websword/*`) becomes the first registered `LegendaryDef`, and the Scythe of Calamity the second. No weapon module keeps a private copy of an anti-dup invariant (C-7).

## Current state (verified in code, 2026-09-24)
`src/legendary/` does not exist yet. Everything is hard-wired to the Web Sword:
| File | Concern | Web-Sword-only detail |
|---|---|---|
| `state.ts` | key names, mark, world flag, pending, cooldown deadline | `andrew:ws_*`; `ws_pending` holds a single mark |
| `craftgate.ts` | after-the-fact gate, refund, broadcast | `REFUND = web×4 + diamond_sword×1` |
| `retention.ts` | death retention (inventory path + drop sweep), restore on spawn | `findMarkedSword` returns the first sword only; off hand not scanned |
| `cooldown.ts` | `isReady/startCooldown/remainingTicks`, 10-tick HUD | `_abilityKey` ignored (one slot per player); main hand only |
| `commands.ts` | `/andrew:websword <give\|reset> [target]` | command name, item id |
| `rules.ts` | pure `craftDecision`, `cooldownRemaining`, mark (de)serialisation | `COOLDOWN_TICKS` |

## Owns
- Registry `registerLegendary(def)` — `L0-lgnd-ent1`, `L0-lgnd-p006`.
- Instance mark with `gen` + `holder` — `L0-lgnd-ent2`.
- Per-weapon one-per-world craft gate, refund, broadcast, Creative/admin exemption — `L0-lgnd-p001`, `L0-lgnd-r002`.
- Death retention for every legendary carried, both hands — `L0-lgnd-p002`, `L0-lgnd-r008`.
- Loss (Void/ordinary destruction) return to the last holder — `L0-lgnd-p003`, `L0-lgnd-r005`, `L0-lgnd-r011`.
- Cooldown per (player, abilityKey) + in-memory busy — `L0-lgnd-ent3`, `L0-lgnd-r003`, `L0-lgnd-r009`.
- Hand-priority Use dispatch — `L0-lgnd-p004`, `L0-lgnd-r004`.
- The only Action Bar HUD for legendaries — `L0-lgnd-p005`, `L0-lgnd-r007`.
- Operator commands — `L0-lgnd-p007`.
- Read-only `isHiddenFromTargeting(player)` — `L0-lgnd-r010`.
- Localization plumbing: every player-facing string is a rawtext `translate` key; the RU/EN strings themselves are owned by `L0-sitm` (C-4).

## Published contracts (change only by ADR)
- `LegendaryDef` shape (`L0-lgnd-ent1`).
- `cooldown.isReady / isBusy / setBusy / start / remaining (player, abilityKey)`.
- `isHiddenFromTargeting(player): boolean`.
- Ability handler `(player, hand) → "cast" | "refused" | "busy"`; the framework never infers success.

## Inputs / outputs
**In:** stable `@minecraft/server` 2.10.0 events (C-2): `playerInventoryItemChange`, `entityDie`, `playerSpawn`, `playerLeave`, `itemUse`, `playerInteractWithBlock`, `entitySpawn`, `beforeEvents.entityRemove`, `system.beforeEvents.startup`. Weapon modules supply defs and ability handlers; `L0-sprj` calls `setBusy`/`start` on volley resolution.
**Out:** durable world/player/item dynamic properties per weapon prefix (`L0-lgnd-ad01`); a chat broadcast on first craft; private blocked/returned/voided/admin messages; Action Bar rawtext for holders only.

## Does NOT own
What an ability does (cobweb cube in `trap.ts`/`cube.ts`; target search `L0-stgt`; volley `L0-sprj`), item JSON, recipes and lang strings (`L0-sitm`; the Web Sword JSON gains only `minecraft:allow_off_hand`), Shadow Blade itself.

## Key decisions
`L0-lgnd-ad01` frozen per-weapon prefixes · `ad02` loss recovery by generation · `ad03` transient loss watcher · `ad04` fall-through dispatch on "not ready" only · `ad05` busy is memory-only · `ad06` compatibility shims for shipped paths and command.

## Open items
- Parent-level: CTR-1 (`cool-ctr1`, Void return for Web Sword; running on `L0-lgnd-as01`), CTR-3 (`cool-ctr3`, off-hand priority; running on Q-019 default a). Not re-raised here.
- This dive: `L0-lgnd-cx01` (Ready display differs), `L0-lgnd-cx02` (non-player pickup leaves a stale melee-capable copy), `L0-lgnd-cx06` (loss watcher vs the letter of C-5).
- Withdrawn after checking: cx04 (no test asserts the `ws_pending` format, so "tests unchanged" and the array change do not collide), cx05 (`/andrew:websword` stays as an alias, so README remains correct). cx03 became assumption `L0-lgnd-as09`.

## Constraint-number crosswalk
Artifacts `L0-lgnd-*` written before this revision cite an older C-numbering. Read them as: old C-1 → **C-2** (stable API); old C-4 "no global scans" → **C-5**; old C-9 "translate keys" → **C-4**; old C-13 "bounded tick work" → **C-5** (second sentence); old C-6, C-7 unchanged. Old C-10 (shipped tests stay green), C-14 (volleys do not survive restart) and C-17 (one implementation per rule) have no entry in the current `concept-constraint`; they are carried as `L0-lgnd-ac11`, `L0-lgnd-r009` and `L0-lgnd-r001` respectively.

## Risk
Highest regression risk of the Stage-2 Scythe work: it rewrites code under a shipped weapon. Web Sword unit tests, the `andrew:websword_*` GameTests and the pickaxe suites must stay green (`L0-lgnd-ac11`).
