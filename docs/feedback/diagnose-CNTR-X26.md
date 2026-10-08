ИСХОД: 3 — Подчистка знания

# CNTR-X26-AA · CX-L0-26 · The Storm Blade passive +6 vs the melee hurt window

Measured on `3b1769d` against BDS 1.26.51.1 in a private instance (`andrew-bds-x26` under `dist/`, ports 19826/19830–19839/7829, removed after the run). The Storm Blade is not built; a vanilla `minecraft:diamond_sword` in a SimulatedPlayer's main hand stands in for it.
- Probe: `docs/feedback/diagnose-CNTR-X26.probe.ts`, run by `diagnose-CNTR-X26.repro.sh`.
- Raw lines: `diagnose-CNTR-X26.probe.txt`, cited as `txt:N`.
- Artifact: `.ai/verify/CNTR-X26-AA/2.json`, `run_kind: against_workspace`, exit 0, 9/9 scenarios. Every scenario's `NOISE` line reads `none`. Run 2 (`8de7ab7`, the first 8 scenarios) gave identical numbers.
- Targets: Survival SimulatedPlayers at 40 HP (health_boost), Peaceful, regeneration off, pvp on; plus an iron golem without behaviours. Kits: bare; full diamond (`totalArmor` 20, `totalToughness` 8); full netherite + Protection IV (20 / 12 / EPF 16) (`txt:6,25,44`).
- KV lines are from the root `.ai/context/analysis/` (read-only). Nothing was filed, nothing was written to the KV.

**Verdict.** The node is right about the failure: a plain `applyDamage(6)` in the melee tick takes **0.00 and returns true**, on every kit. Its resolution path is wrong. On armour, difference-stacking deals one L+6 hit, not "6 through armour". It also needs a raw L that no event exposes. Two measured paths deliver what the KV asks for: a before-event raise of the melee hit (passive) and the ADR's own fallback C (active in a window). No code exists, so the fix is to the knowledge. **The node stays open:** by its own text it closes on the strm build's GameTest.

## 1 · OBSERVED / VERDICT
- **OBSERVED.** `L0-xcx26` says `applyDamage(6)` from `entityHitEntity` is swallowed by the melee's window, and that the active takes "10 − L, about 2–3 HP". It cites CNTR-X22. That measurement covered script `applyDamage` on **bare** targets only, never a real melee and never armour. The melee figure "~7–8 HP" had no source.
- **VERDICT.** An unmeasured hypothesis behind the weapon's headline number, with a silent failure if true, so it was investigated as a bug.

## 2 · The three questions, measured

f(d) is armour + toughness + Protection applied to d (the Java formula). It reproduces all 10 armoured reference hits to 0.01 (`FIT`, `txt:29,48,133`; bare `txt:10,104`).

**Q1 · `applyDamage(6)` in the tick of a diamond-sword melee:**

| target | melee | apply6 in the same block | apply6 inside `entityHitEntity` (fires at +0) | txt |
|---|---|---|---|---|
| bare | 8.00 | **0.00** (true) | **0.00** (true) | 7, 11, 12 |
| diamond | 2.24 | **0.00** (true) | **0.00** (true) | 26, 30, 31 |
| netherite + P4 | 0.76 | **0.00** (true) | **0.00** (true) | 45, 49, 50 |
| iron golem | 8.00 | **0.00** (true) | **0.00** (true) | 144, 145 |
| bare, Sharpness V | 14.00 | **0.00** (true) | — | 65 |

**Q2 · Does difference-stacking `applyDamage(8+6)` net +6?** Only without armour:

| target | separate: melee + apply6 alone | one hit: apply14 alone | stack (8+6) | stack, L = `entityHurt.damage` | before-event +f(6) | write hp−6 / hp−f(6) | txt |
|---|---|---|---|---|---|---|---|
| bare | 14.00 | 14.00 | **14.00** (+6.00) | 14.00 | 14.00 | 14.00 / 14.00 | 13–20 |
| diamond | **3.80** | 4.76 | **4.76** (+2.52) | 2.33 (+0.09) | **3.80** | 8.24 / 3.80 | 26–39 |
| netherite + P4 | **1.30** | 1.57 | **1.57** (+0.81) | 0.76 (+0.00) | **1.30** | 6.76 / 1.30 | 45–58 |
| iron golem | 14.00 | — | **14.00** | — | 14.00 (+6 flat) | — | 146–148 |
| Sharpness V, bare / diamond | 20.00 / 6.32 | — | **14.00 / 4.76** (+0.00) | 20.00 / 4.76 | 20.00 (+6 flat) / — | — | 66–69, 77–80 |

- The window compares **post-armour** amounts. An in-window `applyDamage(X)` takes f(X) − f(L): on diamond, 2.52 = 4.76 − 2.24.
- So stacking equals one L+D hit (merged), not f(L) + f(D) (separate).
- Both `entityHurt.damage` and `beforeEvents.entityHurt.damage` report the post-armour value (2.24 for an 8.00 hit), so raw L is not observable on armour. A constant L = 8 takes 0.00 under Sharpness V.
- Event order, all in the swing's tick: `beforeEvents.entityHurt` (synchronous inside the swing) → `entityHitEntity` → `entityHurt` (`txt:7`).
- Raising the melee in `beforeEvents.entityHurt` by a flat 6 adds 6 *after* armour, which is true damage: 8.24, 6.76 (`txt:35,54`). The wielder's main hand reads fine inside that callback (`hand=minecraft:diamond_sword`).
- Absorption 16, bare (`txt:155-159`): melee leaves 8. The raise +6 and the stack both leave 2 with 0 health lost (native). The write `hp−6` costs **6 health and leaves absorption at 8** (it bypasses absorption).

**Q3 · Active `applyDamage(10)` k ticks after a melee:**
- Bare: **2.00 at every k = 1…9**, full 10.00 at k = 10, 11 (`txt:97`). Iron golem: 2.00 at k = 3 (`txt:149`).
- Diamond: **0.76 at every k = 1…9** against a native 3.00, full at k ≥ 10 (`txt:126`). That is f(10) − f(8) = 3.00 − 2.24.
- After a passive-raised melee, `applyDamage(10)` at k = 3 takes **0.00** on bare and diamond. The window's last hit is then the raised one (`txt:107,136`).
- Stacking `applyDamage(8+10)`: bare 10.00, golem 10.00, but **diamond 4.60** against 3.00, i.e. +1.60 too much (`txt:101,130,150`).
- Exact in-window active, **C**: `applyDamage(10)`, then write hp_before − f(10). It gives 10.00 / 3.00, also after a raised melee (`txt:105,107,134,136`).
- A before-event that sets f(10) on an `applyDamage(50)` gives 10.00 / 3.00 after a plain melee. After a raised melee it gives **0.00 with no hurt event**: the rewrite is final but dropped when ≤ the window's last hit (`txt:106,108,135,137`).

## 3 · REPRO / CAUSE / PROOF / RULED OUT
- **REPRO.** `env ANDREW_BDS_DIR=../dist/<private> bash docs/feedback/diagnose-CNTR-X26.repro.sh` gave 9/9 every time it ran (runs 2 and 3, identical numbers).
- **CAUSE.** The engine keeps a 10-tick window from the last landed hit and applies only what exceeds its **post-armour** amount. f(6) < f(8) on every armour, so the passive takes 0.
- **PROOF.** The in-test negative controls above (`txt:11,12,30,31,49,50,65,76,144,145`).
- **RULED OUT.**
  - *Armour applied to the difference D* (adr-sbdm P1). The stack took 2.52 on diamond, not f(6) = 1.56 (`txt:32`).
  - *Handler timing*. The same 0.00 appears synchronously after `attackEntity`, before any after-event (`txt:11` vs `12`).
  - *L from `entityHurt`*. It is post-armour, and stacking with it took 0.09 (`txt:34`).

## 4 · RADIUS · GREEN / LIVE
- **RADIUS.** Searched for `applyDamage(` and `beforeEvents.entityHurt` over `src/` minus gametest/selftest.
  - The only damage sites are `src/sculk/hit.ts:178,183` (cause sonicBoom, which skips armour, so raw = post-armour and nothing shifts) and `src/scythe/volley.ts:122,131` (a write on every hit).
  - No `src/storm/`. `hit.ts:24-28` stays correct for its cause.
  - No restriction is added, so CASES/BYPASS do not apply.
- **GREEN / LIVE.** No product change. The measurement artifact above is the proof. It ran on BDS 1.26.51.1 with the stand-in, because there is no Storm Blade to run live.

## 5 · Resolution text for `L0-xcx26`
Confirmed and re-pathed (measured on BDS 1.26.51.1 with a diamond-sword stand-in, diagnose-CNTR-X26).
- **The window compares post-armour damage.** A plain `applyDamage(6)` in the melee tick takes 0.00 and returns true: bare (melee 8.00), diamond (2.24), netherite + P4 (0.76), mobs.
- **Active after a melee.** The active `applyDamage(10)` 1–9 ticks after a melee takes 2.00 bare and 0.76 in diamond (native 3.00). After a passive-raised melee it takes 0.00.
- **Difference-stacking (adr-sbdm A) fails P1.** On armour it deals one L+D hit: 4.76 against the 3.80 the KV requires on diamond. It also needs raw L, which no event reports.
- **Passive mechanism.** In `world.beforeEvents.entityHurt` on the blade's own melee (cause entityAttack, damagingEntity = wielder holding the blade), `event.damage += f(6)`.
  - f is computed from `equippable.totalArmor` / `totalToughness` and the Protection EPF of the four armour slots.
  - Exact on every kit (14.00 / 3.80 / 1.30): one native hurt event, absorption first.
  - Kill credit comes from the native hit. The strike visual is deferred with `system.run`.
- **Active mechanism.**
  - Out of a window: native `applyDamage(10)`.
  - Inside a known window: `applyDamage(10)`, then write hp_before − f(10), exact 3.00 / 10.00.
  - When hp ≤ f(10): the overkill `applyDamage`.
- **Closing.** It stays open until the strm build's GameTest repeats these numbers, with the in-test negative controls: plain `applyDamage(6)` → 0, and a flat +6 raise → true damage.

## 6 · Duplicates: file:line — replace what with what
Paths are relative to `.ai/context/analysis/`. Rollout copies are in parentheses.
1. `nodes/xcx26__concept-contradiction.md:32` (`risks.md:198`, `contradictions.md:192`): "is weaker than the ~7–8 HP melee and takes **0**" → "is below the 8.00-HP diamond-sword melee once both pass armour (the window compares post-armour amounts) and takes **0.00**: bare 8.00, diamond 2.24, netherite+P4 0.76".
2. `nodes/xcx26:34` (`risks.md:200`, `contradictions.md:194`): "takes only 10 − L, about 2–3 HP" → "takes only f(10) − f(L): 2.00 bare, 0.76 in diamond armour (native 3.00), at every gap of 1–9 ticks".
3. `nodes/xcx26:38` (`risks.md:204`, `contradictions.md:198`): "`L0-adr-sbdm` (difference-stacking, probe-gated; manual-armour fallback)" → "`L0-adr-sbdm` as amended by diagnose-CNTR-X26 (passive: before-event raise by f(6); active in window: C)".
4. `nodes/adr-sbdm__concept-architecture-decision.md:30` (`project-knowledge/architecture.md:480`): "takes only the difference" → "takes only the difference of the post-armour amounts, f(X) − f(L)".
5. `nodes/adr-sbdm:32` (`architecture.md:482`): "Melee is about 7–8 HP" → "A diamond-sword melee is 8.00 HP (14.00 with Sharpness V)".
6. `nodes/adr-sbdm:37-39` (`architecture.md:487-489`): "The engine takes the difference D and applies armour to it, so armour and credit stay native" → "Measured: the engine takes f(L+D) − f(L), so the total is one L+D hit (diamond 4.76, not 3.80). Exact only without armour (bare, iron golem +6.00). Raw L is not observable: entityHurt and beforeEvents.entityHurt both report post-armour damage. A constant L takes 0.00 under Sharpness V." Mark P1 "answered: L + D", and P2 "unarmoured mob holds; armoured mob not run".
7. `nodes/adr-sbdm:41` (`architecture.md:491`): after option C, add "**R: raise the melee hit.** `beforeEvents.entityHurt`, `event.damage += f(D)`; the value read is post-armour. Exact f(L)+f(6) in one native event, absorption first. A flat +D adds true damage."
8. `nodes/adr-sbdm:44-46` (`architecture.md:494-496`): "**A**, gated on probes P1 and P2" → "P1 failed. Passive: **R**. Active inside a known window: **C** with D′ = f(10) from `totalArmor`/`totalToughness`/Protection. A before-event rewrite of the active is exact only while f(10) > the window's last hit. B stays rejected."
9. `nodes/adr-sbdm:50` (`architecture.md:500`): append "plus a flat +6 raise as a second negative control (true damage, 8.24 on diamond)".
10. `nodes/strm-rdmg__concept-rule.md:30` (`project-knowledge/business-rules.md:1321`): "If P1 passes, `applyDamage(L + D, …)`; the engine takes the difference D and armours it" → "Passive: raise the melee in beforeEvents.entityHurt by f(6) (P1 failed, diagnose-CNTR-X26)".
11. `nodes/strm-rdmg:31` (`business-rules.md:1322`): "If P1 fails, compute D′ (vanilla armour reduction of D)" → "Active in a known window: D′ = f(10) from `equippable.totalArmor`/`totalToughness` + Protection EPF; `applyDamage(10)`, then write hp − D′".
12. `nodes/strm-ppas__concept-process.md:24-27` step 1: "`world.afterEvents.entityHitEntity`" → "`world.beforeEvents.entityHurt` (cause entityAttack, damagingEntity a Player whose main hand holds the blade; readable in the callback)".
13. `nodes/strm-ppas:32-34` step 3: replace the whole step with "No L is needed. The window and both hurt events use post-armour damage. Order in the swing's tick: beforeEvents.entityHurt → entityHitEntity → entityHurt."
14. `nodes/strm-ppas:35` step 4: "`stormDamage(target, 6, wielder, { windowLast: L })`" → "`event.damage += f(6)`; strike visual via `system.run`".
15. `nodes/strm-ppas:40`: "The difference-stacking uses the observed L, not a constant" → "The raise adds f(6) on top of whatever the hit deals, so Sharpness needs no L (14.00 → 20.00 bare). Crits not measured."
16. `nodes/strm-pprb__concept-process.md:28,29,30,34` mark answers:
    - P1: "no — L + D (diamond 2.52 = f(14) − f(8))".
    - P2: "unarmoured mob holds; armoured zombie not run".
    - P2b: "before → hit → hurt, same tick; both damages post-armour".
    - P6: "vanilla diamond sword 8.00 HP; `minecraft:damage` N not measured here".
17. `nodes/strm-gls-hwin__concept-glossary-term.md:17`: after "takes only the difference from a stronger one" add "(compared after armour)". At `:19`, "Difference-stacking … nets D through it" → "nets D only without armour; on armour it deals one L + D hit. The passive raises the melee hit instead".
18. `nodes/strm-acd__concept-acceptance-criterion.md:30` (`scope.md:1559`): "not 10 − L" → "not f(10) − f(L) (2.00 bare, 0.76 in diamond)". Lines `:28-29` (`scope.md:1557-1558`) stand: R meets them (3.80 = 2.24 + 1.56).
19. `nodes/concept-overview.md:66` and `summary.md:72`: "damage by difference-stacking in the hurt window, probe-gated (P1/P2)" → "passive: before-event raise by f(6); active in window: write hp − f(10) (P1 failed, diagnose-CNTR-X26)".
20. `nodes/concept-decomposition-plan.md:53`: "P1/P2: inside the hurt window, does `applyDamage(L + D, entityAttack)` take D with armour applied to D…" → "P1/P2 answered (diagnose-CNTR-X26); the probe still owes: Resistance in f, an armoured mob, a crit, and the lethal path through the raise".

## 7 · Not measured here (open for the strm probe, not for this node)
- Resistance in f.
- `totalArmor` on a mob with natural armour (e.g. a zombie).
- A critical hit.
- The `minecraft:damage` N of a custom item (P6).
- The lethal path and a totem through the before-event raise.
- Absorption on an armoured target.
- The C write against absorption for the active: it bypasses absorption, the same fault as X22 §7 S1.

## 8 · Environment (said to the operator, not filed)
`docker compose up` hung on "Pulling" because the Docker credential helper does not return: `error getting credentials - err: signal: terminated`. The image was already local. The neighbour CNTR-X27 stalled at the same point. `pull_policy: never` in the private compose file got past it.
