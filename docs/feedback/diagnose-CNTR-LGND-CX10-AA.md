# Diagnose CNTR-LGND-CX10-AA · CX-lgnd-10

ИСХОД: 2 — Работа над кодом

Death retention does delete the second marked copy of a weapon, and nothing brings it back. The off-hand half has no harm: on BDS 1.26.51.1, path B already retains an off-hand copy. The node stays open until the code task below lands.

Evidence (BDS 1.26.51.1, private instance, code `9285e90`):

| Check | Artifact | Exit |
|---|---|---|
| `env ANDREW_BDS_DIR=bds-cx10 bash docs/feedback/diagnose-CNTR-LGND-CX10-AA.repro.sh two-copies` | `.ai/verify/CNTR-LGND-CX10-AA/2.red.json` | 1 (expect-red) |
| `env ANDREW_BDS_DIR=bds-cx10 bash docs/feedback/diagnose-CNTR-LGND-CX10-AA.repro.sh offhand` | `.ai/verify/CNTR-LGND-CX10-AA/2.json` | 0 |

The probes are `src/gametest/probe-retention.ts`, registered in `scripts/bds-gametest.mjs`. Each passes when its measurement completes. The repro script turns each RESULT line into an exit code.

## Claim, number by number

| Claim | Re-measured by | Result |
|---|---|---|
| `findMarked` returns the first marked stack per weapon | `sed -n 89,103p src/legendary/state.ts` | true in code. **Irrelevant on 1.26.51.1:** path A logged "had no marked … at entityDie" in 4 of 4 deaths. |
| `setPending` stores one serialized mark | `state.ts:75-77` | true |
| no `Offhand` outside `hands.ts` | `grep -rn Offhand src` | true: 2 hits, `hands.ts:8,20` |
| sweep radius 8 | `retention.ts:53` | true |
| "the second drops as an item entity" | log: two `watching … via entitySpawn` lines before `entityDie` | true |
| "keeps one" | RESULT `accounted=1/2`, twice | true, but the copy kept is the first in `getEntities` order, not the first slot: both runs kept the copy added **second**. |
| "otherwise it is swept or left behind, and loss return would then re-issue it" | RESULT `held=0 ground=0 pending=false owed=false`, over 100 ticks (two 40-tick recovery checks) | **false.** Path B deletes it (`retention.ts:164-165`). `forgetWatched` runs first, so recovery never counts a loss. The copy is gone for good. |
| "an off-hand legendary, once cx08 is fixed, would … go through loss return" | `2.json`, with `allow_off_hand` patched in for the run | **false.** The off-hand drop spawns before `entityDie`. Path B logs "reclaimed 1", retention logs "returned …", and `owed=none`. |
| (cx08) "a GameTest can still force the slot through `setEquipment(Offhand)`" | first measurement run, item JSON as shipped | **false.** It returned `false`, and the off hand stayed empty. |
| (cx11 / `L0-lgnd`) `recovery.ts:253` | `grep -n "owed\[ownerId\]" src/legendary/recovery.ts` | the line is **254** |

## /diagnose

```text
OBSERVED: A player dies carrying two marked Web Swords (ids X, Y; origin admin,
          as /andrew:websword give writes). After respawn plus 100 ticks, one is
          in the inventory and the other is nowhere: not held, not on the ground,
          not pending, not owed.
          The same player with one marked sword in the off hand (allow_off_hand
          patched in) gets it back through retention.
VERDICT:  bug. A live marked instance is destroyed by the add-on itself, with no
          debt. Expectations it breaks:
          - Web Sword §4: the owner's sword does not drop and comes back after
            respawn; test copies may coexist with the admin.
          - R-lgnd-012: "a live marked legendary is never lost".
          - The effect statement that L0-adr-wpn2 row cx10 (b) was ruled on:
            the second copy "is re-issued by loss return".
          The off-hand half has no observed harm.

REPRO:    docs/feedback/diagnose-CNTR-LGND-CX10-AA.repro.sh two-copies.
          Red in 2 of 2 runs (measurement run, then the run-check run).
CAUSE:    On 1.26.51.1 the engine spawns the death drops before entityDie
          (recorded in ebf3d0a, re-measured here), so path A
          (retention.ts:101-120) never finds anything. Path B handles every drop:
          - retention.ts:159-160: the first mark found fills the single pending
            slot (state.ts:75);
          - retention.ts:164-165: every found entity is then forgotten and
            removed, including a copy that got no slot.
PROOF:    .ai/verify/CNTR-LGND-CX10-AA/2.red.json, exit 1:
          "RETENTION-2 RESULT accounted=1/2; 34-rvjgeso16c8: held=0 ground=0
          pending=false owed=false -> VANISHED; 34-f9sg6sl2oil: held=1 …"
RULED OUT: (1) loss return re-issuing the copy: owed=none, and no recovery
          "vanished"/"returning" line.
          (2) findMarked's first-slot choice deciding the survivor: path A found
          nothing in all 4 deaths.
          (3) the off hand escaping retention: 2.json shows path B "reclaimed 1",
          then "returned".

RADIUS:   The pending slot has four writers:
          - retention.ts:113 and :160;
          - recovery.ts:228 (lost() overwrites pending without a guard);
          - recovery.ts:270-273 (redeemOwed deletes the owed entry even when
            pending is occupied).
          Readers are restore (retention.ts:196), the respawn trigger (:79) and
          GameTests main.ts:512, 582, 1363, 1440.
          tests/legendary-registry.test.mjs:128 pins andrew:ws_pending, and ad01
          forbids a key change.
          Q-016 rules out leaving the copy on the ground.
          The owed list the fix needs is already accepted scope: wpn2 cx09(2),
          wpn3 sequencing step 1, ent4, p003 §5.
          How I looked: grep over src/tests/scripts for setPending, getPending,
          clearPending, findMarked, forgetWatched and _owed; KV reads of wpn2,
          wpn3, p002, p003, r008, r012, ent4, ac01 and ac07.
          This is not a restriction: a deletion becomes a return, and nobody
          depends on the deletion.
GREEN:    n/a. This task writes no fix (diagnose-only wave). The green bar for
          the fix is the same command, two-copies, exiting 0.
LIVE:     Both checks ran on a real BDS 1.26.51.1 through the production
          retention and recovery modules (armed in the gametest pack). No fix
          exists yet, so there is no fixed path to exercise.
```

Exposure: in a plain Survival world only one crafted copy exists, so the defect needs an operator action. Either `/andrew:<weapon> give` to a player who already carries a marked copy of that weapon, or `reset` followed by a second craft. README.md:186-187 recommends exactly that `give` for testing retention. Which copy dies is arbitrary, so the crafted one can be lost. Its craft right never reopens (Q-014, R-lgnd-011).

## Work statement (for the post-wave phase)

**Where it belongs.** It belongs with step 1 of the `lgnd` v3 task (the `wpn2` backlog, per `L0-adr-wpn3`), because it needs the owed list that step builds. It is not a separate epic.

**Observation.** A player dying with two marked copies of one weapon gets one back. The other is deleted by `sweep()` with no debt: `retention.ts:159-165`. Measured red: `.ai/verify/CNTR-LGND-CX10-AA/2.red.json`.

**Mechanism.** On 1.26.51.1 path B handles every death drop, and path A never fires. Path B fills a single pending slot per weapon, then removes every marked item entity it found. It calls `forgetWatched` first, so loss return never sees the removal.

**Reachability.** `/andrew:websword give` (or `/andrew:scythe give`) to a player who already carries a marked copy, then any death with `keepInventory` off.

**Required behaviour.** This stays within ruling `wpn2` cx10 (b), which puts one mark per weapon in pending. Path B must never remove a live marked item entity without a durable debt for it.
- A copy that does not fit into pending is appended to the owed list keyed by the player who died.
- Redeem grants each owed entry once, with the token rules of p002: the entry is removed in the same turn as `addItem`, and nothing is granted if the inventory already holds that id.
- Redeem must not depend on the pending slot being free. `recovery.ts:270-273` drops the entry in that case today.
- `lost()` (`recovery.ts:228`) must stop overwriting an occupied pending slot: it appends to owed, or grants directly per p003 §4.

An array `pending` (option a) would also satisfy the checks below, but it reopens the accepted ruling (b). I do not recommend it.

Acceptance criteria:
1. **e2e (bds)**: `env ANDREW_BDS_DIR=<instance> bash docs/feedback/diagnose-CNTR-LGND-CX10-AA.repro.sh two-copies` exits 0 with `RETENTION-2 RESULT accounted=2/2`. This is the command that is red at `9285e90`.
2. **e2e (bds)**: a new GameTest. A Survival SimulatedPlayer carries one `craft`-origin and one `admin`-origin marked Web Sword and dies. After respawn plus 100 ticks:
   - both ids are held exactly once;
   - no Web Sword item entity lies within 16 blocks of the death spot;
   - pending and owed are empty;
   - a second death with an empty inventory followed by a respawn grants nothing.
3. **e2e (bds)**: `repro.sh offhand` stays green. This guards the case where `allow_off_hand` ships.
4. **e2e (bds)**: these stay green: `websword_death_returns`, `websword_unmarked_drops`, `legendary_returns_from_void`, `legendary_survives_lava`, `legendary_pickup_no_duplicate`.
5. **unit**: node tests for owed-list read/write. A legacy single-mark owed value reads as a one-element list (ac01, ent4). The key names `andrew:<p>_pending` and `andrew:<p>_owed` are unchanged.
6. **build**: `npm run typecheck && npm run build && npm test` green.

**Off hand: nothing to fix.** Adding the Offhand read to path A (wpn2 backlog) does not change behaviour on 1.26.51.1. It is a guard of the same kind as path A itself. Keep it only for consistency with path A; `cx08`/`allow_off_hand` does not depend on it.

## Resolution text (for refine resolve)

> CX-lgnd-10 re-measured on BDS 1.26.51.1 (CNTR-LGND-CX10-AA, `9285e90`).
>
> The engine spawns death drops before `entityDie`, so retention path A found nothing in 4 of 4 deaths, and path B does all the work.
>
> - **Two marked copies of one weapon:** path B keeps the first entity it finds (in `getEntities` order, not slot order) and **deletes** the other (`retention.ts:164-165`, after `forgetWatched`). Nothing is owed, so the copy is lost for good. Measured `accounted=1/2`, twice (`.ai/verify/CNTR-LGND-CX10-AA/2.red.json`, exit 1). The claim that loss return re-issues it is false. That contradicts Web Sword §4 and R-lgnd-012, and it contradicts the premise ruling `wpn2` cx10(b) was taken on.
> - **Off hand:** without `allow_off_hand`, `setEquipment(Offhand)` returns `false`, so the case is unreachable. With it patched in, path B reclaims the off-hand drop and retention returns it, `owed=none` (`2.json`, exit 0). The claimed loss-return path does not occur.
>
> Resolution: keep ruling (b), one mark per weapon in pending. A copy that does not fit is appended to the owed list (`wpn2` cx09(2), `wpn3` step 1) instead of being deleted. This is code work inside `lgnd` v3 step 1.

## KV copies that diverge (do not edit here; for the closing phase)

Line numbers are for the live KV as of 2026-09-29. Frontmatter edits shift them, so each entry quotes its line.

- `analysis/nodes/lgnd-p002__concept-process.md:27`: "For **every** live marked stack of **every** registered weapon: append the mark to `andrew:<p>_pending`" → "For each weapon, the first live marked stack fills `andrew:<p>_pending`; each further one is appended to `owed[player]` (wpn2 cx10 (b)). Nothing is blanked or removed without a debt."
- `analysis/nodes/lgnd-p002__concept-process.md:28`: "Each live marked legendary found is appended to pending (dedup by `id`) and removed" → "the first mark per weapon fills pending, and every further one is appended to `owed[player]` before the entity is removed (dedup by `id`)".
- `analysis/nodes/lgnd-p002__concept-process.md:36`: "Death in the Void is covered by path A" → "On BDS 1.26.51.1 path A never fires: death drops spawn before `entityDie` (4 of 4 measured deaths, CNTR-LGND-CX10-AA). The Void case is not measured."
- `analysis/nodes/lgnd-r008__concept-rule.md:24`: "`findMarkedSword` returns only the **first** marked sword" → "path B (`retention.ts:159-165`) keeps one mark per weapon and deletes the rest with no debt; path A (`findMarked`) never fires on 1.26.51.1".
- `analysis/nodes/lgnd-r008__concept-rule.md:27`: "Pending is per weapon and holds an array of marks." → "Pending holds one mark per weapon (wpn2 cx10 (b)); further copies return through the owed list (p003 §5)."
- `analysis/nodes/lgnd-cx04__concept-contradiction.md:30`: "pending becomes an array, with a legacy read" → "pending keeps one mark per weapon (wpn2 cx10 (b)); extra copies go to the owed list, which carries the legacy read".
- `analysis/nodes/lgnd-ad01__concept-architecture-decision.md:25`: "Legacy *formats* (single-object pending, no gen or holder)" → "Legacy *formats* (single-mark owed, no gen or holder); the pending format is unchanged".
- `analysis/nodes/lgnd-ac07__concept-acceptance-criterion.md:30`: "A second marked copy of the same weapon is outside this AC (a known limit)." → "A second marked copy of the same weapon is not retained through pending. It is returned through the owed list and is never deleted without a debt."
- `analysis/nodes/lgnd-ent4__concept-entity.md:27`, v3 target cell: "**One mark per weapon** (`wpn2` cx10 ruling b). Unchanged format." → append "Further copies of the same weapon at death go to Owed returns."
- `analysis/nodes/adr-wpn2__concept-architecture-decision.md:28`: "The off-hand read is mandatory once the fix above ships; otherwise an off-hand legendary drops and goes through loss return." → "On BDS 1.26.51.1 an off-hand legendary drops before `entityDie` and path B retains it (measured). The path-A off-hand read is a guard, like path A itself."
- `analysis/nodes/lgnd-cx08__concept-contradiction.md:37`: "A GameTest can still force the slot through `Equippable.setEquipment(Offhand)`, which would give a false pass." → "Without `allow_off_hand` the engine also refuses `setEquipment(Offhand)`: it returns `false` on BDS 1.26.51.1 (measured, CNTR-LGND-CX10-AA)."
- `analysis/nodes/lgnd__concept-component.md:30` and `analysis/nodes/lgnd-cx11__concept-contradiction.md:38`: "`recovery.ts:253`" → "`recovery.ts:254`".
- `analysis/nodes/lgnd-cx10__concept-contradiction.md:25,35,36`: this node itself. The design side cited as `p002, ent4, ac07` is really only `p002` and `r008`, because `ent4` and `ac07` were already narrowed by wpn2. The effect lines are replaced by the resolution text above.
- `analysis/risks.md` and `analysis/contradictions.md` repeat the cx04 and cx10 text. They are generated ("Автогенерация"), so they are regenerated rather than edited.

Outside the KV, where the fix makes the text true again (no edit needed if it lands):
- `README.md:187`: "удерживается при смерти как обычная".
- `src/legendary/commands.ts:5`: "retained on death like a crafted one".

Both are false today whenever the player already carries another marked copy of that weapon.

Nothing was created on the board and nothing was written to the KV.
