---
type: "concept-boundary"
node_id: "L0"
source_channel: "rollout"
analysis_version: 2
title: "System Boundaries"
aliases: ["L0"]
is_a: ["boundary"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 530
size_chars: 3334
tags: ["title:System Boundaries", "alias:L0-boundary", "alias:Boundaries", "is_a:boundary", "relates_to:L0", "see_also:fourstructuresspecruencopy", "supersedes:L0-boundary@v1"]
level: 0
---
# System Boundaries

## In scope
- Bedrock behavior pack + resource pack shipped as one `dist/andrew.mcaddon`.
- Stage 0 infrastructure: `npm run build`, `validate`, `bds:check`, `bds:gametest`, `bds:up/down/logs`, README cycle build → Docker BDS → iPad (LAN).
- Stage 1: `andrew:miners_pickaxe` (closed).
- Stage 2–3: legendary framework, `andrew:web_sword`, Scythe of Calamity. **Correction to v1:** the Scythe now targets mobs as well as players, with players ranked first (commit `4b74f2f`, docs `1e04150`). v1 listed "mobs as targets" as out of scope; that no longer holds.
- **New — structures (Four Structures spec):**
  - Windmill (Overworld, dry land, 1 %/chunk + one guaranteed near spawn with forced site preparation up to 500 blocks).
  - Airship (Overworld over land, 2 %/chunk + one linked attempt per Windmill at 40–100 blocks; 40–70 blocks above terrain).
  - Mini Warden City (Overworld underground, 5 %/chunk, top at Y −35…−45, surface sculk marker).
  - Mini Bastion (Nether, 5 %/chunk, not over lava ocean).
  - One fixed template per structure plus random rotation 0/90/180/270.
  - A shared custom loot table (Windmill + Airship). Vanilla loot tables for Warden City (Ancient City) and Bastion (treasure / other).
  - Vanilla-like breakable spawners (Windmill ×3, Airship ×1). One-time persistent guards (10 sun-immune Zombie Villagers per Windmill; 7–10 Piglins + 2 Brutes per Bastion).
  - Idempotent first initialisation. Nothing regenerates after restart or chunk reload.
  - Tooling to produce the four templates reproducibly from the repo (no Windows editor).
  - A technical deviation report listing every stable-API approximation.
- RU/EN names for every user-facing string. Structure names: Мельница/Windmill, Дирижабль/Airship, Маленький город Вардена/Mini Warden City, Маленький Бастион/Mini Bastion.
- Single-player worlds and BDS with ≥2 players. Main scenario: add-on installed **before** the first world start. Installing into an existing world is secondary (one-time init allowed).

## Out of scope (explicit)
- Java Edition. Beta/Preview/Experimental APIs and experiment toggles, including experimental data-driven jigsaw worldgen (spec §7 "Не включать Experiments только ради косметической точности").
- Structure variants (only rotation), procedural field layouts, relocation of a failed candidate to a neighbouring chunk (except the spawn Windmill search and the linked Airship search).
- Automatic restoration of anything: blocks, loot, spawners, guards.
- Chat announcements for structure generation (§8).
- Pre-spawned Warden; Hoglins in the Bastion; mob spawners in the Bastion; functional portal in the Warden City monument.
- Lift, ladder or teleport up to the Airship.
- Enchanted Golden Apple in the custom table (it stays possible in the vanilla Ancient City table).
- Pickaxe: Fortune/Silk Touch overrides. Web Sword: long-range beam, replacing entities/containers/protected blocks, writing into unloaded chunks.
- Network services, accounts, user data.

## Undefined / not yet in scope
- Shadow Blade and Dragon Katana (both only referenced).
- The "earlier draft decisions" that §13/§14 override (e.g. a 30×30 Bastion, a 50 % spawn-Windmill chance). They are not in the KV (`L0-xcx5`).
- An exact definition of "защищаемый спавнер" (protected spawner, §2). Assumed in `L0-xasm3`.
