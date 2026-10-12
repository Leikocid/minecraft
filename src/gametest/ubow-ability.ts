// Scenarios for the Underwater Bow's armed charge (src/ubow/ability.ts; spec v3 §1; L0-xcx33, R-uwbw-001, R-uwbw-003,
// L0-uwbw-a005..a007). SimulatedPlayers sneak and draw the real andrew:underwater_bow. Witnesses: the engine's
// entityHurt, entityDie, entitySpawn and projectileHitEntity, the module's own reports, the strike counters of the storm
// visuals, and the HUD message rendered through the two shipped lang files. Every scenario logs
// "[gametest] ubow-ability <name> ROW …" lines and a RESULT line, and fails on the first check that does not hold.

import {
  BlockVolume,
  type Dimension,
  Direction,
  EnchantmentType,
  type Entity,
  EntityDamageCause,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type RawMessage,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import EN_US from "../../packs/resource/texts/en_US.lang" with { type: "text" };
import RU_RU from "../../packs/resource/texts/ru_RU.lang" with { type: "text" };
import { clearCooldown, remainingTicks } from "../legendary/cooldown";
import { hudMessage } from "../legendary/hud";
import { UNDERWATER_BOW } from "../legendary/registry";
import { afterArmour, defenceOf } from "../storm/damage";
import { visualStats } from "../storm/visuals";
import {
  ARMED_COOLDOWN_TICKS,
  ARMED_DAMAGE,
  type UbowAbilityReport,
  dropUbowCharge,
  observeUbowAbility,
  registerUbowAbility,
  ubowChargeOf,
  ubowChargeState,
} from "../ubow/ability";
import { armedKey } from "../ubow/ability-rules";
import { superFireTicksLeft } from "../ubow/fire";

registerUbowAbility();

const STRUCTURE = "andrew:platform";
const UBOW = UNDERWATER_BOW.itemId;
const ABILITY = UNDERWATER_BOW.abilityKey;
const ARROW = "minecraft:arrow";
const BOLT = "minecraft:lightning_bolt";
const STONE = "minecraft:stone";
const AIR = "minecraft:air";
const SLOT = 0;
const AMMO_SLOT = 9;
/** probe-ubow row 3: 25 ticks of draw is a full-power shot. */
const FULL_DRAW = 25;
/** Waits out any hurt window and lets knockback settle. */
const CLEAR = 22;
/** How long a shot is watched after its release: the arrow lands by +2 at 4 blocks, an entity miss settles by +5. */
const FLIGHT = 14;
const EPS = 0.01;

const SHOOTER_AT: Vector3 = { x: 3, y: 2, z: 0 };
const TARGET_AT: Vector3 = { x: 3, y: 2, z: 4 };
/** Test-relative, mid-body of a player at TARGET_AT: lookAtLocation takes a relative point (probe-ubow row 1). */
const AIM: Vector3 = { x: 3.5, y: 3.0, z: 4.5 };
/** The platform's floor block two ahead of the shooter, and its top face. */
const FLOOR: Vector3 = { x: 3, y: 1, z: 2 };
const FLOOR_AIM: Vector3 = { x: 3.5, y: 2.0, z: 2.5 };
const SHOOTER_EYE: Vector3 = { x: 3.5, y: 3.6, z: 0.5 };

const log = (msg: string): void => console.warn(`[gametest] ubow-ability ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(2));
const f3 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(3));
const center = (v: Vector3): Vector3 => ({ x: v.x + 0.5, y: v.y, z: v.z + 0.5 });
const near = (a: number | undefined, b: number): boolean => a !== undefined && Math.abs(a - b) < EPS;

// ------------------------------------------------------------------ witnesses

const reports: UbowAbilityReport[] = [];
const players = new Map<string, Player>();
/** Arrow id → the shooter's cooldown in ticks, read in the spend's own tick. */
const cooldownAtSpend = new Map<string, number>();
observeUbowAbility((r) => {
  reports.push(r);
  if (r.type !== "spent") return;
  const p = players.get(r.playerId);
  cooldownAtSpend.set(r.arrowId, p?.isValid === true ? remainingTicks(p, ABILITY) : Number.NaN);
});
function since<T extends UbowAbilityReport["type"]>(from: number, type: T, playerId: string): Array<Extract<UbowAbilityReport, { type: T }>> {
  return reports.slice(from).filter((r): r is Extract<UbowAbilityReport, { type: T }> => r.type === type && r.playerId === playerId);
}
function show(from: number): string {
  return reports
    .slice(from)
    .map((r) => {
      switch (r.type) {
        case "press":
          return `press ${r.via} ${r.decision}${r.sneaking ? " sneaking" : ""}${r.cooldownMs > 0 ? ` cd ${Math.ceil(r.cooldownMs / 1000)}s` : ""}`;
        case "mark":
          return `mark ${r.arrowId}`;
        case "hit":
          return `hit ${r.arrowId} ${r.skip === undefined ? r.plan : `skip ${r.skip}`} read ${f2(r.read)} goal ${f3(r.goal)} set ${f3(r.set)}`;
        case "spent":
          return `spent ${r.arrowId} ${r.plan} landed ${f3(r.landed)} cooldown=${r.cooldown} superFire=${r.superFire} strikes=${r.strikes}`;
        case "miss":
          return `miss ${r.arrowId} (${r.why})`;
      }
      return "";
    })
    .join("; ");
}

interface Hurt {
  tick: number;
  damage: number;
  cause: string;
}
const hurts = new Map<string, Hurt[]>();
world.afterEvents.entityHurt.subscribe((e) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  hurts.get(id)?.push({ tick: system.currentTick, damage: e.damage, cause: e.damageSource.cause });
});
const watch = (e: Entity): void => void hurts.set(e.id, []);
const hurtsOf = (e: Entity, from: number, to: number, cause?: string): Hurt[] =>
  (hurts.get(e.id) ?? []).filter((h) => h.tick > from && h.tick <= to && (cause === undefined || h.cause === cause));
const showHurts = (hs: Hurt[]): string => `[${hs.map((h) => `${h.cause} ${f3(h.damage)}`).join(" ")}]`;

let bolts = 0;
world.afterEvents.entitySpawn.subscribe((e) => {
  try {
    if (e.entity.typeId === BOLT) bolts++;
  } catch {
    // a bolt gone within its spawn tick still counted nowhere else; none is expected at all
  }
});

const deaths = new Map<string, { cause: string; by: string | undefined }>();
world.afterEvents.entityDie.subscribe((e) => {
  try {
    deaths.set(e.deadEntity.id, { cause: e.damageSource.cause, by: e.damageSource.damagingEntity?.id });
  } catch {
    // an unreadable death is not one of these scenarios'
  }
});

const entityHits = new Map<string, number>();
world.afterEvents.projectileHitEntity.subscribe((e) => {
  try {
    const id = e.getEntityHit().entity?.id;
    if (id !== undefined) entityHits.set(id, (entityHits.get(id) ?? 0) + 1);
  } catch {
    // nothing to count
  }
});

// ------------------------------------------------------------------ helpers

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

/** A Survival SimulatedPlayer: `boost` gives it 40 HP, `immune` Resistance V. */
async function survivor(test: Test, rel: Vector3, name: string, opts: { boost?: boolean; immune?: boolean } = {}): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  if (opts.boost === true) p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  if (opts.immune === true) p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  players.set(p.id, p);
  watch(p);
  return p;
}

function giveBow(p: SimulatedPlayer): void {
  p.setItem(new ItemStack(UBOW), SLOT, true);
  const inv = p.getComponent("minecraft:inventory")?.container;
  if (inv === undefined) throw new Error(`${p.name} has no inventory`);
  inv.setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
}

/** A use right after another use can be refused for one tick; retry a few. */
async function startUse(test: Test, p: SimulatedPlayer): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (p.useItemInSlot(SLOT)) return true;
    await test.idle(1);
  }
  return false;
}

interface Shot {
  started: boolean;
  release: number;
  /** Read three ticks into the draw, before the release. */
  during: { charged: boolean; ledger: unknown; state: string; hud: RawMessage | undefined };
}

/** A draw of `ticks` at `aim`, sneaking from before the press through the release when `sneak`. */
async function draw(test: Test, p: SimulatedPlayer, aim: Vector3, sneak: boolean, ticks = FULL_DRAW): Promise<Shot> {
  p.lookAtLocation(aim, LookDuration.Continuous);
  p.isSneaking = sneak;
  await test.idle(4);
  const started = await startUse(test, p);
  await test.idle(3);
  const during = { charged: ubowChargeOf(p.id), ledger: world.getDynamicProperty(armedKey(p.id)), state: ubowChargeState(p), hud: hudMessage(p) };
  await test.idle(ticks - 3);
  const release = system.currentTick;
  p.stopUsingItem();
  p.isSneaking = false;
  return { started, release, during };
}

/** Health per tick for `ticks` ticks from now. */
async function hpSeries(test: Test, e: Entity, ticks: number): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  for (let i = 0; i < ticks; i++) {
    await test.idle(1);
    out.set(system.currentTick, hp(e));
  }
  return out;
}

async function placeTarget(test: Test, p: SimulatedPlayer, at: Vector3): Promise<void> {
  p.teleport(test.worldLocation(center(at)), { rotation: { x: 0, y: 180 } });
  p.extinguishFire(false);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  await test.idle(CLEAR);
}

function fill(dim: Dimension, test: Test, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(test.worldBlockLocation(a), test.worldBlockLocation(b)), block);
}

function clearArrows(test: Test): void {
  for (const e of test.getDimension().getEntities({ location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 40, type: ARROW })) {
    if (e.isValid) e.remove();
  }
}

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

function equip(p: SimulatedPlayer, kit: Kit, ench?: readonly [string, number]): void {
  const eq = p.getComponent("minecraft:equippable");
  if (eq === undefined) throw new Error(`${p.name} has no equippable`);
  for (const [slot, id] of kit) {
    const stack = new ItemStack(id);
    if (ench !== undefined) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType(ench[0]), level: ench[1] });
    eq.setEquipment(slot, stack);
  }
}

/** The off-hand shield's durability damage, or why it could not be read. */
function shieldWear(p: SimulatedPlayer): { damage: number; note: string } {
  try {
    const stack = p.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand);
    if (stack === undefined) return { damage: Number.NaN, note: "no off-hand item" };
    const durability = stack.getComponent("minecraft:durability");
    if (durability === undefined) return { damage: Number.NaN, note: `${stack.typeId} has no durability` };
    return { damage: durability.damage, note: `${stack.typeId} ${durability.damage}/${durability.maxDurability}` };
  } catch (err) {
    return { damage: Number.NaN, note: `unreadable: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`.split("\n")[0] };
  }
}

function fireBlocks(test: Test): number {
  const dim = test.getDimension();
  let n = 0;
  for (let x = -1; x <= 7; x++)
    for (let y = 1; y <= 5; y++)
      for (let z = -1; z <= 8; z++) {
        try {
          if (dim.getBlock(test.worldBlockLocation({ x, y, z }))?.typeId === "minecraft:fire") n++;
        } catch {
          // an unloaded cell holds no fire this scenario lit
        }
      }
  return n;
}

class Checks {
  readonly failures: string[] = [];
  expect(ok: boolean, msg: string): void {
    if (!ok) this.failures.push(msg);
  }
  finish(test: Test, name: string): void {
    log(`${name} RESULT ${this.failures.length === 0 ? "pass" : `fail: ${this.failures.join(" | ")}`}`);
    test.assert(this.failures.length === 0, this.failures.join(" | "));
    test.succeed();
  }
}

/** What a shot did, read off the witnesses since report index `from` and the release. */
function outcome(from: number, shooter: Player, shot: Shot) {
  const marks = since(from, "mark", shooter.id);
  const spent = since(from, "spent", shooter.id);
  const misses = since(from, "miss", shooter.id);
  const presses = since(from, "press", shooter.id);
  return { marks, spent, misses, presses, arrowId: marks[0]?.arrowId, release: shot.release };
}

// ------------------------------------------------------------- AC1: sneak + draw arms, a plain draw does not

registerAsync("andrew", "ubow_ability_arm", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, SHOOTER_AT, "ubab_arm_shooter", { immune: true });
  const target = await survivor(test, TARGET_AT, "ubab_arm_target", { boost: true });
  giveBow(shooter);
  const c = new Checks();
  try {
    await test.idle(5);

    // A plain draw: an ordinary shot, nothing armed.
    await placeTarget(test, target, TARGET_AT);
    let n = reports.length;
    let shot = await draw(test, shooter, AIM, false);
    await test.idle(FLIGHT);
    let o = outcome(n, shooter, shot);
    const plainHurt = hurtsOf(target, shot.release - 1, system.currentTick, "projectile")[0];
    log(
      `arm ROW plain: use started=${shot.started}; while drawing charged=${shot.during.charged} state=${shot.during.state}; reports [${show(n)}]; ` +
        `arrow hurt ${f3(plainHurt?.damage)}; charge after ${ubowChargeOf(shooter.id)}; cooldown ${remainingTicks(shooter, ABILITY)} ticks`
    );
    c.expect(shot.started, "plain: the draw did not start");
    c.expect(o.presses.length === 1 && o.presses[0].decision === "plain" && !o.presses[0].sneaking, `plain: presses [${show(n)}], expected one plain press`);
    c.expect(o.marks.length === 0, "plain: the plain arrow carried a charge");
    c.expect(!shot.during.charged && !ubowChargeOf(shooter.id) && shot.during.state === "ready", "plain: a plain draw armed the charge");
    c.expect(plainHurt !== undefined && plainHurt.damage >= 6 && plainHurt.damage <= 12.5, `plain: the arrow hurt ${f3(plainHurt?.damage)}, expected a vanilla full draw (6–12.5)`);
    c.expect(remainingTicks(shooter, ABILITY) === 0, "plain: a cooldown started");
    clearArrows(test);

    // Sneak + draw: armed while still drawing, and the arrow of the same draw carries the charge to the target.
    await placeTarget(test, target, TARGET_AT);
    n = reports.length;
    shot = await draw(test, shooter, AIM, true);
    await test.idle(FLIGHT);
    o = outcome(n, shooter, shot);
    const armedHurt = hurtsOf(target, shot.release - 1, system.currentTick, "projectile")[0];
    log(
      `arm ROW sneak: use started=${shot.started}; while drawing charged=${shot.during.charged} ledger=${String(shot.during.ledger)} state=${shot.during.state}; ` +
        `reports [${show(n)}]; arrow hurt ${f3(armedHurt?.damage)}; charge after ${ubowChargeOf(shooter.id)}`
    );
    c.expect(shot.started, "sneak: the draw did not start");
    c.expect(o.presses.length === 1 && o.presses[0].decision === "arm" && o.presses[0].via === "use" && o.presses[0].sneaking, `sneak: presses [${show(n)}], expected one sneaking arm`);
    c.expect(shot.during.charged && shot.during.ledger === true && shot.during.state === "armed", "sneak: not armed in the module, the world ledger and the state while drawing");
    c.expect(o.marks.length === 1, `sneak: ${o.marks.length} arrows carried the charge, expected the one of this draw`);
    c.expect(o.spent.length === 1 && o.spent[0].arrowId === o.arrowId, "sneak: the armed arrow did not spend the charge on the target");
    c.expect(near(armedHurt?.damage, ARMED_DAMAGE), `sneak: the armed arrow hurt ${f3(armedHurt?.damage)}, expected ${ARMED_DAMAGE}`);
    clearArrows(test);
    clearCooldown(shooter, ABILITY);

    // Sneak + Use aimed at a block: no itemUse for a custom item there (CNTR-XCX14), the interact before-event arms.
    n = reports.length;
    shooter.lookAtLocation(FLOOR_AIM, LookDuration.Continuous);
    shooter.isSneaking = true;
    await test.idle(4);
    const onBlock = shooter.useItemInSlotOnBlock(SLOT, FLOOR, Direction.Up, { x: 0.5, y: 1, z: 0.5 });
    await test.idle(3);
    const blockCharged = ubowChargeOf(shooter.id);
    shooter.stopUsingItem();
    shooter.isSneaking = false;
    await test.idle(FLIGHT);
    const blockPresses = since(n, "press", shooter.id);
    log(`arm ROW block: useItemInSlotOnBlock=${onBlock}; reports [${show(n)}]; charged three ticks in ${blockCharged}; charge after ${ubowChargeOf(shooter.id)}`);
    c.expect(blockPresses.some((p) => p.decision === "arm") && blockCharged, `block: sneak + Use at a block did not arm (presses [${show(n)}])`);
    clearArrows(test);

    // A second arming while armed does nothing; the arrow of that draw goes into the floor and keeps the charge.
    n = reports.length;
    shot = await draw(test, shooter, FLOOR_AIM, true);
    await test.idle(FLIGHT);
    o = outcome(n, shooter, shot);
    log(`arm ROW already: use started=${shot.started}; reports [${show(n)}]; charge after ${ubowChargeOf(shooter.id)}; cooldown ${remainingTicks(shooter, ABILITY)} ticks`);
    c.expect(o.presses.length === 1 && o.presses[0].decision === "already", `already: presses [${show(n)}], expected one "already"`);
    c.expect(ubowChargeOf(shooter.id) && o.spent.length === 0 && remainingTicks(shooter, ABILITY) === 0, "already: the charge or the cooldown moved");
  } finally {
    dropUbowCharge(shooter.id);
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
    clearArrows(test);
  }
  c.finish(test, "arm");
})
  .structureName(STRUCTURE)
  .maxTicks(700)
  .tag("andrew");

// ------------------------------------------------------------- AC2: a miss keeps the charge and starts no cooldown

const WALL_LO: Vector3 = { x: 1, y: 2, z: 4 };
const WALL_HI: Vector3 = { x: 5, y: 4, z: 4 };
const ASIDE: Vector3 = { x: 0, y: 2, z: 6 };

registerAsync("andrew", "ubow_ability_miss", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = await survivor(test, SHOOTER_AT, "ubab_miss_shooter", { immune: true });
  const target = await survivor(test, ASIDE, "ubab_miss_target", { boost: true });
  giveBow(shooter);
  let stand: Entity | undefined;
  const c = new Checks();
  const missRow = (label: string, from: number, o: ReturnType<typeof outcome>, why?: string): void => {
    const cd = remainingTicks(shooter, ABILITY);
    const own = o.misses.filter((m) => m.arrowId === o.arrowId);
    c.expect(o.marks.length === 1, `${label}: ${o.marks.length} arrows carried the charge, expected 1`);
    c.expect(own.length === 1 && (why === undefined || own[0].why === why), `${label}: the armed arrow was not settled as a miss${why === undefined ? "" : ` (${why})`}: [${show(from)}]`);
    c.expect(o.spent.length === 0, `${label}: the charge was spent`);
    c.expect(ubowChargeOf(shooter.id), `${label}: the charge is gone`);
    c.expect(cd === 0, `${label}: a cooldown of ${cd} ticks started`);
  };
  try {
    await test.idle(5);

    // An armed arrow into a wall.
    fill(dim, test, WALL_LO, WALL_HI, STONE);
    let n = reports.length;
    let shot = await draw(test, shooter, { x: 3.5, y: 3.0, z: 4.0 }, true);
    await test.idle(FLIGHT);
    let o = outcome(n, shooter, shot);
    log(`miss ROW wall: armed=${shot.during.charged}; reports [${show(n)}]; charge after ${ubowChargeOf(shooter.id)}; cooldown ${remainingTicks(shooter, ABILITY)}`);
    c.expect(o.presses.length === 1 && o.presses[0].decision === "arm", `wall: presses [${show(n)}], expected one arm`);
    missRow("wall", n, o, "block");
    fill(dim, test, WALL_LO, WALL_HI, AIR);
    clearArrows(test);

    // A plain draw now carries the kept charge, into a raised shield facing the shooter (probe-ubow row 6).
    target.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:shield"));
    await placeTarget(test, target, TARGET_AT);
    target.lookAtLocation(SHOOTER_EYE, LookDuration.Continuous);
    target.isSneaking = true;
    await test.idle(12);
    const wear0 = shieldWear(target);
    const hits0 = entityHits.get(target.id) ?? 0;
    const hp0 = hp(target);
    n = reports.length;
    shot = await draw(test, shooter, AIM, false);
    await test.idle(FLIGHT);
    o = outcome(n, shooter, shot);
    const shieldHurts = hurtsOf(target, shot.release - 1, system.currentTick);
    const wear1 = shieldWear(target);
    const hits1 = entityHits.get(target.id) ?? 0;
    log(
      `miss ROW shield: sneaking ${target.isSneaking}; reports [${show(n)}]; target hurts ${showHurts(shieldHurts)} hp ${f2(hp0)}->${f2(hp(target))}; ` +
        `projectileHitEntity ${hits1 - hits0}; shield ${wear0.note} -> ${wear1.note}; charge after ${ubowChargeOf(shooter.id)}; cooldown ${remainingTicks(shooter, ABILITY)}`
    );
    c.expect(shieldHurts.length === 0 && near(hp(target), hp0), `shield: the target was hurt ${showHurts(shieldHurts)}`);
    c.expect(hits1 > hits0, "shield: no projectileHitEntity on the target: the arrow never reached the shield");
    c.expect(wear1.damage > wear0.damage, `shield: the shield took no wear (${wear0.note} -> ${wear1.note}): it did not block`);
    missRow("shield", n, o, "entity");
    target.isSneaking = false;
    target.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, undefined);
    target.teleport(test.worldLocation(center(ASIDE)));
    clearArrows(test);

    // An armour stand: inanimate, never a successful hit.
    stand = test.spawn("minecraft:armor_stand", TARGET_AT);
    await test.idle(5);
    const standHits0 = entityHits.get(stand.id) ?? 0;
    n = reports.length;
    shot = await draw(test, shooter, AIM, false);
    await test.idle(FLIGHT);
    o = outcome(n, shooter, shot);
    log(`miss ROW stand: reports [${show(n)}]; projectileHitEntity on the stand ${(entityHits.get(stand.id) ?? 0) - standHits0}; stand valid ${stand.isValid}; charge after ${ubowChargeOf(shooter.id)}`);
    missRow("stand", n, o);
    if (stand.isValid) stand.remove();
    clearArrows(test);

    // The same charge, kept through three misses, lands on the player.
    await placeTarget(test, target, TARGET_AT);
    const hpHit = hp(target);
    n = reports.length;
    shot = await draw(test, shooter, AIM, false);
    await test.idle(FLIGHT);
    o = outcome(n, shooter, shot);
    const landed = hurtsOf(target, shot.release - 1, system.currentTick, "projectile")[0];
    const cd = remainingTicks(shooter, ABILITY);
    log(`miss ROW hit: reports [${show(n)}]; arrow hurt ${f3(landed?.damage)}; hp ${f2(hpHit)}->${f2(hp(target))}; charge after ${ubowChargeOf(shooter.id)}; cooldown ${cd}`);
    c.expect(o.marks.length === 1 && o.spent.length === 1 && o.spent[0].arrowId === o.arrowId, `hit: the kept charge was not spent by the next arrow: [${show(n)}]`);
    c.expect(near(landed?.damage, ARMED_DAMAGE), `hit: the arrow hurt ${f3(landed?.damage)}, expected ${ARMED_DAMAGE}`);
    c.expect(!ubowChargeOf(shooter.id) && cd > ARMED_COOLDOWN_TICKS - 30, `hit: charge ${ubowChargeOf(shooter.id)}, cooldown ${cd} ticks`);
  } finally {
    dropUbowCharge(shooter.id);
    if (stand?.isValid === true) stand.remove();
    fill(dim, test, WALL_LO, WALL_HI, AIR);
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
    clearArrows(test);
  }
  c.finish(test, "miss");
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ------------------------------------------------------------- AC3, AC4, AC6 (player): exactly 14 before armour

registerAsync("andrew", "ubow_ability_exact", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const shooter = await survivor(test, SHOOTER_AT, "ubab_exact_shooter", { immune: true });
  giveBow(shooter);
  const rows: Array<{ label: string; at: Vector3; want: number; p: SimulatedPlayer }> = [];
  for (const [label, x, kit, ench, want] of [
    ["bare", 1, [], undefined, ARMED_DAMAGE],
    ["iron", 3, IRON, undefined, 9.52],
    ["diamond+projprot4", 5, DIAMOND, ["projectile_protection", 4], 0.952],
  ] as Array<[string, number, Kit, readonly [string, number] | undefined, number]>) {
    const at = { x, y: 2, z: 4 };
    const p = await survivor(test, at, `ubab_${label.replace(/\W/g, "")}`, { boost: true });
    equip(p, kit, ench);
    rows.push({ label, at, want, p });
  }
  const aimAt = (at: Vector3): Vector3 => ({ x: at.x + 0.5, y: 3.0, z: at.z + 0.5 });
  const c = new Checks();
  try {
    await test.idle(5);

    // Negative control: an unarmed full draw on the bare target stays vanilla and starts nothing.
    const bare = rows[0];
    await placeTarget(test, bare.p, bare.at);
    let n = reports.length;
    let shot = await draw(test, shooter, aimAt(bare.at), false);
    await test.idle(FLIGHT);
    const control = hurtsOf(bare.p, shot.release - 1, system.currentTick, "projectile")[0];
    log(`exact ROW control: reports [${show(n)}]; unarmed arrow hurt ${f3(control?.damage)}; cooldown ${remainingTicks(shooter, ABILITY)}`);
    c.expect(control !== undefined && control.damage >= 6 && control.damage <= 12.5 && !near(control.damage, ARMED_DAMAGE), `control: an unarmed hit read ${f3(control?.damage)}, expected vanilla (6–12.5)`);
    c.expect(since(n, "mark", shooter.id).length === 0 && remainingTicks(shooter, ABILITY) === 0, "control: an unarmed shot carried a charge or started a cooldown");
    clearArrows(test);

    for (const row of rows) {
      clearCooldown(shooter, ABILITY);
      await placeTarget(test, row.p, row.at);
      const goal = afterArmour(ARMED_DAMAGE, defenceOf(row.p, EntityDamageCause.projectile));
      const sounds0 = visualStats().sounds;
      const bolts0 = bolts;
      const hp0 = hp(row.p);
      const others = [shooter, ...rows.filter((r) => r !== row).map((r) => r.p)];
      n = reports.length;
      shot = await draw(test, shooter, aimAt(row.at), true);
      const series = await hpSeries(test, row.p, FLIGHT);
      const o = outcome(n, shooter, shot);
      const hit = hurtsOf(row.p, shot.release - 1, system.currentTick, "projectile")[0];
      const lossAt = hit === undefined ? undefined : series.get(hit.tick + 2);
      const loss = lossAt === undefined ? undefined : hp0 - lossAt;
      const atSpend = o.arrowId === undefined ? undefined : cooldownAtSpend.get(o.arrowId);
      const strikes = visualStats().sounds - sounds0;
      const liveBolts = dim.getEntities({ type: BOLT, location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 48 }).length;
      const otherHurts = others.flatMap((p) => hurtsOf(p, shot.release - 1, system.currentTick)).filter((h) => h.cause !== "fireTick");
      const fires = fireBlocks(test);
      log(
        `exact ROW ${row.label}: f(14) by defenceOf ${f3(goal)}, expected ${f3(row.want)}; reports [${show(n)}]; arrow hurt ${f3(hit?.damage)}; ` +
          `hp ${f2(hp0)} -> ${f2(lossAt)} at hit+2 (loss ${f3(loss)}); cooldown at the spend ${atSpend ?? "-"} ticks, now ${remainingTicks(shooter, ABILITY)}; ` +
          `charge ${ubowChargeOf(shooter.id)} state ${ubowChargeState(shooter)}; strikes drawn ${strikes}; lightning_bolt spawned ${bolts - bolts0}, alive ${liveBolts}; ` +
          `super fire left ${superFireTicksLeft(row.p)}; other entities hurt ${showHurts(otherHurts)}; fire blocks ${fires}`
      );
      c.expect(o.presses.length === 1 && o.presses[0].decision === "arm", `${row.label}: presses [${show(n)}], expected one arm`);
      c.expect(near(goal, row.want), `${row.label}: f(14) through the target's defence is ${f3(goal)}, expected ${f3(row.want)}`);
      c.expect(o.marks.length === 1 && o.spent.length === 1 && o.spent[0].plan === "set" && o.spent[0].arrowId === o.arrowId, `${row.label}: not one spent "set" hit: [${show(n)}]`);
      c.expect(near(hit?.damage, row.want), `${row.label}: the hit read ${f3(hit?.damage)}, expected exactly ${f3(row.want)}`);
      c.expect(near(loss, row.want), `${row.label}: the target lost ${f3(loss)}, expected exactly ${f3(row.want)}`);
      c.expect(atSpend === ARMED_COOLDOWN_TICKS, `${row.label}: the cooldown read ${atSpend ?? "-"} ticks at the spend, expected ${ARMED_COOLDOWN_TICKS}`);
      c.expect(!ubowChargeOf(shooter.id) && ubowChargeState(shooter) === "cooldown", `${row.label}: the charge was not spent`);
      c.expect(strikes === 1, `${row.label}: ${strikes} strikes drawn, expected exactly 1`);
      c.expect(bolts - bolts0 === 0 && liveBolts === 0, `${row.label}: a real lightning_bolt appeared`);
      c.expect(o.spent[0]?.superFire === true && superFireTicksLeft(row.p) > 0, `${row.label}: Super Fire was not lit`);
      c.expect(otherHurts.length === 0, `${row.label}: another entity was hurt ${showHurts(otherHurts)}`);
      c.expect(fires === 0, `${row.label}: ${fires} fire blocks near the targets`);
      clearArrows(test);
    }
  } finally {
    dropUbowCharge(shooter.id);
    test.removeSimulatedPlayer(shooter);
    for (const r of rows) test.removeSimulatedPlayer(r.p);
    clearArrows(test);
  }
  c.finish(test, "exact");
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ------------------------------------------------------------- AC6 (mob): a golem, and a pig the hit kills

registerAsync("andrew", "ubow_ability_mob", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, SHOOTER_AT, "ubab_mob_shooter", { immune: true });
  giveBow(shooter);
  let golem: Entity | undefined;
  let pig: Entity | undefined;
  const c = new Checks();
  try {
    golem = test.spawnWithoutBehaviors("minecraft:iron_golem", TARGET_AT);
    watch(golem);
    await test.idle(CLEAR);
    const hp0 = hp(golem);
    let n = reports.length;
    let shot = await draw(test, shooter, { x: 3.5, y: 3.4, z: 4.5 }, true);
    const series = await hpSeries(test, golem, FLIGHT);
    let o = outcome(n, shooter, shot);
    const hit = hurtsOf(golem, shot.release - 1, system.currentTick, "projectile")[0];
    const after = hit === undefined ? undefined : series.get(hit.tick + 2);
    const atSpend = o.arrowId === undefined ? undefined : cooldownAtSpend.get(o.arrowId);
    log(
      `mob ROW iron_golem: reports [${show(n)}]; arrow hurt ${f3(hit?.damage)}; hp ${f2(hp0)} -> ${f2(after)} at hit+2; cooldown at the spend ${atSpend ?? "-"}; ` +
        `charge ${ubowChargeOf(shooter.id)}; super fire left ${superFireTicksLeft(golem)}`
    );
    c.expect(o.marks.length === 1 && o.spent.length === 1 && o.spent[0].plan === "set", `golem: not one spent "set" hit: [${show(n)}]`);
    c.expect(near(hit?.damage, ARMED_DAMAGE) && after !== undefined && near(hp0 - after, ARMED_DAMAGE), `golem: read ${f3(hit?.damage)}, lost ${f3(after === undefined ? undefined : hp0 - after)}, expected ${ARMED_DAMAGE}`);
    c.expect(atSpend === ARMED_COOLDOWN_TICKS && !ubowChargeOf(shooter.id), `golem: cooldown ${atSpend ?? "-"} at the spend, charge ${ubowChargeOf(shooter.id)}`);
    c.expect(o.spent[0]?.superFire === true, "golem: Super Fire was not lit");
    golem.remove();
    clearArrows(test);

    // f(14) = 14 against a pig's 10 HP: setHit's lethal plan writes 0 and the shooter's overkill kills it.
    clearCooldown(shooter, ABILITY);
    pig = test.spawnWithoutBehaviors("minecraft:pig", TARGET_AT);
    watch(pig);
    const pigId = pig.id;
    await test.idle(CLEAR);
    const pigHp = hp(pig);
    n = reports.length;
    shot = await draw(test, shooter, { x: 3.5, y: 2.45, z: 4.5 }, true);
    await test.idle(FLIGHT);
    o = outcome(n, shooter, shot);
    const died = deaths.get(pigId);
    const pigSpend = o.arrowId === undefined ? undefined : cooldownAtSpend.get(o.arrowId);
    log(
      `mob ROW pig_lethal: hp ${f2(pigHp)}; reports [${show(n)}]; hurts ${showHurts(hurtsOf(pig, shot.release - 1, system.currentTick))}; ` +
        `died ${died === undefined ? "no" : `${died.cause} by ${died.by === shooter.id ? "the shooter" : (died.by ?? "none")}`}; cooldown at the spend ${pigSpend ?? "-"}; charge ${ubowChargeOf(shooter.id)}`
    );
    c.expect(o.marks.length === 1 && o.spent.length === 1 && o.spent[0].plan === "lethal", `pig: not one spent "lethal" hit: [${show(n)}]`);
    c.expect(died !== undefined && died.cause === EntityDamageCause.entityAttack && died.by === shooter.id, "pig: not killed by the shooter's overkill");
    c.expect(pigSpend === ARMED_COOLDOWN_TICKS && !ubowChargeOf(shooter.id), `pig: cooldown ${pigSpend ?? "-"} at the spend, charge ${ubowChargeOf(shooter.id)}`);
  } finally {
    dropUbowCharge(shooter.id);
    if (golem?.isValid === true) golem.remove();
    if (pig?.isValid === true) pig.remove();
    test.removeSimulatedPlayer(shooter);
    clearArrows(test);
  }
  c.finish(test, "mob");
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------------------- AC7: three HUD states, in both shipped languages

function parseLang(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "").replace(/\t#.*$/, "");
    const eq = line.indexOf("=");
    if (line.startsWith("#") || eq <= 0) continue;
    out.set(line.slice(0, eq), line.slice(eq + 1));
  }
  return out;
}

/** The client's rendering of a rawtext: `translate` through the lang map, `%s` filled in order by `with`. */
function render(m: RawMessage | undefined, lang: Map<string, string>): string {
  if (m === undefined) return "";
  if (m.rawtext !== undefined) return m.rawtext.map((r) => render(r, lang)).join("");
  if (m.text !== undefined) return m.text;
  if (m.translate === undefined) return "";
  const args = m.with === undefined ? [] : Array.isArray(m.with) ? m.with : (m.with.rawtext ?? []).map((r) => render(r, lang));
  let i = 0;
  return (lang.get(m.translate) ?? m.translate).replace(/%(\d+\$)?s/g, (_all: string, pos: string | undefined) => (pos === undefined ? args[i++] : args[Number(pos.slice(0, -1)) - 1]) ?? "");
}

const firstKey = (m: RawMessage | undefined): string => m?.rawtext?.[0]?.translate ?? "none";

registerAsync("andrew", "ubow_ability_hud", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, SHOOTER_AT, "ubab_hud_shooter", { immune: true });
  const target = await survivor(test, TARGET_AT, "ubab_hud_target", { boost: true });
  giveBow(shooter);
  const langs = { en_US: parseLang(EN_US), ru_RU: parseLang(RU_RU) };
  const c = new Checks();
  try {
    await placeTarget(test, target, TARGET_AT);
    const ready = hudMessage(shooter);
    let n = reports.length;
    let shot = await draw(test, shooter, AIM, true);
    const armed = shot.during.hud;
    await test.idle(FLIGHT);
    const cooling = hudMessage(shooter);
    const spent = since(n, "spent", shooter.id);
    log(`hud ROW arm and hit: reports [${show(n)}]`);

    // Arming during the cooldown is refused; the draw still shoots, a plain arrow.
    await placeTarget(test, target, TARGET_AT);
    n = reports.length;
    shot = await draw(test, shooter, AIM, true);
    await test.idle(FLIGHT);
    const o = outcome(n, shooter, shot);
    const refusedHud = hudMessage(shooter);
    log(`hud ROW refused: reports [${show(n)}]; charge ${ubowChargeOf(shooter.id)}; hud ${firstKey(refusedHud)}`);

    const states = [
      ["ready", ready, "andrew.underwater_bow.hud_ready"],
      ["armed", armed, "andrew.underwater_bow.hud_armed"],
      ["cooldown", cooling, "andrew.underwater_bow.hud_cooldown"],
    ] as const;
    for (const [lang, map] of Object.entries(langs)) {
      const name = map.get(`${UNDERWATER_BOW.nameKey}.name`) ?? "?";
      const texts = states.map(([, m]) => render(m, map));
      log(`hud ROW ${lang}: ${states.map(([state], i) => `${state} "${texts[i]}"`).join(" | ")}`);
      c.expect(new Set(texts).size === 3, `${lang}: the three states do not read differently: ${texts.join(" | ")}`);
      c.expect(texts.every((t) => t.includes(name) && !t.includes("%") && !t.includes("andrew.")), `${lang}: a state is unresolved or lacks the bow's name "${name}"`);
      c.expect(/\b(29|30)\b/.test(texts[2]), `${lang}: the cooldown line "${texts[2]}" does not show the seconds left`);
    }
    states.forEach(([state, m, key]) => c.expect(firstKey(m) === key, `${state}: the HUD sent ${firstKey(m)}, expected ${key}`));
    c.expect(render(ready, langs.en_US) !== render(ready, langs.ru_RU), "the ready line is the same in both languages");
    c.expect(spent.length === 1, "the armed draw did not land its charge");
    c.expect(o.presses.length === 1 && o.presses[0].decision === "refused" && o.marks.length === 0 && o.spent.length === 0, `refused: [${show(n)}], expected one refused press and a plain arrow`);
    c.expect(!ubowChargeOf(shooter.id) && firstKey(refusedHud) === "andrew.underwater_bow.hud_cooldown", "refused: armed during the cooldown, or the HUD left it");
  } finally {
    dropUbowCharge(shooter.id);
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
    clearArrows(test);
  }
  c.finish(test, "hud");
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------------------- AC5: the charge across a server restart

const RESTART_KEY = "andrew:gt_ubab_restart";

interface RestartSeed {
  playerId: string;
  savedAt: number;
}

/**
 * The charge is armed by the gesture and its arrow goes into the floor, a miss. A SimulatedPlayer does not survive a
 * restart and could not come back with the same id, so the check reads what the freshly loaded module holds for it.
 */
registerAsync("andrew", "ubow_ability_restart_seed", async (test: Test): Promise<void> => {
  const p = await survivor(test, SHOOTER_AT, "ubab_restart", { immune: true });
  giveBow(p);
  await test.idle(5);
  const n = reports.length;
  const shot = await draw(test, p, FLOOR_AIM, true);
  await test.idle(FLIGHT);
  const o = outcome(n, p, shot);
  const ledger = world.getDynamicProperty(armedKey(p.id));
  const seed: RestartSeed = { playerId: p.id, savedAt: Date.now() };
  log(`restart_seed RESULT ${p.id}: reports [${show(n)}]; charge ${ubowChargeOf(p.id)}; world ledger ${String(ledger)}`);
  test.assert(o.presses.length === 1 && o.presses[0].decision === "arm", `the gesture did not arm: [${show(n)}]`);
  test.assert(o.spent.length === 0 && ubowChargeOf(p.id) && ledger === true, "the seed's charge is not held in the module and the world ledger");
  world.setDynamicProperty(RESTART_KEY, JSON.stringify(seed));
  test.removeSimulatedPlayer(p);
  clearArrows(test);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");

registerAsync("andrew", "ubow_ability_restart_check", async (test: Test): Promise<void> => {
  const raw = world.getDynamicProperty(RESTART_KEY);
  test.assert(typeof raw === "string", "no seed: ubow_ability_restart_seed did not run in this world before the restart");
  const seed = JSON.parse(raw as string) as RestartSeed;
  const ledger = world.getDynamicProperty(armedKey(seed.playerId));
  const charged = ubowChargeOf(seed.playerId);
  let fresh: SimulatedPlayer | undefined;
  try {
    fresh = await survivor(test, SHOOTER_AT, "ubab_restart_fresh", { immune: true });
    giveBow(fresh);
    await test.idle(3);
    const freshState = ubowChargeState(fresh);
    const freshHud = firstKey(hudMessage(fresh));
    log(
      `restart_check RESULT ${((Date.now() - seed.savedAt) / 1000).toFixed(1)} s since the seed; world ledger for ${seed.playerId} ${String(ledger)}; ` +
        `module after the boot: charged ${charged}; a fresh player (${fresh.id}) ${freshState}, hud ${freshHud}`
    );
    test.assert(ledger === true, "the charge's world ledger did not survive the restart");
    test.assert(charged, "the module loaded after the restart does not read the seed player as armed");
    test.assert(fresh.id !== seed.playerId && freshState === "ready" && freshHud === "andrew.underwater_bow.hud_ready", "control: a fresh player reads armed");
  } finally {
    dropUbowCharge(seed.playerId);
    world.setDynamicProperty(RESTART_KEY, undefined);
    if (fresh !== undefined) test.removeSimulatedPlayer(fresh);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(300)
  .tag("andrew");
