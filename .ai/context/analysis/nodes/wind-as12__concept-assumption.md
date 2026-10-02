---
type: "concept-assumption"
node_id: "L0-wind-as12"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — a naturally valid Windmill sits at the plot's modal surface Y, and the template's foundation skirt absorbs Δ ≤ 3"
aliases: ["L0-wind-as12"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 882
tags: ["is_a:assumption", "CAN_ASSUME", "placement", "relates_to:L0-wind-p001"]
level: 2
---
# Assumption — a naturally valid Windmill sits at the plot's modal surface Y, and the template's foundation skirt absorbs Δ ≤ 3

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-p001, L0-wind-e001, L0-strf-r005]`

- The template carries 3 layers of natural-looking subsoil under the plot, so on terrain varying by up to 3 blocks no field cell floats and no wall is buried more than 3 blocks. This is part of the fixed template, not script terraforming, so §4.6 "не выравнивать" holds.
- Terrain above the plot surface inside the footprint (hills ≤ 3, trees) is overwritten by the template's air layers — the same effect as every discovery-time placement (`L0-adr-strc` §6).
- **Impact if wrong:** low-medium. If the client reads any tree removal as "levelling", the `flat` profile must also reject trees in the plot, cutting the 1 % yield further.
