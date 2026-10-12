---
type: "concept-assumption"
node_id: "L0-xasm38"
source_channel: "rollout"
analysis_version: 10
title: "ASM-L0-38 · Underwater Bow semantics"
aliases: ["L0-xasm38"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 2471
tags: ["v10", "underwater-bow", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-38 · Underwater Bow semantics: def identity, arming gesture, what counts as a hit, fire overlap, the 14 HP"
aliases: ["L0-xasm38", "Underwater Bow semantics"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-xcx33", "L0-adr-ubfl", "L0-lgnd"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-2"]
---
# ASM-L0-38 · Underwater Bow semantics

**Assumption (CAN_ASSUME).** The spec leaves these gaps:

- **Identity.** The item is `andrew:underwater_bow`. It is def #8, an `ActiveLegendaryDef` with prefix `ub`, token `andrew:underwater_bow_crafted`, command `andrew:bow`, `cooldownTicks` 600 and its own `hudKeys`, including `armed`.
- **Arming.** Sneak + the start of Use arms the charge (`xcx33`). One charge is held at a time. It survives logout, restart, death (it is a player flag) and changing which bow is held.
- **Successful hit.** The arrow lands on a **living entity** (a player or a mob, but not an armour stand, boat, minecart or item frame), and the hurt before-event recorded damage > 0. Each of these is a **miss** that keeps the charge:
  - a block;
  - a shield block;
  - a target in invulnerability frames whose damage the window swallowed;
  - an arrow that despawned;
  - a hit on the shooter.

  An arrow shot before arming is never charged. Only the first arrow fired after arming carries the charge.
- **14 HP.** It **replaces** vanilla arrow damage: exactly 14 before armour, ignoring Power and crit (C-29). Armour, Protection and Resistance then apply as vanilla. Punch knockback still applies.
- **Normal fire.** Fire lasts 2 s, or Flame's duration if that is longer; the two never add. A target in water is put out as vanilla.
- **Super Fire.** It refreshes on a second charged hit; it does not stack. Fire Resistance and fire-immune mobs take no burn damage. The visual runs underwater as particles.
- **Lava.** "Speed in lava as in air" applies to the arrow only. Contact with lava does not destroy the arrow before it hits.
- **Ammunition.** The bow uses vanilla arrows: plain, tipped and spectral, with their effects kept. Infinity follows vanilla.

**Impact if wrong.**
- **A different gesture:** a change to the input handler only.
- **14 *added* to vanilla damage:** the armed hit calls `raiseHit` (opted into projectiles) in place of the replace-mode `setHit` (`L0-uwbw-adex`, amended at reduce v10).
- **Armour stands counting as targets:** the hit filter changes.
- **Super Fire that must stack or spread:** C-43 has to be reopened.
