---
type: "concept-rule"
node_id: "L0-katn-r006"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r006"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 827
tags: ["rule", "katana", "fall-damage", "is_a:rule", "relates_to:L0-adr-ktfl", "relates_to:L0-xasm20"]
level: 2
---
---
title: "R-katn-006: Fall protection is one-shot and bounded"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktfl", "L0-xasm20", "L0-katn-p002", "L0-katn-ent2"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule** (C-25).
- After a successful teleport, the first landing caused by it deals no fall damage (T11).
- The protection ends at the first of these: an on-ground tick, a liquid, a climb, a glide, death, a dimension change, logout, or 10 s of wall-clock time.
- The next ordinary fall deals vanilla damage (T12).
- The protection never blocks any other damage: PvP, mobs, lava, the Void, suffocation.
- It never alters the visible descent: no slow-falling float, unless the probe-failure fallback in `L0-katn-p002` §4 is adopted by a superseding ADR.
- It is not persisted.

Source: Katana §7; T11, T12.
