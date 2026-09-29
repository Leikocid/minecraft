---
type: "concept-contradiction"
node_id: "L0-xcx5"
source_channel: "rollout"
analysis_version: 2
title: "Contradiction — the spec's header, its scope, and \"earlier drafts\""
aliases: ["L0-xcx5"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 1309
tags: ["title:Four Structures spec version and overridden drafts", "alias:L0-xcx5", "is_a:contradiction", "target:L0", "status:open", "category:source-vs-source", "severity:low", "relates_to:L0-wind", "relates_to:L0-bast", "relates_to:L0-wrdn", "see_also:fourstructuresspecruencopy"]
level: 1
---
# Contradiction — the spec's header, its scope, and "earlier drafts"

- The header reads *"Мельница / Windmill + Дирижабль / Airship • RU/EN • v1"*, and the Executive Summary table (§1) covers only those two. But the Purpose line and §2 say "четырёх структур". §13 (Mini Warden City) and §14 (Mini Bastion) are "нормативное дополнение", and "при конфликте с более ранними черновыми решениями правила ниже имеют приоритет".
- §14 "Размер 20×20 заменяет более раннюю черновую идею 30×30" and §4.7.6 "прежний 50% шанс отменён; теперь шанс 100%" point to earlier drafts that are **not in the KV**.
- §12 says "RU and EN sections are equally normative; when wording differs, preserve numeric rules". There is no English equivalent for most of §2–§6 detail, only the §12 summary.

**Risk.** A later re-import of an earlier or later draft could silently change numbers (sizes, chances). The file's own docProps subject reads "Windmill, Airship, Mini Warden City, Mini Bastion — RU/EN v2". KV raw priority follows import order, not the header's version.

**Interim handling.** Structure numbers: operator decisions override the spec; the spec (all §1–§16) overrides nothing else, because no other draft exists. As built: `src/structures/config.ts` and `templates/*_SIZE`, pinned by `tests/structures-sizes.test.mjs`.

**Ask.** The file's own docProps subject reads "Windmill, Airship, Mini Warden City, Mini Bastion — RU/EN v2". KV raw priority follows import order, not the header's version.
