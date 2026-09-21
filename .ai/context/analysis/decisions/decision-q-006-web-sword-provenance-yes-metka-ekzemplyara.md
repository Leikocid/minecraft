---
type: "decision"
node_id: "decision-q-006-web-sword-provenance-yes-metka-ekzemplyara"
source_channel: "cli"
analysis_version: null
title: "Q-006 web-sword-provenance = yes: метка экземпляра на предмете"
aliases: ["decision-q-006-web-sword-provenance-yes-metka-ekzemplyara"]
is_a: ["decision"]
priority: 500
statement: "Решение оператора (автопилот, 2026-09-21): экземпляр Web Sword несёт durable-метку — dynamic properties на ItemStack: andrew:ws_origin (craft|admin), andrew:ws_owner (id игрока), andrew:ws_id (уникальный id). Метку пишет обработчик крафта (L0-once) через общий модуль, которым владеет L0-keep (ADR-016). Death retention действует только для помеченных экземпляров. Копии из креативного инвентаря метки не имеют, не удерживаются при смерти и право крафта не тратят. Операторская команда /andrew:websword give [player] выдаёт помеченную копию origin=admin: удерживается при смерти (для тестов retention), право не тратит. Закрывает CTR-005 и CTR-009. Impact: L0-keep, L0-once, L0-item (ключи), L0-qatg."
decided_at: "2026-09-21"
tags: ["refine","decision"]
size_chars: 700
---

Решение оператора (автопилот, 2026-09-21): экземпляр Web Sword несёт durable-метку — dynamic properties на ItemStack: andrew:ws_origin (craft|admin), andrew:ws_owner (id игрока), andrew:ws_id (уникальный id). Метку пишет обработчик крафта (L0-once) через общий модуль, которым владеет L0-keep (ADR-016). Death retention действует только для помеченных экземпляров. Копии из креативного инвентаря метки не имеют, не удерживаются при смерти и право крафта не тратят. Операторская команда /andrew:websword give [player] выдаёт помеченную копию origin=admin: удерживается при смерти (для тестов retention), право не тратит. Закрывает CTR-005 и CTR-009. Impact: L0-keep, L0-once, L0-item (ключи), L0-qatg.
