---
type: "concept-assumption"
node_id: "L0-ufoc-as05"
source_channel: "rollout"
analysis_version: 5
title: "AS-ufoc-5 · The 150-block notice range is horizontal and Overworld-only, sent once at arrival start"
aliases: ["L0-ufoc-as05"]
is_a: ["assumption"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 696
tags: ["is_a:assumption", "messages", "relates_to:L0-ufoc-r005"]
level: 2
---
# AS-ufoc-5 · The 150-block notice range is horizontal and Overworld-only, sent once at arrival start

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r005", "L0-ufoc-ac07"]`

**Spec (§7):** the localized "В небе НЛО!" goes to players within 150 blocks of the centre when the arrival starts.

**Assumed:**
- The distance is horizontal (x/z), so players in deep caves under the centre are told too.
- Only Overworld players get it.
- It is sent once. Players who walk into range later are not told.
- `come` sends it too.

**Impact if wrong:** low. A 3D distance or a later re-notice is a change local to `r005`. Only AC `ac07`'s expected recipient set changes.
