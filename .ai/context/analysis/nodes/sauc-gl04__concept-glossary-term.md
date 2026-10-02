---
type: "concept-glossary-term"
node_id: "L0-sauc-gl04"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-sauc-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 420
tags: ["is_a:glossary-term", "orbc-seam"]
level: 2
---
**Interceptor** / **`intercepted` outcome**

A callback registered on the Orbital charge flight loop (`registerInterceptor`, `L0-adr-ufoi`). It sees each charge's swept segment per tick and can end the charge mid-air. The charge then ends with the new `Outcome` value `"intercepted"`: it is removed and no effect runs. The saucer's hull test is the only interceptor.

**Synonyms:** absorption ("the charge is absorbed").
