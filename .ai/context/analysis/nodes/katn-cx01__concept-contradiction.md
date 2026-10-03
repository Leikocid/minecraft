---
type: "concept-contradiction"
node_id: "L0-katn-cx01"
source_channel: "rollout"
analysis_version: 6
title: "CX-katn-01 · Fit vs. safe"
aliases: ["L0-katn-cx01"]
is_a: ["contradiction"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1356
tags: ["contradiction", "katana", "category:source-vs-decision", "severity:medium", "status:resolved", "resolved_by:L0-adr-ktob", "target:L0-adr-ktob", "is_a:contradiction", "relates_to:L0-adr-ktob", "relates_to:L0-katn-as03"]
level: 2
---
---
title: "CX-katn-01 · L0-adr-ktob counts a lava cell as 'player fits'; Katana §6 requires a safe position"
is_a: ["contradiction"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-katn-as03", "L0-katn-ad01", "L0-katn-r004"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
# CX-katn-01 · Fit vs. safe

**Source A.** Katana §6 is titled "Safe destination position" and asks for "the nearest safe place where the player model fits". §5 says water and lava are not solid **for the trace**.

**Source B.** `L0-adr-ktob` §3: "Player fits means: the feet cell and the head cell are each **air, liquid** or passable." It carries the trace's liquid rule over to the destination.

**Disagreement.** Under B, a player who aims at the far bank of a lava lake can be placed in the lava, if the trace endpoint falls over it. That is a fitting cell but not a safe one. The spec only exempts liquids from blocking the *trace*.

**Proposed resolution (not self-applied at L0).**
- `katn` applies `L0-katn-as03`: lava and fire cells are unsafe for landing, and water stays allowed. It measures the fit with `L0-katn-ad01`.
- The reduce should amend `L0-adr-ktob` §3 to read "fits = column ray clear; safe = fits and no lava or fire", or mark §3 as refined by `L0-katn-ad01`.

Severity: medium. It is a player-death path on a legal use, but the fix is local to `katn`.

**Resolved at reduce v6.** `L0-adr-ktob` §3 is amended in place: *fits* = the `L0-katn-ad01` column ray is clear; *safe* = fits and neither cell is lava, flowing lava, fire or soul fire (`L0-katn-as03`). Water stays allowed. The trace's liquid rule (§1) is unchanged.
