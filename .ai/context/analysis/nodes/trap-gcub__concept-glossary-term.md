---
type: "concept-glossary-term"
node_id: "L0-trap-gcub"
source_channel: "rollout"
aliases: ["L0-trap-gcub"]
part_of: ["L0-trap"]
is_a: ["glossary-term"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 746
tags: ["glossary","L0-trap"]
---

**Cobweb cube** *(куб паутины 3×3×3)* — also **the trap**

The 27-cell volume centred on the target point, into which the ability writes real vanilla `minecraft:web` blocks (§5). Working geometry: centre ± 1 on each axis, centre cell included (ASM-008, contested by **Q-011**).

Key properties:

- **Real vanilla cobweb** — no custom block, no marker, no owner. It interacts with everyone by normal Minecraft rules (§9).
- **Permanent** — no expiry timer. It stays until players clear it (§5). Cleanup is out of scope by decision.
- **Partial is normal** — protected, occupied or unloaded cells are skipped and the rest are filled anyway (§6). A cube of 19 cells is a success, not a failure (R-005).

**Synonyms**: 3×3×3 cube, the trap, ловушка.
