---
type: "concept-constraint"
node_id: "L0-uwbw-cons"
source_channel: "rollout"
analysis_version: 10
title: "Constraints · Underwater Bow and recipes"
aliases: ["L0-uwbw-cons"]
is_a: ["constraint"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1455
tags: ["v10", "underwater-bow", "constraints"]
level: 2
---
# Constraints · Underwater Bow and recipes

**Links.** relates_to: L0-lgnd, L0-strm, L0-sclk, C-2, C-26, C-29, C-30′, C-34, C-40–C-43.

1. **The stable API.** Use stable `@minecraft/server` 2.10.0 with no Experiments (C-2). There is no `projectileShoot`: attribution is through `entitySpawn` in the same tick.
2. **One shared interval.** Flight correction, Super Fire and the HUD run in one shared interval, with no `runJob`.
3. **One synchronous block** (C-26). The armed hit's damage write is synchronous in the before-event; the strike, Super Fire, cooldown and disarm are synchronous in the after-event.
4. **The `lgnd` seam stays within def fields.**
   - `hudKeys.armed?` is optional, so the other seven defs are untouched.
   - Use is not claimed through `resolveActivation`.
   - `startCooldown` is called on the hit.
   - The `lgnd`, `magn` and `sclk` legendary scenarios gate the merge.
5. **The `strm` seam.** `raiseHit`'s behaviour is frozen. `setHit` is added beside it (`adex`), and the Storm Blade scenarios gate the merge.
6. **Arrow attribution never touches arrows from other bows,** skeletons or dispensers.
7. **Evidence.** Every `bds` criterion has an in-test negative control or a red-before-fix proof. Runs use a private BDS copy on 19136, with env in the command and absolute artifact paths. The broad tier plus the scenarios this change can reach are the gate.
8. **The version** goes to 1.11.0, with RU/EN lang for every new key.
