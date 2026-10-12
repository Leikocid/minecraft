---
type: "concept-contradiction"
node_id: "L0-xcx34"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "CX-L0-34 · A \"replaced\" plate must not teleport, but blocks have no identity"
aliases: ["L0-xcx34"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 2591
tags: ["v11", "pearl-rod", "spec-vs-engine", "status:open"]
---
---
title: "CX-L0-34 · A \"replaced\" plate must not teleport, but blocks have no identity"
aliases: ["L0-xcx34", "Plate identity"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-adr-prbd", "L0-xasm42"]
see_also: ["underwaterbowfinalspecv3ruen-part-2", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
---
# CX-L0-34 · A "replaced" plate must not teleport, but blocks have no identity

**Side A (spec v3).**
- §7: record "тип/идентичность блока" (the block's type/identity).
- "Если плита сломана/заменена — привязка недействительна, телепортации нет" (if the plate is broken or replaced, the binding is void and there is no teleport).
- §8: "Destroyed/replaced plates do not teleport."

**Side B (engine, stable 2.10.0).**
- A block is only a position plus a permutation. It has no instance id.
- An oak plate broken and re-placed as an oak plate at the same position reads exactly as the original.
- The permutation is no help either: `redstone_signal` changes whenever the plate is pressed.
- Several replacement paths raise **no event a script sees**: `/setblock`, `/fill`, `/clone`, structure loads, and other add-ons' `setType`. Pistons cannot move plates, but they pop them.

**What is detectable.**
- A replacement by a **different** type: the typeId check at teleport time.
- A plate that is **missing**: the typeId is no longer `*pressure_plate`.
- A same-type replacement **through an observed path**: `playerBreakBlock`, `blockExplode`, `pistonActivate`, and the support block broken under the plate. Each of these bumps a per-position **plate generation** counter in a world dynamic property, and the binding records the generation it saw.
- A same-type replacement through an unobserved path is **not detectable**. That rod still teleports.

**Impact.** One §8 bullet ("replaced plates do not teleport") is fully met only for different-type and observed replacements. Claiming more would breach C-44 / C-16.

**Default until answered (`xasm42`).**
- Ship the typeId check plus the observed-path generation counter.
- List "a same-type plate replaced by commands or structure loads is indistinguishable" as a reported limitation in the release notes and the acceptance sheet.
- The `bds` scenarios cover a player break and re-place of the same type, an explosion, and a different-type `/setblock`.

**Closes when** the `pear` deep-dive confirms the observed-path list on 1.26.51 and Andrey accepts the limitation through the acceptance sheet. No separate question is needed unless the deep-dive finds a cheaper complete signal.
