---
type: "concept-architecture-decision"
node_id: "L0-adr-orbc"
source_channel: "rollout"
analysis_version: 3
title: "ADR-L0-orbc · Orbital Cannon is a third LegendaryDef with its own module and dual input"
aliases: ["L0-adr-orbc", "Orbital integration ADR"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0", "L0-lgnd", "L0-orbc", "L0-adr-wpn2", "L0-adr-cast", "L0-xcx8"]
see_also: ["orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3", "orbitalcannonspecv1ruen-part-4"]
governs_files: ["src/legendary/registry.ts", "src/legendary/hands.ts", "src/main.ts"]
priority: 540
size_chars: 1936
tags: ["title:ADR-L0-orbc · Orbital Cannon is a third LegendaryDef with its own module and dual input", "alias:L0-adr-orbc", "alias:Orbital integration ADR", "is_a:architecture-decision", "relates_to:L0", "relates_to:L0-lgnd", "relates_to:L0-orbc", "relates_to:L0-adr-wpn2", "relates_to:L0-adr-cast", "relates_to:L0-xcx8", "see_also:orbitalcannonspecv1ruen-part-1", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "status:proposed", "cross-component"]
level: 1
---
# ADR-L0-orbc · Orbital Cannon is a third LegendaryDef with its own module and dual input

**Status:** proposed. **Context.** Orbital §1 asks for a *standalone* module that is portable into "the full PvP add-on". This repo already is that add-on. It has a static `LEGENDARIES` registry and per-weapon subscriptions filtered through `resolveActivation` (`L0-adr-wpn2` amending `L0-adr-cast`). The Cannon is the first weapon with **two** activations (Attack and Use), and both share one cooldown.

**Decision.**
1. Add `ORBITAL_CANNON: LegendaryDef` with `itemId andrew:orbital_cannon`, `keyPrefix "oc"`, `abilityKey "orbital_cannon"`, `cooldownTicks 600`, `craftGate true`, refund `[["minecraft:tnt",4],["minecraft:fishing_rod",1]]` and `command andrew:orbital`. The weapon body lives in `src/orbital/` and imports only `src/legendary/*` public contracts.
2. **Input.** RMB = `world.afterEvents.itemUse` (plus `itemUseOn` / `playerInteractWithBlock` deduped per tick). LMB = `world.afterEvents.entityHitBlock` where the damager is a player holding the Cannon, with a `beforeEvents.playerBreakBlock` cancel so Creative LMB does not break the targeted block. Both paths resolve the target through one `getBlockFromViewDirection({maxDistance: 10})` call at activation time. They do not use the event's block, so the target rule is the same for both modes.
3. `resolveActivation` gets a `mode` argument. Hand priority (main, then off) is unchanged.

**Rejected alternatives.**
- A separate behavior pack for "standalone": it would need a second craft gate and a second mark scheme and would break C-7′.
- Detecting LMB through `entityHitEntity` or the swing animation: there is no stable "swing" event.
- A beta `playerButtonInput` or input API: this violates C-2.

**Consequences.** LMB inherits the vanilla reach limit. See `L0-xcx8`: if the client insists on 10 blocks for LMB, only a stable workaround such as sneak+Use can deliver it.
