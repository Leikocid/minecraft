---
type: "decision"
node_id: "decision-resolve-l0-xcx14"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-xcx14: Закрыто решением decision-vvod-orbitaln…"
aliases: ["decision-resolve-l0-xcx14"]
is_a: ["decision"]
relates_to: ["L0-xcx14"]
refs: ["L0-xcx14"]
priority: 500
statement: "Закрыто решением decision-vvod-orbitalnoy-pushki: удар ловится через playerSwingStart, применение через itemUse, цель — блок события с лучом (maxDistance 10) как запасным. Посылки опровергнуты измерением: сервер дальность не режет (22/22 на всех дистанциях), playerSwingStart стабилен и приходит при ударе в пустоту, луч находит блок при 9.5 и не находит при 10.5. Маркер спекой не запрещён, а объявлен ненужным; частица добавляется только если подсветка на iPad не достанет. Остаток — наблюдение раскладки управления на устройстве — идёт критерием приёмки демо Пушки."
resolves_contradiction: "L0-xcx14"
outcome: "changed"
evidence: "Прибор src/gametest/probe-input.ts, три GameTest; артефакт run-check .ai/verify/CNTR-XCX14-AA/2.json, exit 0, 3/3, два прогона совпали на 122 шагах; отчёт docs/feedback/diagnose-CNTR-XCX14-AA.md"
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 568
---

Закрыто решением decision-vvod-orbitalnoy-pushki: удар ловится через playerSwingStart, применение через itemUse, цель — блок события с лучом (maxDistance 10) как запасным. Посылки опровергнуты измерением: сервер дальность не режет (22/22 на всех дистанциях), playerSwingStart стабилен и приходит при ударе в пустоту, луч находит блок при 9.5 и не находит при 10.5. Маркер спекой не запрещён, а объявлен ненужным; частица добавляется только если подсветка на iPad не достанет. Остаток — наблюдение раскладки управления на устройстве — идёт критерием приёмки демо Пушки.
