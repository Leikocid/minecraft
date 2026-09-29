---
type: "decision"
node_id: "decision-resolve-l0-lgnd-cx08"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-lgnd-cx08: Починено задачей LGND-OFFHAND-01-AA (6 …"
aliases: ["decision-resolve-l0-lgnd-cx08"]
is_a: ["decision"]
relates_to: ["L0-lgnd-cx08"]
refs: ["L0-lgnd-cx08"]
priority: 500
statement: "Починено задачей LGND-OFFHAND-01-AA (6 критериев из 6). В JSON обоих легендарных предметов добавлен minecraft:allow_off_hand, поэтому движок теперь допускает их во вторую руку, и написанная ранее ветка приоритета рук (hands.ts, hud.ts) перестала быть мёртвой. Заодно вторую руку начали читать сохранение при смерти и гейт крафта. Ложный зелёный через setEquipment(Offhand) исключён: проверка построена так, что без компонента она красная — три красных артефакта до правки (1.red, 2.red, 3.red, все с ненулевым кодом) и четыре зелёных после, включая полный bds:gametest и bds:check на отдельном экземпляре bds-offhand."
resolves_contradiction: "L0-lgnd-cx08"
outcome: "changed"
evidence: "Артефакты .ai/verify/LGND-OFFHAND-01-AA/: 1.red.json, 2.red.json, 3.red.json (exit 1 до правки); 1.json, 2.json, 5.json, 6.json (exit 0 после, npm test + bds:gametest + bds:check). Компонент присутствует в обоих JSON (проверено чтением файлов в ветке). Отчёты docs/feedback/diagnose-CNTR-LGND-CX08-AA.md и diagnose-CNTR-COOL-CTR3-AA.md"
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 617
---

Починено задачей LGND-OFFHAND-01-AA (6 критериев из 6). В JSON обоих легендарных предметов добавлен minecraft:allow_off_hand, поэтому движок теперь допускает их во вторую руку, и написанная ранее ветка приоритета рук (hands.ts, hud.ts) перестала быть мёртвой. Заодно вторую руку начали читать сохранение при смерти и гейт крафта. Ложный зелёный через setEquipment(Offhand) исключён: проверка построена так, что без компонента она красная — три красных артефакта до правки (1.red, 2.red, 3.red, все с ненулевым кодом) и четыре зелёных после, включая полный bds:gametest и bds:check на отдельном экземпляре bds-offhand.
