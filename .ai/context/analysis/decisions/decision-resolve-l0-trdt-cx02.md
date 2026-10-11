---
type: "decision"
node_id: "decision-resolve-l0-trdt-cx02"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-trdt-cx02: Закрыто на свёртке v9: оба решения L0 и…"
aliases: ["decision-resolve-l0-trdt-cx02"]
is_a: ["decision"]
relates_to: ["L0-trdt-cx02"]
refs: ["L0-trdt-cx02"]
priority: 500
statement: "Закрыто на свёртке v9: оба решения L0 исправлены на месте. Порядок броска теперь запись в журнал -> очистка руки -> запуск; про общий помощник урона записано, что raiseHit для брошенного попадания не годится."
resolves_contradiction: "L0-trdt-cx02"
outcome: "changed"
evidence: "Прочитано при свёртке v9: src/storm/damage.ts:338 raiseHit выходит на попадании без ближнего боя. Правки внесены в L0-adr-twth §2 и L0-adr-twlt §2."
decided_at: "2026-10-11"
tags: ["refine","resolution"]
size_chars: 208
---

Закрыто на свёртке v9: оба решения L0 исправлены на месте. Порядок броска теперь запись в журнал -> очистка руки -> запуск; про общий помощник урона записано, что raiseHit для брошенного попадания не годится.
