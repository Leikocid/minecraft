---
type: "concept-rule"
node_id: "L0-item-r004"
source_channel: "rollout"
aliases: ["L0-item-r004"]
part_of: ["L0-item"]
is_a: ["rule"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1035
tags: ["rule","passive-behavior","boundary"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["rule"]` · `relates_to: ["L0-trap", "L0-cool"]`

**Rule — Passive behavior is exactly vanilla.** A normal melee attack with the Web Sword must have **no** side effects beyond standard Diamond Sword combat: no cobweb placement, no cooldown consumption, no message. This is achieved by *not attaching any behavior to the attack/hurt event* — the absence of a hook is the correct implementation, not a filtered no-op.

**Rationale.** §7 is explicit: *«У обычного melee-удара нет дополнительного эффекта… не создаёт паутину и не запускает cooldown»*; §13 AC-6 tests it directly.

**Cross-component boundary marker.** This rule constrains `L0-trap` and `L0-cool` as much as this component: their logic must gate on the **Use** event only, never on **hurt/attack**. If either sibling is found listening to an attack-family event, that is a boundary violation to flag upward, not a bug local to that sibling.

**Source:** §7, §13 AC-6; consistent with ASM-006 (parent, `L0-trap`/`L0-cool` scope).
