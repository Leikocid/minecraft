---
type: "concept-assumption"
node_id: "L0-pntr-as08"
source_channel: "rollout"
analysis_version: 3
title: "AS-pntr-08 · Non-solid breakables are removed too"
aliases: ["L0-pntr-as08"]
is_a: ["assumption"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 686
tags: ["title:AS-pntr-08 · Non-solid breakables are removed too", "is_a:assumption", "CAN_ASSUME", "relates_to:L0-pntr-r003", "relates_to:L0-xasm6"]
level: 2
---
# AS-pntr-08 · Non-solid breakables are removed too

**Gap.** §9 speaks of destroying "all **solid** blocks a Survival player can break", and also says chests, spawners "and other destructible blocks" are destroyed.

**Assumption (CAN_ASSUME).** Everything that is not air, liquid or on the `xasm6` keep list is removed, including non-solid blocks such as torches, flowers, grass, snow layers, cobwebs, rails, carpets, signs and item frames. This matches `xasm6`'s "everything else is removed" and gives a clean shaft.

**Impact if wrong.** If only full solids should go, the classifier needs a solidity test. There is no stable query for it, so a second list would be needed. Cosmetic.
