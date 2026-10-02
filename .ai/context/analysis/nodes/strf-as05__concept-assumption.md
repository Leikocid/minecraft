---
type: "concept-assumption"
node_id: "L0-strf-as05"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — Dynamic-property budget"
aliases: ["L0-strf-as05"]
is_a: ["assumption"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 788
tags: ["is_a:assumption", "can-assume", "dynamic-properties", "probe"]
level: 2
---
# Assumption (CAN_ASSUME) — Dynamic-property budget

**Gap.** World dynamic properties have per-key and total size limits that the spec and code do not record for 2.10.0.

**Assumption.** One string property holds at least 32 000 characters. The total world dynamic-property storage is large enough for ~1 000 region shards of ≤ 10 KB, which covers a 1 000 × 1 000-chunk explored area per dimension. The registry only grows with explored area, not with time.

**Impact if wrong.** If the per-key limit is much smaller (e.g. 4 KB), shards split more (overflow keys, `L0-strf-e002`). If the total is capped, very large worlds stop generating new structures once the cap is near. The fail-safe is to stop generating rather than lose records, and to log it. Probe item 8 measures both limits.
