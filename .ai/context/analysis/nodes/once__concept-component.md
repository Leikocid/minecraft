---
type: "concept-component"
node_id: "L0-once"
source_channel: "rollout"
title: "One-per-World Craft Gate"
aliases: ["L0-once"]
part_of: ["L0"]
is_a: ["component"]
relates_to: ["L0"]
analysis_version: 2
level: 1
priority: 510
size_chars: 7084
tags: ["component","web-sword","one-per-world","craft-gate","persistence","L0-once"]
needs_rebuild_marked_at: 2026-09-21T21:27:45.355Z
---

# One-per-World Craft Gate

**Links** — `title: One-per-World Craft Gate` · `aliases: ["L0-once", "One-per-World Craft Gate", "craft gate"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-keep", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governs_files: ["src/main.ts", "packs/resource/texts/ru_RU.lang", "packs/resource/texts/en_US.lang"]`

## Responsibility

Enforce the spec's scarcity rule: **in Survival, `andrew:web_sword` may be successfully crafted exactly once per world/server, forever.** This component owns the durable world-level flag that records that the craft budget has been spent, the enforcement of the block on every subsequent survival craft, the localized broadcast that announces the first craft and names its creator, and the exemption that keeps Creative crafting and `/give` outside the budget entirely.

Source: §3 in full, §9's craft-race clause, §12's *«смерть … не должна … сбрасывать persistent one-per-world flag»*, and the three §13 tests that exercise first craft, second craft and post-restart second craft.

## Why this is its own component

The gate is not a feature of the item — it is a piece of **durable global state with a concurrency contract**. §15 names one-per-world persistence as one of the three top cost drivers. The failure modes here are unlike every sibling's: a lost flag silently un-spends the world's budget, a double-write silently mints a second sword, and both are invisible until a player exploits them. That earns isolation from `L0-item` (which owns the item and recipe as static definitions) and from `L0-keep` (which owns per-instance ownership).

## Inputs

| Input | Origin | Notes |
|---|---|---|
| Craft-completion signal for `andrew:web_sword` | Bedrock stable script event surface | The enforcement point; see ADR-011 |
| Crafting player's game mode | `Player.getGameMode()` at craft time | Discriminates survival craft from Creative craft (R-003) |
| Crafting player's name | The same player object | Substituted into the announcement (`with`) |
| `andrew:web_sword` item identity and recipe | `L0-item` | The gate does not define either |
| Translate keys for announcement and denial text | `L0-item`'s `.lang` catalogue | Consumed, never authored here (C-9, ADR-009) |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **World craft flag** (`L0-once-ecft`) — durable record that the budget is spent | This component, on every subsequent craft | Sole authority (R-007). No sibling may write it |
| First-craft broadcast (`L0-once-ebrd`) | All online players | Localized rawtext, names weapon + creator |
| Blocked-craft denial outcome | The crafting player | Ingredients returned where the API permits (R-005, CTR-003) |
| Craft-event acceptance criteria | `L0-qatg` | Maps to §13 tests 3, 4 and part of 12 |

## Explicitly not owned

- **The item, the recipe, the icon, the `.lang` catalogue** — `L0-item`. This gate consumes keys and reconciles its list with that owner.
- **Which sword instance belongs to which player, and death/respawn restoration** — `L0-keep`. Per the decomposition plan's ownership rule, `L0-once` owns the *craft flag*; `L0-keep` owns the *item ledger*. Neither writes the other's state. §12's "death must not reset the flag" is an invariant `L0-keep` must respect, expressed here as R-002.
- **Counting swords in the world.** The flag counts *craft events*, not instances (`L0-once-gcrd`). Deriving the gate by scanning for existing swords is forbidden — it violates C-4 and contradicts §4's admin copies (R-007, ADR-005 rejected alternative).
- **Cooldown of any kind.** `L0-cool`. The craft gate has no timer; it is one-shot and permanent.

## Architecture in one paragraph

The flag is a **world-scoped dynamic property** on the stable `@minecraft/server` surface (ADR-005), holding a small versioned record rather than a bare boolean (ADR-012). Enforcement hooks the craft-completion event server-side (C-3) and performs a synchronous **read-check-write** inside a single handler invocation; because the Bedrock script host runs one handler to completion before the next, that sequence is the atomic claim that makes the §9 craft race safe (ASM-015, R-004). The first caller to observe an unset flag sets it, emits the broadcast, and keeps the sword. Every later caller observes a set flag, removes the crafted result and — where the stable API permits — returns the ingredients (ASM-011, R-005). Nothing polls; the component is entirely event-driven, which satisfies C-4 by construction.

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | The flag must be a stable-surface dynamic property. If only a Beta API can express pre-craft veto, the *mechanic* degrades to detect-and-refund — the channel does not change |
| **C-3** server-authoritative | Game mode and flag state are read server-side; no client input gates the craft |
| **C-4** no per-tick scan | The gate is event-driven only; it adds no recurring tick |
| **C-5** dedicated-multiplayer safety | Two simultaneous crafts must yield exactly one success (R-004). BDS is the test surface, not single-player |
| **C-6** durable world state | The flag must survive logout, world save and restart — the last is an explicit §13 test (R-002, `L0-once-accp3`) |
| **C-7** no duplication paths | A gate that can be re-opened *is* a craft dup path. R-002 and R-004 exist to close it |
| **C-9** localization is structural | The announcement and any denial message are translate keys, never literals (R-006) |
| **C-10** preserve the platform | Lands in the existing BP/RP alongside `andrew:miners_pickaxe` (ADR-010); the 7 existing suites must stay green |

## Open items carried by this component

- **CTR-003** (inherited) — "blocked without losing ingredients" is required, hedged by *«насколько это позволяет стабильный API»*, and has no §13 test. Refined here as `L0-once-accp7`, which is written as **conditional** on the owner's answer. Not self-resolved.
- **CTR-006** (new, raised here) — the craft budget is spent irreversibly, but the spec guarantees the sword against death only; it is silent on the sword being destroyed by lava/void/`/clear`, which leaves a world permanently with zero obtainable Web Swords.
- **ASM-011, ASM-012** (inherited from L0) plus **ASM-013…015** (new): non-survival game modes, craft-event granularity, and script-host atomicity.
- **Q-008** refinement — see `L0-once__concept-client-question`.

## Risk note

The two highest-consequence failures are both silent. A flag that fails to persist (wrong scope, written after a throw, lost on an unclean shutdown) re-opens the craft budget and mints swords — that is a C-7 dup path discovered only by a player. A flag written *before* the craft is confirmed spends the budget on a craft that never completed, permanently denying the world its sword with no recovery path (CTR-006). The ordering **confirm craft → claim flag → announce** is therefore load-bearing, and both directions need their own acceptance test.
