---
type: "concept-entity"
node_id: "L0-sauc-ent1"
source_channel: "rollout"
analysis_version: 5
title: "Entity · `andrew:ufo_saucer` (BP + RP)"
aliases: ["L0-sauc-ent1"]
is_a: ["entity"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 2458
tags: ["is_a:entity", "bp", "rp", "relates_to:L0-sauc-r003", "relates_to:L0-sauc-r005", "relates_to:L0-sauc-ad01"]
level: 2
---
# Entity · `andrew:ufo_saucer` (BP + RP)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["entity"]` · `relates_to: ["L0-sauc-r003", "L0-sauc-r005", "L0-sauc-ad01", "L0-adr-ufom"]`

## BP (`packs/behavior/entities/ufo_saucer.json`)
| Attribute | Value |
|---|---|
| identifier | `andrew:ufo_saucer` |
| runtime_identifier | `minecraft:snowball` |
| format_version | `1.26.0` |
| family | `andrew_ufo`, `inanimate`. `andrew_ufo` is the family used by restart cleanup (`L0-adr-ufom` §4), plus the script tag `andrew:ufo`. |
| components | see `r003`: a 0×0 box, no gravity or collision, not pushable, knockback resistance 1, `damage_sensor all → no` |
| properties | `andrew:beam` bool (default false, `client_sync: true`); `andrew:beam_len` int [0, 64] (default 40, `client_sync: true`) |
| dynamic property | `andrew:ufo_event` = eventId (diagnostics, plus a cleanup double-check) |

## RP (`packs/resource/entity/ufo_saucer.entity.json` + geo/texture/animation/render controller)
- **Geometry `geometry.andrew.ufo_saucer`.** All units are pixels, 16 to a block.
  - `disc`: about 12 blocks across, built as stacked rings, 1.5 blocks thick at the rim (a lens profile).
  - `dome`: about 5 blocks across, ≈ 1.5 high, glass-textured.
  - `rim_lights`: 12–16 small cubes on the rim.
  - `beam`: a stepped cone of cubes, pivoted at the underside, its length scaled by `andrew:beam_len`.
  - The hull band `[y, y + 3]` contains the disc and dome (`as01`).
  - `visible_bounds_width` ≥ 14, `visible_bounds_height` ≥ 70, and an offset so the bounds span y − 64 … y + 4.
- **Materials.**
  - Opaque `entity` for the disc.
  - `entity_alphablend` for the dome and the beam (bone-pattern materials in the render controller).
  - Emissive for the rim lights (an emissive texture or `entity_emissive`).
- **Animations.**
  - `spin`: a looping Y-rotation of the `disc`/`dome`/`rim_lights` bones, ≈ 1 turn per 4 s, client-only.
  - `lights`: an optional blinking via UV or alpha.
  - The beam bone's visibility is `q.property('andrew:beam')`.
- **Texture.** Grey metal, a darker rim band, light-cyan glass, and a green beam at partial alpha.
- **Lang.** `entity.andrew:ufo_saucer.name` = НЛО / UFO, used only by `/summon` and diagnostics.

## Lifetime
- Spawned by `p001` and removed by `p001`/`p002`, by `/andrew:ufo stop`, or by `worldLoad` cleanup.
- Never saved across a restart in a meaningful way (C-23).
- At most one exists in the world (UFO AC-3, enforced by `ufoc`).
