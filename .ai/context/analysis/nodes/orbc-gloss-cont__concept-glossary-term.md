---
type: "concept-glossary-term"
node_id: "L0-orbc-gloss-cont"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-orbc-gloss-cont"]
is_a: ["glossary-term"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 414
tags: ["is_a:glossary-term", "relates_to:L0-orbc-r008", "relates_to:L0-orbc-r014"]
level: 3
---
**Contact block / detonation point**

A *contact block* is any block that stops a falling charge: not air, not a liquid, and not in the pass-through set (`L0-orbc-as03`).

The *detonation point* is the integer location of the first contact block the charge sweeps, or of its spawn cell when it spawns inside one. That point is handed to `onDetonate`.

**Synonyms:** точка срабатывания, "actual trigger point" (§9).
