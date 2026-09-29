# CNTR-XCX12-AA · CX-L0-12 — структуры «analysis only» в KV против поставки v1.2.0

ИСХОД: 3 — Подчистка знания

Код прав, знание отстало. Все четыре структуры выкачены и включены на рабочем
сервере. Размеры двух из них изменены решениями оператора 2026-09-27. ADR-ы
прошли зонд 2026-09-26. В KV (живой `.ai/context`) остались 67 устаревших копий
в 48 файлах. Правка кода не нужна. README.md исправлен в этом прогоне (3 строки).

Проверки лежат рядом:
- `diagnose-CNTR-XCX12-AA-sizes.mjs` — сторона кода, зелёная;
- `diagnose-CNTR-XCX12-AA-kv.mjs` — сторона знания, красная, пока список ниже
  не применён.

Пути относительно `.ai/context/`, номера строк — по живому KV на 2026-09-29.

## Перепроверенные числа

| Утверждение | Замер | Чем |
|---|---|---|
| `L0` overview помечен `not-implemented` | **Неверно для живого KV.** v3 `nodes/concept-overview.md` без метки, строка 26: «four world structures: shipped in v1.2.0 … reconcile owed (`xcx12`)». v2-обзор (git `68d5766`, :23) писал «analysis only», но метки тоже не имел | `kv_list tags=not-implemented`: current → orbc/pntr/ring; `status=all` → ещё airs, wind |
| `L0-airs`/`L0-wind` — `not-implemented`, «no structure code» | Верно: `airs:13,21`, `wind:14,21` | grep |
| «нет `structures/`» | Верно на момент записи: в `302fba4` (2026-09-26 07:08) 0 файлов в `src/structures` и `packs/behavior/structures`. Первый коммит `36214d7` в тот же день | `git ls-tree` |
| «every structure decision is still `proposed`» | 12 из 20 ADR-узлов структур — `proposed`; 2 `accepted` (`adr-body`, `adr-spwn`); у 6 статуса нет. Из 12: 6 приняты записями 2026-09-26 (PRB-REPORT-01-AA), `infr-d005` следует за `adr-tmpl`, у 5 записи нет | grep по узлам, `ls decisions/` |
| `src/structures/`: bodies, discovery, collision, loot, loot-table… | Верно: 34 файла (22 `.ts` + `bodies/` 4 + `templates/` 8) | `git ls-files` |
| `af024e4 meta(v1.2.0)` | Верно: 2026-09-27 19:30:56 +0200 | `git log -1` |
| «затем quickfix-ы Дирижабля и Города» | 3 коммита: `4d3ac73` (рендерер, берёзовый ротор Мельницы), `47d1841` (тест проходимости Города), `32f4aca` (зона загрузки Дирижабля в gametest). Шаблоны ни один не трогает: `git diff --stat af024e4 HEAD` → только `render-structure.mjs`, `gametest/structures-place.ts`, `tests/warden-template.test.mjs` | `git log`, `git diff` |
| «размеры изменены под реальный масштаб» | Верно для 2 из 4. Дирижабль `[75, 18, 13]` против ≈15×7×10–12; Город `[63, 20, 63]` против ≈30×30×10–15. Мельница `[35, 31, 35]` и Бастион `[20, 12, 20]` совпадают со спекой | sizes-чек |
| Надзор: `[75,18,13]`, `[63,20,63]`, `[35,31,35]`, `[20,12,20]` | Верно все четыре. Файлы на сервере побайтно равны сборке HEAD. Начинка: Дирижабль 10 сундуков / 1 спавнер; Город 40 / 8 визгунов; Мельница 25 / 3 спавнера; Бастион 10 | sizes-чек: NBT `size`, палитра |
| «выкачены и включены на рабочем сервере» | Верно. `andrew-bds`, лог 2026-09-29 15:32:19: `structures enabled: windmill,airship,warden_city,bastion`. Манифест пакета `[1, 2, 0]`, шаблоны от 2026-09-27 19:31 | `docker logs`, `ls` |
| «доска по ним закрыта (58 задач done)» | **58 — не счёт структур.** 58 = 71 done − 13 done в эпике contradictions (вся доска, этапы 0–4). Структурных задач 31, все done, открытых нет (AIRS 4, BAST 2, WIND 3, WRDN 3, STRF 9, PRB 7, LOOT 1, DEMO-S4 2). Противоречия KV по структурам ещё открыты: CNTR-STRF-CX02, CNTR-WIND-CX02 (active), CNTR-XCX5/6/7 (backlog) | `task_list done` |

## /diagnose

```text
OBSERVED: KV v2 L0-airs, L0-wind: tag not-implemented and "Status: analysis only.
          No structure code exists yet (…at 302fba4)". 12 structure ADR nodes: proposed.
          airs/wrdn/strf/loot nodes: spec sizes and contents. Code at 32f4aca and the
          production server ship all four (v1.2.0); Airship and Warden City at other sizes.
VERDICT:  bug (in knowledge): the description diverges from the shipped code. The
          expectation is on file: v3 overview :26 itself says "shipped in v1.2.0 …
          reconcile owed". The code side is right (decisions of 2026-09-26/27).
CHECKS:   contradiction: none (as-built follows the probe acceptances and the size
          decisions) · duplicate: strf-d003 is already in the CNTR-STRF-CX01-AA list;
          the wind-ad03 body overlaps CNTR-WIND-CX02-AA, so only its status line is here ·
          criteria writable: yes (kv check below)
UNFOLD:   nothing for the code; knowledge cleanup list for the post-wave phase
HUMAN:    none
```

```text
REPRO:    kv_search as a downstream reader, deterministic:
          (a) default filter, node_prefix=L0-airs → "No relevant context found"
              (v2 nodes are outside "current" = v3);
          (b) status=all → airs-r001 "Fixed size ≈15×7×10–12", airs-e001
              "size: { x: 15, y: 11, z: 7 }", airs "Status: analysis only".
          node docs/feedback/diagnose-CNTR-XCX12-AA-kv.mjs <root>/.ai/context
          → 67 stale copies in 48 files, exit 1.
CAUSE:    1) v3 is the Orbital delta (overview tag v3-reduce). The six structure
             nodes are carried at analysis_version 2, byte-identical to git 68d5766
             (2026-09-26 17:45). They were written against 302fba4 (0 structure files)
             and never re-read after v1.2.0.
          2) PRB-REPORT-01-AA recorded 6 acceptances and 2 confirmations via
             `ai-kit refine decision` without --node ("the worktree has the v1
             snapshot"). The 8 records have no part_of/relates_to, so the nodes
             keep "proposed".
          3) The size decisions of 2026-09-27. The Warden City record is also unbound
             and says 62x62; 63 ships because an odd side keeps the centre fixed
             under rotation (templates/warden-city.ts:19-20). The Airship record
             (bound to L0-airs) says «примерно до 25–30 блоков», which was the
             AIRS-SHAPE-01-AA step. The operator's final 75×13 (AIRS-SCALE-01-AA
             parent goal; c5a1c27, 2026-09-27 18:40) has no decision record.
PROOF:    run-check red artifact of the kv check (exit 1, 67 copies) and green
          artifact of the sizes check (exit 0), both listed in task_submit result.
RULED OUT: (a) "false from the moment of writing": at 302fba4 src/structures and
          packs/behavior/structures held 0 files, so the text was true when written.
          (b) "shipped only on paper": production log shows all four enabled, and a
          warden_city placed with state done (15:09:26, 15:36:00).
          (c) "the pack differs from source": deployed bytes == HEAD build, 4/4.
RADIUS:   code: none. Knowledge: 67 copies / 48 files (list below). README.md: 3
          lines, fixed here. Method: grep -nE over the live .ai/context (read-only)
          by address (not-implemented, analysis only, 302fba4, proposed, part_of) and
          by number (15×7, x: 15, 30×30, 10–15, 10 chests, 2 Shriekers, 62x62,
          25–30); git grep over README and docs/; kv_list; kv_contradictions;
          task_list. Callers: nothing in src/ reads KV.
GREEN:    sizes check exit 0 (4/4 OK, head==deployed); node --test
          tests/structures-sizes.test.mjs 5/5; git grep for the old README figures:
          0 hits outside the new "отход от ≈15×7×10–12" wording.
          The kv check can go green: on a scratch copy with the flagged lines
          replaced and the records bound → PASS exit 0. A deleted file gives UNKNOWN
          exit 2, so the check cannot pass by deletion.
LIVE:     production andrew-bds, enabled line (above). The KV cleanup is not mine to
          apply, so no live KV run.
```

## Резолюция (refine resolve L0-xcx12)

> Resolved as knowledge cleanup; no code change. Measured 2026-09-29 at 32f4aca.
> All four structures ship in v1.2.0 (af024e4, 2026-09-27). They are enabled on
> the production BDS (log 15:32:19: "structures enabled:
> windmill,airship,warden_city,bastion"), and the deployed .mcstructure files are
> byte-identical to the HEAD build. Template sizes [x,y,z]: Airship [75,18,13],
> Warden City [63,20,63], Windmill [35,31,35], Bastion [20,12,20]. Contents:
> 10 chests/1 spawner, 40 chests/8 shriekers, 25 chests/3 spawners, 10 chests.
> Airship and Warden City depart from §5.1/§13 by operator decisions of
> 2026-09-27; Windmill and Bastion match the spec. The "analysis only" text was
> true at 302fba4 (0 structure files) and went stale when the stage-4 epics
> merged. The six v2 structure nodes were carried into v3 unchanged. The strf-p006
> acceptances of 2026-09-26 were recorded without node binding, so the ADR nodes
> still read "proposed". The copies are listed in
> docs/feedback/diagnose-CNTR-XCX12-AA.md. `diagnose-CNTR-XCX12-AA-kv.mjs`
> passes once they are fixed.

## Копии: файл:строка — что на что

**A. «Не построено»**
- `nodes/airs__concept-component.md:13` — тег `"not-implemented"` → убрать.
- `nodes/airs__concept-component.md:21` — «Status: analysis only. No structure code exists yet (`packs/behavior/structures/` absent at `302fba4`)…» → «Status: shipped in v1.2.0 (af024e4) — `src/structures/bodies/airship.ts`, template `src/structures/templates/airship.ts` → `andrew:airship`».
- `nodes/wind__concept-component.md:14` — тег `"not-implemented"` → убрать.
- `nodes/wind__concept-component.md:21` — то же → «Status: shipped in v1.2.0 — `bodies/windmill.ts`, `spawn-search.ts`, `templates/windmill.ts` + `windmill-fields.ts`».
- `nodes/bast__concept-component.md:41` — «`L0-mill` (Windmill), `L0-arsh` (Airship) … None of these sibling components exist yet in the KV» → «`L0-wind`, `L0-airs`, `L0-wrdn` … all four ship in v1.2.0». Узлов `L0-mill`/`L0-arsh` нет (0 файлов); те же id в `:13` (теги) и `:18`.
- `nodes/infr__concept-component.md:27` — «exact repo path not yet fixed by any ADR (`L0-infr-as05`)» → «`src/structures/templates/*.ts`, read by `scripts/build-structures.mjs` (`templatesDir`, :22)».
- `nodes/infr__concept-component.md:51` — пункт «source layout is not fixed by any ADR yet» → удалить.
- `nodes/infr-as05__concept-assumption.md:6,16` — «Assumption (CAN_ASSUME)» → «confirmed as built».
- `nodes/loot__concept-component.md:32` и `nodes/loot-p002__concept-process.md:28` — «not yet confirmed / pending confirmation by the `strf` probe» → «confirmed: strf-p006 Q4 re-measured PASS (`docs/structures/probe-results.md:16`); `src/structures/loot.ts` uses `/loot insert` via `dimension.runCommand`».
- `nodes/loot-asm2__concept-assumption.md:15` — «Assumption (CAN_ASSUME)» → «confirmed (Q4)».
- `nodes/loot__concept-component.md:28` — «(`L0-strf`, not yet deep-dived at the time of this run)» → убрать скобку.

**B. ADR «proposed»**
- `nodes/adr-strc__…:18`, `adr-strs__…:18`, `adr-tmpl__…:18` — «**Status:** proposed (L0, v2)…» → «accepted 2026-09-26 (strf-p006)». Для `adr-strs` — «с оговоркой Q5». Ссылка на соответствующую запись `decision-adr-l0-adr-{strc,strs,tmpl}-accepted-…`.
- `nodes/strf-d001__…:13`, `strf-d002__…:13` — `status:proposed` → `status:accepted` (`decision-adr-strf-0{1,2}-…`).
- `nodes/wind-ad01__…:13,19` — `proposed` → «accepted с оговоркой о размере области» (`decision-adr-l0-wind-ad01-…`).
- `nodes/infr-d005__…:30` — «proposed (mirrors `L0-adr-tmpl`'s status)» → «accepted (mirrors `L0-adr-tmpl`, accepted 2026-09-26)».
- `nodes/strf-d004__…:13` — `proposed` → «accepted as built»: 3D `collisionBox`, `COLLISION_MARGIN = 2` (`src/structures/collision.ts:73`, `registry.ts:118`).
- `nodes/airs-d001__…:13,18` — `proposed` → «accepted as built»: `overParent` 2D pre-filter through `overlaps2d` (`bodies/airship.ts:41-42,169`; `search-ring.ts:80`).
- `nodes/wind-ad02__…:13,19` — `proposed` → «accepted as amended». Plan and precheck are in script as decided (`planPrep`/`precheck`). The writes are `dimension.fillBlocks` boxes of ≤ 32 768 cells, after a `containsBlock` check for non-natural blocks (`src/structures/prepare.ts:309-335`, probe Q10); there is no per-block `setPermutation`.
- `nodes/wind-ad03__…:13,19` — `proposed` → «accepted as built». The mechanism has other names: a `linked` init step (`withLinks`, `src/structures/bodies.ts:74-83`) calls `LinkedAirships.start` (`runtime.ts:108-115`), and pending attempts are retried every `LINKED_RETRY_ROUNDS` (`runtime.ts:32,131`). There is no `afterInit`/`x.linkedTried`. The body text belongs to CNTR-WIND-CX02-AA.
- `nodes/strf-d003__…:13` — already in the CNTR-STRF-CX01-AA list (→ superseded), not repeated here.

A status that follows shipped code without a decision record of its own (strf-d004, airs-d001, wind-ad02, wind-ad03) records a fact and changes nothing: the choice was made and merged under `merge_policy = autopilot`.

**C. Записи решений (history is not rewritten; bind them and add a line)**
- 8 records without `part_of` → bind to the node (`--node`, which they were written without):
  `decision-adr-l0-adr-strc-…` → `L0-adr-strc`; `…-adr-strs-…` → `L0-adr-strs`;
  `…-adr-tmpl-…` → `L0-adr-tmpl`; `…-wind-ad01-…` → `L0-wind-ad01`;
  `decision-adr-strf-01-…` → `L0-strf-d001`; `…-strf-02-…` → `L0-strf-d002`;
  `decision-ad-wrdn-01-…` → `L0-wrdn-ad01`; `decision-adr-bast-02-…` → `L0-bast-ad02`.
- `decisions/decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i.md` — bind to `L0-wrdn`. Lines `:10,20` «62x62 в плане» → add: «shipped 63×63×20 (odd side: the template centre maps to itself under rotation)».
- `decisions/decision-dirizhabl-udlinyaetsya-protiv-razmera-v-speke-ra.md:18,34` — «примерно до 25–30 блоков» → add: «superseded 2026-09-27 by the operator's Zeppelin NT choice: 75×18×13 (AIRS-SCALE-01-AA, c5a1c27)». This needs a new record, `refine decision --node L0-airs`. It records a decision the operator already made; it is not a new decision.

**D. Размер Дирижабля** (≈15×7×10–12 → 75×18×13; the long axis is x; envelope 73×13×13, gondola 13×7×4)
- `nodes/airs__concept-component.md:26` — «~15×7×10–12» → «[75, 18, 13]».
- `nodes/airs-ac01__…:23` — «≈15×7×10–12 (L×W×H)» → «75×13×18 (L×W×H), template [75, 18, 13]».
- `nodes/airs-r001__…:20` — «Fixed size ≈15×7×10–12 (L×W×H, unrotated)» → «Fixed size 75×13×18 (L×W×H, unrotated)».
- `nodes/airs-e001__…:29` — `size: { x: 15, y: 11, z: 7 }` → `size: [75, 18, 13]` (`AIRSHIP_SIZE`, `templates/airship.ts:20`).

**E. Город Хранителя** (≈30×30×10–15, 10 chests (3 central), 2 shriekers → [63, 20, 63], 40 chests (12 in the hall), 8 shriekers (2 central + 6 far))
- `nodes/wrdn__concept-component.md:23` — «≈30×30, height ≈10–15» → «63×63, height 20».
- `nodes/wrdn__concept-component.md:42` — «3 of the 10 chests … one of the two natural Shriekers» → «12 of the 40 chests … 2 of the 8 Shriekers».
- `nodes/wrdn__concept-component.md:45` — «Exactly 2 Sculk Shriekers … One is central, one is in a far part» → «Exactly 8: 2 central, 6 far».
- `nodes/wrdn__concept-component.md:47` — «the 2 Shriekers» → «the 8 Shriekers».
- `nodes/wrdn__concept-component.md:50` — «Exactly 10 chests … 3 central + 7» → «Exactly 40: 12 central + 28».
- `nodes/wrdn-ac03__…:15` — «≈30×30, the height is 10–15» → «63×63, the height is 20».
- `nodes/wrdn-ac07__…:15` — «exactly 2 Sculk Shriekers» → «exactly 8 (2 central + 6 far)».
- `nodes/wrdn-ac08__…:15` — «exactly 10 chests (3 central + 7 outer)» → «exactly 40 (12 central + 28 outer)».
- `nodes/wrdn-ent1__…:24` — «≈30×30×(10–15)» → «[63, 20, 63]».
- `nodes/wrdn-ent2__…:17` — «Exactly 10 per» → «Exactly 40 per».
- `nodes/wrdn-rul2__…:17` — «≈30×30 … ≈10–15» → «63×63 … 20».
- `nodes/wrdn-rul4__…:20` — «3 of the structure's 10 chests» → «12 of the structure's 40 chests».
- `nodes/wrdn-rul5__…:17` — «Exactly 2 … one near the hall, one in a far part» → «Exactly 8: 2 in the hall, 6 in far rooms»; `:20` — «the 2 Shriekers» → «the 8».
- `nodes/wrdn-rul6__…:17` — «Exactly 10 … 3 + 7» → «Exactly 40 … 12 + 28»; `:18` — «All 10 chests» → «All 40».
- `nodes/wrdn-as01__…:17`, `wrdn-as02__…:15` — «2 Shriekers» → «8 Shriekers».
- `nodes/strf-as01__…:18` — «Warden City (30×30)» → «(63×63)».
- `nodes/strf-e001__…:40` — «Warden City 10 (3 central)» → «40 (12 central)».
- `nodes/loot-e004__…:23` — «all 10 chests» → «all 40»; `loot-ac09__…:15` — «10 chests … all 10» → «40 … all 40»; `loot-r007__…:15`, `loot__concept-component.md:26` — «Mini Warden City (10 chests» → «(40 chests»; `loot-p002__…:22` — «all 10 chests» → «all 40».

**Checked and left unchanged:** Windmill sizes and counts (`wind-e001:28`, `wind-g001:17`, and the plot 35×35 in `wind-*`); Bastion (`bast-*` 20×20×10–12, 10 chests); the raw spec (`fourstructuresspecruencopy-part-*`, the source); `decision-l0-xq2…:16`, where the size enters only a qualitative remark and 1 in 20 chunks does not depend on the footprint. The rollups `risks.md:366-368` and `contradictions.md:354-356` are generated and close with the node.

## Вне узла

- **Observation about the tool (outside this repo, not fixable here).** kv_search and kv_list with the default filter do not return the carried v2 nodes (`node_prefix=L0-airs` → empty). A reader without `status=all` sees the raw spec instead of the analysis. The scan-code reconcile named in the node itself (not this run) would lift the six nodes into the current version.
- **Production world is Peaceful.** A Bastion placement there throws `waits: the world is Peaceful` (log 15:42:28). This is known and intended: garrisons are not spawned on Peaceful. It is not part of this node.
