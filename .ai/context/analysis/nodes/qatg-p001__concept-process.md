---
type: "concept-process"
node_id: "L0-qatg-p001"
source_channel: "rollout"
title: "Process — Build the Acceptance Matrix"
aliases: ["L0-qatg-p001"]
part_of: ["L0-qatg"]
is_a: ["process"]
relates_to: ["L0-qatg-ent1", "L0-qatg-ent2", "L0-qatg-r001"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2216
tags: ["process","matrix","reduce","L0-qatg"]
---

# Process — Build the Acceptance Matrix

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["process"]` · `relates_to: ["L0-qatg-ent1", "L0-qatg-ent2", "L0-qatg-r001"]` · `spec: ["§13"]`

**Trigger.** Run whenever a sibling (`L0-item`, `L0-once`, `L0-keep`, `L0-trap`, `L0-cool`) publishes or updates its `concept-acceptance-criterion` artifacts, or on demand before a DoD evaluation.

**Goal.** Produce/refresh `L0-qatg-ent2` from the current state of sibling artifacts and the §13 text, with an accurate gap report.

## Steps

1. **Enumerate** the twelve §13 bullets in spec order, assigning stable `AT-1`..`AT-12` ids if not already assigned.
2. **Match** each bullet against the decomposition plan's declared owner (`L0` `concept-decomposition-plan`, child-scope table) — this is authoritative for *who should* own it, independent of whether an artifact exists yet.
3. **Search** each declared owner's published `concept-acceptance-criterion` artifacts for one that covers the bullet. Record the artifact id if found.
4. **Classify** each row: `claimed-no-artifact` (owner declared, no AC found), `specified` (AC exists), `green`/`red` (AC exists and has been executed with a result).
5. **Compute** `unclaimed_count` (bullets with no declared owner — should always be 0 per the decomposition plan; a nonzero value here is a contradiction to raise against `L0`, not a normal gap) and `duplicate_claim_count` (more than one sibling's AC claims the same bullet).
6. **Write** the refreshed `L0-qatg-ent2` snapshot and report `pending_artifact_count` upward — do **not** author a substitute AC for a pending row (`L0-qatg-r001`).

## Edge cases

| Case | Behaviour |
|---|---|
| A sibling's AC text covers **part** of a bullet (e.g. only the single-player half) | Row stays `claimed-no-artifact`-adjacent; note the partial coverage rather than rounding up to `specified` |
| Two siblings both plausibly own a bullet (AT-12) | Not a duplicate claim — the decomposition plan explicitly assigns AT-12 jointly to `L0-trap` + `L0-once`; the row records both |
| A declared owner has been re-scoped (contradiction resolved at `L0`) | Re-run step 2 against the updated decomposition plan before re-matching |
