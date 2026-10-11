---
type: "concept-client-question"
node_id: "L0-xq9"
source_channel: "rollout"
analysis_version: 9
title: "Q-L0-9 · Throw or dash: which gesture?"
aliases: ["L0-xq9"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 959
tags: ["v9", "above-water-trident", "non-blocking"]
level: 1
---
---
title: "Q-L0-9 · How should the player choose between throwing and dashing?"
aliases: ["L0-xq9", "Trident throw/dash question"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx28", "L0-adr-twrp", "L0-trdt"]
see_also: ["abovewatertridentspecv1ruen-part-1"]
---
# Q-L0-9 · Throw or dash: which gesture?

**To Andrey:** a vanilla trident with Riptide can't be thrown. Its release always dashes. Your trident has to do both, with no extra button. On the iPad, which gesture should do what?
1. **Crouched (sneak) + release = dash; standing release = throw.** This is the default we build.
2. In the air or in water = dash; on the ground = throw. You couldn't throw while swimming or jumping.
3. A short hold = throw, a long hold = dash.
4. Something else?

**Why it matters:** this is the one input the whole weapon hangs on. The answer changes only `src/trident/` input handling. Until then, option 1 ships and is noted on the acceptance sheet.
