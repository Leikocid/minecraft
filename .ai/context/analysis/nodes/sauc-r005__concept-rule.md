---
type: "concept-rule"
node_id: "L0-sauc-r005"
source_channel: "rollout"
analysis_version: 5
title: "R-sauc-5 · The beam: translucent green, saucer underside to the ground, shown only during the magnet phase"
aliases: ["L0-sauc-r005"]
is_a: ["rule"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1335
tags: ["is_a:rule", "beam", "visuals", "relates_to:L0-sauc-ad01"]
level: 2
---
# R-sauc-5 · The beam: translucent green, saucer underside to the ground, shown only during the magnet phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-ad01", "L0-sauc-ent1", "L0-sauc-ac05"]`

**Rule** (UFO §7, DoD):
- **Visibility.**
  - The beam is visible if and only if `ufoc`'s phase is `magnet`.
  - It turns on in the magnet-on tick.
  - It turns off in the release tick, or in the shoot-down tick.
  - It is never visible during arrival, departure or the fall.
- **Look.**
  - A cone, wide end at the bottom, apex at the underside of the saucer.
  - The bottom radius is ≈ 5 blocks, a tunable judged on the iPad. It is not tied to the 50-block magnet zone.
  - Green with alpha ≈ 0.35–0.5. Terrain and pulled items are visible through it.
  - It is rendered without back-face culling and does not cast a shadow.
- **Length.** `hoverY − centre.y` (normally 40) is sent to the client as an int actor property `andrew:beam_len`. The geometry bone scales by it. The beam ends at the centre block. It does not follow terrain under the cone.
- **Visible whole.** `visible_bounds` covers the disc and the full beam length, so the client does not cull the beam when the disc is off screen. The beam is not damageable and not collidable: it is part of the saucer entity (`ad01`), so `r003` covers it.
