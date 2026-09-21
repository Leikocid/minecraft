---
type: "concept-acceptance-criterion"
node_id: "L0-cool-ac01"
source_channel: "rollout"
aliases: ["L0-cool-ac01"]
part_of: ["L0-cool"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 415
tags: ["acceptance-criterion","cooldown","L0-cool"]
level: 2
---

**AC-COOL-1.** GIVEN a player successfully triggers the Web Sword ability (cobweb cube placed), WHEN they attempt to use the sword again within 30 seconds, THEN the ability does not trigger, no new cobweb is placed, and the player's cooldown record is unchanged by the failed attempt.

Source: §13 — *«После успешной способности повторное использование заблокировано 30 секунд.»* Grounded in R-cool-001, R-cool-002.
