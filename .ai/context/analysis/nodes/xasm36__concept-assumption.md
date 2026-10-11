---
type: "concept-assumption"
node_id: "L0-xasm36"
source_channel: "rollout"
analysis_version: 9
title: "ASM-L0-36 · Timings the spec leaves open"
aliases: ["L0-xasm36"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1483
tags: ["v9", "above-water-trident", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-36 · Timing gaps: fall-grant expiry, return cap, return speed after an entity hit"
aliases: ["L0-xasm36", "Trident timing gaps"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twth", "L0-adr-twrp"]
see_also: ["abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-36 · Timings the spec leaves open

**Assumption (CAN_ASSUME).**
- **Fall grant.** One grant per dash, not stacked: a second dash refreshes it. It expires 10 s after the last dash if no landing used it, matching the katana's `FALL_FLAG_MS`. Water, a ladder or a slime landing consumes it, because "the next landing" happened.
- **Return after an entity hit.** "Then return the weapon" gives no speed. It uses the same visible 10 b/s return from the hit point.
- **Return cap.** The owner may outrun 10 b/s, for example with an elytra (≈ 30 b/s) or a dash. If the return entity has not arrived within 30 s, or its chunk stops ticking, the copy is delivered directly to the owner (or to pending delivery) with a lang message.
- **Flight cap.** A thrown trident that has neither hit anything nor stopped within 10 s counts as a miss and starts returning.
- **Re-throw during return.** Nothing to throw. The player has no copy, and Creative copies are separate items (C-33).

**Impact if wrong.**
- If Andrey wants the fall grant to persist until landing however long, only the expiry constant changes.
- If he wants a faster return after an entity hit, only the speed constant changes.
