---
type: "concept-process"
node_id: "L0-ufoc-p003"
source_channel: "rollout"
analysis_version: 5
title: "P-ufoc-3 · Restart cleanup (C-23)"
aliases: ["L0-ufoc-p003"]
is_a: ["process"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1762
tags: ["is_a:process", "restart", "cleanup", "relates_to:L0-xasm17", "relates_to:L0-adr-ufom", "relates_to:L0-sauc-ent1", "relates_to:L0-magn-eelm"]
level: 2
---
# P-ufoc-3 · Restart cleanup (C-23)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["process"]` · `relates_to: ["L0-xasm17", "L0-adr-ufom", "L0-sauc-ent1", "L0-magn-eelm", "L0-ufoc-ad03", "L0-ufoc-ac05"]`

**At worldLoad** (subscribed from `registerUfo`, before the interval starts doing any work):
1. For every dimension, `getEntities({ tags: ["andrew:ufo"] })` → `remove()`. This catches the saucer and the beam (`sauc-ent1`).
2. For held entities, `getEntities({ tags: ["andrew:ufo_iron"] })` → `removeTag("andrew:ufo_iron")`. The entity stays where it was saved and falls (UFO §10, `magn-eelm`).
3. If `next_ms === 0` (the in-flight marker, `ad03`), write `next_ms = now() + PAUSE_MS` (UFO §10: "15 minutes after the restart").
4. No session exists, so the live `eventId` is `undefined`.

**On entityLoad** (one subscription, owned by `ufoc`, `L0-xasm17`): when an entity loads,
- if it is in the `andrew_ufo` family, or has the tag `andrew:ufo`, and its `andrew:ufo_event` is not the live `eventId` → `remove()`;
- if it has the tag `andrew:ufo_iron` and no live session → `removeTag`. This branch is `magn`'s cleanup hook; `magn` registers no subscription of its own.

The guards run cheapest first: a tag or family check before any property read.

**Not restored:**
- the phase, the centre and the target;
- held positions. Pulled items stay where they were saved and fall with vanilla physics.

**Test reading** (`L0-xasm13`, `L0-xcx17`): AC-18 is a `bds-check` restart scenario on the checks instance.
1. It starts an event through `come` with the saucer placed **outside the spawn chunks**.
2. It restarts the server.
3. A selftest probe asserts that the count of `andrew:ufo` entities is 0, once at load and again after it force-loads the saucer's chunk.
