---
type: "concept-contradiction"
node_id: "L0-sauc-cx01"
source_channel: "rollout"
analysis_version: 5
title: "CX-sauc-1 · \\"Shootable in any phase\\" (UFO §8, AC-15) vs a hover cap of ceiling − 4 plus arrival at hover + 10, and charges capped at `heightRange.max − 1`"
aliases: ["L0-sauc-cx01"]
is_a: ["contradiction"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1752
tags: ["is_a:contradiction","status:resolved","category:source-vs-source","severity:low","relates_to:L0-sauc-r001","relates_to:L0-sauc-r002","relates_to:L0-ufoc","relates_to:L0-orbc","resolved"]
level: 2
closed_at: 2026-10-02
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-sauc-cx01
---

# CX-sauc-1 · "Shootable in any phase" (UFO §8, AC-15) vs a hover cap of ceiling − 4 plus arrival at hover + 10, and charges capped at `heightRange.max − 1`

**Statements.**
- **UFO §2:** hover = centre + 40, "but not above the dimension ceiling − 4". Arrival and departure run at hover + 10.
- **UFO §8 / AC-15:** a charge crossing the hull shoots the saucer down "in any phase".
- **Shipped code, `src/orbital/spawn.ts:29-30`:** `spawnY = min(targetY + 60, heightRange.max − 1)`, which is ≤ 319 in the Overworld.

**Conflict.**
- When the centre is at Y ≥ 276 (a high mountain), hover is capped at 316. Arrival and departure then run at **326**, above the build limit.
- Every charge spawns at ≤ 319, which is below the hull band [326, 329]. **No charge can shoot the saucer down during arrival or departure.**
- At the capped hover the hull is [316, 319], which a charge spawned at 319 barely touches.
- The same geometry holds for ordinary terrain: a charge spawns at target + 60, so a hull at centre + 50…53 is reachable only from targets within ~7 blocks below the centre. That is a positional limit, not a phase limit, and it is not part of this conflict.

**Options.**
- (a) Cap the arrival and departure height at `min(hoverY + 10, ceiling − 4)`. This changes `r002` near the ceiling only.
- (b) Accept it as a deviation note: "near the build limit, the saucer is shootable only while hovering".
- (c) Raise the charge spawn cap. This changes shipped `orbc` behaviour and is rejected by the `L0-adr-ufoi` "additive only" stance.

**Not self-resolved.** Proposed default for the reducer: (a). It keeps AC-15 literal and the path at ≤ 100 blocks, and it never moves the saucer above the build limit, where teleport behaviour has not been probed.

**Resolved at reduce v4** by `L0-adr-ufht`: option (a). Arrival and departure fly at `min(hoverY + 10, ceiling − 4)`.
