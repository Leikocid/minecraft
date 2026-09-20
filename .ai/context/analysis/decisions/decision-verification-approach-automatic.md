---
type: "decision"
node_id: "decision-verification-approach-automatic"
source_channel: "cli"
analysis_version: null
title: "verification_approach = automatic"
aliases: ["decision-verification-approach-automatic"]
is_a: ["decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 500
statement: "Rationale: решение оператора 2026-09-20 — полный автопилот. Проверка автоматическая: канал build (tsc против типов @minecraft/server 2.10.0, валидация JSON, сборка .mcaddon) и канал bds (Bedrock Dedicated Server 1.26.51.1 в Docker: загрузка пакета без ошибок манифеста/зависимостей, исполнение скрипта подтверждается логом сервера). Человек не участвует, если всё зелёное. Канал ipad остаётся только для того, что движок сервера физически не покрывает (визуал: иконка, название в креативе) — такие критерии планировать минимально и как manual; они не блокируют мерж. Impact: /plan типизирует критерии как build/unit/e2e везде, где проверку можно выполнить на Маке или BDS; /verify закрывает их артефактами run-check без участия оператора."
decided_at: "2026-09-20"
tags: ["refine","decision"]
size_chars: 738
---

Rationale: решение оператора 2026-09-20 — полный автопилот. Проверка автоматическая: канал build (tsc против типов @minecraft/server 2.10.0, валидация JSON, сборка .mcaddon) и канал bds (Bedrock Dedicated Server 1.26.51.1 в Docker: загрузка пакета без ошибок манифеста/зависимостей, исполнение скрипта подтверждается логом сервера). Человек не участвует, если всё зелёное. Канал ipad остаётся только для того, что движок сервера физически не покрывает (визуал: иконка, название в креативе) — такие критерии планировать минимально и как manual; они не блокируют мерж. Impact: /plan типизирует критерии как build/unit/e2e везде, где проверку можно выполнить на Маке или BDS; /verify закрывает их артефактами run-check без участия оператора.
