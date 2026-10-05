ИСХОД: 3 — Подчистка знания

# CNTR-X22-AA · CX-L0-22 · T17 vs the hurt-invulnerability window

Checked on `a39e654` against BDS 1.26.51.1 in a private instance (`andrew-bds-x22`, ports 19937/19970–19979/7947, removed after the run).
- Probe: `docs/feedback/diagnose-CNTR-X22.probe.ts`, run by `diagnose-CNTR-X22.repro.sh`.
- Raw lines: `diagnose-CNTR-X22.probe.txt`, cited below as `txt:N`.
- Artifact: `.ai/verify/CNTR-X22-AA/2.json`, exit 0, 12/12 passed (10 probe scenarios plus the shipped `scythe_three_hits_true_damage` and `scythe_lethal_hit_kills`). No scenario took damage the probe did not deal (`NOISE … none`).
- KV lines are from the root `.ai/context` (read-only). Nothing was filed and nothing was written to the KV.

**Verdict.** The node is right, and the window is sharper than it says: exactly 10 ticks. The proposed resolution makes T17 exact: 30.00 of 30 on netherite + Protection IV, against 1.01 without the write. But the mechanism the KV writes down for the crossbow has three faults that the probe exposed:
- `cause: projectile` throws;
- a raised shield stops the lethal `entityAttack` overkill;
- a write on every hit charges absorption twice.

No crossbow code exists, so this is a knowledge correction (§5–§6). The same two pattern faults are in the shipped Scythe, measured on its real code path; they are reported in §7, not filed.

## 1 · OBSERVED / VERDICT

- **OBSERVED.** The node's engine claim ("~10-tick hurt cooldown swallows a second `applyDamage` of equal or lower amount") cited no measurement of script `applyDamage`.
  - The only earlier measurement was of engine explosions (probe_blast_stacking).
  - The Scythe comment `src/scythe/volley.ts:129-130` says the write "covers" the window. Yet its hits are launched 10 ticks apart (`volley-rules.ts:12`) and land 14–25 ticks apart (`txt:79,82,85`), so no shipped test ever put two hits in one window.
  - `adr-scdm:34` and `sclk-p004:30` prescribe `cause: projectile` with no projectile entity.
- **VERDICT.** An unmeasured hypothesis on a path the spec's headline number depends on → investigated as a bug.

## 2 · REPRO / CAUSE / PROOF / RULED OUT

Targets are Survival SimulatedPlayers at 40 HP (health_boost), regen off, D = 10.

| Question | Measured | txt |
|---|---|---|
| Equal second hit inside the window | gap 1–9 ticks: 0 taken; gap 10, 11, 12, 15, 20: the full 10 | 8–19 |
| Lower / stronger hit inside it | lower: 0. Stronger: only the difference (5→8 took 3; 8→20 took 12) | 20 |
| What restarts the window | a hit that lands, even partially: 5 @0, 8 @5 (took 3), 8 @12 took **0**, 8 @16 took **8** | 88 |
| Does a bare `setCurrentValue` open a window | no: `applyDamage(10)` one tick after a write took 10 | 89 |
| Is the swallow visible to the caller | no: `applyDamage` returns `true` when swallowed; `false` only when a shield blocks | 8–13, 44 |
| Synchronous? | yes: health reads the new value in the same call; nothing deferred over +1/+2/+5/+20 | 5, 26 |
| **Pattern ×3, netherite + Protection IV, same tick** | **40 → 10.00 = 30.00**; with the write disabled: **1.01** | 26, 27 |
| Pattern ×3 on adjacent ticks / 10 apart / at Normal | 30.00 / 30.00 / 30.00; without the write 1.01 | 28–30, 35 |
| Lethal overkill inside the window | kills (a stronger hit lands), killer = the owner, also through netherite + P4 | 21, 36 |
| `cause: projectile` with only `damagingEntity` (the KV form) | **throws** `UnsupportedFunctionalityError: Cause 'projectile' is not valid.` | 70 |
| One hit of 10 through netherite + P4, by cause | entityAttack 1.01 · **sonicBoom 10.00** · magic 3.60 · override 3.60 · byProjectile(snowball) 1.01 | 71–75 |
| `sonicBoom` ×3 in one tick, no write | 10.00 (the window swallows hits 2 and 3) | 32 |
| Raised shield (control: arrow 4.00 unblocked, 0 blocked) | entityAttack blocked (`false`, 0, no hurt event). sonicBoom 10.00. Pattern ×3: 30.00 but no hurt event (no flash) | 39–46 |
| **Lethal overkill vs a raised shield** | entityAttack: **blocked, the target survives at 5.00**. sonicBoom, override: dead, killer = player | 51–53 |
| **Absorption 16, one hit** | pattern: **10 off absorption + 10 off health**. Plain entityAttack and native sonicBoom: 10 off absorption only | 61–64 |
| Does the bolt's own impact open the window | no: a snowball hit, then `applyDamage(10)` in `projectileHitEntity`, took the armour-reduced 1.01 | 76 |

- **CAUSE.** The engine keeps a 10-tick window from the last *landed* hit and applies only what exceeds the strongest hit in it. A Multishot volley's 2nd and 3rd bolts therefore take 0 through `applyDamage` alone.
- **PROOF.** The negative control (`txt:27`, `:29`) loses 1.01. The same volley with the write loses exactly 30.00 (`txt:26`, `:28`).
- **RULED OUT.**
  - Armour as the cause of the 1×. Unarmoured, three equal hits still take only 10 (`txt:6-7`), and native sonicBoom, which ignores armour, also takes only 10 (`txt:32`).
  - A deferred hit landing later: health is stable through +20 ticks.
  - Run 1's anomalies (an 8.00 first hit, a 0.72 drift) were the probe's own fault. It stood the targets inside the platform floor (y=1), and suffocation hits of 2 opened windows (`txt:124-126`). Run 4 stands them at y=2 like `main.ts:1624-1625`, with NOISE checks.

## 3 · RADIUS

- **Code with the pattern.** Only the Scythe's `strike()`, `src/scythe/volley.ts:122,131-132` (grep `applyDamage(|setCurrentValue(` over `src/` minus gametest/selftest).
- Nothing in `src/` uses `cause: projectile` or `sonicBoom`.
- The crossbow is not built. Its mechanism lives only in the KV lines of §6.
- CASES / BYPASS: not applicable. No restriction is added to code.

## 4 · GREEN / LIVE

- No product change. On `a39e654` the shipped regression tests pass: `scythe_three_hits_true_damage` (20 → 11 through diamond) and `scythe_lethal_hit_kills` (`txt:118-119`).
- LIVE: the probe drove the shipped `launchVolley` itself (`txt:79,82,85`).

## 5 · Resolution text for `L0-xcx22`

Resolved (measured on BDS 1.26.51.1, diagnose-CNTR-X22).
- **The window.** An equal or lower script `applyDamage` within 10 ticks of the last landed hit takes 0, and a stronger one takes the difference. `applyDamage` returns `true` either way.
- **T17 holds only with a health write.** Three bolts within 2 ticks on netherite + Protection IV take 1.01 through `applyDamage` alone, and exactly 30.00 with a write. AC-17 and its negative control stand as written.

The crossbow hit mechanism (replaces `adr-scdm` §3, `sclk-r002` mechanism bullet, `sclk-p004` step 4), per bolt hit, D = `SONIC_BOOM_DAMAGE`:

1. `hp = health.currentValue`.
2. **Lethal branch.** If D ≥ hp: `applyDamage(hp + 100, {cause: sonicBoom, damagingEntity: owner if valid})`. It kills inside the window, through armour + Protection and through a raised shield, with kill credit to the owner. The totem still works because the hit goes through `applyDamage`.
3. **Normal branch.** Otherwise:
   - `applyDamage(D, {cause: sonicBoom, damagingEntity: owner})`. Outside the window this alone is exact: armour, Protection and the shield are ignored natively, absorption is consumed first like the Warden's boom, and the hurt event fires (flash, sound).
   - Then `health.setCurrentValue(hp − D)`, **only when the target is inside a window known to the script**: a landed hit on it less than 10 ticks earlier. Landed hits are the crossbow's own hits, recorded in the handler (Multishot hits share a tick), plus any `entityHurt` on the target.
   - The write is idempotent when the native hit already took D from health.
4. **Never write on every hit.** With absorption that takes D twice (10 + 10).
5. **Never `cause: projectile` without `damagingProjectile`.** It throws.

The detailed mechanism is the crossbow damage task's to settle. The facts above are what it has to hold.

## 6 · Duplicates and drift: file:line — replace what with what

Paths are relative to `.ai/context/analysis/`. Rollouts (`risks.md`, `contradictions.md`, `architecture.md`, `business-rules.md`, `glossary.md`, `domain-model.md`, `scope.md`) are regenerated from the nodes and are listed for completeness.

1. `nodes/xcx22__concept-contradiction.md:28` (copies `risks.md:261`, `contradictions.md:252`):
   - "hurt cooldown (about 10 ticks) swallows a second `applyDamage` of equal or lower amount" → "hurt window — exactly 10 ticks from the last landed hit — takes 0 from an equal or lower `applyDamage` and only the difference from a stronger one; `applyDamage` still returns true".
   - "`src/scythe/volley.ts:126-130`" → "`src/scythe/volley.ts:124-130`" (the comment starts at 124).
2. `nodes/xcx22__concept-contradiction.md:32` (copies `risks.md:265`, `contradictions.md:256`): "`applyDamage` … then `setCurrentValue(hp − D)` per bolt" → the §5 mechanism (sonicBoom; write only inside a known window).
3. `nodes/adr-scdm__concept-architecture-decision.md:34` (copy `project-knowledge/architecture.md:220`): "`applyDamage(D, {cause: projectile, damagingEntity: owner})`" → "`applyDamage(D, {cause: sonicBoom, damagingEntity: owner})`", with the conditional write from §5. `projectile` throws (`txt:70`).
4. `nodes/sclk-p004__concept-process.md:30`: "`{cause: projectile, damagingEntity: owner?}`" → "`{cause: sonicBoom, damagingEntity: owner?}`".
5. `nodes/sclk-p004__concept-process.md:31`: "then `health.setCurrentValue(hp − D)`" → "then, only inside a known window, `health.setCurrentValue(hp − D)`".
6. `nodes/sclk-r002__concept-rule.md:24` (copy `project-knowledge/business-rules.md:538`): "the Scythe true-damage pattern (`volley.ts:114-136`) … then `setCurrentValue(hp − D)`" → "sonicBoom-cause `applyDamage` (exact through armour, Protection and shield, absorption first), plus `setCurrentValue(hp − D)` only inside a known window (§5)". The Scythe pattern itself spans `volley.ts:115-133`.
7. `nodes/sclk-r002__concept-rule.md:20,22` (copies `business-rules.md:534,536`): "lowers the target's health by exactly D … with any armour, Protection level or raised shield" → "takes exactly D from absorption, then health …". With the pattern as written, a raised shield stops the lethal hit (`txt:51`) and absorption is charged twice (`txt:61`).
8. `nodes/sclk-r002__concept-rule.md:27` (copy `business-rules.md:541`): "A totem … because the lethal path goes through `applyDamage`" → add "with cause sonicBoom: an entityAttack overkill is stopped by a raised shield".
9. `nodes/concept-constraint.md:43` C-28 (copy `business-rules.md:46`): keep the rule. Append "(holds with cause sonicBoom and a write only inside the window; diagnose-CNTR-X22)".
10. `nodes/sclk-gl02__concept-glossary-term.md:17` (copy `glossary.md:1299`), and `nodes/sclk__concept-component.md:24` (copies `architecture.md:77`, `domain-model.md:337`): "exactly subtracted through armour, Protection, the shield and the invulnerability window" → add "absorption first".
11. `nodes/sclk-p001__concept-process.md:30` Q7: answered. "yes: 30.00 within 2 ticks with the write, 1.01 without (diagnose-CNTR-X22)". Remove it from the probe's open list.
12. `nodes/sclk-ac17__concept-acceptance-criterion.md:17-22` (copies `scope.md:851-856`, `glossary.md:1142-1147`): no change. It holds as written, and the negative control still reads < 30 under §5 (10.00, `txt:32`).

## 7 · Shipped Scythe: two faults measured on the way (said to the operator, not filed)

- **S1 · Absorption charged twice.**
  - What happens: a target holding 16 absorption lost **9 health and 9 absorption** to one volley, 18 for a 9-HP weapon (`txt:82`). Each hit is `applyDamage(3)` (eaten by absorption) followed by the write (taken from health).
  - Why it is wrong: it contradicts `nodes/sprj-as01__concept-assumption.md:20` ("absorption first, then health") and §4 "ровно 3 HP" (`scytheofcalamityspecv1ruen-part-1.md:73`). A golden apple (4 absorption) or an enchanted golden apple (16) is enough.
  - Why not here: stable 2.10.0 cannot read absorption (`grep -ci absorption node_modules/@minecraft/server/index.d.ts` → 0). The only cause that ignores armour + Protection natively is `sonicBoom` (`txt:71-74`), which gives the Scythe the Warden's death message. The fix is a choice of semantics, so it does not fit this diagnose-only run.
- **S2 · A raised shield stops the kill.**
  - What happens: a 5-HP target blocking toward the owner went to 2.00 after hit 1 (the write passes the shield). Hits 2 and 3 took the lethal branch (entityAttack overkill), were blocked, and it survived. No hit raised a hurt event (`txt:85`).
  - The Scythe spec names only armour and protective enchantments (`scytheofcalamityspecv1ruen-part-1.md:73` §4, `-part-2.md:31` §7) and never shields. So this is an inconsistency, and the operator's call.
- **A ready statement, if the operator wants a card.** "Scythe true damage: one hit takes exactly 3 HP from absorption-then-health, and the lethal hit kills through a raised shield".
  - Criteria: absorption-16 volley loses 9 in total [e2e]; a 5-HP shield blocker dies on hit 2 with kill credit to the owner [e2e]; diamond-armour volley still 20 → 11 [e2e]; `scythe_lethal_hit_kills` still green [e2e].
