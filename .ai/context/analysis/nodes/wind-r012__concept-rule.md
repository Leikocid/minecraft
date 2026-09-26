---
type: "concept-rule"
node_id: "L0-wind-r012"
source_channel: "rollout"
analysis_version: 2
title: "Rule: every Windmill triggers exactly one linked-Airship attempt"
aliases: ["L0-wind-r012"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1021
tags: ["is_a:rule", "linked-airship", "relates_to:L0-airs", "relates_to:L0-strf-r002", "relates_to:L0-wind-p004", "relates_to:L0-wind-cx02"]
level: 2
---
# Rule: every Windmill triggers exactly one linked-Airship attempt

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-airs, L0-strf-r002, L0-wind-p004, L0-wind-cx02]`

**Source:** §5.6, §7 bullet 4, test 33.

- Every Windmill instance — normal and spawn — requests one linked Airship from `airs` in its `afterInit` hook, after chests and guards.
- **Once:** the attempt is recorded in `InstanceRecord.x.linkedTried` with its outcome. It is never repeated, whether it placed an Airship or found no valid site.
- **Not satisfied by others:** an independent 2 % Airship already within 100 blocks does not count; two nearby Windmills each request their own; linked Airships are not merged or deduplicated.
- `wind` passes only the parent (id, centre, plot AABB). Ring 40–100 blocks from the Windmill centre, "not over the Windmill/fields", validity, altitude, and "no widening beyond 100" belong to `airs`.
- The linked attempt does not consume any chunk's independent Airship roll (`L0-strf-r002` §6).
