---
type: "concept-contradiction"
node_id: "L0-scyt-cx02"
source_channel: "rollout"
analysis_version: 5
title: "CX-scyt-02 · Projectile tuning disagrees: 0.5 vs 0.6 block/tick, and turn-limited vs pure pursuit"
aliases: ["L0-scyt-cx02"]
is_a: ["contradiction"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1212
tags: ["is_a:contradiction", "category:source-vs-source", "severity:low", "target:L0-sprj", "tuning", "resolved", "resolved_by:L0-adr-scyt"]
level: 2
---
# CX-scyt-02 · Projectile tuning disagrees: 0.5 vs 0.6 block/tick, and turn-limited vs pure pursuit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["contradiction"]` · `relates_to: ["L0-sprj-ad02", "L0-sprj", "L0-scyt-p002"]` · **Target:** `L0-sprj` · **Category:** source vs source · **Severity:** low · **Status:** open.

- **`L0-sprj-ad02` (live):** constant speed **0.5** block/tick (ASM-018), **no** turn-rate limit.
- **`project-knowledge/domain-model.md` → `L0-scpr-ent2` (rollup):** speed **about 0.6** block/tick (ASM-029), with a "maximum turn rate", a 1.0 hit radius, a 5-tick stagger and a 200-tick lifetime.

**Why it matters:**
- The speed sets how long a volley lasts, so it sets how often the leash or an expiry decides the outcome (AC-sprj-08/13).
- A turn limit changes whether a target that dodges sideways can be missed.
- The ASM number also clashes: ASM-018 against ASM-029.
- GameTest timing windows must use one set of numbers.

**Proposed:** follow the live `L0-sprj-ad02` (0.5 block/tick, pure pursuit) and adopt the rollup's stagger, lifetime and hit radius where `sprj` is silent. Keep all of them in one exported `SCYTHE_TUNING` constant. **L0 decides.** This node does not resolve it.
