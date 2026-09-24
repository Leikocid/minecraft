---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac09"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-09 — Escape after a hit gives a full 30 s cooldown (§8 test 9)"
aliases: ["L0-sprj-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 623
tags: ["is_a:acceptance-criterion", "channel:bds", "spec-test:9"]
level: 2
---
# AC-sprj-09 — Escape after a hit gives a full 30 s cooldown (§8 test 9)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r005", "L0-sprj-ad01", "L0-lgnd"]` · channel: `bds`

**GIVEN** a volley where exactly one projectile has hit,
**WHEN** the target is then moved 25 blocks from `launchPoint`,
**THEN** the remaining projectiles are `GONE` the same tick, the outcome is `ESCAPED_AFTER_HIT`, busy is false, **AND** `cooldown.remaining(owner, "scythe")` is 30 s ± 1 tick measured from that tick, **AND** a Use at +29 s is refused while a Use at +30.1 s selects a target again.
