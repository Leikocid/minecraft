---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 3
title: "Global Constraints"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4", "constraints", "stage-0-infrastructure"]
supersedes: ["L0-constraint@v2"]
priority: 540
size_chars: 2237
tags: ["title:Global Constraints", "alias:L0-constraint", "alias:Constraints", "is_a:constraint", "relates_to:L0", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "see_also:constraints", "see_also:stage-0-infrastructure", "supersedes:L0-constraint@v2"]
level: 0
---
# Global Constraints

C-1 … C-14 from v2 are carried unchanged (Bedrock only; stable `@minecraft/server` 2.10.0 through `scripts/targets.mjs`; retarget on error; `andrew:` + RU/EN; tick budgets C-5a/C-5b; durable bounded state; no duplication; reproducible build; the `bds`/`ipad` split; before-events never mutate; stage gating; never write into unloaded chunks; structure blocks are ordinary; dimension locks). v3 adds or tightens:

| ID | Constraint | Source |
|---|---|---|
| C-5a′ | *(tightened)* A weapon attack may run a bounded, self-terminating job, and only while its charges exist. No permanent per-tick loop. LMB block removal is batched through `system.runJob`, but it must *look* instant: the whole column goes within the detonation tick or the next few ticks. RMB may have ≈160 live charges from one player, and several players may fire at once. The budget must hold at that load. | Orbital §9, §12, §15 |
| C-7′ | *(extended)* No duplication of **any** legendary through death, a container, the Void, logout/rejoin, concurrent actions **or the Cannon's own effects**. Destroyed containers and blast zones must neither lose a legendary nor copy it. | Orbital §5, §15 |
| C-15 | *(new)* Priority order on conflict: (1) no duplication or save corruption, (2) correct gameplay, (3) MP sync and performance, (4) visual fidelity. | Orbital §16 |
| C-16 | *(new)* Every known stable-API limitation used by a weapon is documented **next to the implementation**, in code comments plus the weapon's deviation notes, not only in the analysis. | Orbital §12, §15 |
| C-17 | *(new)* Cooldowns are per player and shared across all of that player's copies of the same weapon. The cooldown starts on successful activation and is never refunded when a charge is lost. It persists across restart. | Orbital §6, §7, §11 |
| C-18 | *(new)* Copies from Creative or `/give` never read or change the Survival craft flag. | Orbital §4 |
| C-19 | *(new)* After an attack, every temporary entity is gone and no uncontrolled item entities are left behind. Mass RMB must not multiply entities or drops. | Orbital §15 |
| C-20 | *(new)* Weapon acceptance involves at least two players (cooldown independence, transfer, death, sync). | Orbital §15 |
