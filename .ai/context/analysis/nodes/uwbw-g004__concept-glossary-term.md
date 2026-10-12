---
type: "concept-glossary-term"
node_id: "L0-uwbw-g004"
source_channel: "rollout"
analysis_version: 10
aliases: ["L0-uwbw-g004"]
is_a: ["glossary-term"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 443
tags: ["v10", "underwater-bow", "glossary"]
level: 2
---
**Liquid-neutral arrow**

An arrow from the Underwater Bow that keeps its air velocity and gravity in water and lava, within ± 10 % (C-42), and that lava does not destroy before it hits. It is built either by tagging the vanilla arrow and restoring its velocity (the default) or by swapping it for a custom projectile with `liquid_inertia` 0.99 (ADR-uwbw-fl).

**Related:** the arrow swap (the `sclk` entitySpawn +0 swap); `trident_in_flight`.
