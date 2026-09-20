---
type: "concept-intent"
node_id: "L0"
source_channel: "rollout"
title: "Project Intent"
aliases: ["L0"]
part_of: ["L0"]
is_a: ["intent"]
relates_to: ["L0"]
analysis_version: 1
priority: 120
size_chars: 3802
tags: ["intent","goals","bedrock","L0"]
level: 0
---

# Project Intent

## Ultimate goal (Stage 2)

Ship a custom **PvP Add-On for Minecraft Bedrock Edition**, playable on the owner's **iPad**.

This goal is named in both sources but **specified in neither**. `stage-0-infrastructure` records it as *«**2** — основной PvP-аддон (требования ещё не сформулированы)»*. Everything currently written down exists to de-risk this goal, not to deliver it.

## Why the project does not start with the goal

The owner faces two independent unknowns, and has chosen to retire them one at a time before writing product code:

1. **Does the toolchain work at all on this hardware?** The Mac cannot run Bedrock; the iPad cannot produce logs; the only server image is amd64 on an arm64 host. None of this is proven. → **Stage 0**.
2. **Does the add-on stack work on *this* installed game version?** Bedrock's Script API is version-sensitive, and manifest/dependency mismatches fail opaquely at import time. → **Stage 1**.

This is a deliberate *proof-before-product* strategy: each stage produces a throwaway or near-throwaway artifact whose only job is to convert an unknown into a known.

## Stage-level intents

### Stage 0 — infrastructure
> *«до прототипа "Кирки шахтёра" доказать, что процесс разработки работает end-to-end на имеющемся железе (Mac mini + iPad), выкатив минимальный "полупустой" аддон»*

Prove the **loop**, not the content. The deliverable is intentionally minimal — one chat message on player spawn (proves scripts execute), one trivial localized item (proves the resource pack and `.lang` files are picked up). The item is explicitly **not** a pickaxe; content is held back so that a failure can only be a *pipeline* failure.

### Stage 1 — Miner's Pickaxe
> *"validate the core Minecraft Bedrock Add-On stack on the user's installed version before implementing the full PvP Add-On"*

Prove the **stack**, not the game design. The pickaxe is a compatibility probe dressed as a feature: it exercises custom item registration, Creative inventory grouping, Creative search, `/give`, crafting recipes, bilingual naming, enchantment slots, mining-speed tuning and script-driven drop replacement — i.e. most of the surfaces the PvP add-on will eventually need — in a single item.

Tellingly, the spec explicitly defers the parts that would be about *balance* rather than *capability*: Fortune multiplication, Silk Touch override, and exact diamond-parity mining tags are all pushed out until "after the user confirms the pack loads and scripts execute".

### Stage 2 — PvP add-on
Out of scope for this analysis. Requirements must be gathered before any decomposition of Stage 2 is meaningful.

## Success, restated in one line per stage

| Stage | Done when… |
|---|---|
| 0 | A clean clone builds a `.mcaddon` with one command, BDS loads it without manifest errors and runs the script, and the iPad shows the item in Creative with both RU and EN names. |
| 1 | The pickaxe imports, appears in Creative and `/give`, crafts from its recipe, auto-smelts the supported ores in Survival, accepts pickaxe enchantments, and never breaks. |
| 2 | Undefined — requirements not yet gathered. |

## What the intent implies for how to build

Because the intent is *de-risking*, the correct engineering bias for Stages 0–1 is the opposite of normal product work:

- **Prefer the smallest artifact that produces a signal.** Extra content dilutes the diagnostic value of a failure.
- **Treat error messages as deliverables.** The compatibility-target policy says to retarget from *exact error text* — so capturing and preserving BDS log output is part of the job, not incidental.
- **Do not paper over incompatibility.** Enabling Beta/Preview APIs to make an error go away would defeat the entire purpose of the stage (see `concept-architecture-decision` ADR-002).
