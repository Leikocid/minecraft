---
type: "concept-assumption"
node_id: "L0-uwbw-as01"
source_channel: "rollout"
analysis_version: 10
title: "ASM-uwbw-01 · Bow-specific defaults the spec leaves open"
aliases: ["L0-uwbw-as01"]
is_a: ["assumption"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1582
tags: ["v10", "underwater-bow", "CAN_ASSUME", "probe-gated"]
level: 2
---
# ASM-uwbw-01 · Bow-specific defaults the spec leaves open

**Links.** relates_to: L0-xasm38, L0-uwbw-adfl, L0-uwbw-pprb.

**Assumed (CAN_ASSUME).**
1. **A swap costs engine damage.** A custom-projectile swap loses vanilla arrow damage and enchantment effects. Flight therefore defaults to the tagged vanilla arrow (`adfl` B).
2. **The draw.** A custom shooter without `charge_on_draw` draws and releases like a bow, with `max_draw_duration` 1.0 s. A custom shooter cannot fire the bow's pull textures through vanilla Molang, so the RP attachable animates the pull from the use duration.
3. **The off hand.** It is enabled only if probe row 9 shows the shooter drawing from it. Otherwise the bow is main-hand only, and the README says so.
4. **Infinity.** It follows vanilla on the kept arrow: it does not consume a plain arrow, and that arrow cannot be picked up.
5. **Flame.** Its duration on a Bedrock arrow is read in probe row 3. "Longer of 2 s and Flame" uses that measured value.
6. **The HUD.** It uses the existing legendary action-bar loop, shown only while the bow is in either hand.
7. **Arrows in flight at restart.** An armed arrow that is in flight when the server restarts is a miss, and the charge is kept.

**Impact if wrong.**
- **(1):** if the swap does keep damage, A is cheaper per tick; this is a swap of variants, and the tests are unchanged.
- **(2):** an iPad re-look at the RP only.
- **(3):** the off hand is a one-line component change.
- **(5):** a different fire constant.
- **(7):** none for players; it is only a corner case on the acceptance sheet.
