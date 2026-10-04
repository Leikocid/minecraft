---
type: "decision"
node_id: "decision-resolve-l0-katn-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-katn-cx01: Закрыто кодом. Разделение «влезает» и «…"
aliases: ["decision-resolve-l0-katn-cx01"]
is_a: ["decision"]
relates_to: ["L0-katn-cx01"]
refs: ["L0-katn-cx01"]
priority: 500
statement: "Закрыто кодом. Разделение «влезает» и «безопасно» отгружено в src/katana/plan.ts и проверено на BDS. Текстовая правка свода v6 вреда не снимала: измерение показало, что поиск берёт воздух прямо над лавой, и игрок оказывается в лаве через 3 тика, получая те же 4 удара, что и поставленный в лаву. Принято решение decision-katana-landing-above-lava-unsafe (вариант A): кандидат-воздух небезопасен, если луч вниз первым встречает лаву. Проба KATA-PROBE-01 подтвердила лавовую часть и ОПРОВЕРГЛА огненную: луч вниз не видит fire и soul_fire, под ними первым идёт опора, поэтому проверяется первый встреченный блок И блок над ним. Это записано в decision-katana-ray-budget-and-column-length-measured-not и реализовано."
resolves_contradiction: "L0-katn-cx01"
outcome: "changed"
evidence: "KATA-PROBE-01-AA (probe_katana_lava_below), KATA-PLAN-01-AA (tests/katana-plan.test.mjs), KATA-TP-01-AA 9/9 на BDS; выпускной гейт на слитом main: 263 сценария, 0 падений, .ai/logs/release-gate.log EXIT=0; .ai/verify/CNTR-KATN-CX01-AA/2.red.json — красное доказательство до правки"
decided_at: "2026-10-04"
tags: ["refine","resolution"]
size_chars: 713
---

Закрыто кодом. Разделение «влезает» и «безопасно» отгружено в src/katana/plan.ts и проверено на BDS. Текстовая правка свода v6 вреда не снимала: измерение показало, что поиск берёт воздух прямо над лавой, и игрок оказывается в лаве через 3 тика, получая те же 4 удара, что и поставленный в лаву. Принято решение decision-katana-landing-above-lava-unsafe (вариант A): кандидат-воздух небезопасен, если луч вниз первым встречает лаву. Проба KATA-PROBE-01 подтвердила лавовую часть и ОПРОВЕРГЛА огненную: луч вниз не видит fire и soul_fire, под ними первым идёт опора, поэтому проверяется первый встреченный блок И блок над ним. Это записано в decision-katana-ray-budget-and-column-length-measured-not и реализовано.
