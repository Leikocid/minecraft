---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac12"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-ac12"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 475
tags: ["is_a:acceptance-criterion", "verify:repo", "deviation-report", "dod"]
level: 2
---
**AC-strf-12 · The deviation report and probe results exist and agree** (`L0-strf-r012`, `-p006`; §11 DoD)

GIVEN the structures stage is being closed, WHEN the gate runs, THEN `docs/structures/probe-results.md` lists items 1–11 with PASS/FAIL/N/A, `docs/structures/deviations.md` contains entries DEV-STRF-01 (discovery-time generation) and DEV-STRF-02 (heuristic collision), and every FAIL has a deviation entry that references it.
**Verify:** repo check (script) + review.
