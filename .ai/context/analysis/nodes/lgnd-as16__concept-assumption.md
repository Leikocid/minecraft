---
type: "concept-assumption"
node_id: "L0-lgnd-as16"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-as16"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 1209
tags: ["ufo", "retention"]
level: 2
---
---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ac22", "L0-lgnd-p002", "L0-magn"]
---
**ASM-lgnd-16: A magnet-fall death is an ordinary `entityDie`, and the magnet never touches a death drop before retention does.**

What this assumes:
- The magnet moves a held player by `applyKnockback` (UFO §6). The death is plain fall damage at landing.
- Death drops are spawned before `entityDie` (measured earlier). Retention path B empties the legendaries in the same handling, so no legendary item entity outlives the die tick.
- The magnet re-selects only iron dropped within 12 blocks of the hover point. A legendary is never iron, and death drops at ground level are about 37 blocks below it.

**Impact if wrong.**
- Suppose the player dies while still held, for example killed in the air by another player. Death drops would then spawn under the saucer, within 12 blocks. That is harmless for legendaries, because they are removed by retention and are not iron anyway.
- Suppose a future magnet change pulls **every** fresh drop near the hover point. A retained legendary is still safe, but an **unmarked** copy (no retention) would be pulled, which violates AC 13. `r016` item 1 covers this.
