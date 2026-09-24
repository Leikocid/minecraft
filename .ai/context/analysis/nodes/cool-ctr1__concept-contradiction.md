---
type: "concept-contradiction"
node_id: "cool-ctr1"
source_channel: "rollout"
analysis_version: 1
title: "CTR-1 · Scythe's \\"common legendary rules\\" include void return / indestructibility; Web Sword spec and code don't"
aliases: ["cool-ctr1"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1004
tags: ["target:L0-lgnd","status:open","category:source-vs-source","title:Void return missing for Web Sword","resolved"]
closed_at: 2026-09-24
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-cool-ctr1
---

# CTR-1 · Scythe's "common legendary rules" include void return / indestructibility; Web Sword spec and code don't

**Source A** — `scytheofcalamityspecv1ruen-part-1` §1: «Легендарное оружие не должно уничтожаться обычными способами; при падении в Void возвращается последнему владельцу **по общим правилам**».

**Source B** — `webswordspecv1ruen-part-1` §4 covers death retention only; no rule about void, lava, fire, cactus or item despawn. Code `src/websword/retention.ts` handles the death sweep/restore only (verified: no void/destroy handling).

**Why it matters.** With one Survival craft per world (and decision q-014: the right stays spent after the sword is destroyed), a Web Sword thrown into lava or the void is lost for that world for good. The two specs disagree about whether this is acceptable.

**Resolution needed.** Confirm that void return / indestructibility is a shared legendary rule → implement it in the `lgnd` framework and apply it to Web Sword too; or state it's Scythe-only.
