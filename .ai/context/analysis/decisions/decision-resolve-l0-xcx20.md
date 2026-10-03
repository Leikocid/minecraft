---
type: "decision"
node_id: "decision-resolve-l0-xcx20"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx20: Пробел прогона v4 закрыт прогоном v5 и …"
aliases: ["decision-resolve-l0-xcx20"]
is_a: ["decision"]
relates_to: ["L0-xcx20"]
refs: ["L0-xcx20"]
priority: 500
statement: "Пробел прогона v4 закрыт прогоном v5 и карточкой UFOC-CORE-01-AA (9/9, aef4d54). Сегодня L0-ufoc версии 5, у него 37 артефактов, ac01-ac08 несут теги ufo-ac-1/2/3/17/18. У каждого названного критерия НЛО есть владелец в коде и проверка: окно 10-20 мин и +15 мин (env.ts:23,25-26; ufo-core.ts:324,346,356), тайминг 400/1200/300 (env.ts:20; ufo-core.ts:413-416), hoverY (event.ts:19,104), ожидание без игрока и оповещение 150 блоков (env.ts:66, event.ts:21,304; ufo-core.ts:511,520,536,673), команды и их права (commands.ts:60,64; ufo-core.ts:572,600). Перезапускная половина остаётся задачей UFOC-RESTART-01-AA — она доказана bds-check, но не входит в гейт."
resolves_contradiction: "L0-xcx20"
outcome: "changed"
evidence: ".ai/verify/CNTR-X20-AA/2.json (63 PASS / 0 FAIL); .ai/state/analyst-state.md:19 'L0-ufoc: 5'; aef4d54 Acceptance passed=9 failed=0; docs/feedback/diagnose-CNTR-X20.md"
decided_at: "2026-10-03"
tags: ["refine","resolution"]
size_chars: 656
---

Пробел прогона v4 закрыт прогоном v5 и карточкой UFOC-CORE-01-AA (9/9, aef4d54). Сегодня L0-ufoc версии 5, у него 37 артефактов, ac01-ac08 несут теги ufo-ac-1/2/3/17/18. У каждого названного критерия НЛО есть владелец в коде и проверка: окно 10-20 мин и +15 мин (env.ts:23,25-26; ufo-core.ts:324,346,356), тайминг 400/1200/300 (env.ts:20; ufo-core.ts:413-416), hoverY (event.ts:19,104), ожидание без игрока и оповещение 150 блоков (env.ts:66, event.ts:21,304; ufo-core.ts:511,520,536,673), команды и их права (commands.ts:60,64; ufo-core.ts:572,600). Перезапускная половина остаётся задачей UFOC-RESTART-01-AA — она доказана bds-check, но не входит в гейт.
