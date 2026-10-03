# Diagnose CNTR-LGND-CX14-AA · CX-lgnd-14

ИСХОД: 2 — Работа над кодом

The defect is real. A legendary held by an armour stand that falls into the Void is gone: nothing is returned, nothing is owed, and the ledger does not move. The KV closed it as a C-16 deviation (`L0-adr-ktgr` §3, option a). The stated reason was that option (b) "could detect a type but never read its mark", so a fix would have to re-issue the ledger's last instance by guess.

That premise is false on BDS 1.26.51.1:
- `hasitem` reads the stand's main hand on every tick it spends below the floor.
- `kill()` in that window spills the held stack with its **mark intact**.
- The shipped recovery then returns it at gen 1, once two latent defects in `recovery.ts` are fixed.

Both defects also hurt without a stand. One throws `LocationOutOfWorldBoundariesError` in `check()` and loses the item. A stable path exists, so by C-16 this is not a deviation. The node stays open until the code task below lands.

Evidence: BDS 1.26.51.1 on a private instance (`docker/bds-cx14`, ports 19236/19260-19269). Each artifact's `code_sha` is the commit it ran on.

| Check | Artifact | Exit |
|---|---|---|
| `env ANDREW_BDS_DIR=bds-cx14 bash docs/feedback/diagnose-CNTR-LGND-CX14-AA.repro.sh left` | `.ai/verify/CNTR-LGND-CX14-AA/1.red.json` (f9f9ddd) | 1, expect-red |
| `… repro.sh kill` | `.ai/verify/CNTR-LGND-CX14-AA/2.red.json` (f9f9ddd) | 1, expect-red |
| `… repro.sh band` | `.ai/verify/CNTR-LGND-CX14-AA/3.red.json` (d14884e) | 1, expect-red |
| `… repro.sh patched` (both recovery lines patched for the run, file restored) | `.ai/verify/CNTR-LGND-CX14-AA/2.json` (d14884e) | 0 |

The probes are `andrew:probe_stand_void` and `andrew:probe_item_floor_band` in `src/gametest/probe-stand-void.ts`, both registered in `scripts/bds-gametest.mjs`. Each passes once its measurement completes, so neither can turn the suite red. The repro script turns their RESULT lines into exit codes. One plain run came before the run-check runs and gave the same numbers.

## Claim, number by number

| Claim | Re-measured by | Result |
|---|---|---|
| `VOID_HOLDER_TYPES` at `recovery.ts:135` | `grep -n VOID_HOLDER_TYPES src` | true: `:135`, used at `:174` |
| covers `chest_minecart`, `hopper_minecart` only | `sed -n 135p` | true |
| `README.md:71` | `grep -n` in `src/legendary/README.md` | true: `:71`–`:72` "Still open: an armour stand — its hands cannot be read…" (commit 126a34e, 2026-10-03) |
| `probe_ufo_holder_void` exists | `grep -rn` | true: `src/gametest/legendary-ufo.ts:429`, `scripts/bds-gametest.mjs:180` |
| "hands cannot be read from a script on 2.10.0" | `legendary_ufo_holder_armor_stand` log (2026-10-02); `probe_stand_void` | **half true.** There is no equippable ("loaded via equippable absent") and no inventory. But `hasitem andrew:scythe_of_calamity in slot.weapon.mainhand: true`, and the add-on already relies on that read (`src/ufo/magnet-select.ts:179-181`, `:331-336`). |
| "no death and no spill" | `probe_stand_void` events, 4 runs | true: no `entityDie`, no item entity. `entityRemove` fires at y=-81.4. |
| (window, not in the claim) | path lines, 4 runs | From rest, the stand is below the floor for **13 ticks** (y -64.6 to -79.8). It is removed when y < min − 16. `getEntities({type})` sees it on every tick. |
| (b) "a mark cannot be read anyway, so the return would have to re-issue the ledger's last instance" | `probe_stand_void` first/late | **false.** `kill()` returns true at t+0 and at t+10 below the floor. The spill carries the same id at gen 0 (`mark 60-cft7eyv48a/0`, `mark 60-t2ah3e407a/0`). |
| "hasitem" inside `beforeEvents.entityRemove` | events | not possible: `ReferenceError: Native function [Dimension::runCommand] cannot be used in restricted execution` |
| "Nothing in the add-on moves an armour stand" (r016) | `grep armor_stand src` (product code) | true: the magnet's tag pass drops legendary holders (`magnet-select.ts:335-336`) |
| "a deliberate player setup … pushed or placed over the Void" | shaft under the stand | A stand with nothing under it falls by itself. Survival can only reach this in the End, where the floor is open. **Not measured:** the End, pistons, "the stand on a minecart". |
| `playerInteractWithEntity` as the hand-over hook | probe subscription | **not fired** for a SimulatedPlayer's `interactWithEntity` on a stand. Real client: not measured. The fix does not depend on it. |

## /diagnose

```text
OBSERVED: probe_stand_void, BDS 1.26.51.1, 4 runs. A simulated player hands an
          armour stand a marked Scythe; the floor under the stand is dug out.
          The stand falls, spends 13 ticks below y=-64, and is removed at
          y=-81.4 with no entityDie and no spill. Recovery logs nothing; 200
          ticks later the owner holds gens [], ledger 0, nothing owed.
VERDICT:  bug. A live marked legendary is destroyed with no return. This
          diverges from Katana §3 and Orbital §5 (Void → back to the owner)
          and from R-lgnd-012. The recorded acceptance (L0-adr-ktgr §3 =
          option a) rests on "(b) can never read the mark", measured false
          below. C-16 (Intent §6) allows a deviation only where stable Bedrock
          cannot express the rule. It can, so §3 is not a valid C-16
          deviation. It was an autopilot default with no operator answer yet
          (L0-xq6 row 2, non-blocking), so no operator decision is reversed.

REPRO:    repro.sh left. Red in 4 of 4 runs (one plain, three under
          run-check, which recreate the world each time).
CAUSE:    Three gaps, one per link of the chain:
          1. Nothing watches an armour stand. VOID_HOLDER_TYPES
             (recovery.ts:135) lists two minecarts. A stand has no
             container, and a hand-over without a drop swing is dropped as
             "storage this script cannot read" (recovery.ts:346-350).
          2. A spilled item whose last known spot is below the floor is filed
             as "unloaded with its chunk" (recovery.ts:326).
             isChunkLoaded({y:-64.076}) = false, while the same x,z at the
             floor = true. entityLoad never comes, so no return.
          3. A vanished item last seen less than one block above the floor:
             holderCells (recovery.ts:433) passes getBlock the cell below the
             floor. whereIs throws LocationOutOfWorldBoundariesError and
             check() dies mid-loop. The item was already removed from
             `watched`, so it is never returned.
PROOF:    1.red.json (left: gens [], ledger 0, recovery: none)
          2.red.json (kill: spill watched, then "unloaded with its chunk")
          3.red.json (band: "LocationOutOfWorldBoundariesError … at whereIs
          (main.js:1093)", gens [], ledger 0)
RULED OUT: "the stand's chunk really unloaded": isChunkLoaded is true at the
          floor in the same column on the same tick (events line). The test
          itself was mid-run.
          "the one-line chunk fix is enough": tried, red (first kill-patched
          run). The throw at whereIs appeared (5.0,-65.0,8.0) and
          (1.0,-76.0,8.0), which is how gap 3 was found.
          "kill() below the floor spills nothing / an unmarked copy": the
          spill carried mark id/0 in 4 of 4 runs.
```

```text
RADIUS:   Searched `isChunkLoaded` in src/legendary: only recovery.ts:326.
          `holderCells`: called only from whereIs. Its half>0 branch already
          clamps to the floor (:436); half 0 (:433) does not.
          `entityDie.subscribe`: retention.ts:74 returns on any non-player
          (:81). `entityRemove.subscribe`: recovery.ts:172 plus
          selftest/ufo-restart.ts:96.
          Gaps 2 and 3 are guards. Today they misfile or throw, and nothing
          that works changes: chunks above the floor keep the unload branch,
          and in-world cells are still searched.
          The watcher kills only a stand that is already below the floor and
          holds a legendary type. The engine removes that stand within
          16 blocks anyway, and everything it spills falls after it.
```

No fix was written in this run; the fix is the task below. `patched` (2.json, exit 0) only shows the chain closes on BDS, with the probe's own per-tick loop standing in for the watcher:
- first and late: "vanished from the ground; now gen 1, returning to stand_void_owner"; owner holds gens [1], ledger 1;
- band: gens [1], ledger 1, no error line;
- left, with no watcher: still gens [] (expected).

GREEN / LIVE: not applicable to this run (no product change). The task's criteria below carry them.

## Resolution text (for the post-wave phase)

> **CX-lgnd-14 — open, code work.** On BDS 1.26.51.1 an armour stand that loses its support falls below the floor. It stays there 13 ticks from rest and is removed at y < min − 16 with no death and no spill. Throughout that window `hasitem … slot.weapon.mainhand` reads the held type, and `kill()` spills the stack with its mark (id, gen 0). Option (b) therefore needs no ledger guess: kill the stand in the window, and the existing loss path returns the instance at gen + 1. That path needs two guards first. An item last seen below the floor is not "unloaded with its chunk" (`recovery.ts:326`). `holderCells` never asks for a cell below the floor (`recovery.ts:433`), where it throws today and loses the item. Measured: `.ai/verify/CNTR-LGND-CX14-AA/{1,2,3}.red.json`, `2.json`. `L0-adr-ktgr` §3 is superseded: a stable path exists, so this is not a C-16 deviation. `L0-xq6` row 2 is answered by measurement and is not an operator question. The node closes when the task's criteria close.

## Copies to correct (root `.ai/context/analysis/`, not edited here)

| file:line | replace | with |
|---|---|---|
| `nodes/lgnd-cx14__concept-contradiction.md:28`, `contradictions.md:188`, `risks.md:194` | "An armour stand's hand slots cannot be read from a script on 2.10.0 (`README.md:71`, …)" | "An armour stand has no script inventory or equippable on 2.10.0. `hasitem … location=slot.weapon.mainhand` reads the held type, also below the floor, and `kill()` spills the stack with its mark (`probe_stand_void`)." |
| `nodes/lgnd-cx14…:29`, `contradictions.md:189`, `risks.md:195` | "removes it below the floor with no death and no spill" | add: "after 13 ticks from rest, at y < min − 16" |
| `nodes/lgnd-cx14…:33`, `contradictions.md:193`, `risks.md:199` | "pushed or placed over the Void, or the stand on a minecart" | "a stand whose support is removed falls by itself (measured); in survival only the End has an open floor; 'on a minecart' not measured" |
| `nodes/lgnd-cx14…:37`, `contradictions.md:197`, `risks.md:203` | "…a mark cannot be read anyway, so the return would have to re-issue the ledger's last known instance" | "measured: `kill()` in the window spills the marked stack; no re-issue needed" |
| `nodes/lgnd-cx14…:41`, `contradictions.md:201`, `risks.md:207` | "**Resolved at reduce v6** by `L0-adr-ktgr` §3: option (a)…" | the resolution text above |
| `nodes/adr-ktgr__concept-architecture-decision.md:33`, `project-knowledge/architecture.md:228` | "Stand hands cannot be read on 2.10.0" | "Stand hands are readable by type only (`hasitem`); the mark comes back through `kill()`" |
| `adr-ktgr…:42`, `architecture.md:237` | "§3 … a documented C-16 deviation for all four legendaries (`cx14` option a)" | "§3 superseded by measurement: covered by the `lgnd` stand watcher for all four legendaries (code task)" |
| `adr-ktgr…:46`, `architecture.md:241` | "Option (b) … never read its mark, so the best it could do is re-issue the ledger's last instance" | delete (measured false) |
| `adr-ktgr…:54`, `architecture.md:249` | "`L0-xcx21` and `L0-lgnd-cx14` close as resolved, pointing here." | "`L0-xcx21` closes here; `L0-lgnd-cx14` closes with its code task." |
| `adr-ktgr…:55`, `architecture.md:250` | "README … gains one line, 'armour stand in the Void: lost'" | delete (the code task removes `README.md:71-72` instead) |
| `nodes/lgnd__concept-component.md:48`, `architecture.md:120`, `domain-model.md:348` | "Its hands cannot be read on 2.10.0, so a legendary it holds is lost…" | "Unbuilt: a stand watcher kills a legendary-holding stand in its 13-tick window below the floor, and recovery returns the spill (cx14 code task)" |
| `nodes/lgnd-gl16__concept-glossary-term.md:17`, `project-knowledge/glossary.md:1043` | "The armour stand is a Void holder that is **not** covered (`cx14`)." | keep until the task lands, then "covered by the stand watcher (`kill()` in the window)" |
| `nodes/lgnd-ad12__concept-architecture-decision.md:55` | "Armour stand in the Void is not covered (`cx14`)." | same as above, when the task lands |
| `nodes/xq6__concept-client-question.md:31` | row 2: default "documented deviation", overturn "`lgnd` probe task (`hasitem` re-issue)" | remove the row: answered by measurement, not a deviation |
| `summary.md:90`, `nodes/concept-overview.md:84` | "**Resolved** as a documented C-16 deviation…" | "Open → code task (stand watcher + two recovery guards)" |

Copies outside the KV (the code task changes these, not this run):
- `src/legendary/README.md:71-72`: "Still open: an armour stand — its hands cannot be read…" → the covered case.
- `src/gametest/legendary-ufo.ts:386-390`: "both holders are removed … what they held is never seen by recovery" → the minecart part is stale since 83b9ffd. The stand part changes with the task.

## Code task (ready statement)

**Title:** lgnd: a legendary held by an armour stand that falls into the Void goes back to its owner

**parent_work_goal:** `L0-lgnd-cx14` (Katana §3, Orbital §5: a legendary that falls into the Void returns to its owner); found by CNTR-LGND-CX14-AA.

**touches:** `src/legendary/recovery.ts`, a new `src/legendary/stand-void.ts` (or a section of recovery), `src/main.ts`, `src/gametest/main.ts`, `src/gametest/probe-stand-void.ts` (becomes the test), `src/gametest/legendary-ufo.ts`, `scripts/bds-gametest.mjs`, `src/legendary/README.md`, `tests/`.

**What to build, on measured facts:**
1. **Guard (`recovery.ts:326`).** The "unloaded with its chunk" branch applies only when `w.location.y >= heightRange.min`. Below the floor, a vanished item is a Void loss.
2. **Guard (`recovery.ts:433`).** `holderCells(…, 0)` yields only cells with `y >= heightRange.min`.
3. **Stand watcher.**
   - Armour stands join a set on `entitySpawn` / `entityLoad` (`minecraft:armor_stand`) and leave it on `entityRemove`.
   - While the set is non-empty, a 1-tick interval reads each stand's y. The window is 13 ticks from rest, and a faster entry shortens it (not measured), so recovery's 40-tick interval cannot be used.
   - A stand below `heightRange.min` is asked with `hasitem` for each `LEGENDARIES` `itemId`, in `slot.weapon.mainhand` and `slot.weapon.offhand` (the magnet's `HELD_LEGENDARY_IDS` / `HELD_LOCATIONS`, `magnet-select.ts:179-181`). On a hit, `kill()`.
   - Do not do this in `beforeEvents.entityRemove`: `runCommand` throws there, and the stand is already past the window.
   - The spill carries the mark, and recovery returns it through `lost()`, owed if the owner is offline.

**Acceptance criteria:**
1. [e2e] On BDS, `docs/feedback/diagnose-CNTR-LGND-CX14-AA.repro.sh left` exits 0. The owner holds the stand's legendary once at gen 1, the ledger is at 1, and there is exactly one loss line. Red today: `1.red.json`.
2. [e2e] On BDS, `repro.sh kill` exits 0 with no patch: a marked item spilled below the floor is returned. Red today: `2.red.json`.
3. [e2e] On BDS, `repro.sh band` exits 0, and the server log has no `LocationOutOfWorldBoundariesError`. Red today: `3.red.json`.
4. [e2e] On BDS, two more stands fall into the Void: one with an iron sword and one with an unmarked legendary copy. The iron-sword stand gets no `entityDie` from the add-on. For the unmarked copy nothing is returned and no ledger key is written.
5. [e2e] On BDS, with 50 armour stands loaded above the floor, the watcher issues no command over 200 ticks (counted). With no stand loaded, no watcher interval runs.
6. [static] `src/legendary/README.md:71-72` describes the covered case. The comment at `src/gametest/legendary-ufo.ts:386-390` no longer says what a holder held "is never seen by recovery".
7. [build] `npm test`, `npm run typecheck` and `npm run build` are green. The full `bds:gametest` suite is green on the task branch. No existing test is deleted or weakened.

**Not measured (for the implementer):** a stand falling into the End void (floor 0), entry at speed, pistons, a stand riding a minecart, and `playerInteractWithEntity` from a real client.
