---
type: "decision"
node_id: "decision-adr-l0-adr-strc-accepted-generatsiya-skriptom-pr"
source_channel: "cli"
analysis_version: null
title: "ADR L0-adr-strc = accepted: генерация скриптом при обнаружении чанка (зонд strf-p006, Q2/Q7/Q9/Q10)"
aliases: ["decision-adr-l0-adr-strc-accepted-generatsiya-skriptom-pr"]
is_a: ["decision"]
part_of: ["L0-adr-strc"]
relates_to: ["L0-adr-strc"]
priority: 500
statement: "Узел L0-adr-strc. Статус меняется с proposed на accepted. Основание — docs/structures/probe-results.md. Q9 PASS: dimension.isChunkLoaded есть в 2.10.0 и 0 раз расходится с getBlock; в незагруженном чанке getBlock=undefined, а getTopmostBlock/setBlockType бросают LocationInUnloadedChunkError. Поэтому валидация (шаг 3) сначала вызывает isChunkLoaded, потом getTopmostBlock. Q7 PASS: place 35×30×35 = 38 мс (каждая клетка меняется) / 23 мс, 64 getBlock = 0,560 мс — укладывается в тик. Q2 PASS: поворот и начало координат верны. Q10: fillBlocks работает через границы чанков, но берёт не больше 32 768 клеток за вызов; объёмы больше режутся на куски — это деталь реализации, схему она не меняет."
decided_at: "2026-09-26"
tags: ["refine","decision"]
size_chars: 694
---

Узел L0-adr-strc. Статус меняется с proposed на accepted. Основание — docs/structures/probe-results.md. Q9 PASS: dimension.isChunkLoaded есть в 2.10.0 и 0 раз расходится с getBlock; в незагруженном чанке getBlock=undefined, а getTopmostBlock/setBlockType бросают LocationInUnloadedChunkError. Поэтому валидация (шаг 3) сначала вызывает isChunkLoaded, потом getTopmostBlock. Q7 PASS: place 35×30×35 = 38 мс (каждая клетка меняется) / 23 мс, 64 getBlock = 0,560 мс — укладывается в тик. Q2 PASS: поворот и начало координат верны. Q10: fillBlocks работает через границы чанков, но берёт не больше 32 768 клеток за вызов; объёмы больше режутся на куски — это деталь реализации, схему она не меняет.
