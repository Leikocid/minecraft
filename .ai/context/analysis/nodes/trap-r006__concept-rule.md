---
type: "concept-rule"
node_id: "L0-trap-r006"
source_channel: "rollout"
title: "R-006 — Deny by default: a cell whose safety is not established is skipped"
aliases: ["L0-trap-r006"]
part_of: ["L0-trap"]
is_a: ["rule"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2001
tags: ["rule","safety","protected-blocks","deny-by-default","L0-trap"]
---

# R-006 — Deny by default: a cell whose safety is not established is skipped

**Links** — `part_of: ["L0-trap"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap-pfil", "L0-trap-ecel", "L0-trap-ad13", "L0-trap-ac03"]`

**Rule.** Each of the 27 cells is classified independently. A cell is filled **only** if it is positively identified as an ordinary replaceable block. Everything else is skipped, including anything the classifier does not recognise. Specifically skipped:

- cells occupied by an **entity** — entities are never removed or replaced;
- cells carrying a **block entity** — chests, barrels, shulker boxes, hoppers, furnaces, brewing stands, signs, spawners and similar containers/functional blocks with contents or data;
- **indestructible or explicitly protected** blocks — bedrock, barrier, command block, end portal frame and the like;
- cells that cannot be read (see R-007);
- **anything else not positively classified as ordinary and replaceable.**

**Source.** §6: *«Не удалять и не заменять сущности. Не заменять контейнеры и функциональные блоки с важным содержимым/данными (например, сундуки и аналогичные block entities). Не заменять bedrock и другие явно защищённые/неразрушаемые специальные блоки.»* · C-8.

**Rationale, and why the default is deny.** §6 names only *examples* — the list is open (ASM-007, Q-013). The two failure directions are not symmetric: too permissive destroys player storage **irrecoverably**, too restrictive yields a weaker trap, which is a tuning bug fixed in one line. So the unknown branch resolves to `skip`, and the list is narrowed only on positive evidence (TC-5).

**Applies to.** `L0-trap-pfil` phase A, and to any future change to the block classifier.

**Open.** The closed deny-list is **Q-013**, refined in `L0-trap__concept-client-question` with a concrete proposal. Do not treat the list above as final.

**Verified by.** `L0-trap-ac03` (§13: *«Контейнер/bedrock внутри объёма не уничтожается; допустимые соседние клетки заполняются»*).
