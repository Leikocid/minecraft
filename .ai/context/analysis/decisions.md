---
title: Decisions
type: analysis
generated_at: "2026-09-20T16:22:35.867Z"
source_channel: rollout
node_id: rollout-decisions
aliases: ["rollout-decisions","decisions"]
is_a: ["rollout","decisions"]
relates_to: ["decision-namespace-addona-andrew-asm-002-q-002","decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001","decision-windows-pk-ne-nuzhen-q-004","decision-yazyk-skriptov-typescript-asm-003-q-003","decision-zacharovanie-bez-durability-proverit-pervoy-zada"]
priority: 120
---

# Decisions

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.
>
> Решения — override'ы над анализом. Каждое решение фиксируется скиллом `/refine` (CLI `ai-kit refine decision …`) и далее направляет `/plan` и `/execute`.

## Namespace аддона = andrew (ASM-002, Q-002) (decision-namespace-addona-andrew-asm-002-q-002)

_Decided: 2026-09-20_


Вопрос: имя аддона / namespace. Решение: namespace andrew. Все ID предметов, рецептов, ключи .lang и имена пакетов идут с префиксом andrew: (например andrew:miners_pickaxe). Обоснование: предложено в документе этапа 0, оператор не возразил; решено до первого коммита, пока переименование бесплатно. Закрывает ASM-002 и Q-002.





## Целевая версия Bedrock = 1.26.51 (ASM-001, Q-001) (decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001)

_Decided: 2026-09-20_


Вопрос: какая версия игры на iPad. Решение: на iPad установлена Minecraft Bedrock 1.26.51 (оператор прочитал с устройства 2026-09-20) — текущий стабильный релиз (BDS 1.26.51.1 по download API Mojang, bedrock-samples v1.26.50.4 от 2026-09-16). Целевые значения: min_engine_version [1, 26, 50]; @minecraft/server 2.10.0 (стабильный на npm, опубликован 2026-09-15); Bedrock Dedicated Server 1.26.51.1 в Docker. Preview 1.26.60 не используем. Влияние: спека кирки (2.9.0 / 1.26.0) подгоняется под эти значения; закрывает ASM-001 и Q-001.





## Windows-ПК не нужен (Q-004) (decision-windows-pk-ne-nuzhen-q-004)

_Decided: 2026-09-20_


Вопрос: нужен ли Windows-ПК как запасной вариант. Решение: нет. Цикл разработки: Mac (сборка, статика) → BDS в Docker (лог движка) → iPad (проверка глазами). Пересмотреть только если BDS под Rosetta на M4 Pro окажется нестабильным. Закрывает Q-004.





## Язык скриптов = TypeScript (ASM-003, Q-003) (decision-yazyk-skriptov-typescript-asm-003-q-003)

_Decided: 2026-09-20_


Вопрос: TypeScript или JavaScript. Решение: TypeScript. Обоснование: компиляция против типов @minecraft/server 2.10.0 ловит несовместимости API на Маке до дорогого цикла сборка→Docker→iPad. Влияние: npm run build = tsc/esbuild + валидация JSON + упаковка .mcaddon. Закрывает ASM-003 и Q-003.





## Зачарование без durability — проверить первой задачей этапа 1 (ASM-004, Q-005) (decision-zacharovanie-bez-durability-proverit-pervoy-zada)

_Decided: 2026-09-20_


Вопрос: принимает ли предмет без компонента minecraft:durability чары через minecraft:enchantable (slot pickaxe). Решение: проверить эмпирически первой задачей этапа 1 — стол зачарования и наковальня на iPad. Рабочая гипотеза: да, enchantable от durability не зависит. Если нет — спека кирки меняется (durability + защита от поломки или отказ от чар); это изменение спеки, а не баг. Закрывает ASM-004 и Q-005 как решение о способе проверки.





