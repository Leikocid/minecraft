---
type: "decision"
node_id: "decision-yazyk-skriptov-typescript-asm-003-q-003"
source_channel: "cli"
analysis_version: null
title: "Язык скриптов = TypeScript (ASM-003, Q-003)"
aliases: ["decision-yazyk-skriptov-typescript-asm-003-q-003"]
is_a: ["decision"]
priority: 500
statement: "Вопрос: TypeScript или JavaScript. Решение: TypeScript. Обоснование: компиляция против типов @minecraft/server 2.10.0 ловит несовместимости API на Маке до дорогого цикла сборка→Docker→iPad. Влияние: npm run build = tsc/esbuild + валидация JSON + упаковка .mcaddon. Закрывает ASM-003 и Q-003."
decided_at: "2026-09-20"
tags: ["refine","decision"]
size_chars: 291
---

Вопрос: TypeScript или JavaScript. Решение: TypeScript. Обоснование: компиляция против типов @minecraft/server 2.10.0 ловит несовместимости API на Маке до дорогого цикла сборка→Docker→iPad. Влияние: npm run build = tsc/esbuild + валидация JSON + упаковка .mcaddon. Закрывает ASM-003 и Q-003.
