---
title: Project Summary
type: analysis
generated_at: "2026-09-21T21:24:41.670Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 510
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

# Project Overview — Minecraft Bedrock PvP Add-On (v2, post-reduce)

> **Analysis decision: `decompose` — executed.** Six L1 children planned, six analysed. This overview is the **reduce-phase rewrite**: it supersedes the decompose-time draft, which described a decomposition that had not yet run.
> **Supersedes:** `L0` v2 decompose-draft `concept-overview`, and `L0` v1 (which concluded `self-work` against 4.7 KB of scaffolding docs and a repository at T-zero).

**Links** — `title: Project Overview — Minecraft Bedrock PvP Add-On` · `aliases: ["L0", "Project Overview", "Web Sword Project"]` · `part_of: []` · `is_a: ["system-overview"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2", "webswordspecv1ruen-part-3", "minerspickaxetestspec", "stage-0-infrastructure"]` · `supersedes: ["L0"]`

## What this project is

A **Minecraft Bedrock Edition** Add-On (namespace `andrew`) whose ultimate deliverable is a custom **PvP Add-On** featuring legendary weapons. It runs as a strict three-stage gate. Stages 0 and 1 are shipped at v0.2.1; **Stage 2 now has its first real specification** — the Web Sword / Паутинный меч — and this analysis has decomposed it.

| Stage | Name | Status | Evidence |
|---|---|---|---|
| **0** | Development infrastructure | **Done** | `packs/behavior` + `packs/resource` with manifests, `npm run build` → `.mcaddon`, Docker BDS rig, git history from `main` |
| **1** | Miner's Pickaxe test add-on | **Done** (v0.2.1) | `andrew:miners_pickaxe` + recipe + `src/autosmelt.ts`, gilded icon, `packs/gametest` + `packs/selftest`, 7 suites, LAN delivery to iPad |
| **2** | Main PvP Add-On | **Weapon #1 specified and decomposed** | `docs/Web_Sword_Spec_v1_RU_EN.docx` → `webswordspecv1ruen-part-{1,2,3}` → six L1 components |

v1's boundary declared Stage 2 *«требования ещё не сформулированы»*. That statement is **superseded**, not contradicted.

## The shape of the system after deep-dive

The spec reads as one item with a handful of features. It is not. After six deep-dives the Web Sword resolves into **one static item plus four pieces of durable state plus one transient computation**, and almost every hard problem in the project is a problem about that state — not about the sword.

```
                       L0-item  ── defines ──▶  andrew:web_sword          (static: BP item, recipe, icon, .lang)
                          │                            │
                sole writer of .lang                   │  state attaches here
                          │                            │
        ┌─────────────────┼────────────────────────────┼──────────────────────┐
        │                 │                            │                      │
   L0-once           L0-cool                      L0-keep                 L0-trap
   craft flag        cooldown record              retention ledger        (no durable state)
   world-scoped      player-scoped                world-scoped            placement plan is
   write-once        30 s per ability key         idempotency token       computed then discarded
        │                                              ▲                      │
        └────── produces ── provenance marker ─────────┘                      │
                            (item-instance scoped)                            │
                                                                              │
   L0-cool ◀──── isReady() read, then start() after success ──────────────────┘

   L0-qatg ── consumes acceptance criteria from all five ──▶ 12-row matrix + §14 DoD gate
```

**Five feature children and one gate child.** `L0-qatg` produces no product code; it aggregates the other five into a release gate. The five feature children are not peers in difficulty: §15 names one-per-world persistence, death-retention/anti-dup and multiplayer edge cases as the cost drivers, and that is exactly `L0-once`, `L0-keep`, and the C-5 clauses that bind `L0-once` and `L0-trap` separately.

## The six components

**`L0-item` — Item Definition, Recipe & Localization.** Everything that exists *before any script runs*: the item component definition (Diamond Sword parity, infinite durability by omitting the durability component, `minecraft:enchantable` with `slot: "sword"`), the plus-pattern recipe, the icon, and — as **sole writer** — the RU/EN translate-key catalogue every sibling draws from. Structurally the simplest child and, counter-intuitively, **the one that must close last**: three of its keys depend on questions owned by other children (ADR-019).

**`L0-once` — One-per-World Craft Gate.** A write-once world-scoped dynamic property holding a versioned record (ADR-005, ADR-012), claimed by a synchronous read-check-write inside the craft-completion handler (ADR-011). That synchronous claim is what makes §9's craft race safe — the script host runs one handler to completion before the next. Both of its failure modes are silent: a flag that fails to persist re-opens the craft budget and mints swords; a flag written before the craft is confirmed spends the budget on a craft that never happened.

**`L0-keep` — Death Retention & Anti-Duplication.** The only child whose analysis concludes *do not build yet*. Retention is implemented by removing an item and re-granting it later, and **every such pair is a duplication primitive** if both halves can run, or either can run twice. The component's answer is a durable ledger entry that is itself the idempotency token (ADR-K1): `owner → pending` on death, `pending → redeemed` on the same operation that grants. Restart safety then falls out for free. It is **blocked on Q-006**, because the restore predicate — *"does this player still have **their** sword?"* — is unanswerable while the spec permits unlimited indistinguishable admin copies.

**`L0-trap` — Active Ability: Targeting & Cobweb Placement.** The largest child by requirement count and the only one that performs **destructive-capable mutation of world state other players own**. One ray from the eye, bounded by vanilla reach, stopped by the first solid block (ADR-014); the resolved cell expands to 27; every cell is classified **deny-by-default** (ADR-013); all 27 verdicts are computed before the first block is written (ADR-015). Its dominant risk is not failure but *over-permissive success*: one missing block-entity check turns the weapon into a storage-deletion tool, and §13's *«приблизительно полный 3×3×3 куб»* is loose enough to pass a cube off by one on every axis.

**`L0-cool` — Cooldown & Actionbar UI.** The only child with standing timed state and a recurring render loop, and therefore **the holder of the add-on's entire per-tick budget** under C-4. Keyed by player + ability key, never by item stack (ADR-007) — a deliberate anti-abuse choice, since per-instance keying would let a player alternate two copies. Its analysis provisionally adopts "persist across logout" (Q-009) on the reasoning that a resetting cooldown is a logout-abuse path that C-7's spirit already forbids.

**`L0-qatg` — Verification, Acceptance & Definition of Done.** Owns §13/§14/§15 and invents no feature criteria. Its real contribution is the observation that **verification here is five mechanisms with disjoint blind spots**, not one: `npm test` (no engine), `bds:check` (in-engine static claims), `bds:gametest` (SimulatedPlayer behaviour, on the Beta channel and therefore dev-only, never a runtime dependency), the single iPad (visual/locale/actionbar), and a genuine two-client LAN session that **may not be available at all**. The largest risk it owns is a **false green** — a gate reporting DoD-satisfied over evidence that was assumed rather than exercised.

## What only became visible by looking at all six at once

Four findings belong to no single child.

1. **The provenance marker is the keystone of the whole feature set.** Q-006 was filed as a `L0-keep` blocker. It is not. The marker gates `L0-keep`'s ledger shape, supplies the *only* bounded answer to `L0-once`'s CTR-006 (budget spent, sword destroyed), is **written** inside `L0-once`'s craft handler, and changes the meaning of two of `L0-keep`'s acceptance criteria. One unanswered question with four owners. It is now ADR-016 structurally and **the single highest-value question to put to the owner**.

2. **The add-on has exactly one persistence mechanism and exactly one recurring tick.** Not planned centrally — four children independently reached for dynamic properties on the stable surface, at three different scopes, and every child except `L0-cool` independently concluded it must add zero ticks. That convergence is worth freezing as a decision before a fifth weapon erodes it (ADR-020).

3. **`L0-item` is a downstream dependency, not an upstream one.** The build order says `item` first. The *catalogue* closes last: the denial message depends on Q-008's answer, a possible "no valid space" message depends on Q-017's, and any retention message depends on Q-006's. Shipping `.lang` early guarantees a second pass (ADR-019).

4. **Two children drew the same boundary from opposite sides, and one gate child mis-stated its own completeness.** `L0-trap`/`L0-cool` both correctly identified that ADR-006's forced ordering puts a cooldown *read* inside `L0-trap`'s success predicate, which the decomposition plan's rule 3 did not allow for (CTR-007, now ADR-017). Separately, `L0-qatg` reported five §13 tests as having no published criteria; they had been published before it wrote. Corrected in place — the acceptance matrix is **complete-pending-execution**, not incomplete.

## Environment — unchanged and still defining

There is **no Minecraft Bedrock client for macOS**. Every change travels **build (Mac mini) → load (Docker BDS, greppable logs) → confirm (iPad, GUI)**. Stage 1 automated the loop (`bds:check`, `bds:gametest`, `selftest`) but did not remove the hop: Creative visibility, icon rendering, RU/EN display and the actionbar readout remain iPad-only observations. §14's two-player requirement has **no guaranteed environment at all** — one iPad, no second client (ASM-010, Q-012).

Version target is closed: iPad 1.26.51, `min_engine_version [1,26,50]`, `@minecraft/server` 2.10.0 stable, BDS 1.26.51.1 in Docker, no Preview/Beta in the shipped packs. CTR-001 is resolved by decision; CTR-002 is moot.

## Current repository state

`main` @ `d54f361`, version **0.2.1**, carrying the pickaxe-era product and harness. **The Web Sword lands in this codebase, not beside it** — same BP/RP, same version target, same harness (ADR-010), which makes C-10 regression protection mandatory rather than optional.

## Where this analysis leaves the project

The design is settled enough to build **four of the six children today** — `L0-item` (minus its final catalogue freeze), `L0-once`, `L0-trap` and `L0-cool` all have a stated architecture, named rules and executable criteria. `L0-keep` is deliberately not buildable until Q-006 is answered. `L0-qatg` is buildable and is largely already built, since the harness predates the spec.

Four questions carry real rework cost if answered late: **Q-006** (provenance marker — four owners), **Q-007** (does enchantable-without-durability actually work on this build — the assumption the *shipped pickaxe* already encodes and nobody recorded the outcome of), **Q-014** (destroyed sword — recoverable?) and **Q-012** (how the two-player DoD test is actually run). Everything else is tuning.

## Related artifacts

`concept-intent` · `concept-boundary` · `concept-constraint` · `concept-entity` · `concept-assumption` · `concept-contradiction` · `concept-architecture-decision` · `concept-client-question` · `concept-decomposition-plan` · children `L0-item`, `L0-once`, `L0-keep`, `L0-trap`, `L0-cool`, `L0-qatg`


## Statistics

- **Total artifacts:** 221
- **concept-atomic:** 159 (274 KB)
- **concept-aggregate:** 24 (105 KB)
- **concept-special:** 6 (23 KB)
- **decision:** 9 (3 KB)
- **other:** 17 (58 KB)
- **raw:** 6 (16 KB)

### By level

- L0: 11 artifacts
- L1: 10 artifacts
- L2: 168 artifacts


_Analysis version: 2_
