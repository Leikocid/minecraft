# Сводный список правок знания — разбор противоречий 2026-09-29

Собрано из отчётов 13 разборов с исходом 3. Правки идут регенерацией/точечно,
руками в KV не лезем сверх перечисленного.

## CNTR-AIRS-CX01-AA

(список дубликатов в отчёте не выделен)

## CNTR-COOL-CTR1-AA

1. .ai/context/analysis/nodes/cool-ctr1__concept-contradiction.md:13 — тег "status:open" → "status:resolved".
2. cool-ctr1__concept-contradiction.md:23 — «Code src/websword/retention.ts handles … only» → ссылка на src/legendary/recovery.ts (ed7558b) и перенос файла (392253d).
3. adr-lgnd__concept-architecture-decision.md:33 — «CTR-1 … stay open at L0» → «CTR-1 closed by decision-resolve-cool-ctr1, shipped in recovery.ts».
4. lgnd-as01__concept-assumption.md:12,15 — CAN_ASSUME → decided (decision-legendary-rules-…). Сводка assumptions.md:19 обновится сама.
5. cool-asm3__concept-assumption.md:13,21 — CAN_ASSUME → decided; «can be lost permanently» → «implemented in recovery.ts, proven by GameTest».
6. lgnd-p002__concept-process.md:23 — «Generalised from src/websword/retention.ts» → «src/legendary/retention.ts (moved in 392253d)».

## CNTR-COOL-CTR2-AA

(список дубликатов в отчёте не выделен)

## CNTR-COOL-CTR4-AA

(список дубликатов в отчёте не выделен)

## CNTR-LGND-CX01-AA

(список дубликатов в отчёте не выделен)

## CNTR-LGND-CX07-AA

(список дубликатов в отчёте не выделен)

## CNTR-STRF-CX01-AA

(список дубликатов в отчёте не выделен)

## CNTR-WIND-CX01-AA

- «не определено» / «noDryLand»: wind__concept-component.md:50; wind-r007__concept-rule.md:28; adr-spwn__concept-architecture-decision.md:38, :46; wind-e002__concept-entity.md:34; wind-p002__concept-process.md:30.
- andrew:st:spawnWindmill → andrew:st:spawn: wind-e002:6, :16; wind-r011:22; wind-p002:22; wind-r013:22; wind__concept-component:30, :35; strf__concept-component:41; adr-strs:27; adr-spwn:37; xasm5:26; wind-ac01:21.
- windmill:S → windmill:spawn: wind-e002:41; wind-p002:31; wind-p004:33; wind-ac01:22; wind-ac02:22; wind__concept-component:39; wind-g002:17.
- лишний статус "placing": wind-e002:25, wind-p002:22.
- устаревшие формулировки: wind__concept-component:21 («analysis only, no code»), :53 («Peaceful — предположение»).
- тег SHOULD_ASK: xq4__concept-client-question.md:13.

## CNTR-WIND-CX02-AA

(список дубликатов в отчёте не выделен)

## CNTR-XCX12-AA

(список дубликатов в отчёте не выделен)

## CNTR-XCX5-AA

(список дубликатов в отчёте не выделен)

## CNTR-XCX6-AA

(список дубликатов в отчёте не выделен)

## CNTR-XCX7-AA

(список дубликатов в отчёте не выделен)
