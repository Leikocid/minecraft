---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac03"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-03 · Destroyed or replaced plates do not teleport; the use after a trip is a normal cast (§8 bullet 3)"
aliases: ["L0-pear-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1189
tags: ["v11", "pearl-rod", "acceptance", "bds", "spec-8.3"]
level: 2
---
# AC-pear-03 · Destroyed or replaced plates do not teleport; the use after a trip is a normal cast (§8 bullet 3)

**Relates to:** L0-pear-ru01, L0-pear-ru03, L0-xcx34.

**`bds`:** each case starts with a bound rod.
- **Destroyed:** the plate is broken by the sim player → the use teleports nobody, the record is cleared, the message is "plate gone or replaced", and no hook survives the use (`L0-adr-prcn`).
- **Replaced, same type, observed:** the plate is broken and re-placed by a player → the same result.
- **Replaced by explosion:** TNT is detonated next to the plate, then the plate is re-placed → the same result.
- **Replaced, different type:** `/setblock` stone plate → oak plate → the same result.
- **After success:** a successful trip, then a second use → a vanilla hook spawns (the cast is not cancelled) and there is no teleport.
- **Negative control** (the permutation is ignored): a zombie stands on the plate (redstone_signal > 0) at use time → the teleport succeeds.
- **Recorded limitation** (scenario asserts the documented behaviour): `/setblock` to the **same** type → the teleport succeeds, marked as the `xcx34` limitation.

**`ipad`:** the failure messages read clearly in both languages.
