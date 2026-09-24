---
title: Project Summary
type: analysis
generated_at: "2026-09-24T19:42:02.860Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 520
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

---
is_a: ["overview"]
relates_to: ["L0-infr", "L0-pick", "L0-lgnd", "L0-webs", "L0-scyt", "L0-sitm", "L0-sprj", "L0-adr-cast", "L0-adr-scope", "L0-adr-lgnd", "L0-adr-scyt"]
requires: ["L0-infr", "L0-lgnd"]
---
# Project Overview — «Andrew» Minecraft Bedrock PvP add-on (after the L1 deep-dive)

**What it is.** A Minecraft **Bedrock** add-on (behavior pack and resource pack, namespace `andrew:`). It uses only the **stable** Script API (`@minecraft/server` 2.10.0, engine [1,26,50], BDS 1.26.51.1). It is played on an **iPad**, and it is built and checked on a Mac mini running a Bedrock Dedicated Server in Docker.

## Five components in three layers

| Layer | Component | State (as read during reduce, 2026-09-24) | Role |
|---|---|---|---|
| Platform | `L0-infr` Build & verification | closed (Stage 0) | build → `.mcaddon`; `build` / `bds` / `ipad` channels; `targets.mjs` is the only place version targets live |
| Probe | `L0-pick` Miner's Pickaxe | closed (Stage 1, DEMO-S1 accepted 2026-09-21) | proved custom item + recipe + enchant + digger + drop override on the real engine |
| Contract | `L0-lgnd` Legendary framework | designed; `src/legendary/` not present at read time; the logic sits inside `src/websword/*` | one implementation of every «общее правило»: craft gate/refund/broadcast, instance mark + generation, death retention, loss return, cooldown + busy, hand-priority dispatch, the only Action Bar HUD, `isHiddenFromTargeting` |
| Weapon | `L0-webs` Web Sword | shipped 0.3.0; migrates onto `lgnd` | the cast body only: reach target → 3×3×3 cobweb cube → protected/unloaded filter; plus the static item/recipe definition |
| Weapon | `L0-scyt` Scythe of Calamity | no code at read time | the cast body: nearest visible player within 20 blocks → one volley. Its sub-scopes are `L0-sitm` (item JSON) and `L0-sprj` (volley engine) |

**How they relate.**
- `infr` is the verification backbone. Every other component closes its `bds` criteria through `npm run bds:check` / `bds:gametest`, and its `ipad` criteria by hand (C-9).
- `pick` has no runtime link to the weapons. It only proved the engine surface they rely on (custom items, `minecraft:enchantable` without durability, `beforeEvents.playerBreakBlock`).
- `lgnd` is the hub. Both weapons are `LegendaryDef` entries (`L0-lgnd-ent1`). They reach the framework only through its published contract (`L0-lgnd-r001`): `registerLegendary`, `cooldown.{isReady,isBusy,setBusy,start,remaining}`, `isHiddenFromTargeting`, and an ability handler that returns `"cast" | "refused" | "busy"`. `L0-adr-cast` adds `hud.notify` to that contract.
- The two weapons have no dependency on each other. They interact only through `lgnd`: separate craft budgets (`r002`), separate cooldown keys (`r003`), and hand priority between them (`r004`, `ad04`).

## Cross-component flow of one Use press
`itemUse` / `playerInteractWithBlock` → the `lgnd` dispatcher (`L0-lgnd-p004`: de-duplicates the two events, drops stale stacks, main hand if ready, otherwise a ready off hand with a different key) → `def.ability(player, hand)`:
- **Web Sword** (`L0-webs-p001`): resolve a cell → fill the cube → if `filled > 0`, `cooldown.start` and return `"cast"`; otherwise `hud.notify` with no-room or no-target and return `"refused"`.
- **Scythe** (`L0-scyt-p001` → `L0-sprj`): pick the target → `setBusy` → volley. The first hit commits the cooldown (`L0-sprj-ad01`). Resolution clears busy and re-stamps the cooldown. With no target: `hud.notify` and return `"refused"`.

→ The `lgnd` HUD (`L0-lgnd-p005`) shows active, remaining time or Ready to holders only.

## What the deep-dive changed at L0
- The framework has to be **generalised before** the Scythe can ship. The shipped store has one cooldown slot per player, one pending mark, main hand only, and the Web Sword ids hard-coded (`L0-lgnd` current-state table; `L0-scyt` dependency 1). Order: `lgnd` migration (keeping the Web Sword tests green, `L0-lgnd-ac11`) → Scythe `sitm` + targeting + `sprj`.
- Two shared rules now reach **back into the shipped Web Sword**: loss return from Void and lava (CTR-1, running on Q-020 a) and off-hand priority (CTR-3, running on Q-019 a). Both are implemented once in `lgnd`, and neither reopens the craft right (`L0-lgnd-r011`).
- Durable deadlines use epoch ms (`Date.now()`) across the whole add-on (`L0-xasm1`).
- One weapon rule contradicted the framework (Web Sword cooldown ownership, `L0-xcx1`), and one weapon design reached around it (the Scythe trigger and HUD hold, `L0-xcx2`). Both are reconciled by `L0-adr-cast`.

## Open at L0 after reduce
- `L0-xcx3` / `L0-xq1`: should "Ready" show continuously for both weapons? The interim is a per-weapon `readyMode`.
- CTR-4 stays open on purpose, until the raw specs are annotated. CTR-1 and CTR-3 run on autopilot defaults. CTR-2 is resolved by `L0-sitm-adr1`.
- On the Scythe path, not blocking: `L0-sprj-cx02` (lethal branch under Resistance V, interim option a), Q-022 (`pvp` gamerule), CTR-014 (Shadow Blade cannot be tested end to end).


## Statistics

- **Total artifacts:** 305
- **concept-aggregate:** 25 (58 KB)
- **concept-atomic:** 206 (170 KB)
- **concept-special:** 19 (24 KB)
- **raw:** 8 (22 KB)
- **decision:** 27 (5 KB)
- **other:** 20 (179 KB)

### By level

- L0: 14 artifacts
- L1: 5 artifacts
- L2: 218 artifacts


_Analysis version: 1_
