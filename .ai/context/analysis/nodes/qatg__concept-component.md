---
type: "concept-component"
node_id: "L0-qatg"
source_channel: "rollout"
title: "Verification, Acceptance & Definition of Done"
aliases: ["L0-qatg"]
part_of: ["L0"]
is_a: ["component"]
relates_to: ["L0-item", "L0-once", "L0-keep", "L0-trap", "L0-cool"]
analysis_version: 2
level: 1
priority: 510
size_chars: 6597
tags: ["component","verification","acceptance","dod","release-gate","web-sword","L0-qatg"]
needs_rebuild_marked_at: 2026-09-21T21:27:45.355Z
---

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
