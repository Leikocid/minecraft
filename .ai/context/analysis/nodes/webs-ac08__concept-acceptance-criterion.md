---
type: "concept-acceptance-criterion"
node_id: "L0-webs-ac08"
source_channel: "rollout"
analysis_version: 2
level: 2
aliases: ["L0-webs-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 461
tags: ["acceptance-criterion", "channel:bds", "multiplayer"]
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001"]
---
**AC-webs-08 (channel: bds).** GIVEN two clients/SimulatedPlayers observing the same cast, WHEN the ability resolves, THEN both see an identical set of filled cells (server-authoritative geometry, no client-side divergence). Source: spec §9 (server-computed ability) and §13 test 12, scoped here to trap geometry specifically (craft/retention determinism is `L0-lgnd`'s).
