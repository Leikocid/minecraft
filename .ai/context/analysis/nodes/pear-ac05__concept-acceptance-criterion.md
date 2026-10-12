---
type: "concept-acceptance-criterion"
node_id: "L0-pear-ac05"
source_channel: "rollout"
analysis_version: 11
title: "AC-pear-05 · Distant and unloaded destinations: no range cap, no unsafe teleport (§8 bullet 5)"
aliases: ["L0-pear-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1401
tags: ["v11", "pearl-rod", "acceptance", "bds", "spec-8.5", "C-44", "tickingarea"]
level: 2
---
# AC-pear-05 · Distant and unloaded destinations: no range cap, no unsafe teleport (§8 bullet 5)

**Relates to:** L0-pear-pr03, L0-pear-ru02, L0-pear-ad01, C-44.

**`bds`:**
- **Far plate reached:**
  - a plate at +10 000 blocks is placed through a ticking area, then the area is released and the chunk is confirmed unloaded;
  - the binding is written directly (registry stand-in);
  - the player uses the rod → they arrive within 0.5 and the area count returns to baseline.
  - Repeat at 100 K and 1 M if the probe passes; otherwise those distances are recorded deviations.
- **Cross-dimension:** an overworld player with a binding to a Nether plate → arrives in the Nether, if the probe passes; otherwise "other dimensions unsupported" and the binding is kept.
- **Forced preload failure:**
  - all budget slots are held by a test fixture → "server busy", no teleport, binding kept;
  - an injected 1-tick timeout → "destination did not load", no teleport, binding kept, area released.
- **Unsafe destination:** lava poured over the plate and its 8 neighbours, or a block placed at the head height of all 9 → "destination unsafe", no teleport, binding kept.
- **Negative control:** the same far plate with a pre-loaded chunk → success. This proves the failure scenarios fail because of their fault and not the setup.
- The scenarios run BDS-only (checks 19136, private instance), never production.
