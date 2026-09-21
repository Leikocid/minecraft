---
type: "concept-contradiction"
node_id: "L0"
source_channel: "rollout"
title: "Contradictions"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["contradiction"]
relates_to: ["L0"]
analysis_version: 2
level: 0
priority: 510
size_chars: 8425
tags: ["contradiction","open","web-sword","reduce","register","L0","target:L0","resolved"]
closed_at: 2026-09-21
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0
---

# Contradictions

**Links** — `title: Contradictions` · `aliases: ["L0-contradiction", "Contradictions"]` · `part_of: ["L0"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]` · `supersedes: ["L0"]`

This is the **register** after reduce: one canonical number per contradiction across the whole tree, with the current disposition of each. Full text of a child-raised contradiction lives in the child artifact named in the table; L0 restates only what it resolved or escalated.

## Canonical numbering — three collisions repaired at reduce

Children cannot see each other, and three of them independently reached for the same next-free numbers. The collisions were repaired in place (L0 is the author of all of them) and the child artifacts now carry a renumbering note.

| Filed as | Raised by | Canonical | Artifact |
|---|---|---|---|
| CTR-006 | `L0-once` | **CTR-006** (kept) | `once__concept-contradiction` |
| CTR-006 | `L0-keep` | **CTR-009** | `keep-ctr006__concept-contradiction` |
| CTR-007 | `L0-trap` | **CTR-007** (kept) | `trap-ct07__concept-contradiction` |
| CTR-007 | `L0-qatg` | **CTR-010** | `qatg-ctr1__concept-contradiction` |
| CTR-008 | `L0-trap` | **CTR-008** (no collision) | `trap-ct08__concept-contradiction` |

Numbers were assigned by the decomposition plan's child order (`item → once → keep → trap → cool → qatg`), keeping the earlier child's claim. **This is a labelling defect, not a semantic one** — no two of these describe the same disagreement. It is recorded rather than silently fixed because the same collision will recur on the next run unless the numbering authority moves to L0, which is the only vantage point that can see it.

## Register

| # | Title | Target | Severity | Status after reduce |
|---|---|---|---|---|
| CTR-001 | Version target fixed and unknown at once | `L0` | — | **Closed** 2026-09-20 by decision |
| CTR-002 | Stage 0 / Stage 1 both claim to be *the* compatibility probe | `L0` | — | **Moot** — both stages shipped |
| CTR-003 | *«Без потери ингредиентов»* is required, hedged, and untested | `L0-once` | Medium | **Open** — owner must rank (Q-008) |
| CTR-004 | Spec is standalone and depends on a framework that does not exist | `L0-cool` | Medium | **Resolved in design** — ADR-007's seam; Q-009/Q-010 still confirm |
| CTR-005 | Anti-dup and admin copies cannot both hold without instance provenance | `L0-keep` | **High** | **Open — blocking.** Structurally answered by ADR-016, still needs Q-006 |
| CTR-006 | Craft budget spent irreversibly, sword destructible | `L0-once` | Medium | **Open** — owner must rule (Q-014) |
| CTR-007 | Success predicate straddles the `L0-trap` / `L0-cool` line | `L0` | Low-Med | **Resolved** by ADR-017 |
| CTR-008 | §5 and §6 disagree about a zero-cell activation | `L0-trap` | Medium | **Open** — owner must rule (Q-017) |
| CTR-009 | Provenance marker has no owner under the two-way state rule | `L0` | Medium | **Resolved** by ADR-016 |
| CTR-010 | §14 names three dup vectors; C-7/§4/§12 name four | `L0-qatg` | Medium | **Resolved** by ADR-018 — four-vector reading adopted |

Six remain open. **Only CTR-005 blocks work**; the other five block a decision, not a keyboard.

## Resolved at reduce

**CTR-007 → ADR-017.** The decomposition plan said *"`L0-cool` owns everything after success"*; ADR-006 put a cooldown check *inside* the success predicate. Both children independently implemented the same reading — `L0-cool` exposes a non-mutating `isReady()`, `L0-trap` calls it and never writes the timer — and neither would adopt it unilaterally because amending the plan is L0's call. L0 adopts it and amends ownership rule 3. The knock-on (§13 test 9 claimed from both sides) is settled by ADR-018's split-claim list.

**CTR-009 → ADR-016.** The provenance marker CTR-005 asks for is a *third* piece of durable state, written in `L0-once`'s handler and read only by `L0-keep`, and the plan's two-way partition had no slot for it. L0 amends ownership rule 2 to a producer/consumer split with the definition owned by the consumer — the same shape already used for localization. Conditional on Q-006: if the owner refuses the marker, this dissolves and `L0-keep` narrows instead.

**CTR-010 → ADR-018.** §14's DoD sentence is treated as elliptical rather than as a deliberate narrowing; the gate requires restart-dup evidence. The stricter reading costs nothing and the laxer one permits exactly the "false green" `L0-qatg` names as its top risk. No owner input needed.

**CTR-004 → resolved in design, not escalated.** `L0-cool` closes it locally with ADR-007's ability-key seam rather than waiting for the framework §12 assumes. Q-009 and Q-010 remain open as confirmations of provisional positions, not as blockers.

## Still open and escalated to the owner

**CTR-005 (High) — the one that blocks.** Death retention must return *the owner's* sword while Creative/`/give` copies may exist in unlimited numbers and the spec specifies **no way to tell instances apart**. All three readings break something stated; only "retain marked instances" satisfies §4 and §14 together, and it requires a spec addition. Reduce raises its priority further: this is not a `L0-keep` question. It shapes `L0-keep`'s ledger, supplies the only bounded answer to CTR-006, is written inside `L0-once`'s handler, changes two of `L0-keep`'s acceptance criteria, and determines whether `L0-item`'s catalogue needs retention keys (ADR-019). **One question, four owners** → Q-006.

**CTR-003 (Medium).** Ingredient preservation is the only requirement in the spec with a built-in escape clause and the only one with no acceptance test — so "eats a Diamond Sword per blocked attempt" passes §13 and §14 as written. → Q-008.

**CTR-006 (Medium).** The spec invests §4, §12, ADR-008 and a High-severity contradiction in guaranteeing the sword survives *death*, then pairs it with a write-once budget that makes the sword unrecoverable from lava, the void or `/clear`. Either its existence matters — in which case this is a gap of the same kind §4 closes — or it does not, in which case §4's machinery is disproportionate. Reachable terminal state: a running server with a spent budget and zero obtainable Web Swords. → Q-014.

**CTR-008 (Medium).** A valid, in-reach target whose entire 27-cell volume is skipped. §6 reads it as the extreme of normal partial skipping (success, cooldown consumed); §5 and §8 price the cooldown against *«успешного создания ловушки»* (failure, cooldown free). Reachable in ordinary play — Nether bedrock floor, build ceiling, a wall of chests — and no §13 test covers it, so whichever is implemented ships unexamined. → Q-017.

## Considered at reduce and **not** filed

- **`L0-qatg` reporting five §13 tests as having no published criteria.** They had been published before `L0-qatg` wrote. A stale reading of a moving tree by an artifact I authored in this same run — **reconciled in place** (`qatg__concept-component`, `qatg-ent2__concept-entity`), not filed. Per the reduce rules, a within-run disagreement between my own artifacts gets fixed, not escalated.
- **Three §13 rows with two claimed owners.** Each is a §13 line that bundles two claims, and both `L0-trap` ACs anticipated the double mapping and asked `L0-qatg` to reconcile rather than flag. Settled as a rule (ADR-018), not a conflict.
- **The CTR / Q number collisions themselves.** A labelling defect with no semantic content. Repaired and documented above; filing it as a contradiction would confuse a process problem with a spec problem.
- **`L0-item` appearing first in build order while closing last.** Two true statements about different things (start time vs. freeze time). Recorded as ADR-019.
- **Four children independently choosing dynamic properties.** Agreement, not disagreement. Frozen as ADR-020 so it stays true.
- **Carried from decompose, still not filed:** `min_engine_version [1,26,50]` vs target 1.26.51 (a floor, as the decision prescribes); pickaxe spec's 2.9.0/1.26.0 vs shipped 2.10.0/1.26.50 (superseded by decision); v1's *«Stage 2 requirements not formulated»* vs this spec (supersession by new input); shard overlap across `part-1/2/3` (an import artefact); infinite durability vs enchantability (an unverified engine claim — ASM-005/Q-007, an open question, not a filing).
