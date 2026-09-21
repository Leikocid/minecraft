---
type: "decision"
node_id: "decision-q-009-cooldown-persistence-sohranyat-mezhdu-vyho"
source_channel: "cli"
analysis_version: null
title: "Q-009 cooldown-persistence = сохранять между выходом и входом"
aliases: ["decision-q-009-cooldown-persistence-sohranyat-mezhdu-vyho"]
is_a: ["decision"]
priority: 500
statement: "Решение (автопилот): cooldown хранится как dynamic property игрока — момент окончания в тиках мира (world.getAbsoluteTime), переживает reconnect и рестарт. Reconnect не даёт преимущества (C-7)."
decided_at: "2026-09-21"
tags: ["refine","decision"]
size_chars: 193
---

Решение (автопилот): cooldown хранится как dynamic property игрока — момент окончания в тиках мира (world.getAbsoluteTime), переживает reconnect и рестарт. Reconnect не даёт преимущества (C-7).
