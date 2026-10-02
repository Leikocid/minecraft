---
type: "concept-assumption"
node_id: "L0-sauc-as06"
source_channel: "rollout"
analysis_version: 5
title: "AS-sauc-6 · An RMB salvo is partly absorbed: columns inside the hull are intercepted, and the rest detonate at their per-ring power"
aliases: ["L0-sauc-as06"]
is_a: ["assumption"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1656
tags: ["ufo", "shoot-down", "orbital-v1.4.4", "rmb"]
level: 2
---
# AS-sauc-6 · An RMB salvo is partly absorbed: columns inside the hull are intercepted, and the rest detonate at their per-ring power

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sauc-r001", "L0-sauc-r004", "L0-sauc-ac03", "L0-adr-ufoi", "L0-ring"]`

**Context.**
- In shipped Orbital v1.4.4 (`src/orbital/ring-layout.ts`), RMB rings have radii 0.5 / 3.5 / 7 / 10.5 / 14 and powers 4 / 4 / 2 / 1 / 1.
- A blast reaches 2 × power.
- RMB refuses a target nearer than 7 blocks from the eye (`RING_MIN_RANGE`, Orbital §6).

**Assumption.**
- `r001` runs per charge. With the target under the saucer axis, the centre and ring-3.5 columns cross the r 6 hull and are intercepted.
- Rings 7, 10.5 and 14 fall clear of the hull and detonate normally at powers 2 / 1 / 1. That is ordinary Cannon behaviour and not "blast damage" from the saucer, so UFO §8's "no damage" covers only the saucer's own blast (`r004`).
- The first intercepted charge latches the shoot-down. The others in the same tick are absorbed silently (`r004` item 1).
- The 7-block minimum only limits where the shooter stands. Hovering at centre + 40 and spawning charges at target + 60 already require the target to be under the hull, so the minimum range adds no new positional limit.

**Impact if wrong.**
- If the client expects the whole salvo to vanish once the saucer is hit, the interceptor has to absorb every charge of an attack once one of them hits. That means a per-`attackId` set in `p003` and one line in `r001`.
- `ac03`'s RMB block assertions are scoped to this reading. Under the other reading they could go back to the full 13 × 13 snapshot.
