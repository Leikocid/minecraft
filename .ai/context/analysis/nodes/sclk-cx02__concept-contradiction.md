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
closed_reason: resolved_by_measurement
closed_by_ref: decision-resolve-l0-sclk-cx02
---

**CX-sclk-02 · `adr-scbs` option A (a bow-like custom shooter) vs §9 "the standard crossbow reload is the weapon's only limiter" (status: resolved at reduce by `L0-adr-scfc`, severity: high)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-adr-scbs", "L0-sclk-r006", "L0-sclk-as05", "L0-sclk-p001", "L0-xq7"]`

**Source A.** §9: there is no cooldown; the weapon's power is limited by the standard crossbow reload and Quick Charge.

**Source B (as written).** `L0-adr-scbs` option A: a custom `minecraft:shooter` "draws and releases like a bow", so a 1–2 tick tap-release spam would deal 10 HP per tap several times faster than a crossbow's 1.25 s reload.

**Measured (Q5, 2026-10-05).** The premise is false. With `charge_on_draw: true` the custom shooter holds a loaded state: it loads at `max_draw_duration` and fires on the **next** press, like a crossbow, and a release before that fires nothing and spends nothing. Every fired arrow leaves at full speed (2.965–3.041), so there are no under-charged arrows to gate on. Without `charge_on_draw` and without `scale_power` a bare tap gives a full-power bolt — that flag is what carries the limit.

**Resolution (by measurement).** `max_draw_duration` with `charge_on_draw` **is** the native gate, so §9 holds with no script. A speed gate is impossible and unnecessary: there is no slow arrow to catch. Quick Charge has no native effect, so if it must shorten the load it is script work — set the native draw to the QC III floor (0.5 s) and hold each load to 25 − 5·level ticks of the loading draw, removing the arrow fired by the next press when the load was shorter.
