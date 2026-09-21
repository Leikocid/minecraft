---
type: "concept-rule"
node_id: "L0-cool-r005"
source_channel: "rollout"
aliases: ["L0-cool-r005"]
part_of: ["L0-cool"]
is_a: ["rule"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 1083
tags: ["rule","localization","L0-cool"]
level: 2
---

**R-cool-005 — Countdown text is a translate key, never a literal.**

Source: C-9 (inherited), ADR-009 (inherited) — *«Использовать стандартную систему локализации Resource Pack, а не жёстко вшивать только один язык в скрипт»* (§10).

The actionbar string is emitted as rawtext with a `translate` key sourced from `L0-item`'s `.lang` catalogue and a `with` substitution for the remaining-seconds value. No hardcoded RU or EN string may appear anywhere in this component's code.

**Consequences:**
- This component requests a key from `L0-item` (e.g. `item.andrew:web_sword.cooldown`); it does not define the key itself (ownership rule from the decomposition plan: *"Localization ownership is central, use is distributed"*).
- Any new user-facing string this component introduces in the future is a `.lang` addition landed jointly with `L0-item`, never a standalone literal.

**Rationale.** Runtime messages are explicitly in scope for C-9, not just the item name — the decomposition plan calls this out by name for the cooldown readout specifically.

**Verified by:** `L0-cool-ac03`.
