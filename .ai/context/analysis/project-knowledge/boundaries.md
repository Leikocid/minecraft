---
title: Boundaries
type: project-knowledge
generated_at: "2026-09-21T21:24:41.651Z"
source_channel: rollout
node_id: rollout-boundaries
aliases: ["rollout-boundaries","boundaries","project-knowledge/boundaries"]
is_a: ["rollout","boundaries"]
relates_to: ["L0"]
priority: 510
---

# Boundaries

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### System Boundaries (L0)

# System Boundaries

**Links** — `title: System Boundaries` · `aliases: ["L0-boundary", "Boundaries"]` · `part_of: ["L0"]` · `is_a: ["boundary"]` · `relates_to: ["L0"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

> Supersedes the v1 boundary. Stages 0 and 1 have moved from *in scope* to *delivered*; Stage 2, previously *«outside this analysis entirely»*, is now partially in scope via the Web Sword spec.

## In scope — Web Sword v1 (the active envelope)

| # | Item | Spec | L1 owner |
|---|---|---|---|
| WS-1 | Legendary custom sword `andrew:web_sword`, based on Diamond Sword, infinite durability, vanilla sword enchantments allowed | §1 | `L0-item` |
| WS-2 | Discoverable in Creative → Equipment/«Снаряжение», the «Все» catalogue, Creative Search, and via `/give` | §1 | `L0-item` |
| WS-3 | Recipe: 4× Cobweb in a plus-pattern around 1× Diamond Sword → 1× Web Sword | §2 | `L0-item` |
| WS-4 | RU «Паутинный меч» / EN "Web Sword" plus RU/EN variants of **every** user-facing message, via the Resource Pack localization system | §10 | `L0-item` |
| WS-5 | One successful survival craft per world/server, flag persisted across logout, save and restart | §3 | `L0-once` |
| WS-6 | First-craft broadcast to all players, localized, naming the weapon and its creator | §3 | `L0-once` |
| WS-7 | Second survival craft blocked, ideally without consuming ingredients | §3 | `L0-once` |
| WS-8 | Creative and `/give` exempt from the one-per-world budget (admin/test copies permitted) | §3, §4 | `L0-once` |
| WS-9 | No drop on death; item returns to the same owner on respawn | §4 | `L0-keep` |
| WS-10 | No duplicate copy via death, disconnect/reconnect, or server restart | §4, §12 | `L0-keep` |
| WS-11 | Ability on standard Use (right click / long press), reach-bounded targeting, no artificial long-range ray | §5 | `L0-trap` |
| WS-12 | 3×3×3 Cobweb cube of real vanilla cobweb centred on the target position, persisting until players clear it | §5 | `L0-trap` |
| WS-13 | Placement safety: skip entities, containers/block entities, bedrock and protected blocks; fill the remaining valid cells anyway; never write into unloaded chunks | §6, §12 | `L0-trap` |
| WS-14 | Exactly 30 s cooldown, started **only** on successful activation | §8 | `L0-cool` |
| WS-15 | Remaining cooldown shown on the actionbar (or nearest stable equivalent) while the sword is held | §8 | `L0-cool` |
| WS-16 | Main-hand ability takes priority; off-hand may fire if main-hand is on cooldown | §8 | `L0-cool` |
| WS-17 | Server-authoritative computation; identical result for all clients; concurrent activations handled independently; concurrent crafts cannot bypass the one-per-world gate | §9 | `L0-trap`, `L0-once` |
| WS-18 | Twelve acceptance tests + Definition of Done, in single-player and a ≥2-player test | §13, §14 | `L0-qatg` |

## Explicitly out of scope

### Excluded by decision — will not be done

| Item | Reason |
|---|---|
| **Minecraft Java Edition** | Target device is an iPad. Hard exclusion, inherited from Stage 0. |
| **Preview / Beta Script APIs and Experiments** | §11 and §14: *«Нет обязательной зависимости от Experiments/Preview.»* Stable `@minecraft/server` 2.10.0 only. The GameTest module is a dev-only test dependency and must not become a runtime requirement. |
| **Windows PC / macOS Bedrock client** | Not in the environment; the macOS client does not exist. |
| **Artificial long-range targeting** | §5: *«без искусственного дальнего луча»* — normal survival interaction/melee reach only. |
| **Per-tick global world scanning** | §11: *«Не делать постоянный глобальный скан мира каждый tick.»* A performance boundary, stated as a prohibition. |
| **Cobweb cleanup / expiry** | The trap is permanent world state by design. No despawn timer was requested; adding one would change the balance. |
| **Modifying melee behaviour** | §7: normal attacks get no extra effect, create no cobweb and start no cooldown. |

### Deferred — later weapons, not now

| Item | Deferred until |
|---|---|
| Remaining legendary weapons | After Web Sword closes its DoD (§14) |
| The **shared cross-item cooldown framework** | Referenced by §8 (two-hand priority) and §12 (*«общая система cooldown проекта»*) but never specified. Web Sword must ship a single-item implementation with a seam for it. See `concept-contradiction` CTR-004. |
| Integration of Web Sword with other items | Preamble: *«до интеграции с остальными предметами»* |
| Stage 2 as a whole — modes, maps, balance, progression | No requirements exist beyond weapon #1 |

### Delivered — no longer in scope

Stage 0 (build/deploy/verify infrastructure) and Stage 1 (Miner's Pickaxe: item, recipe, auto-smelt, enchantability, icon, RU/EN names) are **complete at v0.2.1**. They are now *platform*: the Web Sword extends them and must not regress them. Any change that breaks `andrew:miners_pickaxe` or the existing 7 test suites is out of bounds.

## Boundary notes and edge cases

**"One per world" is scoped to survival crafting, not to item instances.** §4 is explicit: *«Creative/test copies могут существовать у администратора; one-per-world относится к survival crafting, а не к количеству dev/test copies.»* The persistent flag counts *craft events*, not swords in the world. This distinction is load-bearing and also the source of a real invariant tension — see `concept-contradiction` CTR-005.

**Reach is the boundary of the ability, and failing it is free.** §5 and §12 agree: out-of-reach target → nothing happens **and no cooldown is consumed**. The cooldown is a cost of success only. This makes "did the ability succeed?" a gate that must be evaluated *before* any state is written.

**Protection is per-cell, not per-cube.** §6: *«Если часть куба защищена, пропустить только эти клетки; остальные допустимые клетки всё равно заполнить паутиной.»* A partially-blocked cube is a success, not a failure — it still consumes the cooldown. The all-or-nothing reading is wrong.

**Chunk loading is a hard edge, not a best effort.** §6 and §12: never attempt cobweb outside the loaded/accessible area, and never force a write into unloaded chunks at the edge of the loaded region. Cells outside loaded chunks are skipped like protected cells.

**The spec is bilingual and both halves are normative.** Section headings carry RU/EN pairs and a few requirements appear only in the Russian prose. Implementation must read the Russian text, not just the English headings.



