---
type: "concept-assumption"
node_id: "L0-sauc-as01"
source_channel: "rollout"
analysis_version: 5
title: "AS-sauc-1 · The hull band is `[y, y + 3]` above the entity position, and the model is built to fill it"
aliases: ["L0-sauc-as01"]
is_a: ["assumption"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 908
tags: ["is_a:assumption", "CAN_ASSUME", "hull", "relates_to:L0-sauc-r001", "relates_to:L0-sauc-ent1"]
level: 2
---
# AS-sauc-1 · The hull band is `[y, y + 3]` above the entity position, and the model is built to fill it

**Assumption.**
- UFO §8 says "a cylinder of radius 6 and height 3 blocks **around its position**". It does not say whether the band is centred (y ± 1.5) or rests on the position.
- Reading: the entity position is the underside of the disc. The hull is r 6 in `[y, y + 3]`. The geometry (disc + dome) is built to occupy that band, and the beam hangs from y.
- The edges are closed: a charge column at exactly r = 6.0, or a segment ending exactly at y or y + 3, is a hit.

**Impact if wrong.**
- If the client meant a centred band, the hit band moves down by 1.5 blocks.
- Only shots that graze the top or bottom edge change outcome; a vertical charge column through the disc hits under either reading.
- The fix is a constant offset in the hull test and in `ac03`'s probe heights, with no model change.
