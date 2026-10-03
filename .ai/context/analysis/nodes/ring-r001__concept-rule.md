---
type: "concept-rule"
node_id: "L0-ring-r001"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r001"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1023
tags: ["is_a:rule", "geometry", "relates_to:L0-xasm8", "relates_to:L0-ring-p001", "relates_to:L0-ring-ac11"]
level: 2
---
**R-ring-001 · Five continuous rings at d = 1/7/14/21/28 around the target column** (Orbital §10; AC-11; `L0-xasm8`)

- **Centre.** The rings are centred on the locked target block's (x, z). The face that was hit does not matter.
- **d = 1** means exactly one charge directly over the target.
- **d = 7, 14, 21, 28** are rings of radius r = d/2 (r = 3.5/7/10.5/14), rasterised as 8-connected closed midpoint circles (`p001`):
  - There are no deliberate gaps. Every ring cell has exactly two ring neighbours in its 8-neighbourhood.
  - Each cell is within r ± 0.75.
- **Columns** are de-duplicated. Each column carries one charge of normal TNT size (scale 1.0, `L0-orbc-ent3`).
- **The geometry is fixed.** It does not adapt to terrain, loaded chunks or dimension. Charges whose column is unloaded or voided are handled by `orbc` (`r009`/`r011`), and the ring is not re-shaped to compensate.

**Rationale:** "as continuous as possible, discrete grid allowed" (§10). 8-connectivity is the thinnest ring with no diagonal gap visible from above.
