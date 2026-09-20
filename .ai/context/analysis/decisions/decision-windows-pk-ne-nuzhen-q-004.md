---
type: "decision"
node_id: "decision-windows-pk-ne-nuzhen-q-004"
source_channel: "cli"
analysis_version: null
title: "Windows-ПК не нужен (Q-004)"
aliases: ["decision-windows-pk-ne-nuzhen-q-004"]
is_a: ["decision"]
priority: 500
statement: "Вопрос: нужен ли Windows-ПК как запасной вариант. Решение: нет. Цикл разработки: Mac (сборка, статика) → BDS в Docker (лог движка) → iPad (проверка глазами). Пересмотреть только если BDS под Rosetta на M4 Pro окажется нестабильным. Закрывает Q-004."
decided_at: "2026-09-20"
tags: ["refine","decision"]
size_chars: 248
---

Вопрос: нужен ли Windows-ПК как запасной вариант. Решение: нет. Цикл разработки: Mac (сборка, статика) → BDS в Docker (лог движка) → iPad (проверка глазами). Пересмотреть только если BDS под Rosetta на M4 Pro окажется нестабильным. Закрывает Q-004.
