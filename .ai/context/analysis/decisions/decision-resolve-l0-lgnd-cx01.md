---
type: "decision"
node_id: "decision-resolve-l0-lgnd-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-lgnd-cx01: > CX-lgnd-01 снят решением `decision-le…"
aliases: ["decision-resolve-l0-lgnd-cx01"]
is_a: ["decision"]
relates_to: ["L0-lgnd-cx01"]
refs: ["L0-lgnd-cx01"]
priority: 500
statement: "> CX-lgnd-01 снят решением `decision-legendary-ready-hud` (2026-09-24, вариант (a) из `L0-xq1`): «Готово» / «Ready» показывается непрерывно, пока легендарный предмет в основной или второй руке, одинаково для всех оружий. Измерения на `32f4aca`: `src/websword/cooldown.ts` удалён в `392253d` 2026-09-24; одноразовый показ существовал только в 0.3.0–0.3.2 (`37a0403:src/websword/cooldown.ts:155-156`, окно 10 тиков × 50 ms = 500 ms); `grep -rl readyMode src` = 0, `grep -rl andrew.web_sword.ready src` = 0; `src/legendary/hud.ts:53` пишет `andrew.legendary.ready` на каждом проходе (интервал 10 тиков,"
resolves_contradiction: "L0-lgnd-cx01"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-LGND-CX01-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 599
---

> CX-lgnd-01 снят решением `decision-legendary-ready-hud` (2026-09-24, вариант (a) из `L0-xq1`): «Готово» / «Ready» показывается непрерывно, пока легендарный предмет в основной или второй руке, одинаково для всех оружий. Измерения на `32f4aca`: `src/websword/cooldown.ts` удалён в `392253d` 2026-09-24; одноразовый показ существовал только в 0.3.0–0.3.2 (`37a0403:src/websword/cooldown.ts:155-156`, окно 10 тиков × 50 ms = 500 ms); `grep -rl readyMode src` = 0, `grep -rl andrew.web_sword.ready src` = 0; `src/legendary/hud.ts:53` пишет `andrew.legendary.ready` на каждом проходе (интервал 10 тиков,
