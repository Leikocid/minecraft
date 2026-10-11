---
type: "decision"
node_id: "decision-resolve-l0-trdt-cx01"
source_channel: "cli"
analysis_version: null
title: "Resolved L0-trdt-cx01: Закрыто на свёртке v9 решением L0-adr-t…"
aliases: ["decision-resolve-l0-trdt-cx01"]
is_a: ["decision"]
relates_to: ["L0-trdt-cx01"]
refs: ["L0-trdt-cx01"]
priority: 500
statement: "Закрыто на свёртке v9 решением L0-adr-trlg §2-3: общее необязательное поле refundExchange в описании легендарки принято как намеренное расширение xasm32."
resolves_contradiction: "L0-trdt-cx01"
outcome: "changed"
evidence: "Прочитано при свёртке v9: src/legendary/craftgate.ts refund() строки 185-196 возвращает только стопки def.refund через returnToPlayer."
decided_at: "2026-10-11"
tags: ["refine","resolution"]
size_chars: 153
---

Закрыто на свёртке v9 решением L0-adr-trlg §2-3: общее необязательное поле refundExchange в описании легендарки принято как намеренное расширение xasm32.
