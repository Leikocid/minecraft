---
type: "decision"
node_id: "decision-scythe-launch-applyknockback-s-kalibrovannoy-ver"
source_channel: "cli"
analysis_version: null
title: "scythe-launch = applyKnockback с калиброванной вертикальной силой"
aliases: ["decision-scythe-launch-applyknockback-s-kalibrovannoy-ver"]
is_a: ["decision"]
priority: 500
statement: "Решение (автопилот): подброс примерно на 10 блоков (допуск 8–12 на ровной земле) делается одним player.applyKnockback({x:0,z:0}, V). Константу V подобрать замером на BDS 1.26.51.1 — GameTest логирует пиковый location.y симулированного игрока, старт от 2.5. Сопротивление отбрасыванию (незеритовая броня) не компенсируем: бронированная цель летит ниже, это честно. Урон от падения — ванильный."
decided_at: "2026-09-24"
tags: ["refine","decision"]
size_chars: 392
---

Решение (автопилот): подброс примерно на 10 блоков (допуск 8–12 на ровной земле) делается одним player.applyKnockback({x:0,z:0}, V). Константу V подобрать замером на BDS 1.26.51.1 — GameTest логирует пиковый location.y симулированного игрока, старт от 2.5. Сопротивление отбрасыванию (незеритовая броня) не компенсируем: бронированная цель летит ниже, это честно. Урон от падения — ванильный.
