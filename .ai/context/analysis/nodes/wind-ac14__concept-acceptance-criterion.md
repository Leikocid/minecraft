---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac14"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-14 · Forced preparation levels the plot, blends the edges and leaves deep caves open"
aliases: ["L0-wind-ac14"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 562
tags: ["is_a:acceptance-criterion", "verify:bds", "verify:ipad", "site-prep"]
level: 2
---
# AC-wind-14 · Forced preparation levels the plot, blends the edges and leaves deep caves open

**Spec:** §4.7.9–12, §9.2–3.

GIVEN a test world (fixture) with no naturally valid site within 500 blocks and a cave under the best dry site
WHEN the spawn search completes
THEN `stage = 3`, `prepared = true`; the plot surface is one Y; in plot + band no adjacent-column step > 1 that was not natural
AND no field or building block is floating
AND open cave volume still exists deeper than D below the plot
AND (iPad) there is no square platform with vertical walls.
