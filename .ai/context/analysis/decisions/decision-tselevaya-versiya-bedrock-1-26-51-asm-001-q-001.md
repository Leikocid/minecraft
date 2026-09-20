---
type: "decision"
node_id: "decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001"
source_channel: "cli"
analysis_version: null
title: "Целевая версия Bedrock = 1.26.51 (ASM-001, Q-001)"
aliases: ["decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001"]
is_a: ["decision"]
priority: 500
statement: "Вопрос: какая версия игры на iPad. Решение: на iPad установлена Minecraft Bedrock 1.26.51 (оператор прочитал с устройства 2026-09-20) — текущий стабильный релиз (BDS 1.26.51.1 по download API Mojang, bedrock-samples v1.26.50.4 от 2026-09-16). Целевые значения: min_engine_version [1, 26, 50]; @minecraft/server 2.10.0 (стабильный на npm, опубликован 2026-09-15); Bedrock Dedicated Server 1.26.51.1 в Docker. Preview 1.26.60 не используем. Влияние: спека кирки (2.9.0 / 1.26.0) подгоняется под эти значения; закрывает ASM-001 и Q-001."
decided_at: "2026-09-20"
tags: ["refine","decision"]
size_chars: 533
---

Вопрос: какая версия игры на iPad. Решение: на iPad установлена Minecraft Bedrock 1.26.51 (оператор прочитал с устройства 2026-09-20) — текущий стабильный релиз (BDS 1.26.51.1 по download API Mojang, bedrock-samples v1.26.50.4 от 2026-09-16). Целевые значения: min_engine_version [1, 26, 50]; @minecraft/server 2.10.0 (стабильный на npm, опубликован 2026-09-15); Bedrock Dedicated Server 1.26.51.1 в Docker. Preview 1.26.60 не используем. Влияние: спека кирки (2.9.0 / 1.26.0) подгоняется под эти значения; закрывает ASM-001 и Q-001.
