---
type: "concept-rule"
node_id: "L0-orbc-r013"
source_channel: "rollout"
analysis_version: 3
title: "Rule · Deviation notes live next to the code"
aliases: ["L0-orbc-r013"]
is_a: ["rule"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 842
tags: ["is_a:rule", "C-16", "deviations"]
level: 2
---
# Rule · Deviation notes live next to the code

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx8", "L0-xcx13", "L0-orbc-cx02", "L0-orbc-cx03", "L0-orbc-ad02"]`

The header of `src/orbital/README.md` or `src/orbital/index.ts` must list every stable-API compromise the core makes, each with its KV id (C-16). The list includes:
1. The item is a custom item with the rod icon, not a real fishing rod (`xcx13`).
2. LMB reach and the answer to `xq5` (`xcx8`).
3. The touch aim point (`cx02`).
4. Nether roof behaviour under the clamp (`cx03`).
5. The charge is script-teleported, not physics-driven, so it has no interpolation guarantee (`ad02`).
6. In-flight charges are lost on unload or restart (§11).
7. There is no stable "swing at nothing" event.

A task is not done until the list matches the shipped behaviour.
