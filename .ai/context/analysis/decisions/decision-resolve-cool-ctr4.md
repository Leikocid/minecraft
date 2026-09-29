---
type: "decision"
node_id: "decision-resolve-cool-ctr4"
source_channel: "cli"
analysis_version: null
title: "Resolved cool-ctr4: > CTR-4 закрыт по существу ещё 2026-09-…"
aliases: ["decision-resolve-cool-ctr4"]
is_a: ["decision"]
relates_to: ["cool-ctr4"]
refs: ["cool-ctr4"]
priority: 500
statement: "> CTR-4 закрыт по существу ещё 2026-09-24 (`decision-resolve-cool-ctr4`); остаток — подчистка знания. Замеры на HEAD 32f4aca (2026-09-29): `minerspickaxetestspec.md:67` — 2.9.0 / 1.26.0; `stage-0-infrastructure.md:22` — 2.9.0 «при необходимости 2.10.0», `:55` — engine и BDS от версии iPad; `scripts/targets.mjs:7-9` — [1,26,50] / 2.10.0 / 1.26.51.1; `package.json:27` и `package-lock.json:472` — 2.10.0; `packs/*/manifest.json:8` — [1,26,50] (4 из 4), `:27` — 2.10.0 (3 из 3); `docker/bds/compose.yaml:20` — 1.26.51.1. `npm run validate` — ok, `tsc --noEmit` — exit 0. `git log -S2.9.0` по коду — 0"
resolves_contradiction: "cool-ctr4"
outcome: "changed"
evidence: "Отчёт /diagnose: docs/feedback/diagnose-CNTR-COOL-CTR4-AA.md (в main). Измерения и команды перечислены там же; правки знания заведены задачей KV-CLEANUP-CONTRADICTIONS-AA."
decided_at: "2026-09-29"
tags: ["refine","resolution"]
size_chars: 599
---

> CTR-4 закрыт по существу ещё 2026-09-24 (`decision-resolve-cool-ctr4`); остаток — подчистка знания. Замеры на HEAD 32f4aca (2026-09-29): `minerspickaxetestspec.md:67` — 2.9.0 / 1.26.0; `stage-0-infrastructure.md:22` — 2.9.0 «при необходимости 2.10.0», `:55` — engine и BDS от версии iPad; `scripts/targets.mjs:7-9` — [1,26,50] / 2.10.0 / 1.26.51.1; `package.json:27` и `package-lock.json:472` — 2.10.0; `packs/*/manifest.json:8` — [1,26,50] (4 из 4), `:27` — 2.10.0 (3 из 3); `docker/bds/compose.yaml:20` — 1.26.51.1. `npm run validate` — ok, `tsc --noEmit` — exit 0. `git log -S2.9.0` по коду — 0
