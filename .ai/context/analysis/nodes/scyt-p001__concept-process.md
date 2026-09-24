---
type: "concept-process"
node_id: "L0-scyt-p001"
source_channel: "rollout"
analysis_version: 1
title: "P-scyt-001 — Activation and target acquisition"
aliases: ["L0-scyt-p001"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 2440
tags: ["is_a:process", "targeting", "activation"]
level: 2
---
# P-scyt-001 — Activation and target acquisition

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-scyt-r001", "L0-scyt-r002", "L0-scyt-r003", "L0-scyt-ad01", "L0-scyt-ad02", "L0-scyt-ad03", "L0-lgnd", "L0-sprj"]` · source: Scythe §3, §7.

**Trigger:** `world.afterEvents.itemUse`. `source` is a `Player` and `itemStack.typeId === "andrew:scythe_of_calamity"`.

## Steps
1. **Dispatch (`L0-lgnd`).** The legendary dispatcher resolves hand priority. If the main hand holds a ready legendary, it wins. If the main hand is on cooldown or busy, a ready off-hand legendary may fire. If the Scythe is not the ready ability, stop silently.
2. **Guard.** Proceed only if the owner is valid, alive and not a spectator (a Creative owner may cast for testing, `L0-scyt-as01`), and `isBusy(owner, "scythe")` is false. Otherwise stop silently. The HUD already shows the state.
3. **Snapshot** once:
   - `launchPoint = owner.location`, frozen for the volley;
   - `dim = owner.dimension`;
   - `eye = owner.getHeadLocation()`;
   - `view = owner.getViewDirection()`.
4. **Candidate query**, bounded (`L0-scyt-ad01`): `dim.getPlayers({ location: launchPoint, maxDistance: 20, excludeNames?: — })`, then drop the owner by id.
5. **Filter** each candidate with `L0-scyt-r001`: valid, alive, not spectator or creative (Q-015 mirror), not hidden by Shadow Blade, and visible (`L0-scyt-ad02`).
6. **Select** with `L0-scyt-r002`: minimum 3D distance from `launchPoint` to `candidate.location`. On an ε-tie (0.01), pick the smallest angle between `view` and `normalize(candidate.head − eye)`. If still tied, pick the ascending entity id (ASM-025).
7. **No target** (`L0-scyt-r003`):
   - post `{ translate: "andrew.scythe_of_calamity.no_target" }` to the owner's action bar through `L0-lgnd`'s `hud.hold` so the steady HUD does not overwrite it;
   - no cooldown, no busy, no world change;
   - end.
8. **Lock:** call `L0-sprj.launchVolley({ ownerId, targetId, launchPoint, dimensionId })`. From here `L0-sprj` owns busy, flight, damage, the leash, the outcome and cleanup.

## Notes
- Steps 3 to 6 run once per press. There is no per-tick scan (C-5, §7).
- No world mutation happens here. `afterEvents` is not read-only, but nothing needs to be written anyway.
- Multiplayer: presses from different owners are independent. Two owners may lock the same target (`L0-sprj-r007`).
- Mobs never enter the candidate set, because `getPlayers` returns players only (spec test 2).
