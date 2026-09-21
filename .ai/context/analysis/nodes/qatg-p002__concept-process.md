---
type: "concept-process"
node_id: "L0-qatg-p002"
source_channel: "rollout"
title: "Process — Evaluate the Release Gate"
aliases: ["L0-qatg-p002"]
part_of: ["L0-qatg"]
is_a: ["process"]
relates_to: ["L0-qatg-ent3", "L0-qatg-r003", "L0-qatg-r004", "L0-qatg-r005"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2375
tags: ["process","release-gate","dod","L0-qatg"]
---

# Process — Evaluate the Release Gate

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["process"]` · `relates_to: ["L0-qatg-ent3", "L0-qatg-r003", "L0-qatg-r004", "L0-qatg-r005"]` · `spec: ["§14"]`

**Trigger.** A Web Sword release candidacy check — explicitly requested, not run automatically per commit (that is `L0-qatg-r003`'s continuous regression check, a different, lighter-weight process).

**Goal.** Produce a single PASS/BLOCKED verdict for `L0-qatg-ent3` (the DoD gate) with named reasons for any BLOCKED subgate.

## Steps

1. **Run the regression floor first** (`L0-qatg-r003`): `npm test` (7 suites), `bds:check`, `bds:gametest` against the pre-Web-Sword baseline behaviour. Any red here is an immediate BLOCKED, independent of the rest — do not evaluate the DoD subgates at all until this is green (cheapest check first).
2. **Refresh the Acceptance Matrix** (`L0-qatg-p001`). If `pending_artifact_count > 0` or either gap counter is nonzero, BLOCKED with the specific rows named.
3. **Evaluate `imports_clean`**: `bds:check` load log shows the Web Sword packs loaded with zero content/dependency errors.
4. **Evaluate `all_ats_pass`**: every `L0-qatg-ent2` row is `green`, and the multiplayer evidence condition (`L0-qatg-r002`) holds for AT-12.
5. **Evaluate `no_known_dup`**: dup-cycle evidence exists for all four vectors (`L0-qatg-r005`) — craft (`L0-once`), death (`L0-keep`), reconnect (`L0-keep`), restart (`L0-once` + `L0-keep` jointly).
6. **Evaluate `no_preview_dependency`**: `manifests.test.mjs` confirms no Beta dependency in `packs/behavior`/`packs/resource` manifests (`L0-qatg-r004`).
7. **Derive `module_ready`** from steps 3–6. Report PASS only if all four are true; otherwise BLOCKED with the failing subgate(s) named.

## Edge cases

| Case | Behaviour |
|---|---|
| Regression floor green, but an unrelated pre-existing red test | Still BLOCKED per `L0-qatg-r003` — the rule is unconditional, this component does not triage whether the regression is "related" |
| All four DoD subgates true, but two-player evidence was simulated-only (Q-012 unresolved) | PASS may still be reported per the recommended answer (`L0-qatg-asm1`), but the verdict must record which evidence path was used |
| A subgate flips from true to false between two runs (flaky GameTest) | Re-run once; a second red is authoritative — no averaging |
