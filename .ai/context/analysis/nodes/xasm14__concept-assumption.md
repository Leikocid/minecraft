---
type: "concept-assumption"
node_id: "L0-xasm14"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "ASM-L0-14 · \"First join\" means the first join after the UFO version is installed; Adventure players are pulled like Survival"
aliases: ["L0-xasm14"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1272
tags: ["CAN_ASSUME", "status:assumed", "relates_to:L0-ufoc", "relates_to:L0-magn", "v4"]
---
---
title: "ASM-L0-14 · \"First join\" means the first join after the UFO version is installed; Adventure players are pulled like Survival"
aliases: ["L0-xasm14"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-magn", "L0-adr-ufom"]
see_also: ["ufomagnetspecv1ruen-part-1", "ufomagnetspecv1ruen-part-2"]
---
# ASM-L0-14 · "First join" means the first join after the UFO version is installed; Adventure players are pulled like Survival

**Assumption 1.**
- UFO §2 times the first arrival from "the first player join to a world with the add-on". The production world has run the add-on since v0.x.
- Reading: the first `playerSpawn` with `initialSpawn` seen while `andrew:ufo_next_ms` is absent. In practice that is the first join after the upgrade.
- The schedule is then written as now + random 10–20 min.

**Assumption 2.**
- §5 excludes only Creative and Spectator, while AC-4 says "Survival player".
- Reading: every non-excluded mode is pulled, so Adventure is pulled too.

**Impact if wrong.**
- (1) If the client meant the world's very first join ever, an existing world would never get a "first" arrival window; it would start on the 15 min cadence instead. The difference is at most 20 min, once.
- (2) Adventure-mode map players would be immune.
