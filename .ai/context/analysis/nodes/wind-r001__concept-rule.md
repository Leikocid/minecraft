---
type: "concept-rule"
node_id: "L0-wind-r001"
source_channel: "rollout"
analysis_version: 2
title: "Rule: one fixed Windmill template; only rotation varies"
aliases: ["L0-wind-r001"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1164
tags: ["is_a:rule", "template", "relates_to:L0-wind-e001", "relates_to:L0-adr-tmpl", "relates_to:L0-strf-r004"]
level: 2
---
# Rule: one fixed Windmill template; only rotation varies

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-e001, L0-adr-tmpl, L0-strf-r004, L0-strf-r011]`

**Source:** §2 bullets 2–3, §4.1, §4.4 ("процедурных вариантов поля нет"), §15.

1. There is exactly one Windmill template: building, rotor, plot, fields, paths, ditches, fence and decay are all baked in. No procedural fields, no variant buildings, no random decay at placement time.
2. The only per-instance variation is the seeded rotation 0/90/180/270, applied to the whole plot (`L0-strf-r004`).
3. Identity that must hold in every rotation: ~15×15 base, ~30 high; stone/cobble lower, wood upper, wooden roof; 4 fixed blades and one ordinary wooden door on the **same front face**; 3 full floors; one continuous interior staircase F1 → F3.
4. The normal route (door → F1 → stairs → F2 → F3 → every chest) needs no block breaking (§4.1). Alternative entry by breaking walls stays possible — nothing is protected (`L0-strf-r011`).
5. Allowed "ageing": fixed variants of stone/wood (mossy, cracked, stripped) inside the template, never removing route blocks (§4.2 last bullet).
