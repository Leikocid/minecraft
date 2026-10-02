---
type: "concept-assumption"
node_id: "L0-xasm17"
source_channel: "rollout"
analysis_version: 4
title: "ASM-L0-17 · Restart cleanup is lazy and keyed by event id"
aliases: ["L0-xasm17"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 2024
tags: ["v4", "CAN_ASSUME", "status:assumed", "ufo", "relates_to:L0-ufoc", "relates_to:L0-sauc", "relates_to:L0-magn", "relates_to:L0-adr-ufom", "relates_to:L0-sauc-ent1", "relates_to:L0-magn-prel"]
level: 1
---
---
title: "ASM-L0-17 · UFO restart cleanup is keyed by event id and also runs when an entity loads, not only at worldLoad"
aliases: ["L0-xasm17"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-magn", "L0-adr-ufom", "L0-sauc-ent1", "L0-magn-prel", "L0-magn-eelm"]
status: assumed
---
# ASM-L0-17 · Restart cleanup is lazy and keyed by event id

**Context.** The children agree on what to clean, but two of them clean in different places:
- `sauc-ent1`: the saucer has the family `andrew_ufo`, the tag `andrew:ufo` and the property `andrew:ufo_event = eventId`.
- `magn-prel` / `magn-eelm`: held entities carry the transient tag `andrew:ufo_iron`, and "`magn`'s cleanup hook" clears it at world load.
- `L0-adr-ufom` §4: `ufoc` removes `andrew:ufo` entities on `worldLoad`.

**Assumption.**
- At server start no player is online, so the saucer (up to 90 blocks from any player, 40–50 blocks up) and the held mobs can sit in chunks that are not loaded when `worldLoad` fires.
- Script cannot see entities in unloaded chunks (C-12′).
- So a worldLoad sweep alone can miss them. This is an inference from C-12′, not a probe.

**Reading adopted at L0.** The event id is in memory only, so after a restart there is no live event, and any `andrew:ufo` entity or `andrew:ufo_iron` tag is stale. Cleanup runs in two places:
1. **At worldLoad**, as `L0-adr-ufom` §4 says.
2. **When an entity loads** (`entityLoad`, one subscription owned by `ufoc`):
   - an entity in the `andrew_ufo` family whose `andrew:ufo_event` is not the live event id is removed;
   - an entity with `andrew:ufo_iron` but no live session has the tag removed.

`magn`'s cleanup hook is this second branch, registered through `ufoc`. It does not get its own subscription.

**Impact if wrong.** If a worldLoad sweep does see every saucer (because of ticking areas or spawn chunks), the `entityLoad` branch is redundant but harmless. The UFO AC-18 check should place the saucer outside the spawn chunks so that this case is exercised.
