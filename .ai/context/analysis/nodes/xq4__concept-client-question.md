---
type: "concept-client-question"
node_id: "L0-xq4"
source_channel: "rollout"
analysis_version: 2
title: "Q-L0-4 · The spec says a Windmill always appears near spawn. What if the world starts on a tiny island or in the middle of the ocean?"
aliases: ["L0-xq4"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1070
tags: ["title:Spawn Windmill when there is no dry land near spawn", "SHOULD_ASK", "non-blocking", "reduce", "relates_to:L0-wind", "relates_to:L0-strf", "relates_to:L0-airs", "relates_to:L0-wind-cx01", "relates_to:L0-adr-spwn"]
level: 1
---
# Q-L0-4 · The spec says a Windmill always appears near spawn. What if the world starts on a tiny island or in the middle of the ocean?

**Links:** `is_a: ["client-question"]` · `relates_to: ["L0-wind", "L0-strf", "L0-airs", "L0-wind-cx01", "L0-adr-spwn"]`

**Context.** The spec asks for a guaranteed Windmill near spawn, built on dry land, and it must never damage other structures. On some seeds there is no suitable dry spot near spawn. The spec does not say what to do then.

**Options.**
- **(a)** No spawn Windmill in that world, and the server log says why. *This is the current default.*
- **(b)** Build it anyway on the "least wet" spot, filling shallow water (up to about 3 blocks deep) as part of preparing the site.
- **(c)** Search further than 500 blocks. This means a longer wait when the world is first created.

**Blocking?** No. Normal seeds are not affected, and the tests use normal seeds.

**Why at L0.** The answer changes a constraint-level rule (the one-time spawn search, `L0-adr-spwn`), and on the Windmill it also changes the linked Airship.
