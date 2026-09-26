---
type: "concept-rule"
node_id: "L0-infr-r006"
source_channel: "rollout"
analysis_version: 2
title: "Rule: statistical chunk-roll checks measure `strf`'s roll, they don't implement it"
aliases: ["L0-infr-r006"]
is_a: ["rule"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 1298
tags: ["is_a:rule", "relates_to:L0-adr-strc", "relates_to:L0-infr-p006", "relates_to:L0-xq2", "v2-delta"]
level: 2
---
# Rule: statistical chunk-roll checks measure `strf`'s roll, they don't implement it

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-strc", "L0-infr-p006", "L0-xq2"]`

The `bds`/GameTest lane drives `strf`'s deterministic roll formula (`hash(worldSalt, dim, cx, cz, structureId) < chance`, `L0-adr-strc`) over a large synthetic sample of chunk coordinates and asserts the observed success rate lands inside a tolerance band of the configured per-structure constant (1 % Windmill, 2 % Airship, 5 % Warden City/Bastion — pending confirmation, `L0-xq2`). Neither the sample size nor the tolerance is specified by any raw source; infra picks both (`L0-infr-as03`) and must pick them large/wide enough that the check doesn't flake on a correct roll implementation, and tight enough that a broken roll (wrong constant, wrong hash) still fails reliably.

Infra owns only this measurement harness. It does not own, and must not reimplement, the roll formula, `worldSalt` generation, or the chance-constants table — those live in `strf`'s config (`L0-adr-strc` consequences). If the harness's own copy of the formula drifts from `strf`'s, the check would silently validate the wrong thing; the harness must call `strf`'s roll function directly rather than reproducing the hash.
