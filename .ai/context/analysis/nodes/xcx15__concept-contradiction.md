---
type: "concept-contradiction"
node_id: "L0-xcx15"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "CX-L0-15 · UFO §8 needs a charge stopped mid-fall; the shipped `orbc` charge contract ends a charge only at a block, the Void, a loss or a timeout"
aliases: ["L0-xcx15"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1589
tags: ["status:open", "category:source-vs-code", "target:L0-orbc", "severity:high", "blocks:L0-sauc", "relates_to:L0-adr-ufoi", "relates_to:L0-orbc", "relates_to:L0-sauc", "see_also:ufomagnetspecv1ruen-part-3", "v4"]
---
---
title: "CX-L0-15 · UFO §8 needs a charge stopped mid-fall; the shipped `orbc` charge contract ends a charge only at a block, the Void, a loss or a timeout"
aliases: ["L0-xcx15"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-sauc", "L0-adr-ufoi", "L0-pntr", "L0-ring"]
see_also: ["ufomagnetspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-2"]
status: open
category: source-vs-code
---
# CX-L0-15 · UFO §8 needs a charge stopped mid-fall; the shipped `orbc` charge contract ends a charge only at a block, the Void, a loss or a timeout

- **UFO §8 / AC-15.** Any Orbital charge (LMB or RMB) whose fall passes through the hull, a cylinder of r 6 × h 3 around the saucer, shoots the saucer down in any phase. The charge "is absorbed and does not continue its fall".
- **Shipped `src/orbital/flight.ts` (v1.4.4)** and the contract `orbc-r014` work as follows:
  - Charges move in one shared loop.
  - They end with an `Outcome` of detonate, Void, loss or timeout.
  - The only outward hook is `observeChargeEnds`, which is notified *after* the end.
  - The saucer does not collide (UFO §7), so the block-contact sweep never sees it.
  - Nothing can stop a charge in the air, and on detonation the effect still runs.
- The v3 reduce rule says "any effect needing a different charge behaviour becomes a contradiction on L0". This is that case, with a non-effect caller.

**Resolution (proposed):** `L0-adr-ufoi` adds an additive interceptor seam. It needs the `sauc` task to green the whole Orbital GameTest suite unchanged. Until it merges, UFO AC-15 cannot be tested.
