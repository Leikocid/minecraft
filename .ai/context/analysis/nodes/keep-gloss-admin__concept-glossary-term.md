---
type: "concept-glossary-term"
node_id: "L0-keep-gloss-admin"
source_channel: "rollout"
aliases: ["L0-keep-gloss-admin"]
part_of: ["L0-keep"]
is_a: ["glossary-term"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1017
tags: ["glossary-term","L0-keep"]
---

**Admin copy** (a.k.a. **test copy**, **dev copy**) · RU: *«Creative/test copies»*

A Web Sword instance obtained through the Creative inventory or `/give` rather than through a survival craft. §4 permits these to exist in **unlimited numbers**: *«Creative/test copies могут существовать у администратора; one-per-world относится к survival crafting, а не к количеству dev/test copies.»*

Two consequences that the rest of the team must not conflate:
1. Admin copies **do not consume** the world's single survival craft (§3) — an `L0-once` concern.
2. Admin copies are **not death-retained** under `L0-keep-r003` — they drop and can be looted like any ordinary item. An operator testing on a live server will lose one on death. This is intended behaviour, not a bug.

The existence of admin copies alongside an absolute no-dup rule is precisely what makes **CTR-005** a real conflict rather than a gap.

**Antonym**: **bonded sword** — the single survival-crafted, provenance-marked instance that retention protects.
