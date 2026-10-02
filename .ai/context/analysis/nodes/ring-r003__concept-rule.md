---
type: "concept-rule"
node_id: "L0-ring-r003"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r003"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1113
tags: ["is_a:rule", "independence", "relates_to:L0-orbc-ent3", "relates_to:L0-orbc-r014", "relates_to:L0-ring-ac12", "relates_to:L0-ring-as07"]
level: 2
---
**R-ring-003 · Every charge is independent: no chain push, no chain destruction, no chain priming** (Orbital §10; AC-12)

- A blast must not move, remove, prime, re-time or re-aim any other charge, from the same attack or from another one.
- Independence is guaranteed structurally, not by ordering:
  - The charge entity has zero collision, no physics, `knockback_resistance 1` and a damage sensor that ignores all damage (`L0-orbc-ent3`).
  - Its motion is script-teleported along a fixed column (`L0-orbc-ad02`).
  - Its contact is re-evaluated each tick against the *current* terrain. When a neighbour's blast removed the block below, the charge simply falls further. That is terrain, not a push.
- `ring` code never iterates over, removes or teleports charge entities (`L0-orbc-r014` duty).
- Each blast is a separate `createExplosion` call, and each produces its own engine sound (AC-12). Blasts are never merged into one larger explosion, even when several share a tick.
- **Out of scope:** vanilla `minecraft:tnt` *blocks* in the world that a ring blast primes. They behave like vanilla (`L0-ring-as07`).
