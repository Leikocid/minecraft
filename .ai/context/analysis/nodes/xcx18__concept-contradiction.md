---
type: "concept-contradiction"
node_id: "L0-xcx18"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "CX-L0-18 · Hopper is both an untouched container (UFO §5 Containers) and a pullable iron block (UFO §4 Blocks, §5 Blocks)"
aliases: ["L0-xcx18"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1745
tags: ["status:resolved", "category:source-vs-source", "target:L0-magn", "severity:high", "relates_to:L0-magn", "relates_to:L0-lgnd", "see_also:ufomagnetspecv1ruen-part-1", "see_also:ufomagnetspecv1ruen-part-2", "v4"]
---
---
title: "CX-L0-18 · Hopper is both an untouched container (UFO §5 Containers) and a pullable iron block (UFO §4 Blocks, §5 Blocks)"
aliases: ["L0-xcx18"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-magn", "L0-lgnd"]
see_also: ["ufomagnetspecv1ruen-part-1", "ufomagnetspecv1ruen-part-2"]
status: resolved
category: source-vs-source
---
# CX-L0-18 · Hopper is both an untouched container (UFO §5 Containers) and a pullable iron block (UFO §4 Blocks, §5 Blocks)

- **UFO §4, "Blocks in the world"** lists `hopper` (as well as `cauldron` and `anvil`) as a built iron block. **§5 Blocks** says a selected block becomes air plus its item, and priority class (4) is built blocks.
- **UFO §5 Containers** lists hoppers among the containers from which "only iron stacks are taken; the rest of the contents **and the container itself** are not touched".
- **Consequence if both are applied:**
  - A hopper selected as a block is replaced with air.
  - Its non-iron contents spill, or are lost if the replacement goes through `setType`. That breaks C-7″/priority (1).
  - A legendary sitting in that hopper becomes a loose item under a moving saucer. That breaks AC-13 and lands on `lgnd`.

**Options:**
- (a) A hopper is a container only. It is never selected as a block, and its iron stacks are extracted.
- (b) The hopper is pulled as a block after its contents are spilled vanilla-style (`setblock … destroy`). Legendaries go through `protectLegendariesIn`.
- (c) The hopper is pulled only when it is empty.

**Autopilot default: (a).** Priority (1) beats (2): no loss or corruption beats a complete gameplay list. The hopper stays in the §4 *item* list, so a hopper item is pulled. `magn` records this as an ADR and a C-16 deviation note.

**Resolved at reduce v4** by `L0-magn-adhp` (option a), confirmed in `L0-adr-ufnd`.
