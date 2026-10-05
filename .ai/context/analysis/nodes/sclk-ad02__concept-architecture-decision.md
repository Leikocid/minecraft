---
type: "concept-architecture-decision"
node_id: "L0-sclk-ad02"
source_channel: "rollout"
analysis_version: 7
title: "AD-sclk-02 · Trail particle: vanilla `minecraft:sonic_explosion` first, RP look-alike as the fallback"
aliases: ["L0-sclk-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1057
tags: ["architecture-decision", "trail", "particles", "ipad"]
level: 2
---
# AD-sclk-02 · Trail particle: vanilla `minecraft:sonic_explosion` first, RP look-alike as the fallback

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-sclk-r007", "L0-sclk-p003", "L0-sclk-ac23"]`

**Context.** §4 asks for a Warden Sonic Boom-like cylinder or beam and allows a look-alike if the exact one is unavailable. The Warden's beam is a row of `sonic_explosion` rings. `spawnParticle` with vanilla ids is stable.

**Decision.** Emit `minecraft:sonic_explosion` at ≤ 3 points per bolt per tick, on the real segment. If the iPad check (probe Q10) shows it as too large, too long-lived or invisible, ship `andrew:sonic_trail`: an RP particle with a teal ring billboard, lifetime ≤ 1 s, facing the motion. The fallback is recorded as a C-16 deviation.

**Rejected.**
- **A dummy entity with a beam model.** It is a lingering entity, which C-5f forbids, and needs extra sync.
- **One long beam drawn from the shooter at fire time.** It does not follow the real, falling path (§4), and it reads as hitscan (§9).
