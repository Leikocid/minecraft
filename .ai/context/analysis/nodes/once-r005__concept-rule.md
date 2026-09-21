---
type: "concept-rule"
node_id: "L0-once-r005"
source_channel: "rollout"
aliases: ["L0-once-r005"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1701
tags: ["rule","refund","ingredients","CTR-003","L0-once"]
---

**R-005 — A blocked craft must not silently tax the player.**

Source: §3 — *«повторный survival-крафт должен быть заблокирован без потери ингредиентов, насколько это позволяет стабильный API.»*

Two obligations, of different strength:

1. **Absolute** — the player obtains no second `andrew:web_sword`. The crafted result is removed. No escape clause applies to this half.
2. **Conditional** — the 4× Cobweb and 1× Diamond Sword are returned, *to the extent the stable API permits*. This is the only requirement in the entire spec carrying a built-in get-out, and the only one with **no corresponding §13 acceptance test** (CTR-003, open, inherited from L0).

**Preference order** (see `L0-once-pblk` for the full ladder): pre-craft veto > detect-and-refund > blocked-and-consumed.

**Floor.** If the implementation lands on "blocked-and-consumed", it **must** emit the localized denial message (`andrew.web_sword.already_crafted`) so the player learns why the ingredients vanished. A Diamond Sword per attempt is not a trivial cost, and silent consumption is the failure mode CTR-003 was filed to prevent.

**Do not self-resolve.** The owner must rank the fallbacks and the winner must be added to §13 as a testable criterion. Until then `L0-once-accp7` is written as conditional. An implementation that ships rung 3 while documenting rung 2 is a defect regardless of which rung the owner picks.

**Rationale.** As written, an implementation that eats a Diamond Sword on every blocked attempt passes §13 and §14 in full. The spec's own acceptance suite cannot detect the difference, so the rule has to carry it.

**Verified by:** `L0-once-accp2` (absolute half), `L0-once-accp7` (conditional half).
