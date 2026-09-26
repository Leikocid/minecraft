---
type: "concept-assumption"
node_id: "L0-xasm3"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — What \"protected spawner\" and \"detected structure\" mean"
aliases: ["L0-xasm3"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1529
tags: ["title:Protected spawner and detected structure definitions", "alias:L0-xasm3", "is_a:assumption", "kind:CAN_ASSUME", "relates_to:L0-strf", "relates_to:L0-adr-strc", "see_also:fourstructuresspecruencopy"]
level: 1
---
# Assumption (CAN_ASSUME) — What "protected spawner" and "detected structure" mean

**Gap.** §2/§6/§9 cancel a candidate that intersects "обнаруженной ванильной структурой, другой пользовательской структурой или защищаемым спавнером". Neither term is defined, and stable APIs cannot query structures.

**Assumption.**
- *Protected spawner* = any `minecraft:mob_spawner` or `minecraft:trial_spawner` block inside the footprint plus a 2-block margin, whether vanilla or ours.
- *Detected custom structure* = any instance in the `strf` registry whose rotated AABB (plus a 2-block margin) intersects.
- *Detected vanilla structure* = the footprint probe finds signature blocks that do not occur naturally in that dimension/biome at that position. Examples: planks, cobblestone and doors on the surface (villages); sandstone/chiseled blocks (temples); rails/planks underground (mineshafts); stone bricks (strongholds); deepslate tiles/bricks, reinforced deepslate, sculk shrieker (ancient city); polished blackstone bricks and gilded blackstone (bastion); nether bricks (fortress); tuff bricks and copper (trial chambers); plus chests/barrels.
- Probing is a sparse grid (every 2–4 blocks) over the footprint volume, not a full scan (C-5b).

**Impact if wrong.** False negatives: a structure is cut through a vanilla one (§2 violation; listed in the deviation report). False positives: fewer structures generate, which lowers the measured rates in tests 23/32/41/51. The spawn Windmill is safe either way, because it keeps searching.
