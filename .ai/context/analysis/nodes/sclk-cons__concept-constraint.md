---
type: "concept-constraint"
node_id: "L0-sclk-cons"
source_channel: "rollout"
analysis_version: 7
title: "Constraints · `sclk` (component NFRs; inherits C-1 … C-28)"
aliases: ["L0-sclk-cons"]
is_a: ["constraint"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1340
tags: ["constraints", "nfr", "C-5f", "C-26", "C-27", "C-28", "C-20"]
level: 2
---
# Constraints · `sclk` (component NFRs; inherits C-1 … C-28)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["constraints"]` · `relates_to: ["L0-sclk-as04", "L0-sclk-ad04"]`

| Id | Constraint | From |
|---|---|---|
| K-sclk-1 | Zero per-tick cost when no bolt is alive and the carve queue is empty. No world scans, ever. | C-5f, §11 |
| K-sclk-2 | ≤ 3 trail particles per bolt per tick; bolt lifetime ≤ 100 ticks | C-5f, `xasm27` |
| K-sclk-3 | ≤ 300 `setType` per tick from the carve queue; no `runJob`, no new `runInterval` | ad04 |
| K-sclk-4 | Stable `@minecraft/server` 2.10.0 only; no Experiments; deviations are documented in the README | C-16, §13 |
| K-sclk-5 | Server-authoritative: every hit, damage and edit decision is in the BP script; the RP is cosmetic | §11 |
| K-sclk-6 | Edits respect C-12 (no unloaded writes) and C-27 (box, protect-first, deny list) | C-27 |
| K-sclk-7 | Acceptance with ≥ 2 SimulatedPlayers per combat test (a shooter plus a target or bystander) on the **checks** BDS; GameTests never default to production | C-20‴ |
| K-sclk-8 | Pure planners (`crater-plan.ts`, the speed gate, Piercing stripping) are node-tested with no `@minecraft/server` import. Platform quirk: `addEnchantments` silently drops a conflicting element and does not throw, while `canAddEnchantment` on a conflict throws `EnchantmentLevelOutOfBoundsError` instead of returning false | the repo pattern |
| K-sclk-9 | Defs #1–#4 keep byte-identical behaviour; the Orbital carve is unchanged after the deny-list move | `xcx24`, `xcx25` |
