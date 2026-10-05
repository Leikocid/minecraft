---
type: "concept-contradiction"
node_id: "L0-sclk-cx02"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-cx02"]
is_a: ["contradiction"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1437
tags: ["contradiction","status:resolved","resolved_by:L0-adr-scfc","fire-rate","adr-scbs","§9","resolved"]
level: 2
closed_at: 2026-10-05
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-sclk-cx02
---

**CX-sclk-02 · `adr-scbs` option A (a bow-like custom shooter) vs §9 "the standard crossbow reload is the weapon's only limiter" (status: resolved at reduce by `L0-adr-scfc`, severity: high)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-adr-scbs", "L0-sclk-r006", "L0-sclk-as05", "L0-sclk-p001", "L0-xq7"]`

**Source A.** §9: there is no cooldown; the weapon's power is limited by the standard crossbow reload and Quick Charge.

**Source B.** `L0-adr-scbs` option A: a custom `minecraft:shooter` "draws and releases like a bow". A bow fires on release at **any** draw fraction, at lower speed. With vanilla arrows that is self-limiting, because damage scales with draw. Here, damage is fixed (C-28) and a block hit always carves a full crater. So a 1–2 tick tap-release spam would deal 10 HP per tap, or carve a crater per tap, several times faster than a crossbow's 1.25 s reload.

**Gap.** Neither the ADR nor `xasm27` sets a minimum charge.

**Proposed default (not self-resolved).**
- Make full charge a gate (r006). An arrow below `MIN_BOLT_SPEED`, or released before the Quick-Charge-adjusted charge time (`as05`), is removed with no bolt; the ammunition stays spent.
- The probe's Q5 measures whether `charge_on_draw` with `max_draw_duration` already prevents early release natively. If it does, this contradiction closes.
- If neither holds reliably, `adr-scbs` falls to option B.

The ADR's own gate list should add Q5.
