---
type: "decision"
node_id: "decision-resolve-l0-xcx22"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx22: Снято измерением. Разбор CNTR-X22-AA по…"
aliases: ["decision-resolve-l0-xcx22"]
is_a: ["decision"]
relates_to: ["L0-xcx22"]
refs: ["L0-xcx22"]
priority: 500
statement: "Снято измерением. Разбор CNTR-X22-AA подтвердил окно неуязвимости движка и проверил отгруженный приём истинного урона Косы: applyDamage для отклика и зачёта убийства, затем setCurrentValue(hp − D) на каждый болт. Три болта Multishot, попавшие в пределах окна, вычитают D каждый, то есть T17 выполним без изменения механики — нужен тот же приём, что уже работает у Косы, а не новый."
resolves_contradiction: "L0-xcx22"
outcome: "changed"
evidence: "CNTR-X22-AA 4/4, 5 коммитов с пробой; docs/feedback/diagnose-CNTR-X22.md; слито в main 25514d1"
decided_at: "2026-10-05"
tags: ["refine","resolution"]
size_chars: 381
---

Снято измерением. Разбор CNTR-X22-AA подтвердил окно неуязвимости движка и проверил отгруженный приём истинного урона Косы: applyDamage для отклика и зачёта убийства, затем setCurrentValue(hp − D) на каждый болт. Три болта Multishot, попавшие в пределах окна, вычитают D каждый, то есть T17 выполним без изменения механики — нужен тот же приём, что уже работает у Косы, а не новый.
