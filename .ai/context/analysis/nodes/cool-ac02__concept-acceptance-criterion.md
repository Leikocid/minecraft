---
type: "concept-acceptance-criterion"
node_id: "L0-cool-ac02"
source_channel: "rollout"
aliases: ["L0-cool-ac02"]
part_of: ["L0-cool"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 349
tags: ["acceptance-criterion","cooldown","L0-cool"]
level: 2
---

**AC-COOL-2.** GIVEN a player's Web Sword ability is on cooldown, WHEN exactly 30 seconds (600 ticks) have elapsed since the successful activation that started it, THEN `isReady` returns true and the next use attempt is allowed to proceed to targeting.

Source: §8 — *«Когда cooldown закончился, способность снова доступна.»* Grounded in R-cool-001.
