---
type: "concept-rule"
node_id: "L0-strf-r001"
source_channel: "rollout"
analysis_version: 2
title: "Rule: every random choice in generation is a pure function of the world salt and the candidate key"
aliases: ["L0-strf-r001"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1204
tags: ["is_a:rule", "determinism", "anti-dup", "relates_to:L0-strf-p001"]
level: 2
---
# Rule: every random choice in generation is a pure function of the world salt and the candidate key

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- The chunk roll, rotation, Airship clearance, Warden City depth, and chest-fill seed all derive from `hash32(salt, dim, cx, cz, defId, purpose)`. Examples of `purpose`: `"roll"`, `"rot"`, `"clr"`, `"y"`. Per-instance values derive from `(salt, instanceId, purpose)`.
- `salt` is written once per world (`andrew:st:salt`) and never changes (C-6, C-7).
- `Math.random()` is forbidden in generation paths except for creating the salt. Guard spawn jitter may use it, because it has no effect on idempotency.
- The hash is a fixed, documented function (e.g. `xmur3`/`mulberry32` over a UTF-8 key string). It is unit-tested for uniformity: 100 k keys, χ² p > 0.01 at 100 buckets. The tests assert its output for three golden keys so a refactor cannot silently change existing worlds.

**Rationale.** Re-evaluating a chunk after a crash, a lost bit or a restart gives the same outcome, so duplicates are structurally impossible (§6, §11 "не создают копии структур"). Rates are measurable because rolls are independent and uniform (tests 23, 32, 41, 51).
