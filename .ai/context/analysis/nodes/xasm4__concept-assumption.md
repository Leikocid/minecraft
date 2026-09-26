---
type: "concept-assumption"
node_id: "L0-xasm4"
source_channel: "rollout"
analysis_version: 2
title: "Assumption (CAN_ASSUME) — Vanilla behaviour already satisfies several spec lines"
aliases: ["L0-xasm4"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1590
tags: ["title:Vanilla defaults cover axes, spawner light and Nether support", "alias:L0-xasm4", "is_a:assumption", "kind:CAN_ASSUME", "relates_to:L0-wind", "relates_to:L0-airs", "relates_to:L0-bast", "relates_to:L0-wrdn", "see_also:fourstructuresspecruencopy"]
level: 1
---
# Assumption (CAN_ASSUME) — Vanilla behaviour already satisfies several spec lines

1. **Vindicator with an iron axe** (§4.3, §5.3). Bedrock Vindicators always spawn holding an iron axe, so a plain `mob_spawner` with `minecraft:vindicator` meets the rule. No script equipment is needed.
   *Impact if wrong:* `strf` must hook `entitySpawn` near the instance's spawner and equip the axe. That needs a stable equipment API (`EntityEquippableComponent`, which may be limited for non-player mobs).
2. **Light suppression** (§2, §4.3, §5.2). Vanilla spawner light rules apply unchanged. Templates keep a light level ≤ the Bedrock threshold within ~4 blocks of each spawner. Lamps/lanterns sit only outside that radius.
   *Impact if wrong:* spawners stay idle. BDS test 18 catches it.
3. **Nether "suitable surface"** (§14.2). A Bastion candidate is valid when a solid, non-lava floor supports ≥ 80 % of the 20×20 footprint at some Y between the lava sea level (31) and 110. Placement replaces netherrack/air inside the footprint. It is never above bedrock ceiling Y 122.
   *Impact if wrong:* different density or look. Measured by test 51/52.
4. **"Flat enough" site** (§4.6). The height spread across the ~35×35 plot is ≤ 3 blocks, and ≤ 5 % of samples are water/lava. Normal Windmills never terraform.
   *Impact if wrong:* the 1 % rate is measured lower or higher. Tune the constant.
5. **Surface point on land** (§13.2–13.3). The Warden City's surface check uses `getTopmostBlock` at the centre and 8 ring points, all non-liquid. The marker is placed on the topmost solid, non-leaf block.
