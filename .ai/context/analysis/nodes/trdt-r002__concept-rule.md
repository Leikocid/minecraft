---
type: "concept-rule"
node_id: "L0-trdt-r002"
source_channel: "rollout"
analysis_version: 9
title: "R-trdt-002 · Each landed hit: vanilla base + 2 before armour, one strike, idempotent"
aliases: ["L0-trdt-r002"]
is_a: ["rule"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1254
tags: ["above-water-trident", "damage", "C-29", "C-30-prime"]
level: 2
---
# R-trdt-002 · Each landed hit: vanilla base + 2 before armour, one strike, idempotent

**Links.** is_a: rule. relates_to: L0-adr-twlt, L0-trdt-addm, L0-xasm34, L0-xcx29.

**Rule.**
1. **Base damage.**
   - Melee is the measured vanilla trident melee value (expected 9: `minecraft:damage` 8 + hand 1).
   - A thrown hit is the measured vanilla thrown value (expected 8).
2. **Bonus.**
   - The bonus is +2 **before** armour, Protection and Resistance (`xasm34`), applied in the same hurt event through `raiseHit`.
   - A lethal raise goes through the helper's `system.run` overkill path, so the totem still works.
3. **Who it applies to.**
   - Living targets only: players and mobs with health.
   - Armour stands, item frames, boats and minecarts get no bonus and no strike.
4. **Strike.**
   - Exactly one `playStrikes` visual per accepted hit.
   - No `lightning_bolt` entity is spawned until `xq10` opts in.
   - No fire, conversion or knockback from the visual.
5. **Idempotency.**
   - One bonus and one strike per key: (`throwId`, target) for a thrown hit, (attacker, tick, target) for melee.
   - A hit swallowed by the hurt window (`event.damage` ≤ the window's last) gets neither.
6. **No recursion.** Nothing the trident spawns deals damage.
