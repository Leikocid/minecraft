---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac17"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-lgnd-ac17"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 865
tags: ["v3-delta", "orbital-AC-1"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-lgnd-p001", "L0-lgnd-r002", "L0-adr-orbc"]
---
**AC-lgnd-17: The Orbital Cannon is a registered legendary with its own craft budget and refund (Orbital AC-1).** Channel: `build` + `bds`.

GIVEN `LEGENDARIES` contains `ORBITAL_CANNON` (`oc`, `orbital_cannon`, 600 ticks, `andrew:orbital`)
WHEN Survival player A crafts the Cannon
THEN one localized broadcast names A and "Orbital Cannon", and `andrew:oc_crafted` is set,
AND after a server restart, player B's Survival craft is refunded with exactly 4 TNT + 1 Fishing Rod, sends `andrew.orbital.craft_blocked`, and removes the result,
AND the Web Sword and Scythe flags are unchanged,
AND `/andrew:orbital reset` clears only `oc_crafted`,
AND `/andrew:orbital give B` yields an `origin: admin` stack without touching the flag.
