---
type: "concept-acceptance-criterion"
node_id: "L0-cool-ac04"
source_channel: "rollout"
aliases: ["L0-cool-ac04"]
part_of: ["L0-cool"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 374
tags: ["acceptance-criterion","cooldown","edge-case","L0-cool"]
level: 2
---

**AC-COOL-4.** GIVEN a player's Web Sword use attempt fails reach validation (no valid target, or target out of range), WHEN the failed attempt is evaluated, THEN `start()` is never called, no cooldown is started, and any pre-existing cooldown timer for that player is left exactly as it was.

Source: §5 — *«cooldown не запускается»*; §12 edge case. Grounded in R-cool-002.
