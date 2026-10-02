---
type: "concept-rule"
node_id: "L0-sauc-r004"
source_channel: "rollout"
analysis_version: 5
title: "R-sauc-4 · One shoot-down per event: a harmless blast, the reward exactly once, and a broadcast naming the charge owner"
aliases: ["L0-sauc-r004"]
is_a: ["rule"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1305
tags: ["is_a:rule", "shoot-down", "reward", "C-7", "relates_to:L0-sauc-p002", "relates_to:L0-sauc-ad03"]
level: 2
---
# R-sauc-4 · One shoot-down per event: a harmless blast, the reward exactly once, and a broadcast naming the charge owner

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p002", "L0-sauc-ad03", "L0-sauc-as03", "L0-ufoc"]`

**Rule** (UFO §8, AC-15; priority (1), C-7):
1. **First crossing wins.** Only the first charge to satisfy `r001` triggers the shoot-down. It is latched on `eventId`. Later crossings are absorbed but produce no second reward, broadcast or `reportShotDown`.
2. **The blast is harmless:**
   - no `createExplosion` (even `breaksBlocks: false` deals entity damage);
   - no block is changed;
   - no entity takes damage or knockback;
   - no fire.

   It is only particles plus the `random.explode` sound.
3. **The reward** is exactly `minecraft:diamond × 8` and `minecraft:totem_of_undying × 1`, as two item entities at the blast point. It is spawned once per `eventId`, never on a departure, a `stop` or a restart.
4. **The broadcast** goes to every online player: `andrew.ufo.shot_down` = RU "%s сбил НЛО!" / EN "%s shot down the UFO!". `%s` is the **owner of the absorbed charge** (`attack.ownerId`), not the closest player and not the event target.
5. **The schedule** is the next arrival at 15 min after the shot, set by `ufoc` from `reportShotDown`.
