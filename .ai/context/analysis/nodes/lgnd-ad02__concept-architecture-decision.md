---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad02"
source_channel: "rollout"
analysis_version: 3
title: "AD-lgnd-02: Loss recovery by re-issue with a generation bump"
aliases: ["L0-lgnd-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1176
tags: ["architecture-decision", "void-return", "anti-dup", "CTR-011"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-as04", "L0-lgnd-cx02"]
---
# AD-lgnd-02: Loss recovery by re-issue with a generation bump

**Context.** Scythe §1 asks for indestructibility and Void return. The stable API offers no immunity component (`L0-lgnd-as04`) and no removal reason (`L0-lgnd-as03`). Any return path duplicates the item (C-7) if the "lost" copy is not really gone.

**Decision.** When a watched marked item entity is removed and does not reappear in a player inventory within one tick, re-issue it to the last holder with `gen + 1`. Stale-generation stacks are voided on sight.

**Rejected.**
- (a) Prevent destruction by teleporting item entities out of lava or the Void every tick. That is a standing per-entity scan (C-4), it has race windows, and explosions are instantaneous.
- (b) Return without a generation. A hopper-collected copy plus the returned copy would be a dup (C-7).
- (c) Scan containers to find "lost" copies. That breaks C-4 and turns the ledger into a census (L0-keep-r005).

**Consequence.** A mis-classification costs a harmless stale copy, never a second live one.
