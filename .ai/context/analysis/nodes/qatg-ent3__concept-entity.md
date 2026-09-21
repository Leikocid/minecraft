---
type: "concept-entity"
node_id: "L0-qatg-ent3"
source_channel: "rollout"
title: "Entity — Definition-of-Done Gate"
aliases: ["L0-qatg-ent3"]
part_of: ["L0-qatg"]
is_a: ["entity"]
relates_to: ["L0-qatg-ent2", "L0-qatg-ac01", "L0-qatg-ac02", "L0-qatg-ac03", "L0-qatg-ac04", "L0-qatg-ac05", "L0-qatg-p002"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1991
tags: ["entity","definition-of-done","release-gate","L0-qatg"]
---

# Entity — Definition-of-Done Gate

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["entity"]` · `relates_to: ["L0-qatg-ent2", "L0-qatg-ac01", "L0-qatg-ac02", "L0-qatg-ac03", "L0-qatg-ac04", "L0-qatg-ac05", "L0-qatg-p002"]` · `spec: ["§14"]`

The five §14 conditions, modelled as subgates that must **all** be true for the Web Sword to count as a "самостоятельный готовый модуль" ready for the next weapon. This is the entity `L0-qatg-p002` evaluates.

## Attributes / subgates

| Subgate | §14 condition | Evidence source | AC |
|---|---|---|---|
| `imports_clean` | No content/dependency errors on the stable Bedrock target | `bds:check` load log | `L0-qatg-ac01` |
| `all_ats_pass` | Every §13 test green, single-player **and** ≥2-player | `L0-qatg-ent2` rollup | `L0-qatg-ac02` |
| `no_known_dup` | No known dup path — craft, death, reconnect, **and restart** (`L0-qatg-r005`) | `L0-keep`/`L0-once` dup-cycle GameTests | `L0-qatg-ac03` |
| `no_preview_dependency` | No mandatory Experiments/Preview dependency in shipped packs | `manifests.test.mjs`, `L0-qatg-r004` | `L0-qatg-ac04` |
| `module_ready` | All of the above hold → treat as standalone-ready, proceed to next weapon | derived (all four above) | `L0-qatg-ac05` |

## Evaluation rule

`module_ready` is a **derived** subgate, not independently evidenced — it is true iff the other four are true. This mirrors §14's own structure, where the fifth bullet is a consequence ("после прохождения тестов... можно считать") rather than a sixth independent check.

## Boundary note

This gate is evaluated **once per Web Sword release candidacy**, not per commit. Per-commit protection against shipped-platform regression is `L0-qatg-r003`'s job and runs continuously (`concept-decomposition-plan`: *"`qatg` runs continuously rather than last, since the existing harness already gates every commit"*). The DoD gate is the final, higher bar layered on top.
