---
type: "concept-process"
node_id: "L0-lgnd-p009"
source_channel: "rollout"
analysis_version: 6
title: "P-lgnd-009: Attack (LMB) activation path"
aliases: ["L0-lgnd-p009"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2072
tags: ["v3-delta", "activation"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r015", "L0-lgnd-p004", "L0-lgnd-ac16", "L0-adr-orbc", "L0-orbc", "L0-xq5", "L0-xasm10"]
---
# P-lgnd-009: Attack (LMB) activation path

This extends `p004` (Use dispatch) for defs with `"attack" ∈ activations`. Today that is only the Cannon.

1. **Trigger (owned by `L0-orbc`).** `entityHitBlock` (a `Player` damager) or `playerSwingStart` (`Attack`) + the ray.
   - In Creative, `beforeEvents.playerBreakBlock` is cancelled for a player holding the Cannon in the main hand, so the targeted block is not broken.
   - On iPad, "hold on a block" raises `entityHitBlock` at the start of the hold (`L0-xasm10`).
2. **Resolve.** `resolveActivation(player, "attack")`:
   - Main-hand stack → def. If `"attack" ∉ def.activations` → `undefined`. That is the case for the Web Sword and the Scythe, whose melee stays vanilla.
   - If the def is not ready, or is busy → `undefined`.
   - Otherwise → `{def, slot: Mainhand}`.
3. **The module acts only if** `result?.def === ORBITAL_CANNON`. It then takes the event block within 25, else `getBlockFromViewDirection({maxDistance: 25})`, the same call as the Use path (`L0-adr-orbc` §2).
   - No block → return. No state, no message.
   - A block → spawn the charges, call `startCooldown(player, "orbital_cannon")` **in the same turn**, and lock the target.
4. **Same-tick Use.** If the same gesture also raises `itemUse`, `resolveActivation(player, "use")` now returns `undefined`, because the cooldown was just written. That gives one activation.
5. **HUD.** The next 10-tick pass shows "Orbital Cannon — 30s" (`andrew.legendary.cooldown`). There is no busy segment: the Cannon never sets busy, and charges in flight do not block (Orbital §6).

**Reach.** LMB beyond reach arrives as `playerSwingStart` (decision 2026-09-29); not blocking. The resolver does not change with distance.
