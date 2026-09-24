---
type: "decision"
node_id: "decision-scythe-true-damage-pryamoe-umenshenie-zdorovya-d"
source_channel: "cli"
analysis_version: null
title: "scythe-true-damage = прямое уменьшение здоровья, добивание через applyDamage"
aliases: ["decision-scythe-true-damage-pryamoe-umenshenie-zdorovya-d"]
is_a: ["decision"]
priority: 500
statement: "Решение оператора (автопилот, 2026-09-24): каждое попадание снаряда Косы снимает ровно 3 HP в обход брони и защитных чар. Механизм: hp = health.currentValue; если hp - 3 > 0 — health.setCurrentValue(hp - 3) (броня и Protection на прямую запись не влияют); если hp - 3 <= 0 — добивание через entity.applyDamage(hp + 100, { cause: EntityDamageCause.entityAttack, damagingEntity: владелец }), чтобы сработали сообщение о смерти, засчёт убийства владельцу и тотем бессмертия — броня такой перебор не погасит. Закрывает CX-sprj-02 (ADR-022 lethal branch)."
decided_at: "2026-09-24"
tags: ["refine","decision"]
size_chars: 550
---

Решение оператора (автопилот, 2026-09-24): каждое попадание снаряда Косы снимает ровно 3 HP в обход брони и защитных чар. Механизм: hp = health.currentValue; если hp - 3 > 0 — health.setCurrentValue(hp - 3) (броня и Protection на прямую запись не влияют); если hp - 3 <= 0 — добивание через entity.applyDamage(hp + 100, { cause: EntityDamageCause.entityAttack, damagingEntity: владелец }), чтобы сработали сообщение о смерти, засчёт убийства владельцу и тотем бессмертия — броня такой перебор не погасит. Закрывает CX-sprj-02 (ADR-022 lethal branch).
