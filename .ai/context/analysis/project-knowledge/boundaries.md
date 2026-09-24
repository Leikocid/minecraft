---
title: Boundaries
type: project-knowledge
generated_at: "2026-09-24T19:42:02.842Z"
source_channel: rollout
node_id: rollout-boundaries
aliases: ["rollout-boundaries","boundaries","project-knowledge/boundaries"]
is_a: ["rollout","boundaries"]
relates_to: ["L0"]
priority: 520
---

# Boundaries

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### System Boundaries (L0)

# System Boundaries

## In scope
- Bedrock behavior pack + resource pack shipped as one `dist/andrew.mcaddon`.
- Stage 0 infrastructure: `npm run build`, `validate`, `bds:check`, `bds:gametest`, `bds:up/down/logs`, README cycle build → Docker BDS → iPad (LAN).
- Stage 1: `andrew:miners_pickaxe` — recipe (3 iron / raw gold–stick–raw gold / stick), infinite durability, pickaxe enchantments, diamond-like dig speed, auto-smelt of iron/gold/copper ores (+deepslate) and ancient debris.
- Stage 2: legendary framework + `andrew:web_sword` + Scythe of Calamity (recipe: golden apples ×2, obsidian ×2, diamond hoe).
- RU (`ru_RU`) and EN (`en_US`) for every item name and user-facing message.
- Single-player worlds and dedicated multiplayer (BDS) with ≥2 players.

## Out of scope (explicit)
- Java Edition (iPad target).
- Beta/Preview/Experimental Script APIs and experiment toggles in shipped packs.
- Pickaxe: Fortune multiplication and Silk Touch override; exact parity with every diamond-pickaxe tag (deferred tuning).
- Windows PC tooling (optional Parallels only).
- Network services, accounts, auth, user data — the add-on is offline content.
- Web Sword: artificial long-range beam; replacing entities, containers/block-entities, bedrock and protected blocks; writing into unloaded chunks.
- Scythe: mobs as targets; breaking blocks with projectiles.

## Undefined / not yet in scope
- Shadow Blade (only referenced as an invisibility source for Scythe targeting).
- Any further legendary weapons and the full "PvP add-on" feature set beyond these two weapons.



