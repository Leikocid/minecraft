---
type: "concept-glossary-term"
node_id: "L0-keep-gloss-prov"
source_channel: "rollout"
aliases: ["L0-keep-gloss-prov"]
part_of: ["L0-keep"]
is_a: ["glossary-term"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 887
tags: ["glossary-term","conditional","blocked:Q-006","L0-keep"]
---

**Provenance marker** · *(conditional — pending Q-006)*

A durable per-instance attribute on a Web Sword item stack recording **how it entered the world**: `survival_craft` when set at craft time, **absent** for Creative and `/give` copies. Full definition: `L0-keep-ent2`.

Not specified anywhere in the source spec. It is the requirement **CTR-005 shows to be implied** by holding §4 (always return it to the owner) and §14 (no dup paths) together while §3 permits unlimited admin copies. Without it, the restore predicate cannot distinguish *"the owner's sword"* from *"a Web Sword"*, and any implementation breaks one of the two rules.

A sword carrying the marker is **bonded**; one without it is an **admin copy**.

**Depends on**: Q-006 (`BLOCKER`) — may instances carry such a marker at all? Recommended answer: yes.
**Synonyms**: instance provenance, craft marker, bonding tag.
