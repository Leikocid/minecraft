---
type: "concept-glossary-term"
node_id: "L0-once-gadm"
source_channel: "rollout"
aliases: ["L0-once-gadm"]
part_of: ["L0-once"]
is_a: ["glossary-term"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1073
tags: ["glossary-term","creative","give","admin","L0-once"]
---

**Admin Copy** / **Test Copy** (RU: «Creative/test copies», §4)

A `andrew:web_sword` instance obtained via `/give` or a Creative-mode craft. §4 permits these to exist in **unbounded number** and explicitly places them outside the one-per-world rule: *«one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

Admin copies exist so the weapon can be tested on a live world without burning the world's single craft. Without them the feature would be untestable.

**Critical property — indistinguishability.** The spec specifies no owner tag, serial, or provenance marker, so an admin copy is byte-identical to the survival-crafted sword. This component does not need to tell them apart (R-007 forbids count-based gating), but `L0-keep`'s death-retention logic does — which is exactly why **CTR-005** is open and rated High. If the owner mandates a provenance marker, the natural write point is the first-craft process (`L0-once-pcft` step 5), but the marker and its ledger belong to `L0-keep`.

**Synonyms:** dev copy, `/give` copy, operator copy.
