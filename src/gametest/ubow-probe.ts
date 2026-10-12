// L0-uwbw-pprb rows 1–8 on BDS 1.26.51.1: the engine facts L0-uwbw-adfl and L0-uwbw-adex rest on, measured before
// any Underwater Bow code exists. A scenario passes when its measurement completed and its controls behaved; the
// answers are the "[probe] UBOW Rn RESULT …" lines, recorded in docs/feedback/probe-ubow.md. The probe shooter, the
// token, the swap arrow and the two probe recipes live in packs/gametest and never ship.

import {
  BlockPermutation,
  BlockVolume,
  type Container,
  type Dimension,
  Direction,
  EnchantmentType,
  type Entity,
  EntityDamageCause,
  type EntityHurtBeforeEvent,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { LEGENDARIES, type LegendaryDef, type PassiveLegendaryDef, keysFor } from "../legendary/registry";
import { applyScriptedDamage, isScriptedDamage } from "../legendary/scripted-damage";
import * as state from "../legendary/state";
import { defenceOf } from "../storm/damage";
import { afterArmour } from "../storm/damage-rules";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const ARROW = "minecraft:arrow";
/** The 1.26.50 vanilla arrow's base projectile block with liquid_inertia 0.99 and without its lava hurt_on_condition (ADR-ubfl §2 swap). */
const SWAP_ARROW = "andrew:probe_ubow_arrow";
/** Bow-like custom shooter: no charge_on_draw, max_draw_duration 1 s, scale_power_by_draw_duration, slot bow. */
const SHOOTER = "andrew:probe_ubow_shooter";
const TOKEN = "andrew:probe_ubow_token";
const BOW = "minecraft:bow";
const AIR = "minecraft:air";
const GLASS = "minecraft:glass";
const WATER = "minecraft:water";
const LAVA = "minecraft:lava";
const ROCKET = "minecraft:firework_rocket";
const ROCKET_ENTITY = "minecraft:fireworks_rocket";
const BUCKET = "minecraft:bucket";
const WATER_BUCKET = "minecraft:water_bucket";
const TAG = "andrew_ubow_probe";
const PROP = "ub:armedShot";
const SLOT = 0;
const AMMO_SLOT = 9;

const log = (msg: string): void => console.warn(`[probe] UBOW ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(2));
const f3 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(3));
const v2 = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const hlen = (v: Vector3): number => Math.hypot(v.x, v.z);
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const short = (id: string): string => id.replace("minecraft:", "").replace("andrew:probe_ubow_", "probe_");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const range = (xs: number[]): string => (xs.length === 0 ? "-" : Math.min(...xs) === Math.max(...xs) ? f2(xs[0]) : `${f2(Math.min(...xs))}–${f2(Math.max(...xs))}`);

function typeOf(e: Entity | undefined): string {
  if (e === undefined) return "none";
  try {
    return short(e.typeId);
  } catch {
    return "gone";
  }
}

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function fireTicks(e: Entity): number {
  try {
    return e.getComponent("minecraft:onfire")?.onFireTicksRemaining ?? 0;
  } catch {
    return Number.NaN;
  }
}

function inventoryOf(p: Player): Container {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${p.name} has no inventory`);
  return c;
}

function countIn(c: Container, typeId: string): number {
  let n = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s?.typeId === typeId) n += s.amount;
  }
  return n;
}

function clearInventory(p: Player): void {
  const c = inventoryOf(p);
  for (let i = 0; i < c.size; i++) c.setItem(i, undefined);
}

function enchanted(id: string, enchants: ReadonlyArray<readonly [string, number]>): { stack: ItemStack; note: string } {
  const stack = new ItemStack(id);
  const ench = stack.getComponent("minecraft:enchantable");
  const notes: string[] = [];
  for (const [type, level] of enchants) {
    const e = { type: new EnchantmentType(type), level };
    if (ench === undefined) {
      notes.push(`${type}: no enchantable`);
      continue;
    }
    try {
      ench.addEnchantment(e);
      notes.push(`${type} ${ench.getEnchantment(type)?.level ?? "?"}`);
    } catch (err) {
      notes.push(`${type} ${level} threw ${errText(err)}`);
    }
  }
  return { stack, note: notes.join("+") || "plain" };
}

/** A Survival SimulatedPlayer; `boost` gives 40 HP, `immune` Resistance V. */
async function survivor(test: Test, rel: Vector3, name: string, opts: { boost?: boolean; immune?: boolean } = {}): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  if (opts.boost === true) p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  if (opts.immune === true) p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return p;
}

/** A use right after another use can be refused for one tick; retry a few. */
async function startUse(test: Test, p: SimulatedPlayer, slot = SLOT): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (p.useItemInSlot(slot)) return true;
    await test.idle(1);
  }
  return false;
}

function fill(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(a, b), block);
}

interface BeforeRead {
  tick: number;
  who: string;
  cause: string;
  damage: number;
  hpInside: number;
  attacker: string;
  projectile: string;
  tag: string;
  prop: string;
  scripted: boolean;
  set?: number;
}

interface AfterRead {
  tick: number;
  who: string;
  cause: string;
  damage: number;
  hpAfter: number;
  attacker: string;
  projectile: string;
}

type Rewrite = (e: EntityHurtBeforeEvent, who: string) => number | undefined;

/** Both hurt events for the named entities; `rewrite` may set the before-event damage. */
function hurtLog(names: Map<string, string>, rewrite: () => Rewrite | undefined = () => undefined) {
  const before: BeforeRead[] = [];
  const after: AfterRead[] = [];
  const nameOf = (e: Entity | undefined): string => (e === undefined ? "none" : (names.get(e.id) ?? typeOf(e)));
  const b = world.beforeEvents.entityHurt.subscribe((e) => {
    const who = names.get(e.hurtEntity.id);
    if (who === undefined) return;
    const s = e.damageSource;
    const p = s.damagingProjectile;
    let tag = "-";
    let prop = "-";
    if (p !== undefined) {
      try {
        tag = String(p.hasTag(TAG));
        prop = String(p.getDynamicProperty(PROP));
      } catch (err) {
        tag = `threw ${errText(err)}`;
      }
    }
    const r: BeforeRead = {
      tick: system.currentTick,
      who,
      cause: s.cause,
      damage: e.damage,
      hpInside: hp(e.hurtEntity),
      attacker: nameOf(s.damagingEntity),
      projectile: typeOf(p),
      tag,
      prop,
      scripted: isScriptedDamage(),
    };
    const want = rewrite()?.(e, who);
    if (want !== undefined) {
      e.damage = want;
      r.set = want;
    }
    before.push(r);
  });
  const a = world.afterEvents.entityHurt.subscribe((e) => {
    const who = names.get(e.hurtEntity.id);
    if (who === undefined) return;
    const s = e.damageSource;
    after.push({ tick: system.currentTick, who, cause: s.cause, damage: e.damage, hpAfter: hp(e.hurtEntity), attacker: nameOf(s.damagingEntity), projectile: typeOf(s.damagingProjectile) });
  });
  return {
    before,
    after,
    stop: (): void => {
      world.beforeEvents.entityHurt.unsubscribe(b);
      world.afterEvents.entityHurt.unsubscribe(a);
    },
  };
}

const showBefore = (r: BeforeRead): string =>
  `${r.cause} read ${f2(r.damage)}${r.set === undefined ? "" : ` set ${f2(r.set)}`} hp-inside ${f2(r.hpInside)} by ${r.attacker} proj ${r.projectile} tag=${r.tag} prop=${r.prop}${r.scripted ? " scripted" : ""}`;
const showAfter = (r: AfterRead): string => `${r.cause} ${f2(r.damage)} hp→${f2(r.hpAfter)} by ${r.attacker} proj ${r.projectile}`;

function heldBy(owner: Entity | undefined): string {
  if (owner === undefined) return "-";
  try {
    return short(owner.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId ?? "empty");
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

function projFields(e: Entity): string {
  try {
    const p = e.getComponent("minecraft:projectile");
    if (p === undefined) return "no projectile component";
    return `gravity ${f3(p.gravity)} air ${f3(p.airInertia)} liquid ${f3(p.liquidInertia)}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

// ------------------------------------------------ R1 + R3: the shot, the tag, the swap, and vanilla damage with enchantments

interface ShotPlan {
  label: string;
  item: string;
  ench: ReadonlyArray<readonly [string, number]>;
  draw: number;
  tag: boolean;
  swap?: string;
}

interface ArrowRec {
  e: Entity;
  id: string;
  type: string;
  dt: number;
  owner: string;
  held: string;
  v0: number;
  comp: string;
  fire: number;
  swappedFrom?: string;
}

interface Shot {
  plan: ShotPlan;
  note: string;
  release: number;
  started: boolean;
  arrows: ArrowRec[];
  swapErrors: string[];
  hits: string[];
  ammo0: number;
  ammo1: number;
  knock: number;
  fire: number;
}

const SHOOTER_AT: Vector3 = { x: 3.5, y: 2, z: 0.5 };
const TARGET_AT: Vector3 = { x: 3.5, y: 2, z: 4.5 };
/** Test-relative, mid-body of the target: lookAtLocation takes a relative point. */
const AIM: Vector3 = { x: 3.5, y: 3.0, z: 4.5 };
const FULL = 25;

const plan = (label: string, item: string, ench: ReadonlyArray<readonly [string, number]>, draw: number, tag: boolean, swap?: string): ShotPlan => ({ label, item, ench, draw, tag, swap });

const repeat = (n: number, label: string, item: string, ench: ReadonlyArray<readonly [string, number]>, tag: boolean, swap?: string): ShotPlan[] =>
  Array.from({ length: n }, (_, i) => plan(`${label} #${i + 1}`, item, ench, FULL, tag, swap));

const SHOTS: ShotPlan[] = [
  ...repeat(6, "bow plain full", BOW, [], false),
  ...repeat(6, "bow plain full tagged", BOW, [], true),
  plan("bow draw 6 tagged", BOW, [], 6, true),
  plan("bow draw 12 tagged", BOW, [], 12, true),
  ...repeat(6, "shooter plain full tagged", SHOOTER, [], true),
  plan("shooter draw 6 tagged", SHOOTER, [], 6, true),
  plan("shooter draw 12 tagged", SHOOTER, [], 12, true),
  ...[1, 2, 3, 4, 5].flatMap((n) => repeat(3, `bow power ${n} tagged`, BOW, [["power", n]], true)),
  ...repeat(3, "shooter power 5 tagged", SHOOTER, [["power", 5]], true),
  plan("bow punch 2 tagged", BOW, [["punch", 2]], FULL, true),
  plan("shooter punch 2 tagged", SHOOTER, [["punch", 2]], FULL, true),
  plan("bow flame tagged", BOW, [["flame", 1]], FULL, true),
  plan("shooter flame tagged", SHOOTER, [["flame", 1]], FULL, true),
  plan("bow infinity tagged", BOW, [["infinity", 1]], FULL, true),
  plan("shooter infinity tagged", SHOOTER, [["infinity", 1]], FULL, true),
  ...repeat(2, "bow swap->vanilla arrow", BOW, [], true, ARROW),
  ...repeat(3, "bow swap->probe_arrow", BOW, [], true, SWAP_ARROW),
  plan("bow power 5 swap->probe_arrow", BOW, [["power", 5]], FULL, true, SWAP_ARROW),
  plan("bow flame swap->probe_arrow", BOW, [["flame", 1]], FULL, true, SWAP_ARROW),
];

registerAsync("andrew", "probe_ubow_bow", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = await survivor(test, { x: 3, y: 2, z: 0 }, "ubow_shooter", { immune: true });
  const target = await survivor(test, { x: 3, y: 2, z: 4 }, "ubow_target", { boost: true });
  const names = new Map([
    [shooter.id, "shooter"],
    [target.id, "target"],
  ]);
  const hurts = hurtLog(names);
  let cur: Shot | undefined;
  const ours = new Set<string>();
  const record = (shot: Shot, e: Entity, from?: string): ArrowRec => {
    const proj = e.getComponent("minecraft:projectile");
    const owner = proj?.owner;
    const rec: ArrowRec = {
      e,
      id: e.id,
      type: short(e.typeId),
      dt: system.currentTick - shot.release,
      owner: owner === undefined ? "undefined" : owner.id === shooter.id ? "shooter" : typeOf(owner),
      held: heldBy(owner),
      v0: len(e.getVelocity()),
      comp: projFields(e),
      fire: fireTicks(e),
      swappedFrom: from,
    };
    shot.arrows.push(rec);
    return rec;
  };
  const spawnSub = world.afterEvents.entitySpawn.subscribe((ev) => {
    const shot = cur;
    const a = ev.entity;
    if (shot === undefined || !a.isValid || (a.typeId !== ARROW && a.typeId !== SWAP_ARROW) || ours.has(a.id)) return;
    const rec = record(shot, a);
    if (shot.plan.tag) {
      a.addTag(TAG);
      a.setDynamicProperty(PROP, true);
    }
    if (shot.plan.swap === undefined) return;
    try {
      const at = { ...a.location };
      const vel = a.getVelocity();
      const owner = a.getComponent("minecraft:projectile")?.owner;
      a.remove();
      const b = dim.spawnEntity(shot.plan.swap, at);
      ours.add(b.id);
      const bp = b.getComponent("minecraft:projectile");
      if (bp === undefined) throw new Error(`${shot.plan.swap} has no projectile component`);
      if (owner !== undefined) bp.owner = owner;
      if (shot.plan.tag) {
        b.addTag(TAG);
        b.setDynamicProperty(PROP, true);
      }
      bp.shoot(vel, { uncertainty: 0 });
      record(shot, b, rec.id);
    } catch (err) {
      shot.swapErrors.push(errText(err));
    }
  });
  const hitSub = world.afterEvents.projectileHitEntity.subscribe((ev) => {
    const shot = cur;
    if (shot === undefined) return;
    let tag = "-";
    let prop = "-";
    try {
      tag = String(ev.projectile.hasTag(TAG));
      prop = String(ev.projectile.getDynamicProperty(PROP));
    } catch (err) {
      tag = `threw ${errText(err)}`;
    }
    let id = "-";
    try {
      const pid = ev.projectile.id;
      id = shot.arrows.some((a) => a.id === pid) ? "matches the spawned arrow" : `unknown ${pid}`;
    } catch (err) {
      id = `threw ${errText(err)}`;
    }
    const hit = ev.getEntityHit().entity;
    shot.hits.push(`${typeOf(ev.projectile)}→${hit === undefined ? "none" : (names.get(hit.id) ?? typeOf(hit))}@+${system.currentTick - shot.release} id ${id} tag=${tag.startsWith("threw") ? "unreadable (removed)" : tag} prop=${prop}`);
  });

  const runShot = async (p: ShotPlan): Promise<Shot> => {
    target.teleport(test.worldLocation(TARGET_AT), { rotation: { x: 0, y: 180 } });
    target.extinguishFire(false);
    target.getComponent("minecraft:health")?.resetToMaxValue();
    shooter.teleport(test.worldLocation(SHOOTER_AT), { rotation: { x: 0, y: 0 } });
    const { stack, note } = enchanted(p.item, p.ench);
    shooter.setItem(stack, SLOT, true);
    const ammo = new ItemStack(ARROW, 64);
    inventoryOf(shooter).setItem(AMMO_SLOT, ammo);
    await test.idle(2);
    shooter.lookAtLocation(AIM, LookDuration.Continuous);
    await test.idle(4);
    const shot: Shot = { plan: p, note, release: system.currentTick, started: false, arrows: [], swapErrors: [], hits: [], ammo0: countIn(inventoryOf(shooter), ARROW), ammo1: 0, knock: 0, fire: 0 };
    const p0 = { ...target.location };
    cur = shot;
    shot.started = await startUse(test, shooter);
    await test.idle(p.draw);
    shot.release = system.currentTick;
    shooter.stopUsingItem();
    for (let i = 0; i < 16; i++) {
      await test.idle(1);
      shot.knock = Math.max(shot.knock, hlen(sub(target.location, p0)));
      shot.fire = Math.max(shot.fire, fireTicks(target));
    }
    cur = undefined;
    shot.ammo1 = countIn(inventoryOf(shooter), ARROW);
    const mineB = hurts.before.filter((r) => r.who === "target" && r.tick >= shot.release);
    const mineA = hurts.after.filter((r) => r.who === "target" && r.tick >= shot.release);
    const arrows = shot.arrows
      .map((a) => `${a.type}${a.swappedFrom === undefined ? "" : "(swap)"}[spawn@release+${a.dt} owner=${a.owner} holding ${a.held} |v0|=${f2(a.v0)} fire=${a.fire} ${a.comp}]`)
      .join(" ");
    log(
      `R3 RESULT ${p.label} (${note}, draw ${p.draw}): started=${shot.started}; arrows ${shot.arrows.length}: ${arrows}; swap errors [${shot.swapErrors.join(" | ")}]; ` +
        `before [${mineB.map(showBefore).join("; ")}]; after [${mineA.map(showAfter).join("; ")}]; hit events [${shot.hits.join("; ")}]; ` +
        `knockback ${f2(shot.knock)} blocks; target fire max ${shot.fire}; ammo ${shot.ammo0}->${shot.ammo1}`
    );
    for (const e of dim.getEntities({ location: test.worldLocation({ x: 3, y: 3, z: 6 }), maxDistance: 30 })) {
      if ((e.typeId === ARROW || e.typeId === SWAP_ARROW) && e.isValid) e.remove();
    }
    await test.idle(20);
    return shot;
  };

  const results = new Map<string, Shot>();
  const wall: [Vector3, Vector3] = [test.worldBlockLocation({ x: 2, y: 2, z: 6 }), test.worldBlockLocation({ x: 4, y: 5, z: 6 })];
  try {
    await test.idle(5);
    for (const p of SHOTS) results.set(p.label, await runShot(p));

    // Infinity pickup: shoot into a wall, then stand on the stuck arrow.
    target.teleport(test.worldLocation({ x: 6.5, y: 2, z: 0.5 }));
    fill(dim, wall[0], wall[1], "minecraft:stone");
    for (const p of [plan("pickup bow plain", BOW, [], FULL, false), plan("pickup bow infinity", BOW, [["infinity", 1]], FULL, false), plan("pickup shooter infinity", SHOOTER, [["infinity", 1]], FULL, false)]) {
      shooter.teleport(test.worldLocation(SHOOTER_AT), { rotation: { x: 0, y: 0 } });
      shooter.setItem(enchanted(p.item, p.ench).stack, SLOT, true);
      inventoryOf(shooter).setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
      await test.idle(2);
      shooter.lookAtLocation({ x: 3.5, y: 3.5, z: 6 }, LookDuration.Continuous);
      await test.idle(4);
      const shot: Shot = { plan: p, note: "", release: system.currentTick, started: false, arrows: [], swapErrors: [], hits: [], ammo0: countIn(inventoryOf(shooter), ARROW), ammo1: 0, knock: 0, fire: 0 };
      cur = shot;
      shot.started = await startUse(test, shooter);
      await test.idle(FULL);
      shot.release = system.currentTick;
      shooter.stopUsingItem();
      await test.idle(15);
      cur = undefined;
      const afterShot = countIn(inventoryOf(shooter), ARROW);
      const a = shot.arrows[0];
      const stuck = a !== undefined && a.e.isValid ? { ...a.e.location } : undefined;
      if (stuck !== undefined) shooter.teleport({ x: stuck.x, y: test.worldLocation({ x: 0, y: 2, z: 0 }).y, z: stuck.z - 0.6 });
      await test.idle(30);
      const afterWalk = countIn(inventoryOf(shooter), ARROW);
      log(
        `R3 RESULT ${p.label}: arrows ${shot.arrows.length}, stuck at ${stuck === undefined ? "none" : v2(sub(stuck, test.worldLocation({ x: 0, y: 0, z: 0 })))}; ` +
          `ammo ${shot.ammo0} -> ${afterShot} after the shot -> ${afterWalk} after standing on it 30 ticks; arrow entity ${a === undefined ? "-" : a.e.isValid ? "still there" : "gone"}`
      );
      for (const e of dim.getEntities({ type: ARROW, location: test.worldLocation({ x: 3, y: 3, z: 6 }), maxDistance: 30 })) e.remove();
    }

    const sumBefore = (label: string): number => hurts.before.filter((r) => r.who === "target" && r.tick >= (results.get(label)?.release ?? 1e9) && r.tick <= (results.get(label)?.release ?? 0) + 16).reduce((n, r) => n + r.damage, 0);
    const hitDamage = (labels: string[]): string => {
      const xs = labels.map(sumBefore);
      return `${range(xs)} (n ${xs.length}, mean ${f2(xs.reduce((a, b) => a + b, 0) / xs.length)})`;
    };
    const many = (label: string, n: number): string[] => Array.from({ length: n }, (_, i) => `${label} #${i + 1}`);
    log(
      `R3 RESULT summary (before-event damage at full draw unless named): bow plain ${hitDamage(many("bow plain full", 6))}; ` +
        `bow tagged ${hitDamage(many("bow plain full tagged", 6))}; bow draw 6 ${hitDamage(["bow draw 6 tagged"])}, 12 ${hitDamage(["bow draw 12 tagged"])}; ` +
        `shooter tagged ${hitDamage(many("shooter plain full tagged", 6))}; shooter draw 6 ${hitDamage(["shooter draw 6 tagged"])}, 12 ${hitDamage(["shooter draw 12 tagged"])}; ` +
        [1, 2, 3, 4, 5].map((n) => `bow power ${n} ${hitDamage(many(`bow power ${n} tagged`, 3))}`).join("; ") +
        `; shooter power 5 ${hitDamage(many("shooter power 5 tagged", 3))}; ` +
        `swap->vanilla arrow ${hitDamage(many("bow swap->vanilla arrow", 2))}; swap->probe_arrow ${hitDamage(many("bow swap->probe_arrow", 3))}; ` +
        `swap->probe_arrow from power 5 ${hitDamage(["bow power 5 swap->probe_arrow"])}, from flame ${hitDamage(["bow flame swap->probe_arrow"])}`
    );
    const control = results.get("bow plain full #1");
    test.assert(control !== undefined && control.arrows.length === 1, `control: the plain bow shot spawned ${control?.arrows.length ?? 0} arrows`);
    test.assert(hurts.before.some((r) => r.who === "target" && r.projectile === "arrow"), "control: no vanilla bow arrow ever hurt the target");
  } finally {
    cur = undefined;
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    world.afterEvents.projectileHitEntity.unsubscribe(hitSub);
    hurts.stop();
    fill(dim, wall[0], wall[1], AIR);
    for (const e of dim.getEntities({ type: ARROW, location: test.worldLocation({ x: 3, y: 3, z: 6 }), maxDistance: 40 })) e.remove();
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(6000)
  .tag("andrew");

// ------------------------------------------------ R2: speed and path in air, water and lava; what each fix changes

type Fix = "none" | "liquidInertia" | "swap" | "impulse" | "reshoot";

const LANES: ReadonlyArray<{ x: number; fix: Fix; type: string }> = [
  { x: 0, fix: "none", type: ARROW },
  { x: 2, fix: "liquidInertia", type: ARROW },
  { x: 4, fix: "swap", type: SWAP_ARROW },
  { x: 6, fix: "impulse", type: ARROW },
  { x: 8, fix: "reshoot", type: ARROW },
];
const BOX_LO: Vector3 = { x: -1, y: 2, z: -1 };
const BOX_HI: Vector3 = { x: 9, y: 7, z: 28 };
const LANE_Z1 = 27;
const SPEED = 3.0;
const AIR_DRAG = 0.99;
const GRAVITY = 0.05;

interface Flight {
  fix: Fix;
  e: Entity;
  id: string;
  at0: Vector3;
  born: number;
  path: Map<number, Vector3>;
  vel: Map<number, Vector3>;
  model: Vector3;
  restores: number;
  restoreErrors: string[];
  stuckAt?: number;
  goneAt?: number;
  liquidRead: string;
}

const WATERS = new Set(["minecraft:water", "minecraft:flowing_water"]);

/** Lava leaves an arrow's path alone (R2), so the restore acts in water only. */
function waterAt(dim: Dimension, at: Vector3): boolean {
  try {
    const t = dim.getBlock(at)?.typeId;
    return t !== undefined && WATERS.has(t);
  } catch {
    return false;
  }
}

const stepAir = (v: Vector3): Vector3 => ({ x: v.x * AIR_DRAG, y: v.y * AIR_DRAG - GRAVITY, z: v.z * AIR_DRAG });

registerAsync("andrew", "probe_ubow_media", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const flights: Flight[] = [];
  const interval = system.runInterval(() => {
    for (const f of flights) {
      const dt = system.currentTick - f.born;
      if (!f.e.isValid) {
        if (f.goneAt === undefined) f.goneAt = dt;
        continue;
      }
      const v = f.e.getVelocity();
      f.path.set(dt, { ...f.e.location });
      f.vel.set(dt, v);
      if (f.fix !== "impulse" && f.fix !== "reshoot") continue;
      if (f.stuckAt !== undefined || dt === 0) continue;
      if (!waterAt(dim, f.e.location)) {
        f.model = v;
        continue;
      }
      f.model = stepAir(f.model);
      try {
        if (f.fix === "impulse") {
          f.e.clearVelocity();
          f.e.applyImpulse(f.model);
        } else {
          f.e.getComponent("minecraft:projectile")?.shoot(f.model, { uncertainty: 0 });
        }
        f.restores++;
      } catch (err) {
        if (f.restoreErrors.length < 2) f.restoreErrors.push(errText(err));
      }
    }
  }, 1);
  const hitSub = world.afterEvents.projectileHitBlock.subscribe((ev) => {
    const f = flights.find((x) => x.id === ev.projectile.id);
    if (f !== undefined && f.stuckAt === undefined) f.stuckAt = system.currentTick - f.born;
  });
  // The tagged-arrow fixes (B family) also cancel the arrow's own lava hurt; "none" and "swap" are left alone.
  const arrowHurts = new Map<Fix, Map<string, number>>();
  const hurtSub = world.beforeEvents.entityHurt.subscribe((ev) => {
    const f = flights.find((x) => x.id === ev.hurtEntity.id);
    if (f === undefined) return;
    const cancel = f.fix === "liquidInertia" || f.fix === "impulse" || f.fix === "reshoot";
    const m = arrowHurts.get(f.fix) ?? new Map<string, number>();
    const k = `${ev.damageSource.cause} ${f2(ev.damage)}${cancel ? " cancelled" : ""}`;
    m.set(k, (m.get(k) ?? 0) + 1);
    arrowHurts.set(f.fix, m);
    if (cancel) ev.cancel = true;
  });
  const hurtText = (fix: Fix): string => [...(arrowHurts.get(fix) ?? new Map<string, number>())].map(([k, n]) => `${k}×${n}`).join(", ") || "none";

  const build = (medium: string, open: boolean): void => {
    fill(dim, add(origin, BOX_LO), add(origin, BOX_HI), GLASS);
    for (const lane of LANES) {
      fill(dim, add(origin, { x: lane.x, y: 3, z: 0 }), add(origin, { x: lane.x, y: open ? 7 : 6, z: LANE_Z1 }), AIR);
      if (medium !== AIR) fill(dim, add(origin, { x: lane.x, y: 3, z: 0 }), add(origin, { x: lane.x, y: 6, z: LANE_Z1 }), medium);
    }
  };

  const launch = (start: Vector3, v: Vector3): Flight[] =>
    LANES.map((lane) => {
      const e = dim.spawnEntity(lane.type, add(origin, { x: lane.x + 0.5, y: start.y, z: start.z }));
      const proj = e.getComponent("minecraft:projectile");
      let liquidRead = `default ${proj?.liquidInertia ?? "-"}`;
      if (lane.fix === "liquidInertia" && proj !== undefined) {
        try {
          proj.liquidInertia = 0.99;
          liquidRead = `${liquidRead}, after write ${proj.liquidInertia}`;
        } catch (err) {
          liquidRead = `${liquidRead}, write threw ${errText(err)}`;
        }
      }
      proj?.shoot(v, { uncertainty: 0 });
      const f: Flight = { fix: lane.fix, e, id: e.id, at0: add(origin, { x: lane.x + 0.5, y: start.y, z: start.z }), born: system.currentTick, path: new Map(), vel: new Map(), model: v, restores: 0, restoreErrors: [], liquidRead };
      flights.push(f);
      return f;
    });

  const runs = new Map<string, Map<Fix, Flight>>();
  const describe = (f: Flight, air: Flight | undefined): string => {
    const z = (dt: number): number | undefined => {
      const p = f.path.get(dt);
      return p === undefined ? undefined : p.z - f.at0.z;
    };
    const zs: string[] = [];
    for (let dt = 1; dt <= 10; dt++) zs.push(f2(z(dt)));
    let t16: number | undefined;
    let y16: number | undefined;
    for (let dt = 1; dt <= 40; dt++) {
      const p = f.path.get(dt);
      if (p !== undefined && p.z - f.at0.z >= 16) {
        t16 = dt;
        y16 = p.y - f.at0.y;
        break;
      }
    }
    const speeds: string[] = [];
    for (let dt = 1; dt <= 6; dt++) {
      const v = f.vel.get(dt);
      speeds.push(v === undefined ? "-" : f2(len(v)));
    }
    let vsAir = "";
    if (air !== undefined && air !== f) {
      const d: string[] = [];
      for (const dt of [2, 4, 6, 8]) {
        const a = air.path.get(dt);
        const b = f.path.get(dt);
        d.push(a !== undefined && b !== undefined ? `${f2(b.z - f.at0.z - (a.z - air.at0.z))}/${f2(b.y - f.at0.y - (a.y - air.at0.y))}` : "-");
      }
      const za = air.path.get(5);
      const zb = f.path.get(5);
      const ratio = za !== undefined && zb !== undefined ? (zb.z - f.at0.z) / (za.z - air.at0.z) : Number.NaN;
      vsAir = `; vs air Δz/Δy at +2/+4/+6/+8 ${d.join(" ")}; z-run ratio at +5 ${f2(ratio)}`;
    }
    return (
      `${f.fix}: z-run +1..+10 [${zs.join(" ")}]; speed +1..+6 [${speeds.join(" ")}]; 16 blocks at +${t16 ?? "never"} drop ${f2(y16)}; ` +
      `stuck@+${f.stuckAt ?? "-"}${f.goneAt === undefined ? "" : ` gone@+${f.goneAt}`}; restores ${f.restores}${f.restoreErrors.length > 0 ? ` errors [${f.restoreErrors.join(" | ")}]` : ""}; liquidInertia ${f.liquidRead}${vsAir}`
    );
  };

  try {
    for (const [geometry, open, start, v] of [
      ["inside", false, { x: 0, y: 5.5, z: 0.5 }, { x: 0, y: 0, z: SPEED }],
      ["entry", true, { x: 0, y: 8.0, z: 0.5 }, { x: 0, y: -0.25, z: SPEED }],
    ] as Array<[string, boolean, Vector3, Vector3]>) {
      for (const medium of [AIR, WATER, LAVA]) {
        build(medium, open);
        await test.idle(3);
        const fs = launch(start, v);
        await test.idle(30);
        const byFix = new Map(fs.map((f) => [f.fix, f]));
        runs.set(`${geometry}/${short(medium)}`, byFix);
        const airRun = runs.get(`${geometry}/air`);
        for (const f of fs) log(`R2 RESULT ${geometry} ${short(medium)} ${describe(f, airRun?.get(f.fix))}; arrow hurts [${hurtText(f.fix)}]`);
        arrowHurts.clear();
        if (medium === LAVA) {
          const watch = new Map(fs.map((f) => [f.fix, f.e.isValid ? "alive" : `gone@+${f.goneAt ?? "?"}`]));
          await test.idle(100);
          log(
            `R2 RESULT ${geometry} lava survival 100 ticks after landing: ${fs
              .map((f) => `${f.fix} ${watch.get(f.fix)} -> ${f.e.isValid ? `alive at ${v2(sub(f.e.location, origin))} fire ${fireTicks(f.e)}` : `gone@+${f.goneAt ?? "?"}`} hurts [${hurtText(f.fix)}]`)
              .join("; ")}`
          );
        }
        arrowHurts.clear();
        for (const f of fs) if (f.e.isValid) f.e.remove();
        flights.length = 0;
      }
    }

    // An arrow dropped into still lava with no speed, and one into water: does lava destroy it.
    build(AIR, false);
    fill(dim, add(origin, { x: 0, y: 3, z: 2 }), add(origin, { x: 0, y: 6, z: 4 }), LAVA);
    fill(dim, add(origin, { x: 2, y: 3, z: 2 }), add(origin, { x: 2, y: 6, z: 4 }), WATER);
    await test.idle(3);
    const sit = [
      { name: "vanilla in lava", e: dim.spawnEntity(ARROW, add(origin, { x: 0.5, y: 5.0, z: 3.5 })) },
      { name: "probe_arrow in lava", e: dim.spawnEntity(SWAP_ARROW, add(origin, { x: 0.5, y: 5.5, z: 2.5 })) },
      { name: "vanilla in water", e: dim.spawnEntity(ARROW, add(origin, { x: 2.5, y: 5.0, z: 3.5 })) },
    ];
    const sitIds = new Map(sit.map((s) => [s.e.id, s.name]));
    const removedAt = new Map<string, number>();
    const t0 = system.currentTick;
    const rmSub = world.afterEvents.entityRemove.subscribe((ev) => {
      const name = sitIds.get(ev.removedEntityId);
      if (name !== undefined) removedAt.set(name, system.currentTick - t0);
    });
    for (const s of sit) s.e.getComponent("minecraft:projectile")?.shoot({ x: 0, y: -0.1, z: 0 }, { uncertainty: 0 });
    await test.idle(200);
    world.afterEvents.entityRemove.unsubscribe(rmSub);
    log(
      `R2 RESULT resting arrows, 200 ticks: ${sit
        .map((s) => `${s.name} ${s.e.isValid ? `alive at y ${f2(s.e.location.y - origin.y)} fire ${fireTicks(s.e)}` : `removed@+${removedAt.get(s.name) ?? "?"}`}`)
        .join("; ")}`
    );
    for (const s of sit) if (s.e.isValid) s.e.remove();

    const airNone = runs.get("inside/air")?.get("none");
    const waterNone = runs.get("inside/water")?.get("none");
    test.assert(airNone !== undefined && airNone.path.size > 3, "control: the air arrow was not sampled");
    const zAt = (f: Flight | undefined, dt: number): number => (f?.path.get(dt)?.z ?? Number.NaN) - (f?.at0.z ?? 0);
    test.assert(zAt(waterNone, 5) < zAt(airNone, 5), `control: plain water did not slow the vanilla arrow (z +5 ${f2(zAt(waterNone, 5))} vs air ${f2(zAt(airNone, 5))})`);
  } finally {
    system.clearRun(interval);
    world.afterEvents.projectileHitBlock.unsubscribe(hitSub);
    world.beforeEvents.entityHurt.unsubscribe(hurtSub);
    for (const f of flights) if (f.e.isValid) f.e.remove();
    fill(dim, add(origin, BOX_LO), add(origin, { x: BOX_HI.x, y: BOX_HI.y + 3, z: BOX_HI.z }), AIR);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------ R4: setOnFire in water, and scripted fireTick damage

const WET_AT: Vector3 = { x: 5, y: 2, z: 5 };
const DRY_AT: Vector3 = { x: 1, y: 2, z: 1 };

registerAsync("andrew", "probe_ubow_fire", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const wetLo = test.worldBlockLocation({ x: 4, y: 2, z: 4 });
  const wetHi = test.worldBlockLocation({ x: 6, y: 4, z: 6 });
  fill(dim, wetLo, wetHi, GLASS);
  fill(dim, test.worldBlockLocation({ x: 5, y: 2, z: 5 }), test.worldBlockLocation({ x: 5, y: 3, z: 5 }), WATER);
  fill(dim, test.worldBlockLocation({ x: 5, y: 4, z: 5 }), test.worldBlockLocation({ x: 5, y: 4, z: 5 }), AIR);
  const p = await survivor(test, DRY_AT, "ubow_burn", { boost: true });
  p.addEffect("water_breathing", 20000, { showParticles: false });
  const pig = test.spawnWithoutBehaviors("minecraft:pig", { x: 1, y: 2, z: 5 });
  const names = new Map([
    [p.id, "player"],
    [pig.id, "pig"],
  ]);
  const hurts = hurtLog(names);
  const wet = (): Vector3 => test.worldLocation({ x: WET_AT.x + 0.5, y: WET_AT.y, z: WET_AT.z + 0.5 });
  const dry = (): Vector3 => test.worldLocation({ x: DRY_AT.x + 0.5, y: DRY_AT.y, z: DRY_AT.z + 0.5 });

  const watch = async (e: Entity, who: string, ticks: number): Promise<{ fire: string; hits: string; lost: number; inWater: string }> => {
    const t0 = system.currentTick;
    const hp0 = hp(e);
    const fire: string[] = [];
    for (let dt = 1; dt <= ticks; dt++) {
      await test.idle(1);
      if (dt === 1 || dt % 10 === 0) fire.push(`+${dt}:${fireTicks(e)}`);
    }
    const hits = hurts.after.filter((r) => r.who === who && r.tick > t0).map((r) => `${r.cause} ${f2(r.damage)}@+${r.tick - t0}`);
    let inWater = "-";
    try {
      inWater = String(e.isInWater);
    } catch {
      inWater = "?";
    }
    return { fire: fire.join(" "), hits: hits.join(", ") || "none", lost: hp0 - hp(e), inWater };
  };
  const reset = async (e: Entity, at: Vector3): Promise<void> => {
    e.teleport(at);
    e.extinguishFire(false);
    e.getComponent("minecraft:health")?.resetToMaxValue();
    await test.idle(25);
  };

  try {
    await test.idle(5);
    for (const [label, where, seconds, effects] of [
      ["dry setOnFire(2,true)", "dry", 2, true],
      ["wet setOnFire(2,true)", "wet", 2, true],
      ["wet setOnFire(2,false)", "wet", 2, false],
      ["dry setOnFire(5,false)", "dry", 5, false],
    ] as Array<[string, string, number, boolean]>) {
      await reset(p, where === "wet" ? wet() : dry());
      let ret = "-";
      try {
        ret = String(p.setOnFire(seconds, effects));
      } catch (err) {
        ret = `threw ${errText(err)}`;
      }
      const w = await watch(p, "player", seconds * 20 + 30);
      log(`R4 RESULT player ${label}: returned ${ret}; isInWater ${w.inWater}; fire ticks ${w.fire}; hurts [${w.hits}]; hp lost ${f2(w.lost)}`);
    }

    // Burning on land, then into water.
    await reset(p, dry());
    const r1 = p.setOnFire(5, true);
    await test.idle(10);
    const before = fireTicks(p);
    p.teleport(wet());
    const w = await watch(p, "player", 60);
    log(`R4 RESULT player burning on land (setOnFire(5,true)=${r1}, ${before} ticks left) then teleported into water: isInWater ${w.inWater}; fire ticks ${w.fire}; hurts [${w.hits}]; hp lost ${f2(w.lost)}`);

    // Re-applying setOnFire every tick in water.
    await reset(p, wet());
    const rets = new Map<string, number>();
    const t0 = system.currentTick;
    for (let dt = 0; dt < 60; dt++) {
      const r = String(p.setOnFire(1, false));
      rets.set(r, (rets.get(r) ?? 0) + 1);
      await test.idle(1);
    }
    const reHits = hurts.after.filter((r) => r.who === "player" && r.tick > t0).map((r) => `${r.cause} ${f2(r.damage)}@+${r.tick - t0}`);
    log(`R4 RESULT player in water, setOnFire(1,false) every tick for 60 ticks: returns ${[...rets].map(([k, n]) => `${k}×${n}`).join(" ")}; fire ticks now ${fireTicks(p)}; hurts [${reHits.join(", ") || "none"}]`);

    // Super Fire candidate: scripted fireTick 1 HP every 20 ticks for 5 s, in water.
    for (const [label, who, e, resist] of [
      ["player in water", "player", p, false],
      ["player in water with fire_resistance", "player", p, true],
      ["pig in water", "pig", pig, false],
    ] as Array<[string, string, Entity, boolean]>) {
      await reset(e, wet());
      if (resist) e.addEffect("fire_resistance", 400, { showParticles: false });
      await test.idle(2);
      const tStart = system.currentTick;
      const calls: string[] = [];
      for (let k = 0; k < 5; k++) {
        const h0 = hp(e);
        let ret = "-";
        try {
          ret = String(applyScriptedDamage(e, 1, { cause: EntityDamageCause.fireTick }));
        } catch (err) {
          ret = `threw ${errText(err)}`;
        }
        calls.push(`${ret}(${f2(h0 - hp(e))})`);
        await test.idle(20);
      }
      const b = hurts.before.filter((r) => r.who === who && r.tick >= tStart);
      const a = hurts.after.filter((r) => r.who === who && r.tick >= tStart);
      log(
        `R4 RESULT scripted fireTick 1 HP ×5 every 20 ticks, ${label}: applyDamage returns(hp drop) ${calls.join(" ")}; before [${b.map(showBefore).join("; ")}]; ` +
          `after [${a.map(showAfter).join("; ")}]; fire ticks at the end ${fireTicks(e)}; isInWater ${String(e.isInWater)}`
      );
      if (resist) e.removeEffect("fire_resistance");
    }

    // The pig: setOnFire in water and on land.
    for (const [label, at] of [
      ["pig dry setOnFire(2,true)", dry()],
      ["pig wet setOnFire(2,true)", wet()],
      ["pig wet setOnFire(2,false)", wet()],
    ] as Array<[string, Vector3]>) {
      await reset(pig, at);
      const ret = String(pig.setOnFire(2, !label.endsWith("false)")));
      const wp = await watch(pig, "pig", 70);
      log(`R4 RESULT ${label}: returned ${ret}; isInWater ${wp.inWater}; fire ticks ${wp.fire}; hurts [${wp.hits}]; hp lost ${f2(wp.lost)}`);
    }
    test.assert(hurts.after.some((r) => r.who === "player" && (r.cause === "fireTick" || r.cause === "fire")), "control: a burning player on land never took fire damage");
  } finally {
    hurts.stop();
    test.removeSimulatedPlayer(p);
    if (pig.isValid) pig.remove();
    fill(dim, wetLo, wetHi, AIR);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

// ------------------------------------------------ R5: a projectile hurt before-event rewritten to 14 before armour

type Kit = ReadonlyArray<readonly [EquipmentSlot, string]>;
const IRON: Kit = [
  [EquipmentSlot.Head, "minecraft:iron_helmet"],
  [EquipmentSlot.Chest, "minecraft:iron_chestplate"],
  [EquipmentSlot.Legs, "minecraft:iron_leggings"],
  [EquipmentSlot.Feet, "minecraft:iron_boots"],
];
const DIAMOND: Kit = [
  [EquipmentSlot.Head, "minecraft:diamond_helmet"],
  [EquipmentSlot.Chest, "minecraft:diamond_chestplate"],
  [EquipmentSlot.Legs, "minecraft:diamond_leggings"],
  [EquipmentSlot.Feet, "minecraft:diamond_boots"],
];

function equip(p: SimulatedPlayer, kit: Kit, ench?: readonly [string, number]): string {
  const eq = p.getComponent("minecraft:equippable");
  if (eq === undefined) return "no equippable";
  const notes: string[] = [];
  for (const [slot, id] of kit) {
    const { stack, note } = enchanted(id, ench === undefined ? [] : [ench]);
    eq.setEquipment(slot, stack);
    notes.push(note);
  }
  return `${kit.length} pieces ${[...new Set(notes)].join(",")}`;
}

/** Shot by script with the shooter as owner: cause projectile, the same source a bow arrow carries. */
function arrowAt(dim: Dimension, at: Vector3, v: Vector3, owner: Entity): Entity {
  const e = dim.spawnEntity(ARROW, at);
  const proj = e.getComponent("minecraft:projectile");
  if (proj === undefined) throw new Error("arrow has no projectile component");
  proj.owner = owner;
  proj.shoot(v, { uncertainty: 0 });
  return e;
}

registerAsync("andrew", "probe_ubow_rewrite", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = await survivor(test, { x: 3, y: 2, z: 0 }, "ubow_owner", { immune: true });
  const targets: Array<{ label: string; p: SimulatedPlayer; x: number; kit: string }> = [];
  for (const [label, x, kit, ench] of [
    ["bare", 0, [], undefined],
    ["iron", 2, IRON, undefined],
    ["diamond+prot4", 4, DIAMOND, ["protection", 4]],
    ["diamond+projprot4", 6, DIAMOND, ["projectile_protection", 4]],
  ] as Array<[string, number, Kit, readonly [string, number] | undefined]>) {
    const p = await survivor(test, { x, y: 2, z: 5 }, `ubow_${label.replace(/\W/g, "")}`, { boost: true });
    const kitNote = equip(p, kit, ench);
    targets.push({ label, p, x, kit: kitNote });
  }
  const names = new Map<string, string>([[shooter.id, "shooter"]]);
  for (const t of targets) names.set(t.p.id, t.label);
  const golem = test.spawnWithoutBehaviors("minecraft:iron_golem", { x: 3, y: 2, z: 8 });
  names.set(golem.id, "iron_golem");
  let mode: "vanilla" | "setHit" | "raw14" | "zero" = "vanilla";
  const followThrough: string[] = [];
  const rewrite: Rewrite = (e) => {
    if (e.damageSource.cause !== EntityDamageCause.projectile) return undefined;
    if (mode === "setHit") return afterArmour(14, defenceOf(e.hurtEntity));
    if (mode === "raw14") return 14;
    if (mode === "zero") {
      const target = e.hurtEntity;
      const left = hp(target);
      system.run(() => {
        try {
          const ok = applyScriptedDamage(target, left + 1000, { cause: EntityDamageCause.entityAttack, damagingEntity: shooter });
          followThrough.push(`applyDamage(${f2(left + 1000)}, entityAttack, shooter)=${ok}`);
        } catch (err) {
          followThrough.push(`follow-through threw ${errText(err)}`);
        }
      });
      return 0;
    }
    return undefined;
  };
  const hurts = hurtLog(names, () => rewrite);
  const deaths: string[] = [];
  const dieSub = world.afterEvents.entityDie.subscribe((ev) => {
    const who = names.get(ev.deadEntity.id);
    if (who !== undefined) deaths.push(`${who} died: ${ev.damageSource.cause} by ${ev.damageSource.damagingEntity === undefined ? "none" : (names.get(ev.damageSource.damagingEntity.id) ?? typeOf(ev.damageSource.damagingEntity))}`);
  });
  const fire = async (t: { label: string; p: SimulatedPlayer; x: number }, speed = SPEED): Promise<string> => {
    t.p.teleport(test.worldLocation({ x: t.x + 0.5, y: 2, z: 5.5 }), { rotation: { x: 0, y: 180 } });
    t.p.getComponent("minecraft:health")?.resetToMaxValue();
    await test.idle(3);
    const hp0 = hp(t.p);
    const t0 = system.currentTick;
    arrowAt(dim, test.worldLocation({ x: t.x + 0.5, y: 3.0, z: 3.3 }), { x: 0, y: 0, z: speed }, shooter);
    await test.idle(4);
    const hp1 = hp(t.p);
    const b = hurts.before.filter((r) => r.who === t.label && r.tick >= t0);
    const a = hurts.after.filter((r) => r.who === t.label && r.tick >= t0);
    await test.idle(18);
    return `before [${b.map(showBefore).join("; ")}] after [${a.map(showAfter).join("; ")}] hp ${f2(hp0)}->${f2(hp1)} (lost ${f2(hp0 - hp1)})`;
  };

  try {
    await test.idle(5);
    const vanillaRead = new Map<string, number>();
    for (const t of targets) {
      const d = defenceOf(t.p);
      const defText = `armor ${d.armor} toughness ${d.toughness} protection ${d.protection} resistance ${d.resistance}`;
      mode = "vanilla";
      const v1 = await fire(t);
      const v2r = await fire(t);
      const read = hurts.before.filter((r) => r.who === t.label && r.cause === "projectile").map((r) => r.damage);
      vanillaRead.set(t.label, read[0] ?? Number.NaN);
      mode = "setHit";
      const s1 = await fire(t);
      mode = "raw14";
      const r1 = await fire(t);
      mode = "vanilla";
      log(`R5 RESULT ${t.label} (${t.kit}; defenceOf: ${defText}; afterArmour(14) = ${f3(afterArmour(14, d))}): vanilla #1 ${v1} | vanilla #2 ${v2r} | setHit afterArmour(14) ${s1} | raw 14 ${r1}`);
    }
    {
      const mob = async (label: string): Promise<string> => {
        golem.teleport(test.worldLocation({ x: 3.5, y: 2, z: 8.5 }));
        golem.getComponent("minecraft:health")?.resetToMaxValue();
        await test.idle(3);
        const hp0 = hp(golem);
        const t0 = system.currentTick;
        arrowAt(dim, test.worldLocation({ x: 3.5, y: 3.2, z: 6.3 }), { x: 0, y: 0, z: SPEED }, shooter);
        await test.idle(4);
        const b = hurts.before.filter((r) => r.who === "iron_golem" && r.tick >= t0);
        const a = hurts.after.filter((r) => r.who === "iron_golem" && r.tick >= t0);
        const hp1 = hp(golem);
        await test.idle(18);
        return `${label}: before [${b.map(showBefore).join("; ")}] after [${a.map(showAfter).join("; ")}] hp ${f2(hp0)}->${f2(hp1)}`;
      };
      const d = defenceOf(golem);
      mode = "vanilla";
      const gv = await mob("vanilla");
      mode = "setHit";
      const gs = await mob("setHit afterArmour(14)");
      mode = "vanilla";
      log(`R5 RESULT iron_golem (defenceOf: armor ${d.armor} toughness ${d.toughness} protection ${d.protection}): ${gv} | ${gs}`);
    }
    const bare = vanillaRead.get("bare") ?? Number.NaN;
    log(
      `R5 RESULT vanilla arrow at ${SPEED} b/t: bare read ${f2(bare)} = the raw hit; ` +
        targets
          .slice(1)
          .map((t) => `${t.label} read ${f3(vanillaRead.get(t.label))} vs afterArmour(${f2(bare)}) ${f3(afterArmour(bare, defenceOf(t.p)))}`)
          .join("; ")
    );

    // applyDamage forms for the follow-through, on the bare and the diamond+Protection targets.
    for (const t of [targets[0], targets[2]]) {
      const forms: string[] = [];
      for (const [label, opts] of [
        ["projectile + damagingEntity", { cause: EntityDamageCause.projectile, damagingEntity: shooter }],
        ["projectile alone", { cause: EntityDamageCause.projectile }],
        ["entityAttack + damagingEntity", { cause: EntityDamageCause.entityAttack, damagingEntity: shooter }],
      ] as Array<[string, { cause: EntityDamageCause; damagingEntity?: Entity }]>) {
        t.p.getComponent("minecraft:health")?.resetToMaxValue();
        await test.idle(15);
        const h0 = hp(t.p);
        const t0 = system.currentTick;
        let ret: string;
        try {
          ret = String(applyScriptedDamage(t.p, 14, opts));
        } catch (err) {
          ret = `threw ${errText(err)}`;
        }
        const b = hurts.before.filter((r) => r.who === t.label && r.tick >= t0);
        forms.push(`${label}: ${ret}, hp lost ${f2(h0 - hp(t.p))}, before [${b.map(showBefore).join("; ")}]`);
      }
      log(`R5 RESULT applyDamage(14) on ${t.label}: ${forms.join(" | ")}`);
    }

    // The lethal path of ADR-uwbw-ex: write 0, then an overkill entityAttack from the shooter on the next tick.
    for (const [label, totem, how] of [
      ["lethal plain, zero + follow-through", false, "zero"],
      ["lethal totem, zero + follow-through", true, "zero"],
      ["lethal totem, raw 14 rewrite (control)", true, "raw14"],
    ] as Array<[string, boolean, "zero" | "raw14"]>) {
      const p = await survivor(test, { x: 3, y: 2, z: 5 }, `ubow_l${targets.length}${totem ? "t" : "p"}${how}`.slice(0, 15));
      if (totem) p.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:totem_of_undying"));
      names.set(p.id, label);
      p.teleport(test.worldLocation({ x: 3.5, y: 2, z: 5.5 }), { rotation: { x: 0, y: 180 } });
      p.getComponent("minecraft:health")?.setCurrentValue(10);
      await test.idle(3);
      followThrough.length = 0;
      deaths.length = 0;
      const t0 = system.currentTick;
      mode = how;
      arrowAt(dim, test.worldLocation({ x: 3.5, y: 3.0, z: 3.3 }), { x: 0, y: 0, z: SPEED }, shooter);
      await test.idle(6);
      mode = "vanilla";
      const offhand = p.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
      const b = hurts.before.filter((r) => r.who === label && r.tick >= t0);
      const a = hurts.after.filter((r) => r.who === label && r.tick >= t0);
      log(
        `R5 RESULT ${label}: hp 10 -> ${f2(hp(p))}; before [${b.map(showBefore).join("; ")}]; after [${a.map(showAfter).join("; ")}]; follow-through [${followThrough.join("; ")}]; ` +
          `deaths [${deaths.join("; ")}]; offhand now ${short(offhand)}`
      );
      test.removeSimulatedPlayer(p);
      await test.idle(5);
    }
    test.assert(Number.isFinite(bare) && bare > 0, `control: the vanilla arrow did not hurt the bare target (${bare})`);
  } finally {
    hurts.stop();
    world.afterEvents.entityDie.unsubscribe(dieSub);
    for (const e of dim.getEntities({ type: ARROW, location: test.worldLocation({ x: 3, y: 3, z: 5 }), maxDistance: 30 })) e.remove();
    test.removeSimulatedPlayer(shooter);
    for (const t of targets) test.removeSimulatedPlayer(t.p);
    if (golem.isValid) golem.remove();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");

// ------------------------------------------------ R6: an arrow at a raised shield, front and back

function shieldWear(p: SimulatedPlayer): string {
  try {
    const s = p.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand);
    if (s === undefined) return "no shield";
    const d = s.getComponent("minecraft:durability");
    return d === undefined ? `${short(s.typeId)} no durability` : String(d.damage);
  } catch (err) {
    return `unreadable (${errText(err)})`;
  }
}

registerAsync("andrew", "probe_ubow_shield", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = await survivor(test, { x: 0, y: 2, z: 0 }, "ubow_archer", { immune: true });
  const target = await survivor(test, { x: 3, y: 2, z: 4 }, "ubow_shield", { boost: true });
  target.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:shield"));
  const names = new Map([
    [shooter.id, "shooter"],
    [target.id, "target"],
  ]);
  let rewriteOn = true;
  const hurts = hurtLog(names, () => (rewriteOn ? (e) => (e.damageSource.cause === EntityDamageCause.projectile ? 14 : undefined) : undefined));
  const hits: string[] = [];
  const hitSub = world.afterEvents.projectileHitEntity.subscribe((ev) => {
    const hit = ev.getEntityHit().entity;
    if (hit?.id === target.id) hits.push(`${typeOf(ev.projectile)}@${system.currentTick}`);
  });
  try {
    await test.idle(5);
    // The shooter (the arrow's owner) stands off the arrow's line, in front of the target or behind it.
    for (const [label, sneak, from, ownerAt, rw] of [
      ["arrow at the front, owner in front, shield raised, rewrite 14", true, "front", "front", true],
      ["arrow at the front, owner in front, shield raised, rewrite 14 #2", true, "front", "front", true],
      ["arrow at the front, owner in front, shield raised, no rewrite", true, "front", "front", false],
      ["arrow at the back, owner behind, shield raised, rewrite 14", true, "back", "back", true],
      ["arrow at the back, owner in front, shield raised, rewrite 14", true, "back", "front", true],
      ["arrow at the front, owner behind, shield raised, rewrite 14", true, "front", "back", true],
      ["arrow at the front, owner in front, shield lowered (control), rewrite 14", false, "front", "front", true],
    ] as Array<[string, boolean, string, string, boolean]>) {
      shooter.teleport(test.worldLocation(ownerAt === "front" ? { x: 1.5, y: 2, z: 0.5 } : { x: 5.5, y: 2, z: 6.5 }));
      target.teleport(test.worldLocation({ x: 3.5, y: 2, z: 4.5 }), { rotation: { x: 0, y: 180 } });
      target.lookAtLocation({ x: 3.5, y: 3.5, z: 0 }, LookDuration.Continuous);
      target.getComponent("minecraft:health")?.resetToMaxValue();
      target.isSneaking = sneak;
      rewriteOn = rw;
      await test.idle(12);
      const view = target.getViewDirection();
      const hp0 = hp(target);
      const t0 = system.currentTick;
      const h0 = hits.length;
      const shield0 = shieldWear(target);
      const arrow = from === "front" ? arrowAt(dim, test.worldLocation({ x: 3.5, y: 3.0, z: 2.3 }), { x: 0, y: 0, z: SPEED }, shooter) : arrowAt(dim, test.worldLocation({ x: 3.5, y: 3.0, z: 6.7 }), { x: 0, y: 0, z: -SPEED }, shooter);
      const fate: string[] = [];
      for (let dt = 1; dt <= 6; dt++) {
        await test.idle(1);
        fate.push(arrow.isValid ? `+${dt}:${v2(sub(arrow.location, test.worldLocation({ x: 0, y: 0, z: 0 })))} v ${v2(arrow.getVelocity())}` : `+${dt}:gone`);
      }
      const shield1 = shieldWear(target);
      const b = hurts.before.filter((r) => r.who === "target" && r.tick >= t0);
      const a = hurts.after.filter((r) => r.who === "target" && r.tick >= t0);
      log(
        `R6 RESULT ${label}: view ${v2(view)} sneaking ${target.isSneaking}; before [${b.map(showBefore).join("; ")}]; after [${a.map(showAfter).join("; ")}]; ` +
          `hp ${f2(hp0)}->${f2(hp(target))}; projectileHitEntity ${hits.length - h0}; shield damage ${shield0}->${shield1}; owner at z ${f2(shooter.location.z - test.worldLocation({ x: 0, y: 0, z: 0 }).z)}; arrow ${fate.join(" ")}`
      );
      if (arrow.isValid) arrow.remove();
      target.isSneaking = false;
      await test.idle(15);
    }
    const control = hurts.after.filter((r) => r.who === "target");
    test.assert(control.length > 0, "control: no arrow ever hurt the target");
  } finally {
    hurts.stop();
    world.afterEvents.projectileHitEntity.unsubscribe(hitSub);
    for (const e of dim.getEntities({ type: ARROW, location: test.worldLocation({ x: 3, y: 3, z: 4 }), maxDistance: 30 })) e.remove();
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ R7 and R8 share the Crafter

const CRAFTER: Vector3 = { x: 3, y: 2, z: 4 };
const POWER: Vector3 = { x: 2, y: 2, z: 4 };
const STAND: Vector3 = { x: 3, y: 2, z: 5 };
const GROUND_RADIUS = 8;

function placeCrafter(test: Test): void {
  test.setBlockPermutation(BlockPermutation.resolve("minecraft:crafter", { orientation: "south_up" }), CRAFTER);
}

/** All nine slots, explicit: an `undefined` empties the slot so one craft does not inherit the last one's grid. */
function craft(test: Test, grid: ReadonlyArray<string | undefined>): void {
  const at = test.worldBlockLocation(CRAFTER);
  grid.forEach((id, slot) => {
    const cmd = `replaceitem block ${at.x} ${at.y} ${at.z} slot.container ${slot} ${id ?? AIR} 1`;
    test.assert(test.getDimension().runCommand(cmd).successCount > 0, `${cmd} failed`);
  });
  test.pulseRedstone(POWER, 2);
}

function onGround(test: Test, typeId: string): number {
  let n = 0;
  for (const e of test.getDimension().getEntities({ type: "minecraft:item", location: test.worldLocation(STAND), maxDistance: GROUND_RADIUS })) {
    const s = e.isValid ? e.getComponent("minecraft:item")?.itemStack : undefined;
    if (s?.typeId === typeId) n += s.amount;
  }
  return n;
}

function clearGround(test: Test): void {
  for (const e of test.getDimension().getEntities({ type: "minecraft:item", location: test.worldLocation(STAND), maxDistance: GROUND_RADIUS })) if (e.isValid) e.remove();
}

async function waitFor(test: Test, ticks: number, done: () => boolean): Promise<boolean> {
  for (let t = 0; t < ticks; t++) {
    if (done()) return true;
    await test.idle(1);
  }
  return done();
}

const BOW_GRID: ReadonlyArray<string | undefined> = [
  undefined, "minecraft:lightning_rod", undefined,
  WATER_BUCKET, BOW, WATER_BUCKET,
  undefined, "minecraft:sand", undefined,
];

/** The bow def's shape for the probe only: the probe token, the probe shooter as the weapon, the trident's craftReturn. */
const STAND_IN: PassiveLegendaryDef = {
  itemId: SHOOTER,
  keyPrefix: "ubp",
  nameKey: "item.andrew:probe_ubow_shooter",
  craftGate: true,
  craftTokenId: TOKEN,
  refund: [
    ["minecraft:lightning_rod", 1],
    [BOW, 1],
    ["minecraft:sand", 1],
    [WATER_BUCKET, 2],
  ],
  craftReturn: [[BUCKET, 2]],
  textPrefix: "andrew.probe_ubow",
  command: "andrew:probe_ubow",
};

registerAsync("andrew", "probe_ubow_buckets", async (test: Test): Promise<void> => {
  placeCrafter(test);
  const p = await survivor(test, STAND, "ubow_crafter");
  const registry = LEGENDARIES as LegendaryDef[];
  let pushed = false;
  const tally = (): string => {
    const c = inventoryOf(p);
    return (
      `empty ${countIn(c, BUCKET)}+${onGround(test, BUCKET)} water ${countIn(c, WATER_BUCKET)}+${onGround(test, WATER_BUCKET)} token ${countIn(c, TOKEN)}+${onGround(test, TOKEN)} ` +
      `shooter ${countIn(c, SHOOTER)} (marked ${state.findAllMarked(STAND_IN, c).length}) rod ${countIn(c, "minecraft:lightning_rod")} bow ${countIn(c, BOW)} sand ${countIn(c, "minecraft:sand")}`
    );
  };
  const run = async (label: string, expect: () => boolean): Promise<string> => {
    clearInventory(p);
    clearGround(test);
    await test.idle(3);
    craft(test, BOW_GRID);
    const arrived = await waitFor(test, 100, expect);
    await test.idle(20);
    const line = `${label}: arrived ${arrived}; ${tally()}`;
    log(`R7 RESULT ${line}`);
    return line;
  };
  try {
    await test.idle(5);
    state.resetCrafted(STAND_IN);
    const bare = await run("no def (engine alone)", () => countIn(inventoryOf(p), TOKEN) > 0);
    registry.push(STAND_IN);
    pushed = true;
    const claim = await run("stand-in def with craftReturn [2 empty buckets], first craft (claim)", () => countIn(inventoryOf(p), SHOOTER) > 0);
    const flag = state.isCrafted(STAND_IN);
    const refund = await run("stand-in def, second craft (refund)", () => countIn(inventoryOf(p), BOW) > 0);
    log(`R7 RESULT flag after the claim ${flag} by ${String(world.getDynamicProperty(keysFor(STAND_IN).craftedBy))}`);
    test.assert(bare.includes("token 1"), `control: the Crafter's token never reached the player: ${bare}`);
    test.assert(claim.includes("arrived true") && refund.includes("arrived true"), "the gate never settled a token");
  } finally {
    if (pushed) {
      const i = registry.indexOf(STAND_IN);
      if (i >= 0) registry.splice(i, 1);
    }
    state.resetCrafted(STAND_IN);
    clearGround(test);
    test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ------------------------------------------------ R8: what the paper + string rocket is, and whether it boosts an Elytra

const ROCKET_GRIDS: ReadonlyArray<readonly [string, ReadonlyArray<string | undefined>]> = [
  // Not the spec's paper-over-string shape: that one is the product recipe (RCPE-VNLA), whose position probe a
  // second, position-free paper/string recipe in this pack would answer for it. The result block is the same.
  ["paper/string/string (add-on recipe)", [undefined, "minecraft:paper", undefined, undefined, "minecraft:string", undefined, undefined, "minecraft:string", undefined]],
  ["paper+gunpowder (vanilla, flight 1)", ["minecraft:paper", "minecraft:gunpowder", undefined, undefined, undefined, undefined, undefined, undefined, undefined]],
  ["paper+2 gunpowder (vanilla, flight 2)", ["minecraft:paper", "minecraft:gunpowder", "minecraft:gunpowder", undefined, undefined, undefined, undefined, undefined, undefined]],
  ["paper+3 gunpowder (vanilla, flight 3)", ["minecraft:paper", "minecraft:gunpowder", "minecraft:gunpowder", "minecraft:gunpowder", undefined, undefined, undefined, undefined, undefined]],
];

registerAsync("andrew", "probe_ubow_rocket", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  placeCrafter(test);
  const p = await survivor(test, STAND, "ubow_rocketeer", { immune: true });
  const kinds = new Map<string, ItemStack>();
  const rockets: Map<string, { born: number; peak: number; y0: number; gone?: number; kind: string }> = new Map();
  let kindNow = "-";
  const spawnSub = world.afterEvents.entitySpawn.subscribe((ev) => {
    if (ev.entity.isValid && ev.entity.typeId === ROCKET_ENTITY) rockets.set(ev.entity.id, { born: system.currentTick, peak: ev.entity.location.y, y0: ev.entity.location.y, kind: kindNow });
  });
  const rmSub = world.afterEvents.entityRemove.subscribe((ev) => {
    const r = rockets.get(ev.removedEntityId);
    if (r !== undefined && r.gone === undefined) r.gone = system.currentTick - r.born;
  });
  const peakRun = system.runInterval(() => {
    for (const [id, r] of rockets) {
      if (r.gone !== undefined) continue;
      const e = world.getEntity(id);
      if (e !== undefined && e.isValid) r.peak = Math.max(r.peak, e.location.y);
    }
  }, 1);
  let unload: (() => void) | undefined;
  try {
    await test.idle(5);
    for (const [label, grid] of ROCKET_GRIDS) {
      clearInventory(p);
      clearGround(test);
      let made = 0;
      for (let k = 0; k < 2; k++) {
        const before = countIn(inventoryOf(p), ROCKET);
        craft(test, grid);
        await waitFor(test, 100, () => countIn(inventoryOf(p), ROCKET) > before);
        await test.idle(10);
        made = countIn(inventoryOf(p), ROCKET);
      }
      const c = inventoryOf(p);
      let stack: ItemStack | undefined;
      for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === ROCKET) stack ??= c.getItem(i);
      if (stack !== undefined) kinds.set(label, stack);
      log(`R8 RESULT craft ${label} ×2: rockets in the inventory ${made} (+${onGround(test, ROCKET)} on the ground); stacks ${[...Array(c.size).keys()].filter((i) => c.getItem(i)?.typeId === ROCKET).length}`);
    }
    kinds.set("new ItemStack(firework_rocket)", new ItemStack(ROCKET, 8));
    clearInventory(p);
    dim.runCommand(`give "${p.name}" ${ROCKET} 8`);
    await test.idle(3);
    const given = inventoryOf(p).getItem(0);
    if (given !== undefined) kinds.set("/give firework_rocket", given);

    const names = [...kinds.keys()];
    const matrix = names.map((a) => `${a}: ${names.map((b) => ((kinds.get(a) as ItemStack).isStackableWith(kinds.get(b) as ItemStack) ? "S" : ".")).join("")}`);
    log(`R8 RESULT isStackableWith (columns in the same order as rows): ${matrix.join(" | ")}`);
    for (const [k, s] of kinds) {
      log(`R8 RESULT ${k}: amount ${s.amount} maxAmount ${s.maxAmount} tags [${s.getTags().join(",")}] lore [${s.getLore().join(",")}] components [${s.getComponents().map((x) => x.typeId).join(",")}] dynamic ids [${s.getDynamicPropertyIds().join(",")}]`);
    }

    // Launch from the floor: lifetime and height by kind.
    for (const [k, s] of kinds) {
      clearInventory(p);
      const st = s.clone();
      st.amount = Math.min(st.maxAmount, 8);
      p.setItem(st, SLOT, true);
      p.teleport(test.worldLocation({ x: 1.5, y: 2, z: 1.5 }));
      await test.idle(3);
      kindNow = k;
      const uses: boolean[] = [];
      for (let n = 0; n < 6; n++) {
        uses.push(p.useItemInSlotOnBlock(SLOT, { x: n % 4, y: 1, z: 3 }, Direction.Up));
        await test.idle(12);
      }
      await test.idle(80);
      kindNow = "-";
      const mine = [...rockets.values()].filter((r) => r.kind === k);
      log(`R8 RESULT launch ${k}: uses [${uses.join(",")}]; rockets ${mine.length}; lifetime ticks ${mine.map((r) => r.gone ?? "alive").join("/")}; rise ${mine.map((r) => f2(r.peak - r.y0)).join("/")}`);
    }

    // Elytra: glide high over a loaded strip, fire one rocket, read the speed.
    const startRel: Vector3 = { x: 3.5, y: 60, z: 2.5 };
    const w0 = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
    unload = await loadBox(test, dim, "andrew_gt_ubow_glide", { min: [w0.x - 24, 0, w0.z - 8], max: [w0.x + 24, 0, w0.z + 120] });
    await test.idle(20);
    p.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Chest, new ItemStack("minecraft:elytra"));
    for (const k of ["no rocket (control)", ...names.flatMap((n) => [n, n])]) {
      clearInventory(p);
      const s = kinds.get(k);
      if (s !== undefined) {
        const st = s.clone();
        st.amount = 1;
        p.setItem(st, SLOT, true);
      }
      p.teleport(test.worldLocation(startRel), { rotation: { x: 0, y: 0 } });
      p.lookAtLocation({ x: startRel.x, y: startRel.y - 6, z: startRel.z + 60 }, LookDuration.Continuous);
      await test.idle(4);
      const glide = p.glide();
      await test.idle(10);
      const speeds: number[] = [];
      for (let dt = 0; dt < 3; dt++) {
        speeds.push(len(p.getVelocity()));
        await test.idle(1);
      }
      kindNow = `glide ${k}`;
      const used = s === undefined ? "-" : String(p.useItemInSlot(SLOT));
      const t0 = system.currentTick;
      for (let dt = 0; dt < 60; dt++) {
        await test.idle(1);
        speeds.push(len(p.getVelocity()));
      }
      kindNow = "-";
      const r = [...rockets.values()].filter((x) => x.kind === `glide ${k}` && x.born >= t0 - 1);
      const before = speeds.slice(0, 3);
      const after = speeds.slice(3);
      const peakAt = after.indexOf(Math.max(...after));
      log(
        `R8 RESULT glide ${k}: glide()=${glide} gliding ${String(p.isGliding)}; use ${used}; speed before ${before.map(f2).join("/")}; after use +1..+60 every 3 ` +
          `${after.filter((_, i) => i % 3 === 0).map(f2).join(" ")}; peak ${f2(Math.max(...after))} at +${peakAt + 1}; above 1.60 for ${after.filter((x) => x > 1.6).length} ticks; attached rockets ${r.length} lifetime ${r.map((x) => x.gone ?? `alive@+${system.currentTick - t0}`).join("/")}; ` +
          `fell ${f2(test.worldLocation(startRel).y - p.location.y)} blocks, ${f2(p.location.z - test.worldLocation(startRel).z)} forward`
      );
      await test.idle(5);
    }
    test.assert([...rockets.values()].some((r) => r.kind === "new ItemStack(firework_rocket)"), "control: a script-made rocket launched from the floor spawned no rocket entity");
  } finally {
    world.afterEvents.entitySpawn.unsubscribe(spawnSub);
    world.afterEvents.entityRemove.unsubscribe(rmSub);
    system.clearRun(peakRun);
    unload?.();
    for (const e of dim.getEntities({ type: ROCKET_ENTITY, location: test.worldLocation({ x: 3, y: 30, z: 30 }), maxDistance: 150 })) e.remove();
    clearGround(test);
    test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(4000)
  .tag("andrew");
