---
type: "concept-glossary-term"
node_id: "L0-trap-greh"
source_channel: "rollout"
aliases: ["L0-trap-greh"]
part_of: ["L0-trap"]
is_a: ["glossary-term"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 747
tags: ["glossary","L0-trap"]
---

**Reach** *(reach-зона, допустимая дистанция)*

The maximum distance from the activating player at which a target may resolve. Defined by the spec as **ordinary survival interaction/melee reach** — *«без искусственного дальнего луча»* (§5). A candidate beyond it is not a target: the activation fails and costs nothing (R-002, R-004).

Reach is the ability's balance lever and the spec guards it in three places (§5, §12, and the L0 boundary's "excluded by decision" list). It is implemented as **one named constant** used both for the ray length and for the final bound-check.

The concrete numeric value, and whether Creative-mode reach differs, are **ASM-017** — unresolved.

**Synonyms**: interaction reach, melee reach, допустимая дистанция.
