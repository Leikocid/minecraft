---
title: Project Summary
type: analysis
generated_at: "2026-09-20T16:22:35.861Z"
source_channel: rollout
node_id: rollout-summary
aliases: ["rollout-summary","summary"]
is_a: ["rollout","summary"]
relates_to: ["L0"]
priority: 120
---

# Project Summary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Overview

_node: L0_

# Project Overview — Minecraft Bedrock PvP Add-On

> **Analysis decision: `self-work`.** No L1 decomposition — rationale in the Survey section below.

## What this project is

A **Minecraft Bedrock Edition** Add-On project whose ultimate deliverable is a custom **PvP Add-On**. Neither available source document specifies that PvP add-on. Both describe *risk-reduction scaffolding* that must be completed before it starts.

The project is organised as a strict, sequential three-stage gate:

| Stage | Name | Status in sources | Purpose |
|---|---|---|---|
| **0** | Development infrastructure | Fully specified (`stage-0-infrastructure`, decisions dated 2026-09-20) | Prove the build → deploy → verify loop works end-to-end on the available hardware, using a deliberately "half-empty" add-on |
| **1** | Miner's Pickaxe test add-on | Fully specified (`minerspickaxetestspec`) | Prove the real add-on stack (BP + RP + stable Script API + custom item + recipe + script-driven behavior) works on the user's *installed* game version |
| **2** | Main PvP Add-On | **Requirements not yet formulated** | The actual product |

Stage 0 states the gate explicitly: *«Прототип из `Miners_Pickaxe_Test_Spec` начинается только после закрытия этого этапа.»*

## Physical topology — the defining structural fact

Development is shaped by one hard environmental truth: **there is no Minecraft Bedrock client for macOS**. This splits the development loop across three machines, none of which can do the whole job:

| Node | Hardware / image | Can do | Cannot do |
|---|---|---|---|
| **Mac mini** | Apple M4 Pro, macOS, Docker | Node.js, TypeScript, `@minecraft/server` npm types, static checking, `.mcaddon` packaging | Run the game |
| **Docker BDS** | `itzg/minecraft-bedrock-server`, `linux/amd64` via Rosetta | Load the pack, emit **machine-readable** manifest/script error logs, serve LAN to the iPad | Render resource packs, show Creative inventory |
| **iPad** | Retail Bedrock (App Store) | Visual confirmation: `.mcaddon` import, Content Log GUI, Creative visibility, RU/EN localization | Produce greppable logs |

Every change therefore travels **build (Mac) → load (Docker BDS, read logs) → confirm (iPad, read GUI)**. This three-hop loop is the single most important structural fact about the project and drives most of its constraints and decisions.

## The central technical risk

Both documents are, at heart, about one unresolved unknown: **which Bedrock version is actually installed on the iPad**, and therefore which `@minecraft/server` API version and `min_engine_version` the manifests must declare. Stage 1 hard-codes an answer (2.9.0 / 1.26.0); Stage 0 lists the same question as still open. See `concept-contradiction` CTR-001.

The project's stated response to version failure is notably disciplined and is itself a governing policy: *"If the installed game reports a dependency or format error, use the exact error text to retarget the pack rather than enabling Preview/Beta APIs by default."*

## Survey (§4.2)

- **Volume** — 4,759 chars across 2 raw sources. Far below any decomposition threshold.
- **Diversity** — low. Two documents, one domain (Bedrock add-on authoring), heavily overlapping tag sets (`api`, `performance` in both).
- **Coherence** — high. `stage-0-infrastructure` explicitly names `Miners_Pickaxe_Test_Spec` as its successor stage. One system, one goal, one author's voice.
- **Dependencies** — a clean linear pipeline (Stage 0 → 1 → 2), not a topical spread.

Decomposition would yield at most two ~2 KB children (infrastructure, pickaxe) with no independent internal structure. Splitting would produce padding rather than analysis. Hence **self-work**: intent, boundaries, constraints, entity, acceptance criteria, decisions, assumptions, contradictions and open questions are all emitted directly at L0.

## Source inventory

| Source | node_id | Priority | Lang | Role |
|---|---|---|---|---|
| `docs/Miners_Pickaxe_Test_Spec.docx` | `minerspickaxetestspec` | 120 | EN | Stage 1 spec |
| `.ai/inbox/stage-0-infrastructure.md` | `stage-0-infrastructure` | 110 | RU | Stage 0 spec + project-level decisions |

Note the **priority inversion**: the Stage 1 spec carries higher priority (120) than the Stage 0 document (110), yet Stage 0 is the newer record (it is dated and it refers to the pickaxe spec as pre-existing) and it is the one that *gates* Stage 1. Retrieval that trusts priority alone will surface the stale version target first. See `concept-contradiction` CTR-002.

## Current repository state

The working tree is at its very beginning — `main` branch with **no commits yet**, and only `.ai/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `.vscode/`, `.gitignore` present as untracked files. No `package.json`, no behavior pack, no resource pack. Stage 0 pass criterion #5 ("Проект в git с первым коммитом") is therefore not yet met, and neither is any other Stage 0 criterion. **The project is at T-zero: all documented work is still ahead.**

## Related artifacts

`concept-intent` · `concept-boundary` · `concept-constraint` · `concept-entity` · `concept-acceptance-criterion` · `concept-architecture-decision` · `concept-assumption` · `concept-contradiction` · `concept-client-question`


## Statistics

- **Total artifacts:** 30
- **concept-atomic:** 6 (26 KB)
- **concept-aggregate:** 3 (13 KB)
- **concept-special:** 1 (4 KB)
- **decision:** 5 (1 KB)
- **raw:** 2 (5 KB)
- **other:** 13 (37 KB)

### By level

- L0: 10 artifacts


_Analysis version: 1_
