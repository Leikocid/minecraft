---
type: "concept-glossary-term"
node_id: "L0-magn-glat"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-glat"]
is_a: ["glossary-term"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 387
tags: ["is_a:glossary-term", "relates_to:L0-adr-ufpc", "relates_to:L0-magn-prel"]
level: 2
---
**Magnet-off latch**

The way `requestMagnetOff(reason)` works (`L0-adr-ufpc`). The call only records the request, with reason `"shot"`, `"stop"` or `"abort"`. `ufoc` runs the release (`L0-magn-prel`) at the start of its next interval tick. Every UFO world mutation therefore stays inside the one shared interval, whichever interval detected the shoot-down.

**Synonyms:** release latch.
