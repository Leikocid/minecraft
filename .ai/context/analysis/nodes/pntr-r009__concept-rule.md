---
type: "concept-rule"
node_id: "L0-pntr-r009"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-r009"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 442
tags: ["title:Exactly one explosion sound per LMB", "is_a:rule", "relates_to:L0-pntr-p003", "source:orbital-§9", "ac:10"]
level: 2
---
**Rule R-pntr-9 · One sound.** Each LMB detonation plays exactly one main explosion sound. It plays at the detonation point, in the detonation tick, and before any removal. The removal job, the particle wave and block updates add no sounds of their own (Orbital §9: "no extra sounds along the wave"). Vanilla sounds caused by consequences, such as liquid flowing, sand landing or a mob falling, are not suppressed and do not count as "extra".
