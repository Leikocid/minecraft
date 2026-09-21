---
title: Architecture
type: project-knowledge
generated_at: "2026-09-21T21:24:41.660Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0","L0-cool","L0-item","L0-keep","L0-once","L0-once","L0-qatg","L0-trap"]
priority: 510
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

### Cooldown & Actionbar UI (L0-cool)

# Cooldown & Actionbar UI

**Links** — `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-trap", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]`

## Responsibility

Own the Web Sword ability's per-player cooldown and its player-visible countdown: the exact-30-second timer keyed by **player + ability** (not by item instance), the rule that only a *confirmed successful* activation starts the clock, the actionbar readout of remaining time while the sword is held, and the ability-key seam ADR-007 reserves for a future cross-item cooldown framework that does not exist yet. Spec sections owned: §8 in full, §12's *«cooldown должен сохраняться настолько, насколько это требуется общей системой cooldown проекта»*, and the cooldown half of §9's per-activation independence.

## Why this is its own component

Every sibling deals with a one-shot event (craft, death, cobweb placement). This component is the only one with **standing timed state and a recurring render loop** — the failure modes are different in kind: a timer that doesn't persist is a logout-abuse exploit (C-7's spirit), a render loop that isn't scoped is a C-4 violation, and a timer keyed wrong (per item instead of per player) is a balance bypass (ASM-009). None of `L0-item`, `L0-once`, `L0-keep` or `L0-trap` share this shape.

## Inputs

| Input | Origin | Notes |
|---|---|---|
| "Activation succeeded" signal for the Web Sword ability | `L0-trap`, after cell placement completes | This component never decides success; it only reacts to it — decomposition plan: *"Success is decided by L0-trap; the cooldown is consumed by L0-cool"* |
| "Is this ability ready?" query, before placement | `L0-trap`, step 2 of ADR-006's forced ordering | Must answer before any world state is written |
| Held-item state per online player, each render tick | Bedrock stable equipment surface | Drives which players get an actionbar update |
| Translate keys for the countdown string | `L0-item`'s `.lang` catalogue | Consumed only, never authored here (C-9, ADR-009) |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **Cooldown record** (`L0-cool-ent1`) — per player, per ability-key ready-at time | This component, read on every check/render | Keyed by player + `abilityKey`, never by item stack (ASM-009, ADR-007) |
| `isReady(player, abilityKey)` query result | `L0-trap`, gate before cell placement | Pure read; never mutates state |
| `start(player, abilityKey)` mutation | Called by `L0-trap`, only after a confirmed successful activation | The only write path that arms the timer |
| Actionbar countdown text | The holding player's client | Localized rawtext, `L0-item` keys + seconds substitution |
| Ability-key registration seam (`L0-cool-ent1`) | Future weapons (deferred) | Web Sword registers one key now; the API accepts more without redesign |

## Explicitly not owned

- **Whether an activation succeeds** — reach validation, targeting and cell placement are `L0-trap`. This component answers "ready?" and starts the clock; it never evaluates reach or targets.
- **The `.lang` catalogue** — `L0-item` owns every translate key this component consumes, including the countdown string itself.
- **The general cross-item cooldown framework** referenced by §12 — it does not exist anywhere in the KV. This component ships a single-item implementation with the ability-key seam (ADR-007) and must not invent the framework.
- **Main-hand/off-hand priority arbitration** (§8) — cannot be tested or meaningfully implemented with one legendary item. Provisionally deferred in `concept-boundary` (Q-010); this component keeps only the ability-key indirection a future rule would need.

## Architecture in one paragraph

The cooldown is a small **per-player, per-ability-key service** (ADR-007), not sword-local state. A successful activation writes one **cooldown record** — this component's proposal is a player-scoped dynamic property keyed by ability id, so the record travels with the player and survives disconnect/reconnect without extra plumbing (`L0-cool-adr1`; recommended default for open question Q-009). A single recurring interval, scoped **only to players currently holding a tracked ability's item** (never all online players, never a world scan), recomputes remaining time each cadence tick and renders the actionbar or clears it (also `L0-cool-adr1`). `L0-trap` is the sole caller of the service's mutating and gating entry points; this component never listens for the use-event itself.

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | Dynamic properties and `onScreenDisplay.setActionBar` are both stable-surface; no Beta dependency |
| **C-3** server-authoritative | Remaining time is computed from the server's own record and tick clock, never trusted from a client |
| **C-4** no per-tick global scan | The **only** child permitted a recurring tick, and only because it is scoped to sword holders — not the world (R-cool-004) |
| **C-6** durable world state | Extended here to *durable per-player* state — the cooldown record must outlive logout, in line with Q-009's recommended answer |
| **C-7** no duplication / no-advantage paths | A cooldown that resets on reconnect is a logout-abuse path; persisting it closes that door |
| **C-9** localization is structural | The countdown string is a translate key with a `with` substitution, never a literal (R-cool-005) |

## Open items carried

- **CTR-004** (inherited, root-level, not re-filed) — the framework §12 assumes doesn't exist; this component resolves it locally via ADR-007's seam rather than waiting for it.
- **Q-009** (persistence across logout) — treated as **provisionally answered "persist"** for design purposes (`L0-cool-asm1`, `MUST_ASK`); confirm before implementation.
- **Q-010** (hand-priority scope) — treated as **provisionally deferred**; only the seam ships in v1 (see "Explicitly not owned" above).
- **ASM-009** (inherited) — cooldown keyed per player + ability; this component's entity model enforces it structurally (R-cool-003).

## Risk note

The two failure modes that matter most are silent: a record that resets on reconnect looks correct in every single-session test and only shows up as a logout-abuse exploit under adversarial play; a render loop that iterates all online players instead of sword-holders looks correct at one player and only shows up as a performance regression at server scale — exactly the shape C-4 warns about.







### Item Definition, Recipe & Localization (L0-item)

# Item Definition, Recipe & Localization

**Links** — `title: Item Definition, Recipe & Localization` · `aliases: ["L0-item"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]`

## Responsibility

Owns everything about `andrew:web_sword` that exists **before any Script API logic runs**: the static item component definition, the crafting recipe, the Resource Pack presence (icon, display name), and the full RU/EN translate-key catalogue that this item — and every sibling component that emits a runtime message — draws from. Spec sections owned: §1 (Core), §2 (Recipe), §7 (Passive Behavior), §10 (Localization), and the Resource Pack half of §11 (Technical Architecture).

## Inputs

- Web Sword spec §1, §2, §7, §10, §11 (`webswordspecv1ruen-part-1`, `-part-2`)
- Shipped platform precedent this component extends, not reinvents (C-10): `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `packs/resource/texts/{en_US,ru_RU}.lang`, `packs/resource/textures/item_texture.json`
- Vanilla Diamond Sword's documented component shape (damage, enchant slot, tags) — not present anywhere in this repo, so treated as an assumption (`L0-item-asm2`), not a copyable source

## Outputs

- `packs/behavior/items/web_sword.json` — item definition
- `packs/behavior/recipes/web_sword.json` — shaped recipe
- `packs/resource/textures/items/andrew_web_sword.png` + an `item_texture.json` entry — icon
- `packs/resource/texts/ru_RU.lang` / `en_US.lang` — the `item.andrew:web_sword.name` pair **plus every other key any sibling component needs** (first-craft announcement, cooldown readout)

## What this component does NOT own

- The one-per-world craft gate, its persistent flag, and the broadcast trigger (`L0-once`) — this component defines the recipe's *shape*; whether a craft is *allowed to complete* is decided elsewhere.
- Any dynamic property, ownership marker, or death-retention logic (`L0-keep`).
- The active-ability handler, targeting, and cobweb placement (`L0-trap`) — this component only guarantees that a **plain melee hit** does nothing beyond vanilla Diamond Sword damage (§7).
- The cooldown timer and actionbar readout (`L0-cool`).

## Ownership rule inherited from the decomposition plan

Per `concept-decomposition-plan`: *"Localization ownership is central, use is distributed."* This component is the **sole writer** of `.lang` entries; `L0-once` and `L0-cool` are consumers that must request keys from here rather than hardcoding literals (C-9, ADR-009). This component must reconcile the sibling key list, not merely publish its own item name.

## Key open risk

Q-007 / ASM-005 (parent, `MUST_ASK`): does `minecraft:enchantable` actually function on an item with **no** `minecraft:durability` component on this Bedrock build? The pickaxe (`slot: "pickaxe"`) encodes the identical hypothesis, but Stage 1 never recorded the empirical outcome. The sword repeats the shape with `slot: "sword"`. Verify before or alongside implementation — see `L0-item-asm1`.

## Relation to siblings

`L0-once`, `L0-keep`, `L0-cool` and `L0-trap` all attach behavior/state to the **same entity** this component defines (`andrew:web_sword`) — per the decomposition plan's reduce pass: *"`andrew:web_sword` is the single shared entity — `L0-item` defines it, the others attach state to it."* Any attribute conflict between this component's static definition and a sibling's runtime expectation must be reconciled at L0, not silently overridden here.







### Death Retention & Anti-Duplication (L0-keep)

# Death Retention & Anti-Duplication

**Links** — `title: Death Retention & Anti-Duplication` · `aliases: ["L0-keep", "Death Retention"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-once", "L0-cool", "L0-item", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governed_by: ["C-1", "C-5", "C-6", "C-7", "C-10"]` · `implements: ["WS-9", "WS-10"]`

> **STATUS: analysis complete, implementation blocked on Q-006 / CTR-005.** Everything below that depends on telling one Web Sword instance from another is written *conditionally*. Do not build the ledger before the owner answers.

## Responsibility

Own the lifecycle of a Web Sword across **player death** and **session/world discontinuity**, such that the item is neither *lost* nor *multiplied*. Spec §4 and §12.

Two obligations that pull in opposite directions:

- **Retention (WS-9).** The owner's sword must not appear as a death drop, and must be back in the owner's hands after respawn.
- **Anti-duplication (WS-10, C-7).** Death, disconnect/reconnect and server restart must not — alone or in combination — yield a second copy. C-7 states this absolutely: *«Нет известных способов дюпа через смерть или reconnect.»*

Retention is implemented by *removing* an item from the world and *re-granting* it later. Every such pair is a dup primitive if the two halves can ever both run, or run twice. The entire component is therefore an **idempotency problem**, not an inventory problem.

## In scope

| Ref | Obligation | Spec |
|---|---|---|
| K-1 | Web Sword is excluded from the death drop — it never lands on the ground | §4 |
| K-2 | On respawn the same owner receives exactly one instance back | §4 |
| K-3 | The retain→restore pair is idempotent across death, disconnect/reconnect and server restart | §4, §12 |
| K-4 | Death during ability cooldown creates no copy | §12 |
| K-5 | Death never resets the one-per-world craft flag | §12 |
| K-6 | Retention state is durable world-level state, surviving logout/save/restart | §11, C-6 |

## Out of scope — belongs to siblings

- **The craft flag itself** (`L0-once`). K-5 is a *read-only invariant this component must not breach*; the flag's storage and semantics are `L0-once`'s. Per the parent ownership rule, neither child writes the other's state.
- **Cooldown persistence across death** (`L0-cool`). K-4 only forbids *item* duplication during the cooldown window; whether the timer itself survives is Q-009.
- **The item definition and its `.lang` keys** (`L0-item`). If retention emits any player-visible message, the key is consumed from `L0-item`'s catalogue (C-9, ADR-009); this component adds no literal strings.
- **Non-Web-Sword inventory.** Everything else follows vanilla death rules untouched — ADR-008 rejects `keepInventory` precisely to avoid this blast radius.

## Interfaces

**Consumes**
- Death / drop-path event on the stable `@minecraft/server` surface (ASM-013).
- Respawn event for the same player.
- Player join event (for reconnect reconciliation).
- Instance **provenance marker** written at craft time — *pending Q-006*, and written by `L0-once`'s handler (see CTR-009, resolved at L0 by ADR-016).

**Produces**
- A durable **Retention Ledger** entry per bonded owner (`L0-keep-ent1`).
- Exactly one restored `andrew:web_sword` instance per redeemed entry.

**Touches nothing else.** No world blocks, no other players' inventories, no craft flag.

## Core design (ADR-008, refined here)

Intercept the drop rather than change the gamerule. Concretely, the retain and restore halves are separated by a **durable ledger entry that acts as the idempotency token**:

1. **Retain** — on death, remove the bonded sword from the drop set and write a ledger entry `owner → pending`. Writing the entry and removing the item must be observably atomic (`L0-keep-r002`).
2. **Restore** — on respawn *or* on next join if respawn was missed, grant one instance **only if** an entry is `pending`, then flip it to `redeemed` in the same operation. A second event finds nothing pending and is a no-op.

The ledger is what makes restart safety free: an entry written before the crash is still `pending` after it, so a player who died and immediately crashed the server is made whole on next join — exactly once. This is `L0-keep-p003`.

**Why not "give if missing" at respawn** — rejected in ADR-008 and reconfirmed here: it cannot distinguish "died and lost it" from "an admin took it" or "the player is legitimately carrying an admin copy", so it dupes on the third case. The ledger replaces inference with a record.

## The blocking problem (CTR-005 / Q-006)

The restore predicate is *"does this player still have **their** sword?"* The spec permits unlimited Creative/`/give` copies (§3, §4) while specifying **no way to distinguish instances**. Without provenance, retention and anti-dup are not simultaneously satisfiable — see CTR-005's three-way case analysis.

This component's position: **adopt option three** — retention applies only to instances carrying a durable provenance marker set at survival craft. It is the only branch that satisfies §4 and §14 together. It requires a spec addition the owner must approve (Q-006).

Everything downstream is shaped by the answer:
- **Yes (recommended)** → the ledger binds `player → marked instance`, admin copies drop normally on death like any other item, and §14 holds without qualification.
- **No** → retention must be narrowed to "the first Web Sword a player ever acquires" or to nothing at all, and §14's absolute no-dup claim must be relaxed in writing to exclude admin copies. Two acceptance criteria (`L0-keep-ac05`, `L0-keep-ac06`) change meaning.

## Risk profile

§15 names death-retention/anti-dup as one of the three top cost drivers, alongside one-per-world persistence and multiplayer edge cases — and all three are governed by C-6 and C-7. The distinguishing risk here is that **failures are silent and permanent**: a dup path produces a second legendary item that persists in the world indefinitely, cannot be detected after the fact without auditing every inventory, and directly defeats the one-per-world design that `L0-once` exists to enforce. Test the failure modes (`L0-keep-ac03`, `ac04`) before the happy path.







### One-per-World Craft Gate (L0-once)

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







### Verification, Acceptance & Definition of Done (L0-qatg)

# Verification, Acceptance & Definition of Done

**Links** — `title: Verification, Acceptance & Definition of Done` · `aliases: ["L0-qatg", "QATG", "Verification & DoD"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool"]` · `see_also: ["webswordspecv1ruen-part-2", "webswordspecv1ruen-part-3"]` · `governed_by: ["C-1", "C-5", "C-9", "C-10", "C-11", "C-12"]` · `implements: ["WS-18"]`

## Responsibility

Own §13 (Acceptance Tests), §14 (Definition of Done) and §15 (Estimate) of the Web Sword spec: turn the twelve acceptance tests into an executable matrix, map each onto the existing verification harness (`tests/`, `packs/gametest`, `packs/selftest`, `bds:check`, `bds:gametest`, the iPad visual pass), gate the "no Preview/Experiments dependency" rule, and protect the shipped platform (pickaxe + Stage 0/1 infra) from regression under C-10.

This component **invents no acceptance criteria of its own on the feature side**. Per the decomposition plan: *"`L0-qatg` does not invent criteria. It aggregates and makes executable what the other five define. If it finds a §13 test with no owner, that is a gap to report upward, not to absorb."* Its own criteria are the five §14 Definition-of-Done conditions, which are genuinely gate-level and belong to no single sibling.

## Inputs

- Web Sword spec §13, §14, §15 (`webswordspecv1ruen-part-2`, `-part-3`)
- Every sibling's `concept-acceptance-criterion` artifacts (`L0-item-ac*`, `L0-once-accp*`, `L0-keep-ac*`, and — pending at analysis time — `L0-trap-*`, `L0-cool-*`)
- The live harness: `tests/*.test.mjs` (7 suites), `packs/gametest` + `src/gametest/main.ts`, `packs/selftest` + `src/selftest/main.ts`, `scripts/bds-check.mjs`, `scripts/bds-gametest.mjs`, `package.json` scripts (`test`, `bds:check`, `bds:gametest`)
- C-1…C-12 (`concept-constraint`, node `L0`), inherited unchanged

## Outputs

- The **Acceptance Matrix** (`L0-qatg-ent2`): one row per §13 test, mapped to owner component, harness mechanism, and environment
- The **Definition-of-Done Gate** (`L0-qatg-ent3`): the five §14 conditions as an aggregate go/no-go
- A **gap report** naming any §13 test with zero or more-than-one claimed owner
- No new files in `packs/` or `src/` — this component governs process, not product code

## In scope

| Ref | Obligation | Spec |
|---|---|---|
| Q-1 | Every §13 test has exactly one owning sibling and at least one harness mechanism | §13 |
| Q-2 | Import/load correctness on the stable Bedrock target, no content/dependency errors | §14 |
| Q-3 | All twelve tests pass in a single-player world, and the DoD is corroborated by a ≥2-player test | §14, §9 |
| Q-4 | No known duplication path — across craft, death, disconnect/reconnect, **and restart** (C-7's four-vector reading; see `L0-qatg-ctr1`) | §14, C-7 |
| Q-5 | No mandatory Experiments/Preview dependency in the shipped packs | §14, C-1 |
| Q-6 | The 7 existing pickaxe-era `npm test` suites, `bds:check`, and `bds:gametest` stay green | C-10 |
| Q-7 | The iPad visual pass covers what BDS logs structurally cannot (Creative visibility, icon, RU/EN rendering, actionbar) | C-11 |

## Out of scope — belongs to siblings

- **Defining what "correct" looks like for any single mechanic.** `L0-item` through `L0-cool` each own their own rules, entities and edge cases; this component only aggregates their `concept-acceptance-criterion` output into one matrix.
- **Fixing a failing test.** This component reports gate status; it does not own the code paths under test.
- **The cross-item cooldown framework, or any Stage-2 weapon beyond the Web Sword** — both explicitly deferred at `L0` (`concept-boundary`).

## The harness, as it exists today

Verification is **not one thing** — it is five mechanisms with disjoint blind spots, matching C-11's three-hop loop:

| Mechanism | Runs | Proves | Blind to |
|---|---|---|---|
| `npm test` (`tests/*.test.mjs`, 7 suites) | Node, no engine | Build output, manifests, static item/recipe shape | Anything requiring a live world |
| `bds:check` (`packs/selftest`, stable API) | Docker BDS | In-engine static claims (item exists, is enchantable, recipe resolves) — the machine-checkable half of what used to need an iPad | Player-driven behaviour, multiplayer, death |
| `bds:gametest` (`packs/gametest`, **Beta** API, dev-only) | Docker BDS, `Beta APIs` experiment on a throwaway world | Scripted `SimulatedPlayer` behaviour: targeting, death, respawn, multi-player-in-one-tick races | Anything the Beta channel would make a **runtime** dependency if it leaked into `packs/behavior` (forbidden, C-1) |
| iPad visual pass | Real device, one iPad | Creative Equipment placement, icon, RU/EN text rendering, actionbar readout | Anything requiring two simultaneous clients (only one device exists — ASM-010) |
| Genuine 2-client BDS LAN | Docker BDS + ≥2 real clients, if borrowable | The literal §14 "two players" requirement | Not guaranteed available — see `L0-qatg-asm1` |

Nothing in this table is new infrastructure. `L0-qatg`'s job is to say, for each of the twelve tests, **which row(s) of this table produce its evidence** — not to build a sixth mechanism.

## Relation to siblings

Every sibling emits `concept-acceptance-criterion` artifacts for its own slice; per the decomposition plan's reduce pass #2, those "funnel into `L0-qatg`". This component does not fill gaps by writing siblings' criteria itself; it reports them and re-checks when the siblings publish.

> **Corrected at reduce (analysis_version 2).** This section originally reported that `L0-trap` had no acceptance criteria and `L0-cool` had not been deep-dived, leaving five §13 tests with a declared owner and no artifact. That was already false when written: `L0-trap-ac01`…`ac09` and `L0-cool-ac01`…`ac05` were on disk. **All twelve §13 tests have a published owning artifact**; `pending_artifact_count = 0`. Three rows are declared *split-claims* (AT-9, AT-12, and the melee row) rather than double-claim defects — see `L0-qatg-ent2` invariant 1 as amended and L0's ADR-018.

## Risk profile

§15 does not name verification itself as a cost driver, but three of its named drivers — persistence, dup-safety, multiplayer — are exactly the things this component's harness struggles hardest to prove, per C-11. The single largest risk owned here is **a false green**: a gate that reports DoD-satisfied while restart-dup safety (C-7's fourth vector) or the genuine two-player check (§14) was never actually exercised, only assumed. Both are captured as open items (`L0-qatg-ctr1`, `L0-qatg-asm1`) precisely so the gate cannot close silently around them.







### Active Ability — Targeting & Cobweb Placement (L0-trap)

# Active Ability — Targeting & Cobweb Placement

**Links** — `title: Active Ability — Targeting & Cobweb Placement` · `aliases: ["L0-trap", "Active Ability", "trap", "cobweb placement"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-cool", "L0-item", "L0-once", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `governs_files: ["src/main.ts", "packs/behavior/scripts/main.js", "src/gametest", "src/selftest"]`

## Responsibility

Own everything between **the player using a held `andrew:web_sword`** and **the world containing (or deliberately not containing) a new cobweb trap**. Concretely: hooking the item-use activation, resolving a target server-side inside normal survival reach, deciding whether the activation *succeeded*, and writing up to 27 real vanilla Cobweb blocks through a deny-by-default per-cell safety filter.

Source: §5 in full, §6 in full, §9's determinism and concurrent-activation clauses, §11's server-side/no-per-tick-scan clauses, and §12's four ability edge cases (out of reach, wall-blocking, protected cells, chunk edge, logout-after-activation).

This component owns the **success predicate**. Everything that happens *after* success — starting the 30 s timer, rendering the actionbar — belongs to `L0-cool` (decomposition plan, ownership rule 3).

## Why this is its own component

It is the only child that performs **destructive-capable mutation of shared world state that other players own**. Its failure mode is unlike any sibling's: a mis-tuned safety filter silently and irrecoverably deletes a player's chest, and no acceptance test in §13 is precise enough to catch a subtly wrong cube geometry (§13's *«приблизительно полный 3×3×3 куб»* passes either reading — see ASM-008/Q-011). It is also the largest child by requirement count, and the one place where **C-3** (server authority), **C-4** (no per-tick scan) and **C-8** (non-destructive mutation) all bind simultaneously.

## Inputs

| Input | Origin | Notes |
|---|---|---|
| Item-use activation event for `andrew:web_sword` | Bedrock stable script event surface | The sole trigger. A melee swing must **not** raise it (R-001, ASM-006) |
| Activating player: position, view direction, dimension, reach | `Player` at activation time | All read server-side; no client-supplied coordinates (C-3, R-008) |
| Block and entity state along the view ray | `Dimension` raycast on the stable surface | Ray stops at the first solid block — no through-wall targeting (R-003) |
| Chunk-loaded / accessible state per cell | `Dimension` block lookup | An unreadable cell is an unloaded cell and is skipped (R-007) |
| **Cooldown readiness for (player, `web_sword` ability)** | `L0-cool` — *read only* | Part of the success predicate; this component never writes it (CTR-007) |
| `andrew:web_sword` item identity | `L0-item` | Not defined here |

## Outputs

| Output | Consumer | Notes |
|---|---|---|
| **Placement plan** (`L0-trap-ecub`) — 27 cell verdicts | This component, then discarded | Computed in full before the first write (ADR-015) |
| Up to 27 vanilla `minecraft:web` blocks in the world | All players, permanently | Real ordinary cobweb; no despawn timer (R-005, boundary: cleanup out of scope) |
| **Success / failure signal** for the activation | `L0-cool` | The only thing that may start the cooldown (R-004) |
| Target-resolution result (`L0-trap-etgt`) | Internal; surfaced in GameTest assertions | The seam `L0-qatg` asserts against |
| Ability acceptance criteria | `L0-qatg` | §13 tests 6 (negative half), 7, 8, 10, 12 |

## Explicitly not owned

- **The 30-second timer, its persistence, and the actionbar readout** — `L0-cool` (§8, §12). This component reports *success*; it does not measure time. The ordering it must respect is ADR-006's: validate reach → check cooldown → place cells → **hand off** → start cooldown.
- **The item, recipe, icon and `.lang` catalogue** — `L0-item`. The ability emits no user-facing text in v1; a failed activation is silent per §5 (*«способность не срабатывает»* — no message is specified). If a message is later added it must be a translate key from `L0-item` (C-9, ADR-009).
- **Melee damage parity** — `L0-item` owns §7's damage clause. This component owns only §7's *negative* half: a normal hit creates no cobweb and starts no cooldown (R-001).
- **The craft gate and the ownership ledger** — `L0-once`, `L0-keep`. The ability does not care how the sword was obtained; an admin `/give` copy has the identical ability.
- **Multiplayer determinism as a component.** Per the decomposition plan §9 was deliberately *not* made a node; it binds here as C-3/C-5 (R-008) and separately in `L0-once`.

## Architecture in one paragraph

The ability is **entirely event-driven** (ADR-006): the stable item-use event is the only entry point, so C-4 is satisfied by construction — nothing polls, nothing scans. On activation the handler resolves a target server-side by casting a single ray from the player's eye along the view vector, bounded by vanilla interaction reach and stopped by the first solid block (ADR-014); entity hits, block hits and a bounded near-player fallback all collapse into one `TargetResolution`. If no target resolves inside reach the handler returns **before touching any state** — failure is free (R-004). Otherwise it expands the resolved cell to the 27-cell cube (target ±1 on each axis, ASM-008) and evaluates each cell against a **deny-by-default classifier** (ADR-013): unloaded, occupied by an entity, carrying a block entity, or indestructible ⇒ skip; unknown ⇒ skip. All 27 verdicts are computed **before** the first block is written (ADR-015), then the permitted cells are set to `minecraft:web` inside the same synchronous handler invocation, which is what makes two concurrent activations resolve independently and identically on every client (C-3, C-5, R-008).

## Constraint bindings

| Constraint | How it binds here |
|---|---|
| **C-1** stable API only | Raycast, block get/set and the use event must all exist on `@minecraft/server` 2.10.0. If targeting is only expressible on a Beta surface, the *mechanic* degrades (e.g. a simpler front-of-player cell) — the channel does not change. Escalate rather than decide locally |
| **C-3** server-authoritative | Target is computed from server-read player state only. No client coordinate is trusted, and no cell verdict may depend on who is looking (R-008) |
| **C-4** no per-tick global scan | The component adds **zero** recurring ticks. Targeting happens once per activation. The one permitted tick in the whole add-on belongs to `L0-cool`'s actionbar writer |
| **C-5** dedicated-multiplayer safety | Concurrent activations by different players must each resolve independently (§9). No shared mutable targeting state may exist between handler invocations |
| **C-8** non-destructive world mutation | The governing constraint. Default posture is **deny**: a cell whose safety cannot be established is skipped, not filled (R-006). Asymmetry is deliberate — a weak trap is a tuning bug, destroyed storage is unrecoverable |
| **C-10** preserve the platform | Lands in the existing BP script module alongside the pickaxe's auto-smelt (ADR-010); the 7 shipped suites must stay green |
| **C-11** three-hop verification | Placement correctness is provable in GameTest on Docker BDS; only "does the trap look right / does Use work by long-press on touch" needs the iPad |

## Open items carried by this component

- **Q-011** (inherited, ASM-008) — exact cube geometry relative to the target, and whether self-entombment when targeting adjacent ground is intended. Refined in `L0-trap__concept-client-question`. **Not self-resolved.**
- **Q-013** (inherited, ASM-007) — the closed protected-block deny-list. Refined with a concrete proposed list. **Not self-resolved.**
- **ASM-006** (inherited) — use and attack are distinct engine events. Cheap to falsify; do it first.
- **ASM-017…020** (new) — reach value, no-hit fallback, entity→cell mapping, chunk-loaded probe.
- **CTR-007** (new) — the success predicate spans the `L0-trap` / `L0-cool` ownership line.
- **CTR-008** (new) — §5 and §6 disagree about the **zero-permitted-cells** activation.

## Risk note

Two failures dominate. The first is **over-permissive classification**: one missing block-entity check and the weapon becomes a storage-deletion tool, breaching C-8 with no undo and no test that would have caught it. The second is **wrong geometry** (ASM-008): §13's acceptance test is written loosely enough to pass a cube that is off by one on every axis, so the gate gives false assurance — this needs an explicit owner answer plus a GameTest that asserts the exact 27 coordinates, not an approximate count. A distant third: activating the cooldown before placement succeeds, which §5 and §12 both forbid and which is only visible as a player complaint.







## Architecture Decisions

### Architecture Decisions (L0)

# Architecture Decisions

**Links** — `title: Architecture Decisions` · `aliases: ["L0-adr", "Architecture Decisions"]` · `part_of: ["L0"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

ADR-001…004 (Bedrock over Java; stable API only; three-hop verification loop; TypeScript + namespace `andrew`) were recorded at v1 and remain in force — now evidenced by shipped code rather than by intent.

**Numbering across the tree.** ADR-005…010 are L0's, forced by the spec at decompose time. ADR-011/012 belong to `L0-once`, ADR-013/014/015 to `L0-trap`; `L0-keep`, `L0-cool` and `L0-qatg` used local prefixes (`ADR-K*`, `L0-cool-adr1`, `ADR-Q*`). **ADR-016…020 are new at reduce** — each one is a decision no single child could take, because it settles something visible only across two or more of them.

---

## ADR-005 — One-per-world state lives in world-level dynamic properties

**Context.** §3 requires a craft flag surviving logout, world save and restart; §11 requires *«устойчивое world-level состояние»*; C-1 forbids Beta APIs; §13 makes restart survival an acceptance test.

**Decision.** Persist the flag as a **world-scoped dynamic property** on the stable `@minecraft/server` surface, written inside the craft-completion handler, read before any craft is allowed. Treat the property as the single source of truth; nothing else may gate the craft.

**Rejected alternatives.** *Scoreboard objective* — operator-visible, trivially reset, semantically a score. *Marker entity* — despawnable, killable, lost with a chunk. *State file outside the world* — not portable with the world, unreachable from the sandbox. *Deriving the flag by scanning for existing swords* — violates C-4 and contradicts §4's admin copies.

**Consequence.** World-scoped, therefore correctly shared by all players on a dedicated server (C-5), and correctly *per world*: copying the world copies the spent budget, matching *«один раз на весь мир/сервер»*.

---

## ADR-006 — Ability executes event-driven and server-side, on a reach-bounded raycast

**Context.** §5 (Use-activated, normal reach, no artificial long ray), §6 (per-cell safety), §9 + §11 (server-authoritative), C-4 (no per-tick global scan), §12 (*«Луч упирается в ближайший доступный блок»*).

**Decision.** Hook the stable item-use event. Resolve the target **server-side** by raycasting from the player, bounded by vanilla interaction reach, stopping at the first solid block; accept a block point, an entity, or a nearby point within reach. Validate reach **before** writing any state, then iterate the 27 cells applying the safety filter per cell.

**Rejected alternatives.** *Per-tick proximity scan* — prohibited by §11. *Client-supplied coordinates* — violates C-3. *Custom extended-range ray* — prohibited by §5. *Structure/fill in one call* — cannot express per-cell skipping (§6) and risks writing into unloaded chunks (§12).

**Consequence.** Ordering is forced: **validate reach → check cooldown → place cells → start cooldown.** Any other order can consume the cooldown on a failed activation. *The cooldown-check step straddles a child boundary; see ADR-017.*

---

## ADR-007 — Cooldown is a shared per-player ability service, not sword-local state

**Context.** §8 requires exactly 30 s, an actionbar readout of *remaining* time, and a main-hand-over-off-hand priority rule presupposing multiple legendary items. §12 defers persistence to an *«общая система cooldown проекта»* that does not exist. More weapons are coming.

**Decision.** Implement cooldown as a small **per-player, per-ability-key service** owned by the add-on, with the Web Sword registering one ability into it. Ship a single-item implementation now, with the ability-key indirection already in place — the seam the future framework plugs into.

**Rejected alternatives.** *`minecraft:cooldown` component alone* — gates re-use but exposes no remaining-time value, so §8's UI requirement cannot be met from it. *Ad-hoc inline timer* — makes hand-priority unimplementable, guarantees a rewrite at weapon #2. *Per-item-instance cooldown* — lets a player alternate two copies to bypass the gate (ASM-009).

**Consequence.** Keying by **player + ability** is a deliberate anti-abuse choice. The actionbar writer is the one permitted recurring tick under C-4, scoped to players currently holding the sword.

---

## ADR-008 — Death retention intercepts the drop; it does not rely on `keepInventory`

**Context.** §4: no drop on death, return to the same owner on respawn, no extra copy across death/disconnect/restart. §12: death during cooldown must neither dupe the sword nor reset the craft flag. C-7 states anti-dup absolutely.

**Decision.** Handle the sword specifically on the death/drop path — remove it from the death drop and restore exactly one instance to the same player on respawn, guarded by an idempotency check so a repeated or late event cannot restore a second copy.

**Rejected alternatives.** *`keepInventory` gamerule* — server-wide, retains everything, materially changes PvP stakes for every other item. *Soulbound-style enchantment* — no such vanilla Bedrock mechanic. *Respawn-time "give if missing" with no ledger* — cannot distinguish "died and lost it" from "admin took it" or "legitimately holding an admin copy", so it dupes.

**Consequence.** The restore path needs a notion of *which* sword instance belongs to the player. This collides with §3's allowance of admin copies — CTR-005, and now ADR-016.

---

## ADR-009 — All user-facing text is a translate key resolved by the Resource Pack

**Context.** §10 mandates RU/EN for the item name *and* every runtime message, and forbids hardcoding one language in the script (C-9).

**Decision.** Scripts emit **rawtext with `translate` keys plus `with` substitutions**; the strings live in `packs/resource/texts/ru_RU.lang` and `en_US.lang` alongside the pickaxe entries. `L0-item` owns the catalogue; `L0-once` and `L0-cool` consume keys and add no literals.

**Rejected alternatives.** *Literal Russian strings in `sendMessage`* — prohibited by §10, leaves EN players unserved. *Script-side language dictionary* — reimplements the engine's own system.

**Consequence.** Every message-emitting feature lands a `.lang` pair in the same change. *When the catalogue may be frozen is itself a cross-component question; see ADR-019.*

---

## ADR-010 — Web Sword ships inside the existing `andrew` packs, not as a separate add-on

**Context.** §14 calls the weapon a *«самостоятельный готовый модуль»*, which invites a separate pack. But Stages 0–1 delivered one BP + one RP at a fixed version target with a working build/validate/GameTest/BDS pipeline (C-10).

**Decision.** Add `andrew:web_sword` as a new item, recipe and script module **within** `packs/behavior` / `packs/resource`, reusing manifests, version scheme, test suites and BDS harness. "Standalone module" is honoured as **code and test isolation**, not pack isolation.

**Rejected alternatives.** *Separate BP/RP pair per weapon* — multiplies manifests and UUIDs, forces N installs, re-opens the import-compatibility risk Stage 0 closed once. *Core pack + per-weapon packs* — right at ten weapons, premature at one.

**Consequence.** Pickaxe regression protection is mandatory (C-10). If the weapon count later justifies splitting, this is the ADR to revisit.

---
---

# Cross-component decisions (reduce phase)

## ADR-016 — The provenance marker is a third piece of durable state, with a declared producer/consumer split

**Resolves:** CTR-009 (`L0-keep`). **Relates to:** `L0-once`, `L0-keep`, and CTR-005 / CTR-006. **Conditional on:** Q-006 — if the owner refuses the marker, this ADR is void and `L0-keep` narrows instead.

**Context.** The decomposition plan partitioned durable state cleanly in two: *"`L0-once` owns the craft flag; `L0-keep` owns the item ledger. These are different pieces of state and neither may write the other's."* CTR-005's recommended resolution introduces a **third** piece — a per-instance provenance marker distinguishing a survival-crafted sword from an admin copy. It can only be *written* at craft completion, which is `L0-once`'s handler, and it is *read* exclusively by `L0-keep`. The two-way partition has no slot for it, and under the rule as written either child breaches it.

**Decision.** Name the marker explicitly as a third piece of state with **split producer/consumer ownership**:

- **Producer:** `L0-once`, at craft completion, in the same synchronous handler that claims the craft flag (ADR-011).
- **Consumer:** `L0-keep`, exclusively. No other child reads or writes it.
- **Definition:** a single shared constant/helper module whose shape, durability contract and semantics are **specified by `L0-keep`** (`L0-keep-ent2`) and *called* by `L0-once`. The write site belongs to `L0-once`; the definition is not duplicated.

This mirrors the pattern the plan already established for localization — *"ownership is central, use is distributed"* — so it extends an existing rule rather than inventing one.

**Rejected alternatives.** *Extend `L0-once`'s ownership to cover the marker* — `L0-once` would own state whose invariants and impact-if-wrong are entirely `L0-keep`'s, with no contract between them. *Let `L0-keep` hook the craft event* — two children mutating state inside one handler is the concrete form of the overlap the rule exists to prevent, and it would collide at integration as a merge conflict in the craft handler. *Leave it unstated* — the observed failure mode is the worst one: a marker one child assumes is written and the other never writes, which silently stops retaining swords with no error anywhere.

**Consequence.** The decomposition plan's ownership rule 2 is **amended** to read: *`L0-once` owns the craft flag, `L0-keep` owns the retention ledger and defines the provenance marker, and `L0-once` writes the marker through `L0-keep`'s helper at craft completion.* This must be settled **before the craft handler is written** — it is the one place the two children meet in code.

---

## ADR-017 — `L0-cool` exposes a read-only readiness query; `L0-trap` calls it and never writes the timer

**Resolves:** CTR-007 (`L0-trap`). **Relates to:** `L0-trap`, `L0-cool`, `L0-qatg`.

**Context.** The decomposition plan's ownership rule 3 draws the boundary at the moment of success: *"`L0-trap` owns the success predicate; `L0-cool` owns everything after it."* But ADR-006's forced ordering places a **cooldown check inside** that predicate — an activation while the timer runs is not a success. "Everything after success" and "check cooldown before placing" cannot describe the same line. Both children noticed independently and both provisionally implemented the same answer, which is the strongest available evidence that it is the right one.

**Decision.** `L0-cool` exposes exactly two entry points and `L0-trap` is their only caller:

- `isReady(player, abilityKey)` — **pure read, never mutates.** Called by `L0-trap` as step 2 of ADR-006's ordering, before any world state is written.
- `start(player, abilityKey)` — **the sole write path that arms the timer.** Called by `L0-trap` only after placement has confirmed success.

`L0-cool` does **not** listen for the use event. The event hook stays with the component that owns §5.

**Rejected alternatives.** *`L0-cool` wraps the activation*, intercepting the use event and calling into `L0-trap` when ready — this moves the §5 event hook out of `L0-trap`, contradicting its ownership of activation, and forces targeting knowledge into a component that should have none. *Leave it unstated* — the concrete predicted failure is that both children implement a gate and the sword checks the cooldown twice, harmless until one of them also starts it.

**Consequence.** Ownership rule 3 is **amended**: *`L0-cool` owns all mutation of the timer and exposes a read-only readiness query; `L0-trap` calls it as part of the success predicate and never writes cooldown state.* §13 test 9 is consequently claimed from **both** sides by design (`L0-trap-ac08` asserts the gate, `L0-cool-ac01` asserts the duration) — see ADR-018, which stops `L0-qatg` flagging it as a defect.

---

## ADR-018 — The acceptance matrix admits declared split-claim rows, and the DoD gate uses the four-vector dup reading

**Resolves:** CTR-010 (`L0-qatg`), and the double-claim ambiguity left by ADR-017. **Relates to:** `L0-qatg`, `L0-trap`, `L0-cool`, `L0-item`, `L0-once`.

**Context.** Two things about the gate only resolve above the children. First, `L0-qatg`'s matrix invariant demanded exactly one owning artifact per §13 row, with a single hand-carved exception for AT-12 — but three rows legitimately have two owners, because three §13 lines each bundle two claims. Second, §14's DoD sentence names **three** dup vectors (*«крафт, смерть или reconnect»*) while §4, §12 and C-7 name **four**, adding restart. A gate implemented literally from §14 would report green without ever requiring restart-dup evidence.

**Decision.** Two rulings, both on the side of the stricter reading.

1. **Split-claim rows are legitimate and enumerated.** Exactly three §13 rows have two owners, and no others may:
   - **AT-9** — `L0-trap` (the re-use gate) + `L0-cool` (the 30 s duration), per ADR-017.
   - **AT-12** — `L0-trap` (identical cobweb on both clients) + `L0-once` (the craft race), per the plan's deliberate refusal to make multiplayer determinism its own node.
   - **The melee row** — `L0-item` (damage parity with Diamond Sword) + `L0-trap` (a normal swing creates no cobweb and starts no cooldown).

   Outside this list, two owners remains a defect to report upward.
2. **The DoD gate adopts the four-vector reading.** §14's sentence is treated as **elliptical** — dropping "and restart" because §12 covers it two paragraphs earlier — not as a deliberate narrowing. Restart-dup evidence is required before the gate can close.

**Rejected alternatives.** *Force each §13 line onto one owner* — would push either damage parity into `L0-trap` or the cooldown duration into `L0-trap`, in both cases relocating a criterion away from the component that owns the code it tests. *Follow §14 literally on three vectors* — there is no scenario where honouring C-7 over §14's text produces a worse outcome, and the failure it permits ("false green") is exactly the risk `L0-qatg` names as its largest.

**Consequence.** `L0-qatg-ent2`'s invariant 1 and its snapshot were amended in place at reduce. The matrix now stands at `unclaimed_count = 0`, `duplicate_claim_count = 0`, `pending_artifact_count = 0`, `overall_status = complete-pending-execution`. Neither ruling requires the owner's input; both are recorded so the gap between the two texts stays visible rather than being silently absorbed into rule text.

---

## ADR-019 — The `.lang` catalogue is frozen last, not first

**Relates to:** `L0-item`, `L0-once`, `L0-trap`, `L0-cool`. **Blocked by:** Q-008, Q-017, and conditionally Q-006.

**Context.** The decomposition plan's build order opens with `item`, and ADR-009 makes `L0-item` the sole writer of the catalogue. Read together, that invites publishing the `.lang` pairs first and moving on. Looking across all six children shows the opposite dependency: the **set of keys is not knowable** until questions owned by other children are answered.

| Key | Needed by | Blocked on |
|---|---|---|
| `item.andrew:web_sword.name` | `L0-item` | nothing — publishable today |
| First-craft announcement (+ creator `with`) | `L0-once` | nothing — publishable today |
| Cooldown remaining-time readout (+ seconds `with`) | `L0-cool` | nothing — publishable today |
| Blocked-craft denial message | `L0-once` | **Q-008** — exists only if the owner picks "block and consume with an explanation" |
| "No valid space" on a zero-cell activation | `L0-trap` | **Q-017** — exists only under CTR-008 option (c) |
| Any retention-related message | `L0-keep` | **Q-006** — the component emits none today, but its shape is unsettled |

**Decision.** `L0-item` publishes the three unblocked pairs immediately so nothing waits on it, and **holds the catalogue open** until Q-008 and Q-017 are answered. "Catalogue frozen" becomes an explicit `L0-item` milestone that `L0-qatg` checks, not an implicit consequence of `L0-item` finishing first.

**Rejected alternatives.** *Freeze the catalogue at `L0-item` completion and amend later* — guarantees a second RP pass and a second iPad verification hop for what is otherwise a one-line change, and the iPad hop is the expensive one (C-11). *Let the blocked children author their own literals provisionally* — directly violates C-9/ADR-009, and provisional literals are exactly the kind of thing that ships.

**Consequence.** The build order in the decomposition plan stays as written — `L0-item` still goes **first** — but its *definition of done* now has a tail that closes after `L0-once` and `L0-trap`. Two of the three blocking questions are cheap for the owner to answer, so this is a scheduling note rather than a risk.

---

## ADR-020 — One persistence mechanism, one recurring tick, for the whole add-on

**Relates to:** all six children. **Records convergence rather than forcing it.**

**Context.** No child was told how to persist state or whether it might poll. Four of them independently reached for **dynamic properties on the stable `@minecraft/server` surface** — at three different scopes — and five of them independently concluded they must add **zero** recurring ticks. That is convergence worth freezing before a second weapon erodes it by precedent.

**Decision.** Two standing rules for the add-on, not just the Web Sword:

1. **All durable add-on state is a dynamic property on the stable surface.** No scoreboards, no marker entities, no files outside the world, no structure abuse. Scope is chosen to match the state's lifetime: world for the craft flag and retention ledger, player for the cooldown record, item-instance for the provenance marker (ADR-016).
2. **The add-on spends exactly one recurring interval, and `L0-cool`'s actionbar writer holds it** — scoped to players currently holding a tracked ability's item, never all online players, never a world scan. A child that believes it needs a second tick escalates to L0 rather than adding one; per C-1's precedent the *mechanic* degrades before the budget grows.

**Rejected alternatives.** *Leave both implicit* — they are currently true only by coincidence, and the failure is gradual: the second weapon adds "just one more" interval, and C-4 erodes into a per-tick scan nobody decided on. *Mandate a single persistence facade module now* — premature at one weapon; four call sites with three different scopes do not yet justify an abstraction, and the constraint above gets the safety without the indirection.

**Consequence.** C-4 acquires a concrete, countable form — *the add-on has one interval; grep for it* — which `L0-qatg` can assert cheaply in the existing `npm test` layer without a live engine. It also means any future cross-item cooldown framework (ADR-007's seam, CTR-004) inherits the tick budget rather than being free to add its own.







### Architecture Decisions — One-per-World Craft Gate (L0-once)

# Architecture Decisions — One-per-World Craft Gate

**Links** — `part_of: ["L0-once"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0", "L0-keep", "L0-item"]`

**Inherited and binding:** **ADR-005** (one-per-world state lives in world-level dynamic properties), **ADR-009** (all user-facing text is a translate key), **ADR-010** (ships inside the existing `andrew` packs). This node does not revisit them. Two further decisions are forced at component depth.

---

## ADR-011 — The enforcement point is craft completion, with a synchronous read-check-write claim

**Context.** §3 requires the second survival craft to be *«заблокирован без потери ингредиентов, насколько это позволяет стабильный API»*, and §9 requires that two simultaneous crafts cannot bypass the gate. C-1 forbids Beta APIs; C-5 makes dedicated-server concurrency a first-class concern. ASM-011 anticipates that the stable surface offers no pre-craft veto.

**Decision.** Hook the **craft-completion** event server-side. Inside a single synchronous handler invocation, in this order: confirm the craft produced a result → read the crafting player's game mode → read the world craft flag → if unset, write it → then announce. If set, remove the result and attempt the ingredient refund. **No `await`, no `system.run`, no queued callback may appear between the flag read and the flag write** — that uninterrupted window *is* the atomic claim (ASM-015).

**Rejected alternatives.**
- *Pre-craft veto / recipe-unlock gating* — preferred if it exists on the stable surface (ASM-011's "good direction": simpler, no refund edge cases). Rejected as the **planned** design only because the analysis cannot confirm it exists. If implementation finds it, revisit this ADR rather than working around it.
- *Deferring the flag write to a follow-up tick* (`system.run`) — the single most likely way to introduce the §9 race. It passes every single-player test and fails only under real concurrency.
- *A per-player "has crafted" record* — fails §3 outright: a second player would get their own sword. Also fails AC-ONCE-2's cross-player half.
- *A lock/mutex around the craft* — no such primitive exists on the stable surface, and the single-threaded handler model makes it unnecessary if the ordering rule is obeyed.
- *Announcing before the flag write* — a throw between the two announces a craft that was never recorded, silently re-opening the budget.

**Consequence.** The ordering is a **reviewable rule**, not just a runtime behaviour: a code reviewer can verify race safety by reading for asynchrony between read and write. That matters because AC-ONCE-5 is timing-dependent and can pass by luck. The review gate is recorded in R-004 and in AC-ONCE-5's "review gate, not just a test" clause.

---

## ADR-012 — The flag stores a versioned record, not a bare boolean

**Context.** ADR-005 fixed the *storage mechanism* (world dynamic property) but not the *payload*. §3 requires the announcement to name the creator; §13 requires the block to persist across restart; G-4 will add more legendary weapons, each presumably with its own gate.

**Decision.** Store a single serialized JSON record under `andrew:web_sword_craft_gate` carrying `{ v, crafted, crafterName, crafterId, at }` (entity `L0-once-ecft`). One property, written atomically as one value.

**Rejected alternatives.**
- *A bare boolean property* — cannot name the crafter in the blocked-craft denial message, and offers no migration path when the cross-weapon framework arrives. The information is free to store and impossible to recover later.
- *Several independent properties* (`…_crafted`, `…_crafter`, `…_at`) — a torn multi-write can leave `crafted: true` with no crafter name, producing a broken announcement and an unattributable gate. A single serialized value makes the write all-or-nothing.
- *Recording the crafted item instance in the record* — deliberately rejected. It would pull CTR-005's provenance question into this component, which owns the craft flag and explicitly **not** the item ledger. If the owner grants a provenance marker, it belongs to `L0-keep`.
- *`crafterName` alone, without `crafterId`* — a display name is mutable; the id is not. The denial message must still attribute the craft years later.

**Consequence.** `v` is the migration seam: when weapon #2 lands and a shared gate registry becomes worthwhile, existing worlds can be read forward without re-opening any budget. This is the same "ship single-item, keep the seam" posture ADR-007 takes for cooldown, applied to persistence.







