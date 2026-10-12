---
type: "concept-architecture-decision"
node_id: "L0-uwbw-adfl"
source_channel: "rollout"
analysis_version: 10
title: "ADR-uwbw-fl · Flight: tag the vanilla arrow unless the swap keeps vanilla damage"
aliases: ["L0-uwbw-adfl"]
is_a: ["architecture-decision"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1836
tags: ["v10", "underwater-bow", "status:proposed", "flight", "probe-gated"]
level: 2
---
# ADR-uwbw-fl · Flight: tag the vanilla arrow unless the swap keeps vanilla damage

**Links.** relates_to: L0-adr-ubfl, L0-sclk, L0-uwbw-as01, L0-uwbw-pfly, C-42.

**Context.**
- ADR-ubfl §2 proposes the `sclk` swap to `andrew:underwater_arrow` with `liquid_inertia` 0.99.
- The precedents are custom entities on `runtime_identifier` snowball (`trident_in_flight`, `sculk_bolt`). Recorded engine facts: snowball runtime deals no impact damage, and a custom entity without that runtime pushes mobs.
- A swapped arrow therefore likely loses everything the engine applies to `minecraft:arrow`:
  - draw-scaled damage, crit, Power, Punch and Flame;
  - tipped-arrow effects and the spectral glow;
  - the stuck-in-ground pickup, and Infinity's no-pickup rule.

  The spec demands *vanilla bow damage*.

**Decision (probe-gated, `pprb` rows 1–3).**
- **B, the default: keep the vanilla `minecraft:arrow`.**
  1. Tag it in `entitySpawn`.
  2. Store its spawn velocity.
  3. In the one shared interval, while its block is water or lava, restore the velocity to the air path (air drag 0.99 and gravity 0.05 per tick, from the stored state).
  - All vanilla damage and enchantment behaviour is kept for free. The cost is per-tick work only for this bow's arrows that are in a liquid.
- **A: the swap is adopted only if** the probe shows the custom projectile reproduces the vanilla table (row 3) exactly, and `liquid_inertia` alone meets ± 10 % in lava.

**Rejected.**
- **The swap with script-recomputed vanilla damage.** It re-implements the Power, crit and tipped-arrow logic, and drift from vanilla is likely.
- **Velocity correction on every vanilla arrow.** It misattributes arrows from other bows (ADR-ubfl).

**Risk.** A velocity restore lands one tick late on liquid entry. That is within ± 10 % over 16 blocks, as probe row 2 measures.
