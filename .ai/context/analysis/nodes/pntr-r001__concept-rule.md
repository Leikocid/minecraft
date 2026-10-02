---
type: "concept-rule"
node_id: "L0-pntr-r001"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-r001"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1147
tags: ["title:Column geometry", "is_a:rule", "relates_to:L0-pntr-ad02", "relates_to:L0-pntr-as01", "source:orbital-§9", "ac:7"]
level: 2
---
**Rule R-pntr-1 · Column geometry.**
- **Vertical:** from the detonation cell (inclusive) down to `dimension.heightRange.min` (inclusive). Nothing above the detonation cell is affected.
- **Horizontal:** a roughly 5×5 footprint centred on the detonation cell's `(x, z)`:
  - the 3×3 core is always included;
  - each of the 12 non-corner cells of the 5×5 ring is included with high probability;
  - each of the 4 corners is included with ~50% probability;
  - a few cells on the 7×7 rim are included with low probability.
- The mask changes every 4-layer band, so the walls look blast-ragged rather than square (Orbital §9: "not perfectly square… like TNT aftermath").
- The number of removed cells per layer (before classification) stays between 9 and 33. The expected value is about 25.

**Rationale.** The spec asks for "approximately 5×5" with "small natural irregularity". The 3×3 core guarantees a continuous, passable shaft for AC-7. The band-level variation avoids per-block noise that would look like a render glitch.

**Test hook.** The mask is a pure function of `attackId` (`L0-pntr-ent1`), so a gametest can assert the exact cell set.
