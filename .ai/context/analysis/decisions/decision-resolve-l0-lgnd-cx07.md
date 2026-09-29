---
type: "decision"
node_id: "decision-resolve-l0-lgnd-cx07"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-lgnd-cx07: > Resolved by `L0-adr-wpn2` (accepted),…"
aliases: ["decision-resolve-l0-lgnd-cx07"]
is_a: ["decision"]
relates_to: ["L0-lgnd-cx07"]
refs: ["L0-lgnd-cx07"]
priority: 500
statement: "> Resolved by `L0-adr-wpn2` (accepted), option (a). Re-measured 2026-09-29: > - 0.3.0–0.3.2 (`37a0403`…`2d57c52`) wrote `andrew:ws_cooldown_until` as epoch ms. > - From 0.4.0 (`dcb0bb4`, 2026-09-24 23:58), `cooldownKey` reads only >   `andrew:cd_<abilityKey>` (`registry.ts:106`); `grep ws_cooldown_until src tests scripts packs` >   finds 0 matches. > - A 0.3.x player cooling with 20 s left reads Ready after the upgrade (repro, red, >   positive control green). > - Loss is bounded by `COOLDOWN_TICKS` = 600 → one cooldown ≤ 30 000 ms, once per player. > - The 7 other `ws_*` keys are byte-identic"
resolves_contradiction: "L0-lgnd-cx07"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-LGND-CX07-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 600
---

> Resolved by `L0-adr-wpn2` (accepted), option (a). Re-measured 2026-09-29: > - 0.3.0–0.3.2 (`37a0403`…`2d57c52`) wrote `andrew:ws_cooldown_until` as epoch ms. > - From 0.4.0 (`dcb0bb4`, 2026-09-24 23:58), `cooldownKey` reads only >   `andrew:cd_<abilityKey>` (`registry.ts:106`); `grep ws_cooldown_until src tests scripts packs` >   finds 0 matches. > - A 0.3.x player cooling with 20 s left reads Ready after the upgrade (repro, red, >   positive control green). > - Loss is bounded by `COOLDOWN_TICKS` = 600 → one cooldown ≤ 30 000 ms, once per player. > - The 7 other `ws_*` keys are byte-identic
