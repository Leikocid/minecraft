---
type: "decision"
node_id: "decision-zacharovanie-bez-durability-proverit-pervoy-zada"
source_channel: "cli"
analysis_version: null
title: "Зачарование без durability — проверить первой задачей этапа 1 (ASM-004, Q-005)"
aliases: ["decision-zacharovanie-bez-durability-proverit-pervoy-zada"]
is_a: ["decision"]
priority: 500
statement: "Вопрос: принимает ли предмет без компонента minecraft:durability чары через minecraft:enchantable (slot pickaxe). Решение: проверить эмпирически первой задачей этапа 1 — стол зачарования и наковальня на iPad. Рабочая гипотеза: да, enchantable от durability не зависит. Если нет — спека кирки меняется (durability + защита от поломки или отказ от чар); это изменение спеки, а не баг. Закрывает ASM-004 и Q-005 как решение о способе проверки."
decided_at: "2026-09-20"
tags: ["refine","decision"]
size_chars: 440
---

Вопрос: принимает ли предмет без компонента minecraft:durability чары через minecraft:enchantable (slot pickaxe). Решение: проверить эмпирически первой задачей этапа 1 — стол зачарования и наковальня на iPad. Рабочая гипотеза: да, enchantable от durability не зависит. Если нет — спека кирки меняется (durability + защита от поломки или отказ от чар); это изменение спеки, а не баг. Закрывает ASM-004 и Q-005 как решение о способе проверки.
