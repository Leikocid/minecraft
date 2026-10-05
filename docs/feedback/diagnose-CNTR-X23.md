ИСХОД: 3 — Подчистка знания

# CNTR-X23-AA · CX-L0-23 — the shield against the Sculk Crossbow bolt

The contradiction rests on a premise the engine does not support. On BDS 1.26.51.1 a raised shield **never deflects** a snowball-runtime bolt:
- `projectileHitEntity` fires on the shield-holder 5/5 with the shield in the off hand and 1/1 in the main hand, at +2 ticks, exactly as on an unshielded player;
- the bolt is removed in that tick, with no reversal and no second event.

So T08 can be met honestly; no C-16 deviation and no proximity fallback are needed.

The probe also found a real T08 gap one step later, in the damage call that ADR-scdm §3 adopts:
- the `projectile` cause it names throws;
- the `entityAttack` cause of the shipped Scythe pattern is cancelled by a raised shield. A lethal bolt leaves the holder alive.

`sonicBoom` and `override` pass the shield, credit the owner on a kill, and let a totem save.

Nothing is filed and nothing is written to the KV. The edits below are for whoever applies the cleanup.

Evidence: `ai-kit run-check` artifact `/Users/aleks/work/AI/Andrew/Andrew 5/.ai/verify/CNTR-X23-AA/2.json`, code sha 9088879, exit 0, 143 s, private instance `dist/bds-x23`. Three earlier exploratory runs gave the same numbers (the totem readings excepted, see the note under P2).
- Probe: `docs/feedback/diagnose-CNTR-X23.probe.ts` with three GameTests.
- Bolts: `diagnose-CNTR-X23.bolts.json`.
- Runner: `diagnose-CNTR-X23.repro.sh`.

## Intake

**OBSERVED.** No observation existed. L0-xcx23 states as an engine fact that "a raised shield deflects the projectile before it counts as a hit". In the same node it says the snowball-runtime case is "not known (to be probed)". I searched three places and found no run:
- the chronicle;
- `src/` (shield appears only in `src/ufo/iron.ts:55` and the off-hand test);
- `docs/feedback/`.

AS-sclk-02 (assumptions.md:386–400) adds two more unmeasured claims: "raised by sneaking" and a radius of 0.8.

**VERDICT.** A hypothesis, so I measured it.

## Set-up

- A SimulatedPlayer `x23_target` (Survival) stands at structure (3.5, 2, 6.5) and faces the shot.
- The shooter `x23_shooter` stands off the line at (0, 2, 0) and is the projectile `owner`.
- Each projectile is spawned at (3.5 + offset, 3.0, 1.5) and shot with `shoot({0, 0, 3.0}, {uncertainty: 0})`.
- Stone walls at z = 10 and z = −3 catch what passes and what comes back.
- Health is reset before every trial.
- The shield is raised by `isSneaking = true` with `minecraft:shield` in a hand, set through `setEquipment` (returns `true`).

Bolts are `runtime_identifier: minecraft:snowball`, format 1.26.0, `gravity` 0.05, with these `on_hit` variants:

| bolt | on_hit |
|---|---|
| `x23_bolt_zero` (the ADR design) | `impact_damage` 0, `remove_on_hit` |
| `x23_bolt_dmg` | `impact_damage` 1, `remove_on_hit` |
| `x23_bolt_bounce` | as zero, plus `should_bounce: true` |
| `x23_bolt_bare` | `remove_on_hit` only |

## P1 · What the shield does to the projectile

| target | arrow (control) | snowball and all 4 bolts |
|---|---|---|
| no shield | hit +2, **hurt 6.00** | hit +2, removed +2 |
| sneaking, no shield | hit +2, hurt 6.00 | hit +2, removed +2 |
| **shield off hand + sneak, ×5** | hit +2 **5/5**, hurt **0.00 ×5**, no hurt event before or after; reverses at the shield (z 6.20, v −0.29); `projectileHitBlock` on the floor at +8, 5/5; stays stuck until removed | hit +2 **5/5** at (3.50, 2.97, 6.20); removed +2; reversed 0/5; block hit 0/5 |
| shield main hand + sneak | as the off hand, 1/1 | hit 1/1, removed +2 |
| shield, not sneaking | hit, hurt 6.00 | hit |
| shield + sneak, back to the shot | hit, hurt 6.00 | hit |

Near misses (centre line 0.4 / 0.6 / 0.8 / 1.0 from the target's axis), for the arrow, bolt_zero and bolt_bounce, with and without a raised shield: 0/24 `projectileHitEntity`, 24/24 `projectileHitBlock` on the back wall, no reversal.

Other observations:
- `itemStartUse` never fires for the shield.
- For an unshielded arrow, `world.beforeEvents.entityHurt` fires (`projectile:6.00:minecraft:arrow`); for a blocked one it does not.

Answers to the three questions in the task:
1. **Does a blocked projectile raise `projectileHitEntity` on the holder?** Yes, always. For the bolts and the snowball, nothing deflects at all. Even the vanilla arrow raises it before it bounces.
2. **Does the entity survive?** A snowball-runtime bolt is removed in the hit tick (`entityRemove` +2) and leaves no second outcome. The vanilla arrow survives and lands a second event (`projectileHitBlock` at +8).
3. **Can a deflection be told from a miss?** For the bolt there is no deflection to tell: a hit on a shield-holder looks exactly like a hit. For the arrow, a deflection is `projectileHitEntity` with no hurt event, then `v.z < 0`. A miss raises no entity event at any offset from 0.4 to 1.0.

## P2 · Which script damage gets through a raised shield

Each row is `applyDamage` on the target, starting at hp 20 (hp 6 for lethal rows), with `damagingEntity: x23_shooter` unless stated.

| call | no shield | shield + sneak, facing | shield + sneak, back |
|---|---|---|---|
| `entityAttack`, 10 | 20→10 | **false, 20→20, no hurt event** | 20→10 |
| `projectile`, 10 (ADR §3 as written) | **throws** "Cause 'projectile' is not valid" | throws | throws |
| `{damagingProjectile: bolt}`, 10 | 20→10 | **false** | 20→10 |
| `entityAttack`, no source | 20→10 | **false** | **false** |
| `sonicBoom`, 10 | 20→10 | 20→10 | 20→10 |
| `override`, 10 | 20→10 | 20→10 | 20→10 |
| ADR non-lethal (`entityAttack` + `setCurrentValue`) | 20→10, hurt event | 20→10, `applyDamage`=false, **no hurt event** | 20→10 |
| **ADR lethal** (`applyDamage(hp+100, entityAttack)`) | dies, credited to shooter | **false, survives at 6** | dies |
| the same two, inside a real `projectileHitEntity` handler | 20→10 / dies | 20→10 silent / **survives at 6** | 20→10 / dies |
| `sonicBoom` lethal | dies, credited to shooter | dies, credited | dies, credited |
| `override` lethal | dies, credited | dies, credited | dies, credited |
| totem in hand + lethal `entityAttack` | totem used, 6→1 | **false, totem kept, 6→6** | totem used, 6→1 |
| totem in hand + lethal `sonicBoom` / `override` | totem used, 6→1 | totem used, 6→1 | totem used, 6→1 |

Inside the hit handler, `e.projectile.isValid` is `false` (the bolt is already removed). So `damagingProjectile: e.projectile` is not available there, and it is shield-blocked anyway.

Note on the totem rows: a totem leaves absorption and regeneration behind. In the first recorded run (code sha 1cf0128) these soaked the next trial (20→18 against a 10.00 hurt; 6→9). Commit 9088879 clears effects before every trial, and the artifact above is the clean run.

## P3 · The shipped Scythe against a raised shield (live)

`launchVolley` from `src/scythe/volley.ts` targets a player at 3 HP:
- **Unshielded:** hit 1 is `entityAttack` 103.00 at +8 and the target dies.
- **Sneaking with a shield, facing the owner:** hp after each hit is `[3, 1, 2]`, the volley ends `spent hits=3`, there are no hurt events, and the target is alive.
  - Hits 1 and 3 took the lethal branch (`volley.ts:122`), and the shield cancelled them.
  - Hit 2 landed only through `setCurrentValue` (`volley.ts:131–132`), silently.

## Investigation blocks

- **REPRO.** `env ANDREW_BDS_DIR=../dist/bds-x23 docs/feedback/diagnose-CNTR-X23.repro.sh`, in 5 runs:
  - P1 ran in all five; the shielded case was ×3 in the first two runs and ×5 from then on;
  - P2 ran in four; the lethal `override` and totem rows ran in the last two;
  - P3 ran in three;
  - the numbers that overlap matched in every run, except the totem readings fixed in 9088879.
- **CAUSE.** The deflection premise is false for the snowball runtime: the engine registers the hit (P1). The T08 gap is the damage cause:
  - a raised shield cancels script `applyDamage` for `entityAttack` and for by-projectile damage from a source in front, and for `entityAttack` with no source from any side;
  - `projectile` + `damagingEntity` throws.
  ADR-scdm §3 (adr-scdm:34) names the throwing cause and cites the shield-blocked pattern (decision-scythe-true-damage, decisions.md:376; volley.ts:122, :131).
- **PROOF.** The run-check artifact above.
- **RULED OUT.**
  - *The shield was not really up.* In the same set-up the arrow took 0.00 ×5 and bounced. Unshielded it took 6.00. Sneaking only, shield without sneaking and back turned each took 6.00.
  - *The hit event is a by-product of `remove_on_hit` or zero damage.* bolt_dmg, bolt_bounce and bolt_bare give the same 5/5.
  - *A handler call behaves differently from a direct call.* In-handler lethal under a shield gives 6 → 6, the same as direct.

## Knowledge cleanup (proposed, not applied)

Line numbers refer to the root `.ai/context/analysis/`.

| node | edit |
|---|---|
| `xcx23` (also contradictions.md:263–279, risks.md:273–289) | close as resolved by measurement: no deflection, `projectileHitEntity` on the holder, T08 met literally; drop the 0.6 detector and the C-16/xq7 route |
| `sclk-as02` (assumptions.md:386–400) | delete. "Raised by sneaking" holds (arrow control), but the fallback is unneeded and harmful: radius 0.8 would turn the measured misses at 0.4/0.6/0.8 into hits, against §9 |
| `sclk-p004:22` | delete the second trigger (shield fallback) |
| `sclk-r001:20` | drop "or the shield fallback after an event" |
| `sclk-ac08` (scope.md:726–733) | case (b) resolves through `projectileHitEntity` only. Add case (c): a shield-holder at hp ≤ D dies from one bolt, credited to the shooter. Add (d): with a totem in hand, the totem is used |
| `sclk-p001:29` Q6 | answered: yes, 5/5 + 1/1. The shield is raised by sneaking, not by `useItem` (no `itemStartUse`) |
| `adr-scdm:34` §3 | cause `projectile` + `damagingEntity` throws; `entityAttack` is cancelled by a raised shield (lethal: the holder survives). Use `sonicBoom` for both the feedback call and the overkill: it passes the shield, credits the owner and lets a totem save. Keep `setCurrentValue` for the non-lethal exact D |
| `adr-scdm:39` gate | the shield item is answered |
| `adr-scdm:45` rejected | the arrow runtime is deflected but still raises `projectileHitEntity`, then a second `projectileHitBlock` (+8). The rejection stands, for that reason |
| `adr-scdm:27` context | `world.beforeEvents.entityHurt` exists in 2.10.0 and fires for arrow damage (`projectile:6.00:minecraft:arrow`); `cancel` was not tested |
| `xq7:29` item 2 | remove: the engine already counts a hit on a shield as a hit on its holder |
| C-28 (concept-constraint.md:43), `xasm23` (assumptions.md:477) | "the shield" holds only with a shield-piercing cause; do not point at decision-scythe-true-damage as the mechanism for the crossbow |

Not measured here, and still owned by the ADR probe and xcx22:
- `sonicBoom` against armour, Protection and the hurt-invulnerability window;
- the death-message text (chat; an iPad check).

## Said to the operator, not filed: the Scythe

The shipped Scythe cannot finish off a player who sneaks with a shield facing its owner. Every lethal hit is cancelled, and non-lethal hits land with no hurt flash (P3, live).
- It contradicts decision-scythe-true-damage («каждое попадание … снимает ровно 3 HP»; the lethal branch exists «чтобы сработали сообщение о смерти, засчёт убийства … и тотем»).
- The decision itself fixes `EntityDamageCause.entityAttack`. Changing that cause is a decision change, so it is handed over rather than fixed in this crossbow run.
- Measured options: `sonicBoom` or `override`. Both pass the shield, credit the owner and let a totem save. Their death-message text differs, and that is an iPad check.
- Alternative: let a shield block every Scythe hit. The spec (Scythe §4) is silent on shields.
