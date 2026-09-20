---
title: Boundaries
type: project-knowledge
generated_at: "2026-09-20T16:22:35.849Z"
source_channel: rollout
node_id: rollout-boundaries
aliases: ["rollout-boundaries","boundaries","project-knowledge/boundaries"]
is_a: ["rollout","boundaries"]
relates_to: ["L0"]
priority: 120
---

# Boundaries

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### System Boundaries (L0)

# System Boundaries

## In scope — Stage 0 (development infrastructure)

| # | Item | Source |
|---|---|---|
| S0-1 | Behavior pack + resource pack, one manifest each, with a dependency on `@minecraft/server` | stage-0 |
| S0-2 | Exactly one script: writes a chat message on player entry (`world.afterEvents.playerSpawn`, `initialSpawn`) — proof that scripts execute | stage-0 |
| S0-3 | Exactly one trivial item with RU + EN names and its own icon — proof that the resource pack and localization are picked up. **Explicitly not a pickaxe**; "любой пустой предмет" | stage-0 |
| S0-4 | Single-command build: `npm run build` → `dist/<name>.mcaddon` | stage-0 |
| S0-5 | README describing the cycle "собрать → сервер в Docker → iPad" | stage-0 |
| S0-6 | Project in git with a first commit | stage-0 |
| S0-7 | Docker BDS (`itzg/minecraft-bedrock-server`, linux/amd64 via Rosetta) as load/log rig and LAN server for the iPad | stage-0 |

## In scope — Stage 1 (Miner's Pickaxe probe)

| # | Item | Source |
|---|---|---|
| S1-1 | **One** custom item only: Кирка шахтёра / Miner's Pickaxe | pickaxe-spec |
| S1-2 | Behavior Pack + Resource Pack + stable Script API | pickaxe-spec |
| S1-3 | Visibility in Creative Inventory (Equipment/pickaxe group), Creative search, and `/give` | pickaxe-spec |
| S1-4 | Russian and English item names | pickaxe-spec |
| S1-5 | Crafting recipe (3×3, see `concept-entity`) | pickaxe-spec |
| S1-6 | Infinite durability (achieved by omitting the durability component) | pickaxe-spec |
| S1-7 | Enchantable via the pickaxe enchantment slot | pickaxe-spec |
| S1-8 | Diamond-*like* mining speed for common pickaxe blocks | pickaxe-spec |
| S1-9 | Auto-smelt prototype for the listed ore set (iron, gold, copper, their deepslate variants, ancient debris) | pickaxe-spec |

## Explicitly out of scope

### Excluded by decision (will not be done)

| Item | Reason given |
|---|---|
| **Minecraft Java Edition** | Target device is an iPad; Java does not run there. Hard exclusion. |
| **Beta / Preview Script APIs** | Stable API only. Enabling them would invalidate the compatibility probe. |
| **Windows PC** | *«не требуется»* — not part of the environment. Parallels/Windows listed as optional fallback only. |
| **macOS Bedrock client** | Does not exist. The Mac is build/static-check/server only. |

### Deferred (may be done later, not now)

| Item | Deferred until | Source |
|---|---|---|
| **Fortune multiplication** behavior | Not part of the compatibility test | pickaxe-spec |
| **Silk Touch override** behavior | Not part of the compatibility test | pickaxe-spec |
| **Exact parity with every diamond-pickaxe mining tag** | "after the user confirms the pack loads and scripts execute" | pickaxe-spec |
| **Durability component** | Prototype deliberately omits it | pickaxe-spec |

### Outside this analysis entirely

- **Stage 2 — the main PvP Add-On.** Requirements *«ещё не сформулированы»*. No scope, no entities, no criteria exist. Any L1 decomposition of Stage 2 would be invention, not analysis.

## Boundary notes and edge cases

**Non-listed blocks keep vanilla behavior.** The spec is explicit: *"Normal non-smelting blocks keep vanilla breaking behavior."* The auto-smelt override is a closed allow-list, not a general transformation. Anything not in the ore table must be left strictly alone — this is a boundary, not an omission.

**Stage 0's item vs Stage 1's item are different items.** Stage 0 mandates a trivial non-pickaxe placeholder. Stage 1 mandates the pickaxe. These are not the same deliverable and the Stage 0 item is expected to be discarded or replaced.

**Stage 0 and Stage 1 verification overlap.** Both stages independently require: `.mcaddon` imports cleanly, item visible in Creative, RU + EN names render. Stage 1 re-tests what Stage 0 already proved. See `concept-contradiction` CTR-002 — this redundancy is real and should be resolved by trimming Stage 1's criteria rather than by re-running the same checks.

**The BDS server cannot validate half the Stage 0 criteria.** A dedicated server loads behavior packs and runs scripts, but renders nothing. Creative inventory visibility, the item icon, and RU/EN localization are only observable on the iPad. The environment table's split of duties already reflects this and must be preserved: Docker answers *"did it load and run?"*, iPad answers *"does it look right?"*



