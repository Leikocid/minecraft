---
type: "concept-rule"
node_id: "L0-ufoc-r005"
source_channel: "rollout"
analysis_version: 5
title: "R-ufoc-5 · Arrival notice and localization"
aliases: ["L0-ufoc-r005"]
is_a: ["rule"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 833
tags: ["is_a:rule", "localization", "messages", "relates_to:L0-ufoc-as05"]
level: 2
---
# R-ufoc-5 · Arrival notice and localization

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-as05", "L0-sauc", "L0-ufoc-ac07"]`

**Rule** (UFO §7, §12):
- **When:** once, at arrival start, in the same tick the session is created. This applies to `come` too.
- **Who:** every valid Overworld player whose horizontal distance to the centre is ≤ 150 blocks (`as05`). Players in other dimensions never receive it.
- **What:** `player.sendMessage({ rawtext: [{ translate: "andrew.ufo.arrival" }] })`. The client renders it in its own language:
  - `en_US.lang`: `andrew.ufo.arrival=A UFO is in the sky!`
  - `ru_RU.lang`: `andrew.ufo.arrival=В небе НЛО!`
- The shoot-down broadcast `andrew.ufo.shot_down` (`%s`) belongs to `sauc`, not here.
- Lang files must keep the UTF-8 encoding of the existing entries.
