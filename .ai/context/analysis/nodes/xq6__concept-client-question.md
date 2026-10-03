---
type: "concept-client-question"
node_id: "L0-xq6"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "Q-L0-6 · Katana autopilot defaults to confirm"
aliases: ["L0-xq6"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1964
tags: ["v6", "katana", "non-blocking", "channel:ipad", "relates_to:L0-katn", "relates_to:L0-lgnd"]
---
---
title: "Q-L0-6 · Katana: confirm the autopilot defaults at the iPad acceptance (non-blocking)"
aliases: ["L0-xq6"]
is_a: ["client-question"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-lgnd", "L0-adr-ktgr", "L0-adr-ktob", "L0-xasm18", "L0-xasm19", "L0-xasm21", "L0-katn-as01", "L0-katn-as02", "L0-katn-as03", "L0-xcx11", "L0-xq3"]
see_also: ["L0-katn-ac09"]
---
# Q-L0-6 · Katana autopilot defaults to confirm

**Not MUST_ASK.** The build proceeds on each default. Each answer, if it overturns a default, changes one constant or one branch in the stated node. Ask these at the Katana iPad acceptance (`L0-katn-ac09` §6 already records the escape answer).

| # | Question | Default in force | If overturned |
|---|---|---|---|
| 1 | After TNT or cactus, is "the Katana comes back to you" acceptable instead of "it stays on the ground"? | Yes: three-tier C-16 reading (`L0-adr-ktgr` §1) | `lgnd`, all four weapons |
| 2 | Is losing a legendary that an armour stand holds when the stand falls into the Void acceptable? | Yes: documented deviation (`L0-adr-ktgr` §3) | `lgnd` probe task (`hasitem` re-issue) |
| 3 | Void return: to the crafter or to the last person who held it? | Crafter (`mark.owner`) as built; last holder proposed (`L0-adr-hold`, `L0-xq3`) | one line in `lost()`, all four weapons |
| 4 | May the Katana escape a Web Sword trap and the UFO magnet's hold? | Yes (`L0-xasm21`) | a new `lgnd` "rooted" predicate, raised as an L0 contradiction |
| 5 | Aiming further than 20 blocks: shortened jump, or no jump? | Shortened (`L0-xasm18`) | `katn` one branch |
| 6 | Tapping a block on the iPad: go toward the screen centre, or to the tapped block? | Screen centre (`L0-katn-as02`) | `katn` one branch |
| 7 | Landing in lava you aimed across: refused, step back to safe ground? | Yes; water is allowed (`L0-adr-ktob` §3, `L0-katn-as03`) | `katn` one constant |

Question 3 is the same as `L0-xq3`. Answering it once closes it for all four weapons.
