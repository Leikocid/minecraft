---
type: "decision"
node_id: "decision-resolve-l0-xcx18"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx18: Правило изменено оператором, код ему со…"
aliases: ["decision-resolve-l0-xcx18"]
is_a: ["decision"]
relates_to: ["L0-xcx18"]
refs: ["L0-xcx18"]
priority: 500
statement: "Правило изменено оператором, код ему соответствует. Спека НЛО (коммит 2441fb5, 2026-10-02) и decision-resolve-l0-lgnd-cx13 заменили вариант (a) на правило по содержимому: воронка с чем угодно внутри — контейнер и остаётся, пустая — притягиваемый блок класса 4. В коде ровно это: iron.ts:140-141 blockRole выбирает по содержимому, magnet-select.ts:237 передаёт isEmpty. Доказано сценариями ufo_magnet_blocks (пустая воронка -> воздух + предмет), ufo_magnet_containers (непустая остаётся), ufo_magnet_legendaries (воронка с Пушкой остаётся). Легендарка на волю выйти не может: воронка с ней непуста. Остаётся подчистка знания (KV-CLEANUP-CNTR2-AA); требование protectLegendariesIn имеет ноль случаев и кодом не пишется."
resolves_contradiction: "L0-xcx18"
outcome: "changed"
evidence: ".ai/verify/CNTR-X18-AA/2.json (exit 0); MAGN-SCAN-01-AA/1.json, MAGN-HOLD-01-AA/1.json, SAUC-SHOOT-01-AA/2.json и 3.json на 27a2f01; docs/feedback/diagnose-CNTR-X18.md"
decided_at: "2026-10-03"
tags: ["refine","resolution"]
size_chars: 717
---

Правило изменено оператором, код ему соответствует. Спека НЛО (коммит 2441fb5, 2026-10-02) и decision-resolve-l0-lgnd-cx13 заменили вариант (a) на правило по содержимому: воронка с чем угодно внутри — контейнер и остаётся, пустая — притягиваемый блок класса 4. В коде ровно это: iron.ts:140-141 blockRole выбирает по содержимому, magnet-select.ts:237 передаёт isEmpty. Доказано сценариями ufo_magnet_blocks (пустая воронка -> воздух + предмет), ufo_magnet_containers (непустая остаётся), ufo_magnet_legendaries (воронка с Пушкой остаётся). Легендарка на волю выйти не может: воронка с ней непуста. Остаётся подчистка знания (KV-CLEANUP-CNTR2-AA); требование protectLegendariesIn имеет ноль случаев и кодом не пишется.
