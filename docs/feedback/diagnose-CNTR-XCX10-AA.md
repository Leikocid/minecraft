ИСХОД: 2 — Работа над кодом

# CNTR-XCX10-AA · CX-L0-10 «Legendaries are not destroyed» vs «destroyed means returned»

The report covers the whole claim. Checked on `32f4aca` against BDS 1.26.51.1, in a private instance (`andrew-bds-xcx10`, ports 19410–19419 and 7581), with an uncommitted probe (Appendix A).

The claim rests on one premise: *"the stable API has no way to make an item entity indestructible"*. That premise is **false for fire and lava**. The stable item component `minecraft:fire_resistant` keeps a custom item entity alive in both.

The claim also misses the one container-destroying path the add-on already ships. **Structure placement erases a lone hopper together with the marked legendary inside it, and recovery never sees it.** This was reproduced end to end through `StrfRuntime.placeAt`.

The two aggravations it does name (Cannon LMB/RMB) have no code behind them. Both also rest on stale knowledge:
- `setType(air)` **spills** container contents; it does not delete them.
- The RMB mechanism the claim names has been withdrawn.

Evidence (root `.ai/verify/CNTR-XCX10-AA/`):
- `2.red.json`: red probe run. Lava, fire, container removal and the end-to-end placement.
- `2.json` (exit 0): `bds:check --overlay .xcx10-overlay` passes in the no-experiment world with the probe item inside `andrew_bp`, followed by the despawn probe.

## Remeasurement of the claim

| # | Claim | Measured with | Result |
|---|---|---|---|
| 1 | Orbital §5: not destroyed by fire, lava, cactus, TNT or the Cannon; a destroyed container's legendary survives or drops | `doc_get orbitalcannonspecv1ruen-part-1.md` §5 | **true**. §5 also sends a Void fall back to the last owner: Void return is spec, not a deviation |
| 2 | The `recovery.ts` header quote | `sed -n 4,9p src/legendary/recovery.ts` (277 lines, last commit `e38cb75`, 2026-09-24) | **true**, verbatim at `:4-5` |
| 3 | "Re-issued to the owner's inventory, elsewhere" | `recovery.ts:219` (`player.id === w.mark.owner`), `:228-231` (`setPending` + `restore`) | **true**. Owner vs last holder belongs to `L0-xcx11` / `L0-lgnd-cx09`, not this node |
| 4 | "Container destruction is not handled specially; vanilla spills and recovery watches the item entity" | `grep -rnE 'playerBreakBlock\|blockExplode\|explosion\|entityRemove' src/legendary` → only the comment at `recovery.ts:7`; `recovery.ts:60-67` watches only `entitySpawn` / `entityLoad` | **true for vanilla, incomplete**: shipped script removal (structures) spills nothing (F2) |
| 5 | "The stable API has no way to make an item entity indestructible" (= `L0-lgnd-as04`) | `strings bedrock_server-1.26.51.1`: `FireResistantItemComponent` registered as `minecraft:fire_resistant` (schema `SharedTypes::v1_21_90`, next to `minecraft:damage_absorption`); `minecraft:should_despawn` ("determines if the item should eventually despawn while floating in the world"); probe | **false for fire, lava and despawn** (F1). Cactus, explosions and the Void were not measured; return is still needed for them |
| 6 | "LMB deletes containers with contents, so the vanilla drop never happens" (= `as12` item 3) | `ls src/orbital` → *No such file or directory*; `grep -rni orbital src packs tests scripts` → 0 hits; probe `fill_container` | **no code**. Engine premise **false**: `setType(air)` spilled a hopper, a chest and a dropper (F2) |
| 7 | "RMB drop suppression (`L0-adr-ochg`) could delete a spilled legendary" | `doc_get adr-odrp`: status **accepted**, "Amends `L0-adr-ochg` §3 … the mechanism they name is withdrawn" | **no code; stale** inside the KV itself |
| 8 | "Recorded as a deviation (C-16)" | L0 constraint table: C-16 = every known stable-API limitation is documented next to the implementation | **true** in code (`recovery.ts:4-9`). For fire, lava and despawn the "limitation" does not exist |

## F1 · Fire, lava and despawn are avoidable with stable item components

Five items were dropped into lava, and separately into fire on netherrack, then read after 80 ticks. Two runs gave identical outcomes. The only world experiment was `Experiment(s) active: gtst` (Beta APIs, the script lane).

| item | lava 80 t | fire 80 t | despawn, alive at t=6000 |
|---|---|---|---|
| `minecraft:netherite_sword` (positive control) | SURVIVED | SURVIVED | no |
| `minecraft:diamond_sword` (negative control) | DESTROYED | DESTROYED | no |
| `andrew:web_sword` (as shipped, format 1.21.0) | DESTROYED | DESTROYED | no |
| `andrew:xcx10_fr_obj`: format 1.21.90, `"minecraft:fire_resistant": {"value": true}`, `"minecraft:should_despawn": {"value": false}` | **SURVIVED** | **SURVIVED** | **yes** |
| `andrew:xcx10_fr_bool`: the same with bare booleans | DESTROYED | DESTROYED | no |

- The bare form is refused at load: `[Item] Error Parsing Item 'andrew:xcx10_fr_bool': … minecraft:fire_resistant: expected an object`. So this item is the plain-item control.
- The object form loads with no content-log line, in the stable world too. `bds:check --overlay` ran 3 boots with `xcx10_fr_obj.json` in `andrew_bp` and passed; `dist/bds-check.log` has no `[Item]` line and no `Experiment(s) active` line.
- Despawn timeline (`2.json` run):
  - t=4800: all five alive.
  - t=6000: `alive andrew:xcx10_fr_obj` only.
  - t=7200: `alive andrew:xcx10_fr_obj`.
  - `RESULT andrew:xcx10_fr_obj: SURVIVED`; the other four DESTROYED.
  - Run 1 measured the same timeline, but its test timed out (the probe loop idled 7200 ticks under a 6700-tick cap; fixed in Appendix A).

## F2 · Structure placement erases a legendary silently (shipped in v1.2.0)

Probe `fill_container`: each container held a **marked** Web Sword plus 3 diamonds and was removed by script. Item entities were counted after 20 ticks (run 2).

| container / removal | item entities | recovery |
|---|---|---|
| hopper / `fillBlocks(air)` | **NONE** | silent |
| chest / `fillBlocks(air)` | **NONE** | silent |
| hopper / `structureManager.place` (air template) | **NONE** | silent |
| hopper / `setType(air)` | web_sword, diamond×3 | `watching … (via entitySpawn)` |
| chest / `setType(air)` | web_sword, diamond×3 | watched |
| dropper / `setType(air)` | web_sword, diamond×3 | watched |

**End to end** (probe `strf_place`): `StrfRuntime.placeAt("windmill", …)` over a lone hopper holding a marked Web Sword.
- Result: `placeAt=placed; block at the spot now=minecraft:mossy_cobblestone, slot0=none; web_sword item entities within 24: NONE`.
- The server log has no recovery line for id `xcx10-e2e-0`.
- Control, a lone chest: `placeAt=rejected:collision:player`, and the sword is intact.

Mechanism:
- The placer writes exactly the two erasing calls:
  - `src/structures/place.ts:151`: `clearBox` → `fillBlocks … "minecraft:air"` (`:317-319`);
  - `:152`: `world.place` → `structureManager.place` (`:312`).
- Its only guard is the collision scan's `player` rule (`src/structures/collision.ts:47-60`).
  - It lists `chest`, `trapped_chest`, `barrel`, `ender_chest`, the furnaces and `brewing_stand`.
  - It does **not** list `hopper`, `dropper`, `dispenser`, any `*shulker_box`, `crafter`, `decorated_pot`, `frame` or `glow_frame`: `grep -nE 'hopper|dropper|dispenser|shulker|crafter|decorated_pot|frame' src/structures/collision.ts` → only `end_portal_frame`.
- Every production placement goes through `placer.run(inst, this.gate)`: `src/structures/runtime.ts:103` (queue), `:173` (discovery) and `:234` (`placeAt`, used by `/andrew:structure place|find` and the spawn Windmill's stages 1–2).
- The only safe path is the spawn Windmill's *forced* preparation: `prepare.ts` refuses any non-`NATURAL` block before its first write.
- How the loss is reached in play:
  - operator `place` or `find` over a player's hopper or shulker box;
  - the spawn Windmill search on a world that already has bases within 500 blocks;
  - natural generation. A candidate is reserved at discovery and placed once its whole footprint is loaded, and `site.ts:338` itself says "a player may have built there in between".
- `L0-lgnd-r013` item 1 already calls this a defect ("`setType`, `fillBlocks`, `structureManager` overwrite … removing such a block without the call is a defect"). But no `strf-*`, `wind-*`, `airs-*`, `wrdn-*` or `bast-*` node mentions legendaries: `grep -l legendar` over those files → 0.

## Diagnose blocks

```text
OBSERVED: BDS 1.26.51.1, 32f4aca. StrfRuntime.placeAt("windmill") over a lone hopper
          holding a marked Web Sword → placed; the hopper is mossy_cobblestone; no web_sword
          item entity within 24; no recovery line. A marked Web Sword in lava or fire is
          DESTROYED (and returned, legendary_survives_lava). A custom item with
          minecraft:fire_resistant {value:true} survives both for 80 t.
VERDICT:  bug. Orbital §5 (recorded: "container destroyed → survives/drops, not vanishes";
          "not destroyed by fire, lava") diverges from shipped behaviour twice. The first is
          silent permanent loss. The second rests on as04, which is disproven. The expectation
          is still wanted: C-15 rank 1, and L0-lgnd-r013 item 1 already calls it a defect.
CHECKS:   contradiction: none (AD-lgnd-10 tier 3 assumes as04; the measurement removes
          its premise for fire/lava/despawn, and tier 3 stays for cactus/explosion/Void) ·
          duplicate: L0-xcx10's own rollups only (list below) · criteria writable: yes
UNFOLD:   task ×2 (W1, W2). Two separate seams, one wave.
HUMAN:    none
```

```text
REPRO:  ai-kit run-check --task CNTR-XCX10-AA --criterion 2 --expect-red -- env ANDREW_BDS_DIR=bds-xcx10
        node scripts/bds-gametest.mjs --only andrew:probe_xcx10_fill_container
        --only andrew:probe_xcx10_lava_items --only andrew:probe_xcx10_fire_items
        --only andrew:probe_xcx10_strf_place   (Appendix A). 2 of 2 runs give the same outcome.
CAUSE:  C1: packs/behavior/items/web_sword.json and scythe_of_calamity.json (format 1.21.0)
        carry no minecraft:fire_resistant, so the engine burns the item entity and
        recovery.ts:218-232 re-issues it.
        C2: src/structures/place.ts:151-152 erase container contents without item entities
        (fillBlocks / structureManager.place). The gate list collision.ts:47-60 misses
        8 inventory-block families, and nothing runs a legendary-protection pass before
        the write.
PROOF:  .ai/verify/CNTR-XCX10-AA/2.red.json. It fails for these reasons:
        "andrew:web_sword burned in lava/fire: the shipped item carries no
        minecraft:fire_resistant"; "structure placement lost a legendary: lone hopper:
        placeAt=placed, sword kept=false".
RULED OUT:
  - "The probe item just drifted out of the lava." The fire test does not push items: all
    5 fire cells were still fire after 80 t, the diamond and web swords burned in them, and
    fr_obj survived. In lava, the same cells destroyed the diamond sword and the unparsed
    fr_bool.
  - "Beta APIs un-gates the component." The only experiment was gtst (scripts), and the
    stable-world load is clean (2.json: bds:check PASS, no [Item] or Experiment line).
  - "fillBlocks drops the contents later or further away." A 12-block sweep after 20 t
    found only the setType spills, and no watch line for ids xcx10-0/1/3 or xcx10-e2e-0.
  - "The hopper survived under a structure_void cell." Its cell reads mossy_cobblestone
    and slot0=none.
```

```text
RADIUS:
  W1:
  - Item JSONs web_sword.json and scythe_of_calamity.json. Raising format_version from
    1.21.0 to ≥1.21.90 re-parses every component in them. The bare `hand_equipped: true` /
    `max_stack_size: 1` forms must be checked in the content log (bare fire_resistant is
    refused at 1.21.90).
  - GameTest legendary_survives_lava (main.ts:1391-1413). It removes a surviving sword
    itself ("survived 20 ticks, removed"), so it would stay green while testing nothing.
    It must be rewritten.
  - legendary_returns_from_void is unaffected.
  - Unmarked Creative and /give copies become fire-proof too. The component is per item
    type; r012 says unmarked copies "behave as vanilla items" (as11). This is harmless
    (no duplication) but must be written down.
  - should_despawn:false is NOT recommended. A legendary floating on a lava lake or lying
    in a pit would never come back; with despawn it returns after 5 min through p003.
  - How I looked: grep over src/scripts/tests for lava|legendary_survives; KV grep
    (duplicates list).
  W2:
  - Placer.write is shared by all 4 structure bodies, the spawn Windmill and
    /andrew:structure place|find (runtime.ts:103/173/234).
  - A protection pass before the write is a guard, not a restriction: placement still
    proceeds. Its cost is one engine-filtered getBlocks over the write box per placement,
    inside the existing job.
  - Extending the collision list instead would be a restriction (it rejects sites that
    pass today). CASES: unreachable, because placements happen in players' worlds and CI
    worlds are fresh. So it is not proposed for this node.
  - How I looked: grep placer.run / fillBlocks / structureManager.place; read collision.ts,
    prepare.ts, site.ts.
GREEN:  none, because no fix was written in this run (outcome 2). The red checks in
        Appendix A are the checks W1/W2 must turn green.
LIVE:   the probes ran on a real BDS 1.26.51.1. strf_place drove the production placer
        (StrfRuntime.placeAt → SiteGate.occupy → Placer.write).
```

## Work statements

### W1 · Legendaries do not burn: `minecraft:fire_resistant` on the items

- **Observed**: a marked Web Sword dropped into lava or fire is destroyed and re-issued to its owner (`legendary_survives_lava`, probe runs 1–2).
- **Mechanism**: the item JSONs carry no `minecraft:fire_resistant`.
- **Reachable**: any player who drops the item near lava or fire.
- **Fix**: add `"minecraft:fire_resistant": { "value": true }` to `web_sword.json`, `scythe_of_calamity.json` and the future Orbital Cannon, with `format_version` ≥ `1.21.90`. Update the `recovery.ts` header (C-16): fire and lava are prevented; cactus, explosions, despawn and the Void return.

| # | Criterion | Type |
|---|---|---|
| 1 | `npm run build` green; both item files have `minecraft:fire_resistant` `{value:true}` and format ≥ 1.21.90 | build |
| 2 | `npm run bds:check` on the no-experiment world: no content-log error or warning for either item file | e2e |
| 3 | GameTest: a marked Web Sword and a marked Scythe in lava and in fire are valid item entities after 80 t. No `recovery … lost` line; pending and owed unchanged. A `diamond_sword` in the same cells is destroyed (the cells do burn) | e2e |
| 4 | `legendary_survives_lava` asserts survival in place, not return. `legendary_returns_from_void` stays green | e2e |

### W2 · Structure placement does not erase a legendary in a container

- **Observed**: `placeAt("windmill")` over a lone hopper holding a marked Web Sword erases it; recovery is silent (`2.red.json`).
- **Mechanism**: `place.ts:151-152` erase container contents; `collision.ts:47-60` does not list hopper, dropper, dispenser, shulker boxes, crafter, decorated pot or item frames.
- **Fix**: in `Placer.write`, before the first world write (`clearBox`, then `world.place`), run a protection pass over the write box. For each inventory block whose slot holds a live marked legendary, move the stack out of the footprint as an item entity; recovery then watches it through `entitySpawn`. Handle `frame`/`glow_frame` with `setblock … destroy` (vanilla spill, as in `L0-adr-oprt`). This is the core of `L0-lgnd-p008`, landed now and reused by the Cannon later.

| # | Criterion | Type |
|---|---|---|
| 1 | GameTest: `placeAt("windmill")` over a lone hopper, and separately over a lone shulker box, each holding a marked Web Sword. Result `placed`; exactly one live Web Sword with that id exists afterwards, as an item entity outside the footprint with a `watching … via entitySpawn` line. The owed list is unchanged | e2e |
| 2 | Negative check: with the pass disabled, criterion 1 fails (the probe in Appendix A is that check) | e2e |
| 3 | node test on a fake world: the protection pass runs before the first `fill` / `place` call of `write` | unit |
| 4 | Existing structure GameTests (`strf_*`, `windmill_body_*`, `airship_body_*`, `warden_*`, `bastion_*`) stay green | e2e |

The node stays open until W1 and W2 merge. `L0-adr-wpn3:51` ties `xcx10` closure to `lgnd` v3 (`ac15`/`18`/`19`/`20`), and those four do not cover either finding.

## Resolution text (refine resolve L0-xcx10)

> Rechecked 2026-09-29 on 32f4aca, BDS 1.26.51.1 (artifacts .ai/verify/CNTR-XCX10-AA/2.red.json, 2.json).
>
> The premise "no stable way to make an item entity indestructible" is false for fire, lava and despawn. With `minecraft:fire_resistant` `{value:true}` (item format ≥ 1.21.90), a custom item entity survives 80 t in lava and in fire; the shipped `andrew:web_sword` is destroyed in the same cells. `minecraft:should_despawn` `{value:false}` keeps one past t=6000. Bare booleans are refused at load. Cactus, explosions and the Void still need return; §5 itself prescribes Void return.
>
> Missed path: structure placement. `place.ts:151-152` uses `fillBlocks(air)` / `structureManager.place`, which erase a container's contents with zero item entities. The collision gate (`collision.ts:47-60`) omits hopper, dropper, dispenser, `*shulker_box`, crafter, decorated_pot, frame and glow_frame. Reproduced: `placeAt("windmill")` over a lone hopper holding a marked Web Sword gave `placed` and 0 swords left, and recovery was silent.
>
> Cannon LMB/RMB: no code (`src/orbital` absent). `setType(air)` spills contents (hopper, chest, dropper). The RMB mechanism named (`adr-ochg` §3) is withdrawn by `adr-odrp`.
>
> Two code tasks, W1 (fire_resistant) and W2 (protect before the structure write). The node stays open until both merge.

## Duplicates (live KV, `.ai/context/`): file:line — replace → with

1. `analysis/nodes/lgnd-as04__concept-assumption.md:15`, `analysis/assumptions.md:64`:
   - "No stable item component makes a custom item entity immune to lava, fire, cactus or explosions."
   - → "`minecraft:fire_resistant` `{value:true}` (item format ≥ 1.21.90) makes a custom item entity immune to fire and lava (measured BDS 1.26.51.1); no component covers cactus, explosions or the Void."
2. `…lgnd-as04…:17`, `analysis/assumptions.md:66`:
   - "realised as *destroyed, then immediately re-issued …*, not as physical immunity"
   - → "fire and lava: physical immunity via the item component; cactus, explosions, despawn: destroyed, then re-issued"
3. `analysis/nodes/lgnd-ad02__concept-architecture-decision.md:23`:
   - "The stable API offers no immunity component (`L0-lgnd-as04`)"
   - → "The stable API offers fire/lava immunity only (`minecraft:fire_resistant`)"
4. `analysis/nodes/lgnd-ad10__concept-architecture-decision.md`:
   - `:25` "The stable API offers no indestructible item entity (`as04`)" → "… offers fire/lava immunity only (`as04`, corrected)".
   - `:27` "LMB `setType(air)` on a container erases its contents with no drop (`as12` item 3)" → "`setType(air)` spills a container's contents; `fillBlocks(air)` and `structureManager.place` erase them".
   - `:33` tier 3 "Fire, lava, cactus, …" → "Cactus, a vanilla explosion hitting the item entity, despawn (fire and lava are prevented by the item component)"; also drop "or the Void" from the *deviation* (§5 prescribes it).
   - `:29` tier 1: add "structure placement (`place.ts` write)".
5. `analysis/nodes/lgnd-r012__concept-rule.md:29`, `analysis/project-knowledge/business-rules.md:312`:
   - row "Item entity burnt (fire, lava), cactus, vanilla explosion, despawn | Returned"
   - → two rows: "fire, lava | stays in the world (`minecraft:fire_resistant`)" and "cactus, vanilla explosion, despawn | returned".
   - Row 1 (`:27`/`:310`): add structure placement.
6. `analysis/nodes/lgnd-gl12__concept-glossary-term.md:20`, `analysis/project-knowledge/glossary.md:637`:
   - "(fire, lava, cactus, vanilla TNT, despawn, the Void) … This tier is the documented deviation (C-16)"
   - → "(cactus, vanilla TNT, despawn, the Void) … the deviation (C-16) covers cactus, TNT and despawn; the Void return is §5 itself"
7. `analysis/nodes/lgnd__concept-component.md:42`, `analysis/project-knowledge/domain-model.md:438`, `analysis/project-knowledge/architecture.md:47`:
   - "*return* (fire, lava, cactus, TNT, Void)"
   - → "*return* (cactus, TNT, despawn, Void); fire and lava prevented by the item component"
8. `analysis/nodes/concept-overview.md:99`, `analysis/summary.md:102`:
   - "Destroyed-then-returned is used in place of "not destroyed" for vanilla fire, lava, cactus, TNT and the Void"
   - → "… for cactus, TNT and despawn (the Void return is §5); fire and lava are met literally by `minecraft:fire_resistant`"
9. `analysis/nodes/lgnd-as12__concept-assumption.md:24`, `analysis/assumptions.md:210`:
   - item 3 "`setType("minecraft:air")` on a container **deletes** its contents without spawning item entities"
   - → "`setType(air)` **spills** the contents as item entities (measured: hopper, chest, dropper); `fillBlocks(air)` and `structureManager.place` delete them without item entities"
10. `analysis/nodes/adr-odrp__concept-architecture-decision.md:34`:
    - "`setType(air)` produces no drops"
    - → "`setType(air)` produces no block drops but spills container contents; `pntr` empties containers first (`pntr-ent3` `removeContainer`: `clearAll` → `setType(air)`), so the gamerule is still not needed"
11. `analysis/nodes/xcx10__concept-contradiction.md:21,28,29,32`, with the same lines in `analysis/contradictions.md:312,319,320,323` and `analysis/risks.md:322,329,330,333`:
    - `:21` premise → per the resolution;
    - `:28` "LMB deletes containers "with contents"" → "`setType(air)` spills; only `fillBlocks` / `structureManager.place` erase";
    - `:29` "RMB drop suppression (`L0-adr-ochg`)" → "withdrawn by `L0-adr-odrp`";
    - `:32` "fallback for fire, lava, cactus and the Void" → "fallback for cactus, explosions and despawn; Void per §5".
12. `analysis/nodes/concept-intent.md:28`, `analysis/project-knowledge/intent.md:29`:
    - "(LMB input, TNT physics, indestructible items)"
    - → "(LMB input, TNT physics, item entities immune to cactus and explosions)"
13. `analysis/nodes/adr-wpn3__concept-architecture-decision.md:51`:
    - "`L0-xcx10` … close when the `lgnd` v3 task merges with `lgnd-ac15`, `ac18`, `ac19` and `ac20` green"
    - → add "and W1/W2 (fire_resistant on the items; protection before the structure write)"
14. `analysis/nodes/lgnd-r013__concept-rule.md:24` (item 1): name the shipped caller, "structure placement (`src/structures/place.ts` `write`)". No `strf-*` node references `r013` today; a pointer from `L0-strf-p003` belongs there.

Not touched here: `pntr-cx01:28` / `adr-oprt:26` ("`setType(air)` on the frame deletes the framed item"). Item frames were not probed, so that claim is neither confirmed nor refuted.

## Said to the operator, not filed

The same structure-placement erasure also deletes **ordinary** player items in a lone hopper, dropper, dispenser or shulker box. `collision.ts:5` promises "a recognisable player build is never overwritten". This belongs to STRF, not to this node.

## Appendix A · Probe (uncommitted; reproduces the red checks)

Registration: `import "./probe-xcx10";` in `src/gametest/main.ts`, plus the five `andrew:probe_xcx10_*` names in `EXPECTED_TESTS` (`scripts/bds-gametest.mjs`). Items go in `packs/gametest/items/` (the dev pack; never shipped) and, for `bds:check --overlay`, in `<overlay>/behavior/items/`.

`packs/gametest/items/xcx10_fr_obj.json`:

```json
{
  "format_version": "1.21.90",
  "minecraft:item": {
    "description": { "identifier": "andrew:xcx10_fr_obj" },
    "components": {
      "minecraft:max_stack_size": 1,
      "minecraft:fire_resistant": { "value": true },
      "minecraft:should_despawn": { "value": false }
    }
  }
}
```

`packs/gametest/items/xcx10_fr_bool.json` (the refused bare form, used as the plain-item control):

```json
{
  "format_version": "1.21.90",
  "minecraft:item": {
    "description": { "identifier": "andrew:xcx10_fr_bool" },
    "components": {
      "minecraft:max_stack_size": 1,
      "minecraft:fire_resistant": true,
      "minecraft:should_despawn": false
    }
  }
}
```

`src/gametest/probe-xcx10.ts`:

```ts
// CNTR-XCX10-AA probe (uncommitted): two engine facts behind CX-L0-10.
//  A. Does a custom item with minecraft:fire_resistant / should_despawn=false
//     survive lava, fire and despawn as an item entity, like netherite does?
//  B. Does script removal of a container (fillBlocks air, setType air,
//     structureManager.place over it) spill its contents or delete them?

import { BlockTypes, BlockVolume, Difficulty, type Dimension, EnchantmentType, type Entity, ItemStack, StructureRotation, StructureSaveMode, type Vector3, world } from "@minecraft/server";
import { Test, registerAsync } from "@minecraft/server-gametest";
import { WEB_SWORD } from "../legendary/registry";
import { markItem } from "../legendary/state";
import { EnabledTypes } from "../structures/config";
import { SALT_KEY } from "../structures/registry";
import { StrfRuntime, engineStrf } from "../structures/runtime";
import { MemoryStore } from "../structures/store";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const log = (msg: string): void => console.warn(`[probe] XCX10 ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err));

const ITEMS = [
  "minecraft:netherite_sword",
  "minecraft:diamond_sword",
  "andrew:web_sword",
  "andrew:xcx10_fr_obj",
  "andrew:xcx10_fr_bool",
];

function spawnAll(test: Test, cells: Vector3[]): Array<{ typeId: string; entity: Entity | undefined; cell: Vector3 }> {
  const dim = test.getDimension();
  return ITEMS.map((typeId, i) => {
    const cell = cells[i];
    const at = test.worldLocation({ x: cell.x + 0.5, y: cell.y + 0.2, z: cell.z + 0.5 });
    try {
      return { typeId, entity: dim.spawnItem(new ItemStack(typeId, 1), at), cell };
    } catch (err) {
      log(`spawn ${typeId} failed: ${errText(err)}`);
      return { typeId, entity: undefined, cell };
    }
  });
}

function report(tag: string, spawned: Array<{ typeId: string; entity: Entity | undefined }>): void {
  for (const s of spawned) {
    const alive = s.entity !== undefined && s.entity.isValid;
    let where = "";
    if (alive) {
      try {
        where = ` at ${fmt(s.entity!.location)}`;
      } catch {
        where = " (location unreadable)";
      }
    }
    log(`${tag} RESULT ${s.typeId}: ${s.entity === undefined ? "NOT SPAWNED" : alive ? `SURVIVED${where}` : "DESTROYED"}`);
  }
}

const cleanup = (spawned: Array<{ entity: Entity | undefined }>): void => {
  for (const s of spawned) if (s.entity?.isValid) s.entity.remove();
};

// Five cells two apart, one item each, on the platform floor (stone at y=1).
const ROW: Vector3[] = [1, 3, 5].map((x) => ({ x, y: 2, z: 1 })).concat([1, 3].map((x) => ({ x, y: 2, z: 5 })));

registerAsync("andrew", "probe_xcx10_lava_items", async (test: Test): Promise<void> => {
  const spawned = spawnAll(test, ROW);
  await test.idle(2);
  for (const c of ROW) test.setBlockType("minecraft:lava", c);
  await test.idle(80);
  report("lava(80t)", spawned);
  const lavaSword = spawned.find((s) => s.typeId === "andrew:web_sword")?.entity?.isValid === true;
  cleanup(spawned);
  test.assert(lavaSword, "andrew:web_sword burned in lava: the shipped item carries no minecraft:fire_resistant");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

registerAsync("andrew", "probe_xcx10_fire_items", async (test: Test): Promise<void> => {
  for (const c of ROW) test.setBlockType("minecraft:netherrack", { x: c.x, y: 1, z: c.z });
  const spawned = spawnAll(test, ROW);
  await test.idle(2);
  for (const c of ROW) test.setBlockType("minecraft:fire", c);
  await test.idle(80);
  const fire = ROW.map((c) => test.getBlock(c)?.typeId ?? "?").join(",");
  log(`fire cells after 80t: ${fire}`);
  report("fire(80t)", spawned);
  const fireSword = spawned.find((s) => s.typeId === "andrew:web_sword")?.entity?.isValid === true;
  cleanup(spawned);
  test.assert(fireSword, "andrew:web_sword burned in fire: the shipped item carries no minecraft:fire_resistant");
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

const DESPAWN_TICKS = 6300;

registerAsync("andrew", "probe_xcx10_despawn", async (test: Test): Promise<void> => {
  const spawned = spawnAll(test, ROW);
  for (let t = 0; t < DESPAWN_TICKS; t += 1200) {
    await test.idle(1200);
    log(`despawn t=${t + 1200}: alive ${spawned.filter((s) => s.entity?.isValid).map((s) => s.typeId).join(" ") || "none"}`);
  }
  report(`despawn(${DESPAWN_TICKS}t)`, spawned);
  cleanup(spawned);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(DESPAWN_TICKS + 1400)
  .tag("andrew");

function itemsNear(dim: Dimension, at: Vector3, radius: number): string[] {
  return dim.getEntities({ type: "minecraft:item", location: at, maxDistance: radius }).map((e) => {
    const s = e.getComponent("minecraft:item")?.itemStack;
    return `${s?.typeId ?? "?"}x${s?.amount ?? 0}@${fmt(e.location)}`;
  });
}

registerAsync("andrew", "probe_xcx10_fill_container", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // Kind of container × kind of script removal.
  const cases: Array<{ name: string; block: string; cell: Vector3; how: "fill" | "setType" | "structure" }> = [
    { name: "hopper/fillBlocks", block: "minecraft:hopper", cell: { x: 1, y: 2, z: 1 }, how: "fill" },
    { name: "chest/fillBlocks", block: "minecraft:chest", cell: { x: 5, y: 2, z: 1 }, how: "fill" },
    { name: "dropper/setType", block: "minecraft:dropper", cell: { x: 1, y: 2, z: 5 }, how: "setType" },
    { name: "hopper/structure.place", block: "minecraft:hopper", cell: { x: 5, y: 2, z: 5 }, how: "structure" },
    { name: "hopper/setType", block: "minecraft:hopper", cell: { x: 3, y: 2, z: 1 }, how: "setType" },
    { name: "chest/setType", block: "minecraft:chest", cell: { x: 3, y: 2, z: 5 }, how: "setType" },
  ];
  const airId = "andrew:xcx10_air";
  if (world.structureManager.get(airId) !== undefined) world.structureManager.delete(airId);
  const airAt = test.worldBlockLocation({ x: 3, y: 4, z: 3 });
  world.structureManager.createFromWorld(airId, dim, airAt, airAt, { saveMode: StructureSaveMode.Memory, includeEntities: false });

  const owner = "xcx10-probe-owner";
  for (const [i, c] of cases.entries()) {
    test.setBlockType(c.block, c.cell);
    const container = test.getBlock(c.cell)?.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      log(`${c.name}: no inventory component`);
      continue;
    }
    container.setItem(0, markItem(WEB_SWORD, new ItemStack("andrew:web_sword", 1), { origin: "admin", owner, id: `xcx10-${i}` }));
    container.setItem(1, new ItemStack("minecraft:diamond", 3));
    log(`${c.name}: container holds ${container.getItem(0)?.typeId} + ${container.getItem(1)?.typeId}x${container.getItem(1)?.amount}`);
  }
  await test.idle(2);
  const before = itemsNear(dim, test.worldLocation({ x: 3, y: 2, z: 3 }), 12);
  log(`item entities before removal: ${before.length}`);

  for (const c of cases) {
    const at = test.worldBlockLocation(c.cell);
    try {
      if (c.how === "fill") dim.fillBlocks(new BlockVolume(at, at), "minecraft:air");
      else if (c.how === "setType") dim.getBlock(at)?.setType("minecraft:air");
      else world.structureManager.place(airId, dim, at, { includeEntities: false });
    } catch (err) {
      log(`${c.name}: removal threw ${errText(err)}`);
    }
  }
  await test.idle(20);
  for (const c of cases) {
    const at = test.worldBlockLocation(c.cell);
    const now = dim.getBlock(at)?.typeId ?? "?";
    const near = itemsNear(dim, { x: at.x + 0.5, y: at.y + 0.5, z: at.z + 0.5 }, 1.5);
    log(`${c.name} RESULT block now=${now}; item entities within 1.5: ${near.length === 0 ? "NONE" : near.join(" ")}`);
  }
  const after = itemsNear(dim, test.worldLocation({ x: 3, y: 2, z: 3 }), 12);
  log(`fill RESULT item entities in the test area after removal: ${after.length} ${after.join(" ")}`);
  for (const e of dim.getEntities({ type: "minecraft:item", location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 12 })) e.remove();
  world.structureManager.delete(airId);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");


// End to end through the production placer: the gate, then the template write.
const E2E_CHUNK = 16;
function e2eRuntime(salt: string): StrfRuntime {
  const store = new MemoryStore();
  store.set(SALT_KEY, `${salt}-${Date.now()}`);
  const enabled = new EnabledTypes(store);
  enabled.enable(["windmill"]);
  return new StrfRuntime(store, engineStrf({ world, BlockVolume, BlockTypes, StructureRotation, ItemStack, EnchantmentType }), { log, enabled });
}

registerAsync("andrew", "probe_xcx10_strf_place", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const difficulty = world.getDifficulty();
  const base = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const cases: Array<{ name: string; block: string; offset: number }> = [
    { name: "lone hopper", block: "minecraft:hopper", offset: 170 },
    { name: "lone chest (control)", block: "minecraft:chest", offset: 180 },
  ];
  const verdicts: string[] = [];
  world.setDifficulty(Difficulty.Easy);
  try {
    for (const [i, c] of cases.entries()) {
      const cx = Math.floor(base.x / E2E_CHUNK) + c.offset;
      const cz = Math.floor(base.z / E2E_CHUNK);
      const x = cx * E2E_CHUNK + 8;
      const z = cz * E2E_CHUNK + 8;
      const unload = await loadBox(test, dim, `andrew_gt_xcx10_${i}`, { min: [x - 24, 0, z - 24], max: [x + 24, 0, z + 24] });
      try {
        const top = dim.getTopmostBlock({ x, z });
        if (top === undefined) throw new Error(`no ground at ${x},${z}`);
        const at: Vector3 = { x, y: top.location.y + 1, z };
        dim.setBlockType(at, c.block);
        const container = dim.getBlock(at)?.getComponent("minecraft:inventory")?.container;
        container?.setItem(0, markItem(WEB_SWORD, new ItemStack("andrew:web_sword", 1), { origin: "admin", owner: "xcx10-probe-owner", id: `xcx10-e2e-${i}` }));
        log(`strf ${c.name}: ${dim.getBlock(at)?.typeId} at ${fmt(at)} holds ${container?.getItem(0)?.typeId ?? "nothing"}`);
        const out = e2eRuntime(`gt-xcx10-${i}`).placeAt("windmill", "o", x, z, 0);
        await test.idle(20);
        const now = dim.getBlock(at)?.typeId ?? "?";
        const still = dim.getBlock(at)?.getComponent("minecraft:inventory")?.container?.getItem(0)?.typeId ?? "none";
        const near = itemsNear(dim, { x: at.x + 0.5, y: at.y + 0.5, z: at.z + 0.5 }, 24).filter((s) => s.startsWith("andrew:web_sword"));
        const kept = still === "andrew:web_sword" || near.length > 0;
        if (i === 0 && !(out.kind === "placed" && kept)) verdicts.push(`lone hopper: placeAt=${out.kind}, sword kept=${kept}`);
        if (i === 1 && out.kind !== "rejected") verdicts.push(`chest control: placeAt=${out.kind}, expected rejected`);
        log(
          `strf ${c.name} RESULT placeAt=${out.kind}${out.kind === "rejected" ? `:${out.reason}` : ""}; block at the spot now=${now}, slot0=${still}; ` +
            `web_sword item entities within 24: ${near.length === 0 ? "NONE" : near.join(" ")}`
        );
      } finally {
        unload();
      }
    }
  } finally {
    world.setDifficulty(difficulty);
  }
  test.assert(verdicts.length === 0, `structure placement lost a legendary: ${verdicts.join(" | ")}`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

log("registered 5 probe test(s)");
```
