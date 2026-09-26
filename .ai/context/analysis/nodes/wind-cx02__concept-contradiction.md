---
type: "concept-contradiction"
node_id: "L0-wind-cx02"
source_channel: "rollout"
analysis_version: 2
title: "CX-wind-02 · \"Check the linked Airship once, right after the Windmill\" vs never touching unloaded chunks"
aliases: ["L0-wind-cx02"]
is_a: ["contradiction"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 1415
tags: ["is_a:contradiction", "category:source-vs-constraint", "severity:low", "status:open", "target:L0-airs", "linked-airship", "relates_to:L0-wind-r012", "relates_to:L0-wind-ad03", "relates_to:L0-strf-r007"]
level: 2
---
# CX-wind-02 · "Check the linked Airship once, right after the Windmill" vs never touching unloaded chunks

**Links:** `part_of: ["L0-wind"]` · `is_a: ["contradiction"]` · `relates_to: [L0-wind-r012, L0-wind-ad03, L0-strf-r007, L0-airs]`
**Target:** `L0-airs` · **Category:** spec vs constraint C-12 · **Severity:** low · **Status:** open.

- §7: "Проверку связанных Дирижаблей выполнять один раз после успешной генерации конкретной Мельницы." §5.6: search the whole 40–100 ring before giving up.
- C-12 / `L0-strf-r007`: no validity read in an unloaded chunk. A normal Windmill is placed when a player is near its plot (discovery radius 4 chunks = 64 blocks), so most of a 100-block ring plus the Airship's footprint is usually **not loaded** at that moment.
- Read literally, "once, right after" gives one of two wrong outcomes: evaluating only the loaded part of the ring (biased, often "no site"), or reading unloaded chunks (forbidden).

**Proposed reading (`L0-wind-ad03`):** "once" = one *completed* attempt. While ring chunks are unloaded, the attempt returns `deferred` and resumes on later discovery visits; the outcome is recorded once. For the spawn Windmill, the ticking area covers the ring, so its attempt completes at start. Alternative: a temporary ticking area per Windmill (more load, 10-area cap).

**Needed:** `airs` deep-dive to adopt the deferral contract or choose the ticking-area variant.
