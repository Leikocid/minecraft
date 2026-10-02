---
type: "concept-architecture-decision"
node_id: "L0-adr-ufoi"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "ADR-L0-ufoi · An additive mid-fall interceptor on the Orbital charge flight"
aliases: ["L0-adr-ufoi"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 2559
tags: ["status:proposed", "resolves:L0-xcx15", "relates_to:L0-orbc", "relates_to:L0-sauc", "v4"]
---
---
title: "ADR-L0-ufoi · An additive mid-fall interceptor on the Orbital charge flight"
aliases: ["L0-adr-ufoi"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-xcx15", "L0-orbc", "L0-sauc", "L0-pntr", "L0-ring"]
governs_files: ["src/orbital/flight.ts", "src/orbital/charge.ts", "src/ufo/"]
see_also: ["ufomagnetspecv1ruen-part-3"]
status: proposed
---
# ADR-L0-ufoi · An additive mid-fall interceptor on the Orbital charge flight

**Context.**
- UFO §8 lets any Cannon charge crossing a moving, non-colliding hull shoot the saucer down and be absorbed.
- The shipped flight loop (`flight.ts`) moves every charge in one shared interval and sweeps cells for block contact.
- Its only hook is `observeChargeEnds`, which runs after the end (`L0-xcx15`).

**Decision.**
1. `flight.ts` exports `registerInterceptor(fn: (attack, charge, from: Vector3, to: Vector3, tick) => boolean): () => void`. The `attack` argument carries `ownerId` (item 6); this matches `L0-sauc-p003` (reconciled at reduce v4).
2. On each fall step, before the block-contact sweep, every interceptor sees that charge's swept segment.
3. When one returns `true`, the charge ends with a new `Outcome` of `"intercepted"`:
   - it is removed;
   - no effect runs and no explosion happens;
   - `observeChargeEnds` is notified as for any other end.
4. With no interceptor registered, the cost is one empty-set check per step, and the behaviour is byte-for-byte the same as v1.4.4.
5. `orbc` knows nothing about saucers. `sauc` registers on `ufoc`'s arrival and unregisters when the saucer is gone. Its test is a segment-vs-cylinder test (r 6, h 3) against the saucer's position in the current tick.
6. The owner of the charge (`attack.ownerId`) is passed through, so the shoot-down broadcast can name the shooter.

**Rejected alternatives.**
- *A collidable hull, so the existing block-contact path detonates on it.* The saucer must not collide (UFO §7). A detonation would also run the LMB/RMB effect at altitude.
- *A post-hoc `observeChargeEnds` check of whether the path crossed the hull.* That fires only at the end, after the charge has already fallen through and detonated on the ground, which contradicts "absorbed".
- *`sauc` polling charge entities near the saucer.* That is a second loop over charges, and it races with the flight step on ordering.

**Consequences.**
- The change touches a shipped component. The `sauc` task gates on the full Orbital GameTest suite (`orbital-flight`, `penetrator`, ring), green and unchanged.
- An RMB salvo can lose several charges to one hull, which is intended: each one crossing is absorbed. Only the first to cross triggers the shoot-down.
