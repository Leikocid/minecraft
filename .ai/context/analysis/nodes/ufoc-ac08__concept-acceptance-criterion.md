---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac08"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-8 · One interval and an idle cost near zero (C-5d)"
aliases: ["L0-ufoc-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 708
tags: ["is_a:acceptance-criterion", "performance", "C-5d", "channel:bds", "relates_to:L0-ufoc-ad02", "relates_to:L0-ufoc-r004"]
level: 2
---
# AC-ufoc-8 · One interval and an idle cost near zero (C-5d)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-ad02", "L0-ufoc-r004", "L0-xasm16"]`

- **GIVEN** `registerUfo()` has run, **THEN** a source check of `src/ufo/` finds exactly one `runInterval`, and no `runTimeout` or `runJob`.
- **GIVEN** no session for 2 000 ticks, **THEN** the environment seam's `now()` and the property store are read at most 20 times. Both are counted through spies.
- **GIVEN** a full real-duration event with stub consumers, **THEN** the measured mean cost of the `ufoc` step alone, excluding the consumers, is recorded in the task proof as an input to the `L0-xasm16` budget.
