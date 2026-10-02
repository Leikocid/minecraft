---
type: "concept-rule"
node_id: "L0-ufoc-r006"
source_channel: "rollout"
analysis_version: 5
title: "R-ufoc-6 · Enable flag and how commands affect the schedule"
aliases: ["L0-ufoc-r006"]
is_a: ["rule"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1058
tags: ["is_a:rule", "enable-flag", "command", "relates_to:L0-ufoc-as01", "relates_to:L0-ufoc-p004"]
level: 2
---
# R-ufoc-6 · Enable flag and how commands affect the schedule

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-as01", "L0-ufoc-ent1"]`

**Rule** (UFO §9; AC-17):
1. `andrew:ufo_enabled` defaults to true when absent. It is stored in the world and survives a restart.
2. While it is false, no scheduled arrival starts. The first-join write of `next_ms` still happens, so the first window is known once the event is enabled.
3. `disable` during a live event stops the event exactly like `stop`: everything held is released and the saucer is removed (`as01`).
4. `enable` with `next_ms` in the past pushes `next_ms` to now + 15 min, so re-enabling never drops a saucer the same second (`as01`).
5. `stop` ends the event, and the next arrival is set to now + 15 min. `stop` does not change the flag.
6. `come` ignores the flag and the schedule. When the event it starts ends, the usual +15 min rule applies (`r001`).
7. The commands run for operators only (`GameDirectors`). A non-operator invocation changes nothing.
