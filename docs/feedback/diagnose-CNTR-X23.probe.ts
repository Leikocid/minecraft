// L0-xcx23 probe against BDS 1.26.51.1: what a raised shield does to a vanilla
// arrow and to snowball-runtime bolts, whether a script can tell a deflection
// from a miss (P1), which script damage gets through a raised shield (P2), and
// what the shipped Scythe strike does to a shield-holder (P3).
//
// Not part of the shipped gametest pack: diagnose-CNTR-X23.repro.sh copies this
// file and the bolt entities (diagnose-CNTR-X23.bolts.json) into the gametest
// pack for one run and restores the tree.

import { EntityDamageCause, EquipmentSlot, GameMode, ItemStack, type Entity, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { launchVolley } from "../scythe/volley";

const STRUCTURE = "andrew:platform";
const log = (msg: string): void => console.warn(`[probe] XCX23 ${msg}`);

// The platform floor is structure y=1, so players stand at y=2.
const TARGET_FEET: Vector3 = { x: 3.5, y: 2, z: 6.5 };
const SHOOTER_BLOCK: Vector3 = { x: 0, y: 2, z: 0 };
const SPAWN_Z = 1.5;
/** Feet + 1.0: inside the standing (1.8) and the sneaking box alike. */
const AIM_Y = 3.0;
/** Blocks per tick; a crossbow arrow leaves at about 3.15. */
const SPEED = 3.0;
const TRACK_TICKS = 40;
const SETTLE_TICKS = 10;
const SHIELD_REPS = 5;

const ARROW = "minecraft:arrow";
const BOLT_ZERO = "andrew:x23_bolt_zero";
const BOLT_BOUNCE = "andrew:x23_bolt_bounce";
const KINDS = [ARROW, "minecraft:snowball", BOLT_ZERO, "andrew:x23_bolt_dmg", BOLT_BOUNCE, "andrew:x23_bolt_bare"];

interface Condition {
  label: string;
  shield: "none" | "offhand" | "mainhand";
  sneak: boolean;
  face: "shot" | "away";
}

const COND: Record<string, Condition> = {
  none: { label: "none", shield: "none", sneak: false, face: "shot" },
  noneSneak: { label: "none+sneak", shield: "none", sneak: true, face: "shot" },
  offSneak: { label: "offhand+sneak", shield: "offhand", sneak: true, face: "shot" },
  offStand: { label: "offhand-nosneak", shield: "offhand", sneak: false, face: "shot" },
  offBack: { label: "offhand+sneak-back", shield: "offhand", sneak: true, face: "away" },
  mainSneak: { label: "mainhand+sneak", shield: "mainhand", sneak: true, face: "shot" },
};

interface Sample {
  t: number;
  p: Vector3;
  v: Vector3;
}

interface Trial {
  cond: string;
  kind: string;
  offset: number;
  projId: string;
  t0: number;
  hits: string[];
  blocks: string[];
  hurtBefore: string[];
  hurtAfter: number[];
  removedAt?: number;
  uses: string[];
}

interface Outcome {
  cond: string;
  kind: string;
  offset: number;
  hitTarget: number;
  hitOther: number;
  hitBlock: string;
  hurt: number;
  before: string;
  reversedAt: string;
  closest: number;
  fate: string;
  sneakRead: boolean;
}

let current: Trial | undefined;

const f2 = (n: number): string => n.toFixed(2);
const fv = (v: Vector3): string => `(${f2(v.x)},${f2(v.y)},${f2(v.z)})`;
const idOf = (e: Entity | undefined): string => {
  try {
    return e?.id ?? "-";
  } catch {
    return "?";
  }
};
const nameOf = (e: Entity | undefined): string => {
  try {
    if (e === undefined) return "none";
    return e.nameTag !== "" ? e.nameTag : e.typeId;
  } catch {
    return "?";
  }
};

/** Shortest horizontal distance from the target's vertical axis to the segment a→b. */
function segDist(a: Vector3, b: Vector3, c: Vector3): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.z - a.z) * dz) / len2));
  return Math.hypot(a.x + u * dx - c.x, a.z + u * dz - c.z);
}

function equip(p: SimulatedPlayer, c: Condition): void {
  const eq = p.getComponent("minecraft:equippable");
  if (eq === undefined) throw new Error("no equippable on the target");
  const off = eq.setEquipment(EquipmentSlot.Offhand, c.shield === "offhand" ? new ItemStack("minecraft:shield") : undefined);
  const main = eq.setEquipment(EquipmentSlot.Mainhand, c.shield === "mainhand" ? new ItemStack("minecraft:shield") : undefined);
  const read = `main=${eq.getEquipment(EquipmentSlot.Mainhand)?.typeId ?? "-"} off=${eq.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "-"}`;
  log(`setup ${c.label}: setEquipment off=${off} main=${main}; reads ${read}`);
}

function aim(test: Test, p: SimulatedPlayer, c: Condition): void {
  p.teleport(test.worldLocation(TARGET_FEET));
  p.isSneaking = c.sneak;
  // lookAtLocation takes structure-relative coordinates.
  p.lookAtLocation(c.face === "shot" ? { x: 3.5, y: AIM_Y, z: SPAWN_Z } : { x: 3.5, y: AIM_Y, z: 14 }, LookDuration.Continuous);
}

async function shoot(test: Test, target: SimulatedPlayer, shooter: SimulatedPlayer, c: Condition, kind: string, offset: number): Promise<Outcome> {
  const dim = test.getDimension();
  aim(test, target, c);
  target.getComponent("minecraft:health")?.resetToMaxValue();
  await test.idle(2);
  const axis = target.location;
  const sneakRead = target.isSneaking;
  const proj = dim.spawnEntity(kind, test.worldLocation({ x: 3.5 + offset, y: AIM_Y, z: SPAWN_Z }));
  const trial: Trial = {
    cond: c.label,
    kind,
    offset,
    projId: proj.id,
    t0: system.currentTick,
    hits: [],
    blocks: [],
    hurtBefore: [],
    hurtAfter: [],
    uses: [],
  };
  current = trial;
  const comp = proj.getComponent("minecraft:projectile");
  if (comp === undefined) throw new Error(`${kind}: no minecraft:projectile component`);
  comp.owner = shooter;
  comp.shoot({ x: 0, y: 0, z: SPEED }, { uncertainty: 0 });
  const samples: Sample[] = [{ t: 0, p: proj.location, v: proj.getVelocity() }];
  let gone = "";
  for (let t = 1; t <= TRACK_TICKS; t++) {
    await test.idle(1);
    if (!proj.isValid) {
      gone = `gone by +${t}`;
      break;
    }
    samples.push({ t, p: proj.location, v: proj.getVelocity() });
  }
  const last = samples[samples.length - 1];
  if (proj.isValid) {
    gone = `alive@+${TRACK_TICKS} at ${fv(test.relativeLocation(last.p))} v=${fv(last.v)}`;
    proj.remove();
  }
  await test.idle(1);
  current = undefined;

  let closest = Infinity;
  for (let i = 1; i < samples.length; i++) closest = Math.min(closest, segDist(samples[i - 1].p, samples[i].p, axis));
  const rev = samples.find((s) => s.v.z < -0.01);
  const fate =
    trial.removedAt !== undefined ? `${gone}; entityRemove +${trial.removedAt - trial.t0}` : gone === "" ? "?" : `${gone}; no entityRemove`;
  const out: Outcome = {
    cond: c.label,
    kind,
    offset,
    hitTarget: trial.hits.filter((h) => h.includes("x23_target")).length,
    hitOther: trial.hits.filter((h) => !h.includes("x23_target")).length,
    hitBlock: trial.blocks.join(" ") || "-",
    hurt: trial.hurtAfter.reduce((a, b) => a + b, 0),
    before: trial.hurtBefore.join(" ") || "-",
    reversedAt: rev === undefined ? "never" : `+${rev.t} at z=${f2(test.relativeLocation(rev.p).z)} v=${fv(rev.v)}`,
    closest,
    fate,
    sneakRead,
  };
  log(
    `TRIAL ${c.label} ${kind} off=${offset}: hitEntity[target]=${out.hitTarget} [${trial.hits.join(" | ")}] ` +
      `hitBlock=[${out.hitBlock}] hurtAfter=${f2(out.hurt)} (${trial.hurtAfter.length} events) hurtBefore=[${out.before}] ` +
      `reversed=${out.reversedAt} closest=${f2(closest)} fate=${fate} sneak=${sneakRead} uses=[${trial.uses.join(" ")}] ` +
      `path=${samples.slice(0, 5).map((s) => `${s.t}:${f2(test.relativeLocation(s.p).z)}/${f2(s.v.z)}`).join(" ")}`
  );
  return out;
}

registerAsync("andrew", "probe_xcx23_shield", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const subs: Array<() => void> = [];
  const tick = (): number => system.currentTick;
  const onHitEntity = world.afterEvents.projectileHitEntity.subscribe((e) => {
    if (current === undefined || idOf(e.projectile) !== current.projId) return;
    const hit = e.getEntityHit();
    current.hits.push(`+${tick() - current.t0} ${nameOf(hit.entity)} at ${fv(test.relativeLocation(e.location))}`);
  });
  subs.push(() => world.afterEvents.projectileHitEntity.unsubscribe(onHitEntity));
  const onHitBlock = world.afterEvents.projectileHitBlock.subscribe((e) => {
    if (current === undefined || idOf(e.projectile) !== current.projId) return;
    let at = "?";
    try {
      const b = e.getBlockHit();
      at = `${b.block.typeId}@${fv(test.relativeLocation(b.block.location))}`;
    } catch {
      at = "unreadable";
    }
    current.blocks.push(`+${tick() - current.t0} ${at} proj@${fv(test.relativeLocation(e.location))}`);
  });
  subs.push(() => world.afterEvents.projectileHitBlock.unsubscribe(onHitBlock));
  const onHurtBefore = world.beforeEvents.entityHurt.subscribe((e) => {
    if (current === undefined || nameOf(e.hurtEntity) !== "x23_target") return;
    current.hurtBefore.push(`${e.damageSource.cause}:${f2(e.damage)}:${e.damageSource.damagingProjectile?.typeId ?? "-"}`);
  });
  subs.push(() => world.beforeEvents.entityHurt.unsubscribe(onHurtBefore));
  const onHurt = world.afterEvents.entityHurt.subscribe((e) => {
    if (current === undefined || nameOf(e.hurtEntity) !== "x23_target") return;
    current.hurtAfter.push(e.damage);
  });
  subs.push(() => world.afterEvents.entityHurt.unsubscribe(onHurt));
  const onRemove = world.afterEvents.entityRemove.subscribe((e) => {
    if (current !== undefined && e.removedEntityId === current.projId) current.removedAt = tick();
  });
  subs.push(() => world.afterEvents.entityRemove.unsubscribe(onRemove));
  const onStart = world.afterEvents.itemStartUse.subscribe((e) => {
    if (current !== undefined && nameOf(e.source) === "x23_target") current.uses.push(`start:${e.itemStack?.typeId}`);
  });
  subs.push(() => world.afterEvents.itemStartUse.unsubscribe(onStart));

  // Walls: one behind the target catches what passes, one behind the spawn point catches what comes back.
  for (let x = 0; x <= 6; x++)
    for (let y = 2; y <= 5; y++) {
      dim.setBlockType(test.worldLocation({ x, y, z: 10 }), "minecraft:stone");
      dim.setBlockType(test.worldLocation({ x, y, z: -3 }), "minecraft:stone");
    }

  const target = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 6 }, "x23_target", GameMode.Survival);
  const shooter = test.spawnSimulatedPlayer(SHOOTER_BLOCK, "x23_shooter", GameMode.Survival);
  const outs: Outcome[] = [];
  try {
    await test.idle(10);
    const plan: Array<[Condition, number]> = [
      [COND.none, 1],
      [COND.noneSneak, 1],
      [COND.offSneak, SHIELD_REPS],
      [COND.offStand, 1],
      [COND.offBack, 1],
      [COND.mainSneak, 1],
    ];
    for (const [c, reps] of plan) {
      equip(target, c);
      aim(test, target, c);
      await test.idle(SETTLE_TICKS);
      for (let r = 0; r < reps; r++) for (const kind of KINDS) outs.push(await shoot(test, target, shooter, c, kind, 0));
    }
    for (const c of [COND.none, COND.offSneak]) {
      equip(target, c);
      aim(test, target, c);
      await test.idle(SETTLE_TICKS);
      for (const offset of [0.4, 0.6, 0.8, 1.0])
        for (const kind of [ARROW, BOLT_ZERO, BOLT_BOUNCE]) outs.push(await shoot(test, target, shooter, c, kind, offset));
    }
  } finally {
    for (const u of subs) u();
    current = undefined;
    if (target.isValid) test.removeSimulatedPlayer(target);
    if (shooter.isValid) test.removeSimulatedPlayer(shooter);
  }

  const pick = (cond: string, kind: string, offset = 0): Outcome[] => outs.filter((o) => o.cond === cond && o.kind === kind && o.offset === offset);
  const tally = (os: Outcome[]): string =>
    `n=${os.length} hitEntity=${os.filter((o) => o.hitTarget > 0).length} hurt=${os.filter((o) => o.hurt > 0).length} ` +
    `reversed=${os.filter((o) => o.reversedAt !== "never").length} hitBlock=${os.filter((o) => o.hitBlock !== "-").length} ` +
    `closest=[${os.map((o) => f2(o.closest)).join(",")}]`;
  for (const c of Object.values(COND)) for (const kind of KINDS) {
    const os = pick(c.label, kind);
    if (os.length > 0) log(`SUMMARY ${c.label} ${kind}: ${tally(os)}`);
  }
  for (const c of [COND.none, COND.offSneak])
    for (const offset of [0.4, 0.6, 0.8, 1.0])
      for (const kind of [ARROW, BOLT_ZERO, BOLT_BOUNCE]) log(`SUMMARY miss ${c.label} ${kind} off=${offset}: ${tally(pick(c.label, kind, offset))}`);

  // Instrument controls: the arrow must hurt an unshielded player and must not hurt a sneaking shield-holder.
  const arrowBare = pick(COND.none.label, ARROW);
  const arrowShield = pick(COND.offSneak.label, ARROW);
  const shieldUp = arrowShield.length === SHIELD_REPS && arrowShield.every((o) => o.hurt === 0);
  log(
    `CONTROL arrow unshielded hurt ${arrowBare.map((o) => f2(o.hurt)).join(",")}; arrow vs offhand+sneak hurt ` +
      `${arrowShield.map((o) => f2(o.hurt)).join(",")} -> the shield ${shieldUp ? "IS" : "IS NOT"} raised by isSneaking`
  );
  const bolt = pick(COND.offSneak.label, BOLT_ZERO);
  const boltBare = pick(COND.none.label, BOLT_ZERO);
  log(
    `RESULT bolt_zero vs raised shield: hitEntity on holder ${bolt.filter((o) => o.hitTarget > 0).length}/${bolt.length}, ` +
      `reversed ${bolt.filter((o) => o.reversedAt !== "never").length}/${bolt.length}; unshielded control hitEntity ` +
      `${boltBare.filter((o) => o.hitTarget > 0).length}/${boltBare.length}`
  );
  test.assert(arrowBare.length === 1 && arrowBare[0].hurt > 0, "control: an arrow did not hurt an unshielded player — the instrument cannot see damage");
  test.assert(boltBare.length === 1 && boltBare[0].hitTarget > 0, "control: bolt_zero raised no projectileHitEntity on an unshielded player");
  const unsneaked = outs.filter((o) => o.sneakRead !== Object.values(COND).find((c) => c.label === o.cond)?.sneak);
  test.assert(unsneaked.length === 0, `isSneaking did not read back as set in ${unsneaked.length} trials`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(6000)
  .tag("andrew");

// ------------------------------------------------ P2: does script damage land through a raised shield?

/** xasm23: the bolt's fixed damage. */
const D = 10;

interface DmgWatch {
  hurts: string[];
  died: string[];
}

let watch: DmgWatch | undefined;

const hpOf = (p: SimulatedPlayer): number => p.getComponent("minecraft:health")?.currentValue ?? -1;

/** The shipped Scythe pattern (src/scythe/volley.ts strike()), as L0-adr-scdm §3 adopts it. */
function adrStrike(target: Entity, owner: Entity): string {
  const health = target.getComponent("minecraft:health");
  const hp = health?.currentValue ?? 0;
  if (hp - D > 0) {
    const r = target.applyDamage(D, { cause: EntityDamageCause.entityAttack, damagingEntity: owner });
    health?.setCurrentValue(hp - D);
    return `nonlethal applyDamage=${r} hp ${hp}->${health?.currentValue}`;
  }
  const r = target.applyDamage(hp + 100, { cause: EntityDamageCause.entityAttack, damagingEntity: owner });
  return `lethal applyDamage(${hp + 100})=${r}`;
}

async function revive(test: Test, p: SimulatedPlayer, c: Condition): Promise<void> {
  if (hpOf(p) <= 0) {
    log(`respawn ${p.name}: ${p.respawn()}`);
    await test.idle(5);
  }
  equip(p, c);
  aim(test, p, c);
  await test.idle(SETTLE_TICKS);
}

async function dmgTrial(test: Test, target: SimulatedPlayer, c: Condition, label: string, startHp: number, act: () => string): Promise<string> {
  await revive(test, target, c);
  aim(test, target, c);
  const health = target.getComponent("minecraft:health");
  health?.resetToMaxValue();
  await test.idle(12);
  if (startHp < 20) health?.setCurrentValue(startHp);
  const before = hpOf(target);
  watch = { hurts: [], died: [] };
  let ret: string;
  try {
    ret = act();
  } catch (err) {
    ret = `threw ${err instanceof Error ? err.message : String(err)}`;
  }
  const same = hpOf(target);
  await test.idle(1);
  const next = hpOf(target);
  const w = watch;
  watch = undefined;
  const line =
    `${c.label} ${label}: hp ${before} -> ${same} (same tick) -> ${next} (+1) died=[${w.died.join(" ")}] ` +
    `hurt=[${w.hurts.join(" ")}] ret=${ret} sneak=${target.isSneaking}`;
  log(`DMG ${line}`);
  return line;
}

registerAsync("andrew", "probe_xcx23_damage", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const onHurt = world.afterEvents.entityHurt.subscribe((e) => {
    if (watch !== undefined && nameOf(e.hurtEntity) === "x23_target") watch.hurts.push(`${e.damageSource.cause}:${f2(e.damage)}`);
  });
  const onDie = world.afterEvents.entityDie.subscribe((e) => {
    if (watch !== undefined && nameOf(e.deadEntity) === "x23_target")
      watch.died.push(`${e.damageSource.cause} credited to ${nameOf(e.damageSource.damagingEntity)}`);
  });
  let armed: { projId: string; owner: Entity; note: string } | undefined;
  const onHit = world.afterEvents.projectileHitEntity.subscribe((e) => {
    if (armed === undefined || idOf(e.projectile) !== armed.projId) return;
    const hit = e.getEntityHit().entity;
    let valid = "?";
    try {
      valid = String(e.projectile.isValid);
    } catch {
      valid = "unreadable";
    }
    armed.note = `hit ${nameOf(hit)} projectile.isValid=${valid}; ` + (hit === undefined ? "no entity" : adrStrike(hit, armed.owner));
  });
  const target = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 6 }, "x23_target", GameMode.Survival);
  const shooter = test.spawnSimulatedPlayer(SHOOTER_BLOCK, "x23_shooter", GameMode.Survival);
  const lines: string[] = [];
  try {
    await test.idle(10);
    for (const c of [COND.none, COND.offSneak, COND.offBack]) {
      const run = async (label: string, startHp: number, act: () => string): Promise<void> => {
        lines.push(await dmgTrial(test, target, c, label, startHp, act));
      };
      await run("entityAttack+owner", 20, () => String(target.applyDamage(D, { cause: EntityDamageCause.entityAttack, damagingEntity: shooter })));
      await run("projectile+owner", 20, () => String(target.applyDamage(D, { cause: EntityDamageCause.projectile, damagingEntity: shooter })));
      await run("byProjectile(bolt)+owner", 20, () => {
        const bolt = dim.spawnEntity(BOLT_ZERO, test.worldLocation({ x: 3.5, y: AIM_Y, z: 4.5 }));
        const r = target.applyDamage(D, { damagingEntity: shooter, damagingProjectile: bolt });
        bolt.remove();
        return String(r);
      });
      await run("entityAttack-nosource", 20, () => String(target.applyDamage(D, { cause: EntityDamageCause.entityAttack })));
      await run("sonicBoom+owner", 20, () => String(target.applyDamage(D, { cause: EntityDamageCause.sonicBoom, damagingEntity: shooter })));
      await run("override+owner", 20, () => String(target.applyDamage(D, { cause: EntityDamageCause.override, damagingEntity: shooter })));
      await run("adr-nonlethal", 20, () => adrStrike(target, shooter));
      await run("adr-lethal(hp6)", 6, () => adrStrike(target, shooter));
      await run("sonicBoom-lethal(hp6)", 6, () => String(target.applyDamage(106, { cause: EntityDamageCause.sonicBoom, damagingEntity: shooter })));
      await run("override-lethal(hp6)", 6, () => String(target.applyDamage(106, { cause: EntityDamageCause.override, damagingEntity: shooter })));
      for (const startHp of [20, 6]) {
        await run(`in-hit-handler adr (hp${startHp})`, startHp, () => {
          const bolt = dim.spawnEntity(BOLT_ZERO, test.worldLocation({ x: 3.5, y: AIM_Y, z: SPAWN_Z }));
          armed = { projId: bolt.id, owner: shooter, note: "no hit yet" };
          const comp = bolt.getComponent("minecraft:projectile");
          if (comp === undefined) return "no projectile component";
          comp.owner = shooter;
          comp.shoot({ x: 0, y: 0, z: SPEED }, { uncertainty: 0 });
          return "shot";
        });
        // dmgTrial reads hp one tick after the shot; the bolt lands on +2, so wait and report again.
        await test.idle(4);
        const line = `${c.label} in-hit-handler adr (hp${startHp}) after landing: ${armed?.note ?? "-"}; hp now ${hpOf(target)}`;
        log(`DMG ${line}`);
        lines.push(line);
        armed = undefined;
      }
      // C-28 asks that a totem still saves: a totem in the main hand, the shield (if any) in the off hand.
      for (const cause of [EntityDamageCause.entityAttack, EntityDamageCause.sonicBoom, EntityDamageCause.override]) {
        await run(`totem ${cause}-lethal(hp6)`, 6, () => {
          const eq = target.getComponent("minecraft:equippable");
          const put = eq?.setEquipment(EquipmentSlot.Mainhand, new ItemStack("minecraft:totem_of_undying"));
          const r = target.applyDamage(106, { cause, damagingEntity: shooter });
          return `setTotem=${put} applyDamage=${r} mainhand after=${eq?.getEquipment(EquipmentSlot.Mainhand)?.typeId ?? "empty"}`;
        });
        target.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Mainhand, undefined);
      }
    }
  } finally {
    world.afterEvents.entityHurt.unsubscribe(onHurt);
    world.afterEvents.entityDie.unsubscribe(onDie);
    world.afterEvents.projectileHitEntity.unsubscribe(onHit);
    watch = undefined;
    if (target.isValid) test.removeSimulatedPlayer(target);
    if (shooter.isValid) test.removeSimulatedPlayer(shooter);
  }
  const control = lines.find((l) => l.startsWith("none entityAttack+owner"));
  test.assert(control !== undefined && control.includes("entityAttack:10.00"), `control: entityAttack did not hurt an unshielded player (${control ?? "unmeasured"})`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(6000)
  .tag("andrew");

// ------------------------------------------------ P3: the shipped Scythe strike against a raised shield

registerAsync("andrew", "probe_xcx23_scythe", async (test: Test): Promise<void> => {
  const dying: string[] = [];
  const hurts: string[] = [];
  const onDie = world.afterEvents.entityDie.subscribe((e) => {
    if (nameOf(e.deadEntity) === "x23_target") dying.push(`${system.currentTick} ${e.damageSource.cause}`);
  });
  const onHurt = world.afterEvents.entityHurt.subscribe((e) => {
    if (nameOf(e.hurtEntity) === "x23_target") hurts.push(`${system.currentTick} ${e.damageSource.cause}:${f2(e.damage)}`);
  });
  const target = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 6 }, "x23_target", GameMode.Survival);
  const owner = test.spawnSimulatedPlayer(SHOOTER_BLOCK, "x23_shooter", GameMode.Survival);
  const verdicts: string[] = [];
  try {
    await test.idle(10);
    for (const c of [COND.none, COND.offSneak]) {
      await revive(test, target, c);
      target.lookAtEntity(owner, LookDuration.Continuous);
      await test.idle(SETTLE_TICKS);
      dying.length = 0;
      hurts.length = 0;
      const hpAfter: number[] = [];
      let end = "";
      target.getComponent("minecraft:health")?.setCurrentValue(3);
      const t0 = system.currentTick;
      const launched = launchVolley(owner, target, {
        onHit: (_n, hp) => hpAfter.push(hp),
        onEnd: (reason, hits) => {
          end = `${reason} hits=${hits}`;
        },
      });
      for (let t = 0; t < 120 && end === ""; t++) await test.idle(1);
      const line =
        `${c.label}: launched=${launched} start hp 3, hp after each hit [${hpAfter.join(",")}], end ${end || "none in 120 ticks"}, ` +
        `died [${dying.map((d) => `+${Number(d.split(" ")[0]) - t0} ${d.split(" ")[1]}`).join(" ")}], ` +
        `hurt [${hurts.map((h) => `+${Number(h.split(" ")[0]) - t0} ${h.split(" ")[1]}`).join(" ")}], sneak=${target.isSneaking}`;
      log(`SCYTHE ${line}`);
      verdicts.push(line);
      await test.idle(20);
    }
  } finally {
    world.afterEvents.entityDie.unsubscribe(onDie);
    world.afterEvents.entityHurt.unsubscribe(onHurt);
    if (target.isValid) test.removeSimulatedPlayer(target);
    if (owner.isValid) test.removeSimulatedPlayer(owner);
  }
  test.assert(verdicts[0]?.includes("hp after each hit [0") === true, `control: the Scythe's first hit did not kill an unshielded player at 3 HP (${verdicts[0] ?? "unmeasured"})`);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");
