---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 1
title: "Global Constraints"
aliases: ["L0"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1887
tags: ["title:Global Constraints", "alias:L0-constraint", "is_a:constraint", "relates_to:L0"]
level: 0
---
# Global Constraints

| ID | Constraint | Source |
|---|---|---|
| C-1 | Bedrock Edition only; target device iPad (App Store Minecraft). | stage-0 |
| C-2 | Stable `@minecraft/server` only, pinned 2.10.0; `min_engine_version` [1,26,50]; BDS 1.26.51.1; single source of truth `scripts/targets.mjs`. | stage-0, pickaxe spec, constraints.md |
| C-3 | On a dependency/format error: retarget using the exact error text, never switch to Beta/Preview. | pickaxe spec |
| C-4 | All custom identifiers under `andrew:`; every item and message has `en_US` + `ru_RU` via resource-pack `.lang` (no hard-coded single language in scripts). | constraints.md, web sword §10 |
| C-5 | Ability logic runs server-side; no permanent global per-tick world scans. Short-lived tick loops allowed only while temporary objects (Scythe projectiles) exist. | web sword §11, scythe §7 |
| C-6 | One-per-world craft state lives in durable world-level storage surviving restart; concurrent crafts must not bypass it. | web sword §3, §9, §11 |
| C-7 | No duplication via craft, death, disconnect/reconnect, restart; no orphaned temporary entities on target death/logout/dimension change. | web sword §14, scythe §7, §9 |
| C-8 | Reproducible build from a clean clone with one command; no manual packaging, no machine-specific paths. | stage-0 |
| C-9 | Verification split: BDS proves loading/scripts; iPad alone proves rendering, icons, Creative placement, names; Survival world for drop behaviour. | constraints.md |
| C-10 | Before-events never mutate the world synchronously (defer via `system.run`); TS `strict`, no `any`. | constraints.md |
| C-11 | Stage gating: Stage N+1 work starts only after Stage N criteria close. | stage-0, constraints.md |
| C-12 | Performance/safety: 3×3×3 placement must skip protected cells and unloaded chunks; must be safe on a dedicated multiplayer server. | web sword §6, §11–12 |
