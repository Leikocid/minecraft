---
type: "decision"
node_id: "decision-adr-l0-adr-tmpl-accepted-zond-strf-p006-q1-q2-q3"
source_channel: "cli"
analysis_version: null
title: "ADR L0-adr-tmpl = accepted (зонд strf-p006, Q1/Q2/Q3)"
aliases: ["decision-adr-l0-adr-tmpl-accepted-zond-strf-p006-q1-q2-q3"]
is_a: ["decision"]
priority: 500
statement: "Узел L0-adr-tmpl. Статус ADR L0-adr-tmpl (шаблоны .mcstructure генерируются Node-скриптом из исходников в репо) меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункты Q1, Q2, Q3 (BDS 1.26.51.1, прогон 2026-09-26, артефакт .ai/verify/PRB-REPORT-01-AA/6.json). Q1 PASS: после structureManager.place сундуки остались сундуками с инвентарём, mob_spawner с EntityIdentifier выдал minecraft:zombie за 40 тиков. Q2 PASS: состояния (cardinal_direction, direction двери, weirdo_direction ступени, can_summon) и позиции верны при 0/90/180/270, а начало координат — минимальный угол. Q3 PASS: визгун с can_summon=true из шаблона вызвал Хранителя после 4 визгов (тик 694). Поправка: регистрацию пакетной структуры проверять через structureManager.get(id), потому что getPackStructureIds() пакетных структур не видит."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 835
---

Узел L0-adr-tmpl. Статус ADR L0-adr-tmpl (шаблоны .mcstructure генерируются Node-скриптом из исходников в репо) меняется с proposed на accepted. Основание — docs/structures/probe-results.md, пункты Q1, Q2, Q3 (BDS 1.26.51.1, прогон 2026-09-26, артефакт .ai/verify/PRB-REPORT-01-AA/6.json). Q1 PASS: после structureManager.place сундуки остались сундуками с инвентарём, mob_spawner с EntityIdentifier выдал minecraft:zombie за 40 тиков. Q2 PASS: состояния (cardinal_direction, direction двери, weirdo_direction ступени, can_summon) и позиции верны при 0/90/180/270, а начало координат — минимальный угол. Q3 PASS: визгун с can_summon=true из шаблона вызвал Хранителя после 4 визгов (тик 694). Поправка: регистрацию пакетной структуры проверять через structureManager.get(id), потому что getPackStructureIds() пакетных структур не видит.
