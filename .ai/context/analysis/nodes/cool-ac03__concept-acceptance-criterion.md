---
type: "concept-acceptance-criterion"
node_id: "L0-cool-ac03"
source_channel: "rollout"
aliases: ["L0-cool-ac03"]
part_of: ["L0-cool"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 352
tags: ["acceptance-criterion","actionbar","localization","L0-cool"]
level: 2
---

**AC-COOL-3.** GIVEN a player is holding `andrew:web_sword` and it is on cooldown, WHEN an actionbar render tick runs, THEN the actionbar shows the remaining time as a localized (RU and EN, per client locale) string sourced from a translate key in `L0-item`'s catalogue — never a hardcoded literal.

Source: §8, §10. Grounded in R-cool-004, R-cool-005.
