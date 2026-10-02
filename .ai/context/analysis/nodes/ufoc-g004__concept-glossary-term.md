---
type: "concept-glossary-term"
node_id: "L0-ufoc-g004"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ufoc-g004"]
is_a: ["glossary-term"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 395
tags: ["is_a:glossary-term", "phase-machine"]
level: 2
---
**Phase (UFO phase)**

One state of the event, published through `onPhase`:
- `arrival` (400 ticks);
- `magnet` (1200 ticks);
- `release` (instant);
- `departure` (300 ticks);
- `pause` (15 min, no saucer);
- `downed` (about 60 ticks after a shoot-down).

`release` and `pause` are signals only and never a stored session phase.

**Synonyms:** фаза (прилёт / магнит / отключение / улёт / пауза).
