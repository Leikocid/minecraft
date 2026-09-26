---
type: "concept-assumption"
node_id: "L0-strf-as02"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — What counts as a \"significant part\" of the footprint over water"
aliases: ["L0-strf-as02"]
is_a: ["assumption"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 788
tags: ["is_a:assumption", "can-assume", "validity", "relates_to:L0-airs"]
level: 2
---
# Assumption (CAN_ASSUME) — What counts as a "significant part" of the footprint over water

**Gap.** §5.4: "Если значимая часть footprint находится над открытой водой, позиция непригодна". No number is given.

**Assumption.** For the Airship, more than 10 % of the footprint's surface samples being liquid makes the site invalid. The Windmill uses 5 % (`L0-xasm4` §4), because it sits on the ground and its fields need dry soil. Warden City: 0 % at the centre and the 8-point ring (`L0-xasm4` §5). All three are constants in the def table.

**Impact if wrong.** At 10 %, an Airship may hover over a small pond or a stream edge. If the client means "any water", set it to 0. Airship density along rivers drops slightly. Test 31 still passes either way because it uses open ocean or river.
