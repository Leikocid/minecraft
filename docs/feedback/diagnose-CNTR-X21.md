ИСХОД: 3 — Подчистка знания

# CNTR-X21-AA · CX-L0-21 · T17 «переживает» vs возврат по C-16

Checked on `ae1c2d0` against BDS 1.26.51.1, in a private instance (`andrew-bds-x21`, ports 19470/19480–19489/7595). KV lines are from the root `.ai/context` (live, read-only). Nothing was filed and nothing was written to the KV.

**Verdict.** The node's claim holds. The compromise is accepted, shipped and proven, and no KV node will turn literal T17 into a task. But the T17 test text the node points at (`L0-lgnd-ac24`) and its neighbours drifted from the code in three ways (§4). That makes this a knowledge cleanup, not a close for lack of evidence.

## 1 · What the framework does today (code)

| Path | Mechanism | file:line |
|---|---|---|
| Fire, lava | **prevented**: `minecraft:fire_resistant` | `packs/behavior/items/web_sword.json:21`, `scythe_of_calamity.json:21`, `orbital_cannon.json:20` |
| Orbital ring, penetrator, structure write | **prevented**: `protectLegendariesIn` moves the item out first | `src/legendary/recovery.ts:587`; callers `src/orbital/ring.ts:477`, `src/orbital/penetrator.ts:314`, `src/structures/place.ts:329` |
| TNT, cactus, despawn, the Void | **returned**: watcher → `lost()` bumps gen, grants to `mark.owner`, or `writeOwed` | `recovery.ts:321,336,469-488`; `retention.ts:269-281` |
| Destruction table | one place, scenario per path | `src/legendary/README.md:19-30` |

The message on a loss return is the shared `andrew.legendary.recovered` (`recovery.ts:66,487,506,795`). `<textPrefix>.returned` is only the death-retention message (`retention.ts:222`).

## 2 · Scenarios that hold it, re-run on HEAD

`.ai/verify/CNTR-X21-AA/2.json`, exit 0, 8 of 8 passed (a partial run, not a suite verdict):

| Scenario | file:line | RESULT line (BDS log) |
|---|---|---|
| `legendary_survives_lava` | `src/gametest/legendary-fireproof.ts:87` | 3/3 survived in place; control destroyed; no pending return |
| `legendary_survives_fire` | `:92` | same |
| `legendary_returns_from_tnt` | `:186` | destroyed 3/3, control destroyed; each held 1, gen 1 = want 1, pending 0; ground 0 |
| `legendary_returns_from_cactus` | `:254` | same |
| `legendary_returns_when_it_vanishes` | `:279` | same (despawn modelled by `remove()`) |
| `legendary_returns_from_void` | `src/gametest/main.ts:1377` | "fell into the Void; now gen 1, returning" |
| `legendary_protect_ground_item` | `src/gametest/legendary-recovery.ts:467` | moved=1 handedBack=0, no loss line |
| `legendary_protect_framed` | `legendary-recovery.ts:505` | frame and glow frame: moved=1 handedBack=0 |

A literal T17 test fails by construction, because `returnPath` asserts the opposite: `alive.length === 0` and `onGround === 0` (`legendary-fireproof.ts:176,182`).

## 3 · The KV claims, checked

- **`L0-lgnd-ac24` exists**, with T17-prevent (`:24-26`) and T17-return (`:27`).
  - Its substance matches how LGND-INDESTR-01-AA closed. AC#2 there reads "the owner gets exactly one live copy, no second live one, the old copy cannot cast". The assertions are `held === 1`, `gen === ledger + 1`, `pending === 0`, `onGround === 0`.
  - Two details differ (§4 A).
- **Closure of `xcx10`.**
  - `decision-resolve-l0-xcx10` (cli, 2026-09-29, outcome `changed`) names only the Void and cactus explicitly as the remaining return path. The rest is filed as "остаток … отклонением по C-16".
  - The explicit acceptance for **TNT and despawn** is LGND-INDESTR-01-AA. That task grew out of the operator's request ("Андрей после игры … ни взрывом, ни динамитом"), its AC#2 is the return reading, and it closed done (merge `b25f55c`).
  - So `xcx21:35` "accepted … when closing `xcx10`" is true in substance but points at the wrong record for TNT.
- **Resolution chain.** `L0-adr-ktgr` §1 (`adr-ktgr:36-40`) resolves the node. `L0-xq6` row 1 (`xq6:30`) asks the operator, non-blocking.
- **Literal T17 survives only in the raw spec sources**, which are not edited:
  - `dragonkatanaspecv1ruen-part-3.md:43` (T17);
  - `dragonkatanaspecv1ruen-part-1.md:69` (§3).
  - No node restates it as a criterion. `katn-ac07:30` forbids a separate criterion, and the overview routes T16–T18 to `ac24` (`concept-overview.md:97`).

## 4 · Drift: file:line — replace what with what

Paths are relative to `.ai/context/analysis/`. Rollout copies (`scope.md`, `glossary.md`, `business-rules.md`, `assumptions.md`, `contradictions.md`, `risks.md`) are regenerated from the nodes and are listed for completeness.

**A. The T17 test text itself (`L0-lgnd-ac24`).**
1. `nodes/lgnd-ac24__concept-acceptance-criterion.md:27` (copies `scope.md:734`, `project-knowledge/glossary.md:801`):
   - "in the owner's inventory with `gen + 1` and `andrew.katana.returned`"
   - → "in the owner's inventory (at their feet if it is full, `retention.ts:270-275`) with `gen + 1` and `andrew.legendary.recovered`".
   - The Katana key would need recovery to change for all four weapons, which goes against `adr-ktgr` §4.
2. `…lgnd-ac24…:26`: "and no `returned` message" → "and no `andrew.legendary.recovered` message, nothing in `dk_owed`".
3. `…lgnd-ac24…:31`: "no `lost`/`returned` log line appears" → "no `legendary recovery: … now gen` line appears".
   - Recovery never prints the word "lost" (`recovery.ts:471,479-482`; 0 hits in this run's log). Half of that check passes vacuously.

**B. The pre-fireproof tier model: fire and lava listed as *returned*.** This contradicts `ac24:25` and `adr-ktgr:37`. These are items 1, 4, 5 and 6 of `docs/feedback/diagnose-CNTR-XCX10-AA.md:212-240`, which were never applied; the v6 run carried them forward.

4. `nodes/lgnd-ac09__concept-acceptance-criterion.md:23` (copies `scope.md:366`, `project-knowledge/glossary.md:433`). **This is a live criterion: a test written from it fails against `legendary_survives_lava/_fire`.**
   - "WHEN it burns in lava or fire, is destroyed by cactus or a vanilla TNT explosion, or despawns"
   - → "WHEN it is destroyed by cactus or a vanilla TNT explosion, or despawns (in lava or fire it stays where it lies, same gen, nothing owed)".
5. `nodes/lgnd-r012__concept-rule.md:29` (copy `project-knowledge/business-rules.md:545`):
   - "Item entity burnt (fire, lava), cactus, vanilla explosion, despawn | Returned … plus a private `returned` message"
   - → two rows: "Fire, lava | stays in the world (`minecraft:fire_resistant`)" and "Cactus, vanilla explosion, despawn | Returned to `mark.owner` … plus `andrew.legendary.recovered`".
6. `nodes/lgnd-gl12__concept-glossary-term.md:20` (copy `project-knowledge/glossary.md:981`):
   - "(fire, lava, cactus, vanilla TNT, despawn, the Void) … to the last holder"
   - → "(cactus, vanilla TNT, despawn, the Void; fire and lava are prevented by `minecraft:fire_resistant`) … to `mark.owner` (last holder waits for `L0-xcx11`)".
7. `nodes/lgnd-ad10__concept-architecture-decision.md`:
   - `:25` "offers no indestructible item entity (`as04`)" → "offers fire/lava immunity only (`minecraft:fire_resistant`)";
   - `:33` "Fire, lava, cactus, a vanilla explosion …, despawn, or the Void" → "Cactus, a vanilla explosion …, despawn, or the Void".
8. `nodes/lgnd-as04__concept-assumption.md` (copies `assumptions.md:162,164`):
   - `:15` "No stable item component makes a custom item entity immune to lava, fire, cactus or explosions" → "`minecraft:fire_resistant` (format ≥ 1.21.90) makes it immune to fire and lava (measured, LGND-FIREPROOF-01-AA); nothing covers cactus or explosions";
   - `:17` "realised as destroyed, then … re-issued to the last holder" → "fire, lava: immunity; cactus, explosions, despawn: destroyed, then re-issued to `mark.owner`".
9. `nodes/lgnd-p003__concept-process.md:39`: "then send `<textPrefix>.returned`" → "then send `andrew.legendary.recovered`".
   - The same key drift appears at `nodes/lgnd-ac08__concept-acceptance-criterion.md:24` (`andrew.orbital.returned`, copies `scope.md:341`, `glossary.md:408`). Its holder clause belongs to `xcx11`.

**C. The node itself.**

10. `nodes/xcx21__concept-contradiction.md:31` (copies `contradictions.md:225`, `risks.md:232`):
    - "cactus, TNT and despawn are not preventable on stable 2.10.0"
    - → "cactus and TNT are not preventable; despawn is (`minecraft:should_despawn {value:false}` survived past t=6000, `diagnose-CNTR-XCX10-AA.md:41-50`) but stays a return on purpose: an item stuck on a lava lake or in a pit comes back after 5 min (`:148-149`)".
11. `…xcx21…:35`: "the C-16 reading the operator accepted … when closing `xcx10`" → "… accepted by `decision-resolve-l0-xcx10` (Void, cactus) and LGND-INDESTR-01-AA AC#2 (TNT, cactus, despawn)".

## 5 · Blocks

- **OBSERVED:** an analysis-time contradiction, not a run. Katana §3/T17 say "survives", while the shipped framework destroys the item and returns it for TNT, cactus and despawn.
- **VERDICT:** decision already taken. `decision-resolve-l0-xcx10` and LGND-INDESTR-01-AA AC#2 set it; `adr-ktgr` §1 extends it to the Katana; `xq6` #1 collects the operator's confirmation without blocking.
- **REPRO / PROOF:** `.ai/verify/CNTR-X21-AA/2.json` (§2). In every case the vanilla control was destroyed, so no green is vacuous.
- **CAUSE:** no defect. Mechanisms as in §1.
- **RULED OUT:** "the KV describes the code faithfully". Refuted by the run and the code (§4 A–C).
- **RADIUS:** knowledge only. /plan for Stage 7 reads `ac24` (`concept-overview.md:97`) and the `lgnd` rule nodes. Found by grep over the root KV for T17, survive/not-destroyed wording, `returned`, and the tier wording.
- **GREEN / LIVE:** no fix written. The same run is the live evidence.

## 6 · Said to the operator, not filed

- **Platform too narrow for weapon #4.**
  - The shipped scenarios lay one cell per def at `x = 1 + 2i` (`legendary-fireproof.ts:38`). The comment `:34-37` says "the 7-wide platform fits one more".
  - The platform is 7×7, so x ∈ 0..6 (`scripts/bds-gametest.mjs:691`), and the Katana as def #4 lands at x = 7, off the stone floor.
  - Not measured. Expected effects:
    - in the cactus case the sand at x = 7 has no floor under it;
    - in the fire/lava case the only control sits on another cell (`CONTROL_CELL`), so the Katana's cell has no witness that it destroys anything.
  - This is the exact path `ac24:21` names for T17 ("the shipped scenarios parameterised by def"). It belongs to the Stage 7 `lgnd` v6 task.
- **Stale header in `legendary-fireproof.ts:9-12`.** It says cactus, explosion and despawn are exercised by `legendary_returns_from_void`. They are held by the three return scenarios in the same file (`:186,254,279`).
- **Residue after `legendary_protect_ground_item`.**
  - The moved item is left in the world after the test passes (`legendary-recovery.ts:467-504`, no cleanup).
  - 12 s later recovery reads it as "vanished … owed on next spawn" to the departed sim player (BDS log 15:36:10).
  - It is harmless to the product. It is one more piece of shared state between scenarios.
