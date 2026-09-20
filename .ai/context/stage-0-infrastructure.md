---
type: "raw-fragment"
node_id: "stage-0-infrastructure"
source_channel: "raw-import"
level: null
aliases: ["stage-0-infrastructure"]
is_a: ["raw-fragment"]
priority: 110
size_chars: 2931
tags: ["devops", "api", "performance", "integration"]
source: ".ai/inbox/stage-0-infrastructure.md"
embed_lines: "1-45"
embed_slice: "1-45"
---
# Этап 0 — инфраструктура разработки Bedrock-аддона

Цель: до прототипа «Кирки шахтёра» доказать, что процесс разработки работает end-to-end на имеющемся железе (Mac mini + iPad), выкатив минимальный «полупустой» аддон. Прототип из `Miners_Pickaxe_Test_Spec` начинается только после закрытия этого этапа.

## Решения (2026-09-20)

- Платформа: **Minecraft Bedrock Edition**. Java Edition исключена — целевое устройство iPad, Java там не работает.
- Только **стабильный** Script API (`@minecraft/server` 2.9.0, при необходимости 2.10.0 — текущий stable на npm). Beta/Preview API не включаем.
- Этапы проекта: **0** — инфраструктура (этот документ); **1** — тестовый аддон «Кирка шахтёра» (см. `Miners_Pickaxe_Test_Spec`); **2** — основной PvP-аддон (требования ещё не сформулированы).
- Язык скриптов: TypeScript (предложение; см. открытые вопросы).

## Окружение

| Где | Что | Роль |
|---|---|---|
| Mac mini (Apple M4 Pro, macOS, Docker установлен) | Node.js, TypeScript, типы `@minecraft/server` с npm, сборка `.mcaddon` | разработка, статическая проверка, сборка |
| Docker на Mac | Bedrock Dedicated Server (образ `itzg/minecraft-bedrock-server`, `linux/amd64` через Rosetta) | загрузка пакета, лог ошибок манифеста и скриптов, LAN-сервер для iPad |
| iPad | Minecraft Bedrock (App Store) | финальная проверка глазами: импорт `.mcaddon`, Content Log GUI |
| Windows-ПК | нет | не требуется; опционально Parallels с Windows |

Клиента Bedrock под macOS не существует — на Маке только сборка, статика и сервер.

## Минимальный аддон (deliverable)

- Behavior pack + resource pack, по одному манифесту, зависимость от `@minecraft/server`.
- Один скрипт: при входе игрока в мир пишет сообщение в чат (`world.afterEvents.playerSpawn`, `initialSpawn`) — доказательство, что скрипты исполняются.
- Один тривиальный предмет с русским и английским названием и своей иконкой — доказательство, что resource pack и локализация подхватываются. Не кирка, любой пустой предмет.
- Сборка одной командой: `npm run build` → `dist/<name>.mcaddon`.
- README с описанием цикла «собрать → сервер в Docker → iPad».

## Критерии прохождения этапа

1. `npm run build` собирает `.mcaddon` из чистого клона; TypeScript компилируется без ошибок против типов `@minecraft/server`.
2. JSON манифестов и предмета проходят валидацию.
3. BDS в Docker стартует с пакетом: в логе нет ошибок зависимостей/манифеста, скрипт исполняется.
4. iPad: `.mcaddon` импортируется без ошибок; в мире с включённым пакетом при входе появляется сообщение; предмет виден в креативе с русским и английским названием.
5. Проект в git с первым коммитом.

## Открытые вопросы

- Точная версия игры на iPad (Настройки → номер версии внизу главного меню) — от неё зависят `min_engine_version` и версия BDS.
- Имя аддона / namespace (например `andrew`), название пакета.
- TypeScript (предлагается) или чистый JavaScript.
- Нужен ли Windows-ПК как запасной вариант — по умолчанию нет.
