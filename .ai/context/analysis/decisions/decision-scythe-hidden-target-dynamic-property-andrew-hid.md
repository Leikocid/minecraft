---
type: "decision"
node_id: "decision-scythe-hidden-target-dynamic-property-andrew-hid"
source_channel: "cli"
analysis_version: null
title: "scythe-hidden-target = dynamic property andrew:hidden_until, ваниль-невидимость целью остаётся"
aliases: ["decision-scythe-hidden-target-dynamic-property-andrew-hid"]
is_a: ["decision"]
priority: 500
statement: "Решение (автопилот): предикат isHiddenFromTargeting(player) читает dynamic property игрока andrew:hidden_until (метка времени Date.now(), тот же часовой механизм, что у кулдауна). Пока Теневого клинка нет, свойство никто не ставит, кроме тестовой команды. Обычная ванильная невидимость (зелье) цель НЕ исключает — иначе дешёвое зелье становится контрой легендарному оружию, чего спека не просит. Когда появится спека Теневого клинка, меняется только тело предиката."
decided_at: "2026-09-24"
tags: ["refine","decision"]
size_chars: 465
---

Решение (автопилот): предикат isHiddenFromTargeting(player) читает dynamic property игрока andrew:hidden_until (метка времени Date.now(), тот же часовой механизм, что у кулдауна). Пока Теневого клинка нет, свойство никто не ставит, кроме тестовой команды. Обычная ванильная невидимость (зелье) цель НЕ исключает — иначе дешёвое зелье становится контрой легендарному оружию, чего спека не просит. Когда появится спека Теневого клинка, меняется только тело предиката.
