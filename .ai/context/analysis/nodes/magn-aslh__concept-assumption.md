---
type: "concept-assumption"
node_id: "L0-magn-aslh"
source_channel: "rollout"
analysis_version: 5
title: "magn-aslh · Holders that contain a legendary are skipped, not pulled with it"
aliases: ["L0-magn-aslh"]
is_a: ["assumption"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 779
tags: ["is_a:assumption", "CAN_ASSUME", "status:assumed", "relates_to:L0-lgnd", "relates_to:L0-magn-rleg"]
level: 2
---
# magn-aslh · Holders that contain a legendary are skipped, not pulled with it

**Assumption.**
- UFO §5 pulls a chest or hopper minecart "whole", and an armour stand with iron armour is pulled.
- §4 and AC-13 say a legendary is "never pulled, wherever it lies".
- Reading: a class 3 holder whose inventory, or whose hand or armour slots, holds a legendary is **not selected**.
- The check uses the minecart's `minecraft:inventory` container and `hasitem` on `andrew:*` legendary ids for armour stands and mobs.

**Impact if wrong.** If the operator wants the holder pulled with the legendary inside, `lgnd`'s watching of moved holders (the `lgnd` v4 delta) becomes load-bearing, and AC-13 changes to "never separated from its holder". This costs one extra rule plus a GameTest.
