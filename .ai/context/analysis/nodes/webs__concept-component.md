---
type: "concept-component"
node_id: "L0-webs"
source_channel: "rollout"
analysis_version: 1
level: 1
title: "Web Sword: Targeting & 3×3×3 Cobweb Trap"
aliases: ["L0-webs"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 3421
tags: ["component", "targeting", "trap", "protected-blocks", "item", "unloaded-chunks"]
---
---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-lgnd-ad06", "L0-lgnd-cx04", "L0-lgnd-p004", "L0-lgnd-ent1", "L0-sprj"]
---

# Web Sword: Targeting & 3×3×3 Cobweb Trap

**Responsibility.** This component owns only what is unique to the Web Sword as a weapon: its item/recipe identity, and its active-ability body — resolving a melee-reach target and stamping a 3×3×3 (27-cell) cobweb trap around it, skipping protected and unloaded cells. It is the Web Sword's counterpart to `L0-sprj` (Scythe's homing-projectile body): both are per-weapon "cast" implementations plugged into the shared `L0-lgnd` legendary framework.

**Explicitly NOT owned here** (see `L0-lgnd` instead): one-per-world craft gate + refund + first-craft broadcast (`L0-lgnd-p001`), death retention (`L0-lgnd-p002`), Void/lava/despawn loss return (`L0-lgnd-p003`), main/off-hand dispatch (`L0-lgnd-p004`), cooldown timer + busy flag + Action Bar HUD (`L0-lgnd-p005`, `L0-lgnd-ent3`), instance marking/anti-dup (`L0-lgnd-ent2`), operator commands (`L0-lgnd-p007`), localization plumbing. Raw spec §§3,4,8,9,10,14 (one-per-world, death retention, cooldown UI, multiplayer determinism, localization, DoD) are all satisfied by the shared framework already deep-dived as `L0-lgnd`; a scope-overlap contradiction (`L0-webs-cx01`) documents this so the two aren't independently re-implemented or re-decided.

**Inputs.** A ready, dispatched cast from `L0-lgnd-p004` (`onCast(player)`), the player's current melee-interaction ray/reach, and world block/entity state around the resolved target.

**Outputs.** Up to 27 placed `minecraft:web` blocks; a filled-cell count; the ability wrapper starts the cooldown itself on `filled > 0` and returns `"cast"`/`"refused"` to `L0-lgnd` (`L0-webs-r005`, `L0-adr-cast`).

**Core flow** (detail in `L0-webs-p001`): resolve target cell (block-face-adjacent or entity-foot, entity wins ties, no hit ⇒ no target) → enumerate the 27-cell cube centered there → classify each cell (fillable / protected / unloaded / entity-occupied) → replace fillable cells with cobweb → report count.

**Item identity** (`L0-webs-ent1`, `L0-webs-r001`): Diamond-Sword-equivalent melee damage, infinite durability, `minecraft:enchantable` slot `sword`, shaped recipe (4× Cobweb + 1× Diamond Sword, any durability/enchantment, none carried over). This is currently documented only in the rollup decision `web-sword-item-values`; this component gives it a durable home.

**Why this scope now.** `L0-lgnd`'s migration (`ADR-021`, `L0-lgnd-ad06`) explicitly stopped short of the cast body: `L0-lgnd-cx04` notes the shipped `registerTrap()` (in `src/websword/trap.ts`, called from `src/gametest/main.ts`) "no longer subscribes to `itemUse` itself" under the new framework — i.e. `registerTrap`/the trap module is exactly this component's code counterpart, and it never received its own deep-dive. Decisions Q-011 (cube geometry), Q-013 (protected-block list) and Q-017 (zero-cells outcome) already resolved the hard questions operator-side; this deep-dive gives them rule/process/entity homes and adds the acceptance criteria, glossary and assumptions the rollups don't carry.

**NFRs.** Server-authoritative, deterministic across clients (spec §9); no permanent per-tick world scan (spec §11, project C-4/C-5) — target resolution and cube fill are one-shot, triggered only by a cast; never write into unloaded/inaccessible chunks (spec §6/§12).
