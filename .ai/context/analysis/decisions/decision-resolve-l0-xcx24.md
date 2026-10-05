---
type: "decision"
node_id: "decision-resolve-l0-xcx24"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx24: Закрыто кодом. LGND-PASSIVE-01-AA отгру…"
aliases: ["decision-resolve-l0-xcx24"]
is_a: ["decision"]
relates_to: ["L0-xcx24"]
refs: ["L0-xcx24"]
priority: 500
statement: "Закрыто кодом. LGND-PASSIVE-01-AA отгрузила вариант C решения L0-lgnd-ad15: размеченное объединение Active | Passive, hasAbility в hud.ts и hands.ts, defForAbility только по активным записям. Запись без способности не появляется в HUD, не участвует в разборе нажатия и не получает ключа кулдауна; записи #1-#4 сохраняют побайтно те же ключи. Варианты A и B были измерены и отвергнуты: A не меняет поведения вовсе (79 ошибок типов, запись всё равно рисует HUD), B схлопывает ключи кулдауна всех четырёх в andrew:cd_undefined — один общий кулдаун на все легендарки."
resolves_contradiction: "L0-xcx24"
outcome: "changed"
evidence: "LGND-PASSIVE-01-AA 5/5; .ai/verify/LGND-PASSIVE-01-AA/3.red.json — красное до правки, 1.json и 4.json зелёные; docs/feedback/diagnose-CNTR-X24.md; слито в main 27fbeee"
decided_at: "2026-10-05"
tags: ["refine","resolution"]
size_chars: 563
---

Закрыто кодом. LGND-PASSIVE-01-AA отгрузила вариант C решения L0-lgnd-ad15: размеченное объединение Active | Passive, hasAbility в hud.ts и hands.ts, defForAbility только по активным записям. Запись без способности не появляется в HUD, не участвует в разборе нажатия и не получает ключа кулдауна; записи #1-#4 сохраняют побайтно те же ключи. Варианты A и B были измерены и отвергнуты: A не меняет поведения вовсе (79 ошибок типов, запись всё равно рисует HUD), B схлопывает ключи кулдауна всех четырёх в andrew:cd_undefined — один общий кулдаун на все легендарки.
