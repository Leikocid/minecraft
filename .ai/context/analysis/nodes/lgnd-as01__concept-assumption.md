---
type: "concept-assumption"
node_id: "L0-lgnd-as01"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-as01"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 557
tags: ["assumption", "decided", "Q-020"]
level: 2
---
**ASM-lgnd-01 — decided 2026-09-24 (decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk): loss return applies to all legendaries, shipped in ed7558b.**

Indestructibility and Void return cover the Web Sword as well as the Scythe ("по общим правилам", by the general rules). The craft right is still not reopened.

**Impact if wrong:**
- **(b) Scythe only:** `returnOnLoss` becomes a per-def flag set to false for the Web Sword. That is a one-line change, and ac09 is inverted for the Web Sword.
- **(c) not in v3:** drop `L0-lgnd-p003`, the owed/gen parts of ent4, ad02, ad03, ac08–ac10 and ac12. That removes about 30 % of this component's effort.
