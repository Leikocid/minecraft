---
type: "concept-client-question"
node_id: "L0-xq8"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "Q-L0-8 · Should a shield stop the beam?"
aliases: ["L0-xq8"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 843
tags: ["v8", "storm-blade", "non-blocking"]
---
---
title: "Q-L0-8 · Should a shield stop the Storm Blade's beam?"
aliases: ["L0-xq8", "Storm Blade shield question"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-xcx27", "L0-strm"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# Q-L0-8 · Should a shield stop the beam?

**To Andrey:** a player holding a raised shield is hit by the Storm Blade's 10-block line. Should they:
1. block it completely, from any direction (needs extra code: drop the source, or check facing in script);
2. block it only when facing the wielder, as with a sword hit (native on Bedrock; what §02 "прочих стандартных защит" reads as; the default we build);
3. never block it? Armour still reduces it.

The same question applies to the passive +6 HP. Their shield is usually down when they are being meleed, so it rarely matters there.

**Non-blocking.** `strm` builds option 2 (native); no deviation.
