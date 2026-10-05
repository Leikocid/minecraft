---
type: "concept-rule"
node_id: "L0-lgnd-r011"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-r011"]
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 757
tags: ["rule", "Q-014", "Q-020", "craft-right"]
level: 2
---
---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r002"]
---
**R-lgnd-011: Returning an item never reopens the craft right.**

Source: Q-014 (destroying the only sword does not give back the craft right), refined by Q-020 default (a): *returning the item ≠ reopening the craft right*.

- Loss return (`L0-lgnd-p003`) and death retention (`L0-lgnd-p002`) never write `andrew:<p>_crafted`.
- An instance that is not returned (for example removed by `/clear` or `/kill`, which are operator actions and not "ordinary means") leaves the budget spent. The operator remedy stays `reset <weapon>`.
- This applies to the Web Sword too. It changes shipped behaviour (lava and the Void used to destroy the sword for good), under Q-020 (a).
