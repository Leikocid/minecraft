---
type: "decision"
node_id: "decision-resolve-l0-sclk-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-sclk-cx01: Разобрано. Движок не даёт отменить нало…"
aliases: ["decision-resolve-l0-sclk-cx01"]
is_a: ["decision"]
relates_to: ["L0-sclk-cx01"]
refs: ["L0-sclk-cx01"]
priority: 500
statement: "Разобрано. Движок не даёт отменить наложение Piercing наковальней или столом зачарований: minecraft:enchantable.slot принимает целый ванильный слот, и стабильный 2.10.0 не может отвергнуть результат. T15 выполняется в чтении «снимается в тот же тик, когда попало в инвентарь», а не «нельзя наложить»; это отклонение по C-16 и оно идёт в список отклонений README арбалета."
resolves_contradiction: "L0-sclk-cx01"
outcome: "changed"
evidence: "CNTR-SCLK-CX01-AA 4/4, 2 коммита; docs/feedback/diagnose-CNTR-SCLK-CX01.md; слито в main 25514d1"
decided_at: "2026-10-05"
tags: ["refine","resolution"]
size_chars: 371
---

Разобрано. Движок не даёт отменить наложение Piercing наковальней или столом зачарований: minecraft:enchantable.slot принимает целый ванильный слот, и стабильный 2.10.0 не может отвергнуть результат. T15 выполняется в чтении «снимается в тот же тик, когда попало в инвентарь», а не «нельзя наложить»; это отклонение по C-16 и оно идёт в список отклонений README арбалета.
