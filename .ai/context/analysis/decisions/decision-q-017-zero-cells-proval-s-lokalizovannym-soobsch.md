---
type: "decision"
node_id: "decision-q-017-zero-cells-proval-s-lokalizovannym-soobsch"
source_channel: "cli"
analysis_version: null
title: "Q-017 zero-cells = провал с локализованным сообщением, cooldown не тратится"
aliases: ["decision-q-017-zero-cells-proval-s-lokalizovannym-soobsch"]
is_a: ["decision"]
priority: 500
statement: "Решение (автопилот): если валидная цель есть, но ни одна из 27 клеток не заменена (всё защищено/не загружено), способность считается несработавшей: cooldown не запускается, игроку в actionbar показывается локализованное «Нет места для паутины» / «No room for cobweb» (ключ в каталоге L0-item). Закрывает CTR-008."
decided_at: "2026-09-21"
tags: ["refine","decision"]
size_chars: 312
---

Решение (автопилот): если валидная цель есть, но ни одна из 27 клеток не заменена (всё защищено/не загружено), способность считается несработавшей: cooldown не запускается, игроку в actionbar показывается локализованное «Нет места для паутины» / «No room for cobweb» (ключ в каталоге L0-item). Закрывает CTR-008.
