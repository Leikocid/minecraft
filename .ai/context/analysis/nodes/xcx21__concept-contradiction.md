---
type: "concept-contradiction"
node_id: "L0-xcx21"
source_channel: "rollout"
analysis_version: 6
level: 1
title: "CX-L0-21 · T17 literal reading vs the shipped C-16 deviation"
aliases: ["L0-xcx21"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 600
size_chars: 1680
tags: ["v6", "katana", "category:source-vs-code", "severity:low", "status:resolved", "resolved_by:L0-adr-ktgr", "target:L0-lgnd", "alias:L0-xcx21", "is_a:contradiction", "relates_to:L0-lgnd", "relates_to:L0-katn", "relates_to:L0-xcx10", "relates_to:L0-xasm22", "see_also:dragonkatanaspecv1ruen-part-1", "see_also:dragonkatanaspecv1ruen-part-3"]
---
---
title: "CX-L0-21 · Katana §3/T17: the item entity \"is not destroyed\" by cactus and TNT; the framework returns it to the owner instead (C-16)"
aliases: ["L0-xcx21", "Katana T17 vs C-16"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-katn", "L0-xcx10", "L0-xasm22"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-3"]
---
# CX-L0-21 · T17 literal reading vs the shipped C-16 deviation

**Source.** Katana §3 says "the item entity is not destroyed by ordinary hazards: fire, lava, cactus, TNT and the Orbital Cannon". T17 says "as an item entity it survives fire, lava, TNT and the Orbital Cannon".

**Code.** As built in v1.4.x (`lgnd`, with `xcx10` closed under C-16):
- fire and lava are **prevented** (`fire_resistant`);
- Orbital blasts and rings are **prevented** (`protectLegendariesIn` moves the item out first);
- cactus, TNT and despawn are not preventable on stable 2.10.0. The item is destroyed and a fresh marked copy is **returned** to the owner (immediately, or owed).

**Disagreement.** For cactus and TNT, the item does not "survive" where it lay; it reappears with its owner. A literal T17 GameTest ("the item entity is still on the ground after TNT") fails.

**Proposed resolution (autopilot default).** Accept the same C-16 reading the operator accepted for the other three legendaries when closing `xcx10`. T17 is proven as "after TNT, exactly one Katana exists, and it is in the owner's inventory or owed". `katn` writes T17 that way; `lgnd` cites the deviation. Severity is low, because this is a re-statement of an accepted compromise. It is filed so the operator confirms that it also binds the new spec.

**Resolved at reduce v6** by `L0-adr-ktgr` §1: the Katana's T17 is the shipped three-tier C-16 reading. The test text is `L0-lgnd-ac24`. Operator confirmation is collected via `L0-xq6`, which does not block the build.
