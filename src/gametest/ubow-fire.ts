// Scenarios for the Underwater Bow's two fires (src/ubow/fire.ts; spec §1; L0-uwbw-r002, L0-uwbw-esfr, L0-xasm38).
// SimulatedPlayers shoot the real andrew:underwater_bow; Super Fire is lit through igniteSuperFire(), the call the
// armed hit makes. Witnesses: the engine's onfire component and entityHurt, and the module's own reports. Every
// scenario logs "[gametest] ubow-fire <tag> ROW …" and fails on the first scenario-end check that does not hold.

import { BlockVolume, type Container, type Dimension, EnchantmentType, type Entity, GameMode, ItemStack, type Player, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { UNDERWATER_BOW } from "../legendary/registry";
import { NORMAL_FIRE_SECONDS, SUPER_FIRE_SECONDS, type UbowFireReport, igniteSuperFire, observeUbowFire, registerUnderwaterBowFire, superFireTicksLeft } from "../ubow/fire";

registerUnderwaterBowFire();

const STRUCTURE = "andrew:platform";
const UBOW = UNDERWATER_BOW.itemId;
const BOW = "minecraft:bow";
const ARROW = "minecraft:arrow";
const GLASS = "minecraft:glass";
const WATER = "minecraft:water";
const AIR = "minecraft:air";
const SLOT = 0;
const AMMO_SLOT = 9;
/** probe-ubow row 3: 25 ticks of draw is a full-power shot. */
const FULL_DRAW = 25;
const NORMAL_TICKS = NORMAL_FIRE_SECONDS * 20;
const SUPER_TICKS = SUPER_FIRE_SECONDS * 20;
/** Waits out any hurt window and lets knockback settle. */
const CLEAR = 22;
/** probe-ubow row 4: setOnFire(2) reads 39 at +1 and 0 at +40; one tick of slack each side. */
const BURN_SLACK = 2;

const log = (msg: string): void => console.warn(`[gametest] ubow-fire ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined || Number.isNaN(n) ? "-" : n.toFixed(2));
const center = (v: Vector3): Vector3 => ({ x: v.x + 0.5, y: v.y, z: v.z + 0.5 });

// ------------------------------------------------------------------ witnesses

const reports: UbowFireReport[] = [];
observeUbowFire((r) => reports.push(r));
const reportsOf = <T extends UbowFireReport["type"]>(from: number, targetId: string, type: T): Array<Extract<UbowFireReport, { type: T }>> =>
  reports.slice(from).filter((r): r is Extract<UbowFireReport, { type: T }> => r.type === type && r.targetId === targetId);

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
const showHurts = (hs: Hurt[], origin: number): string => `[${hs.map((h) => `${h.cause} ${f2(h.damage)}@+${h.tick - origin}`).join(" ")}]`;

function fireTicks(e: Entity): number {
  try {
    return e.getComponent("minecraft:onfire")?.onFireTicksRemaining ?? 0;
  } catch {
    return Number.NaN;
  }
}

function wet(e: Entity): boolean {
  try {
    return e.isInWater;
  } catch {
    return false;
  }
}

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

/** Fire ticks and water, per tick, for each entity: one sample per tick from the call on. */
interface Sample {
  tick: number;
  fire: number;
  wet: boolean;
}
async function sample(test: Test, entities: Entity[], ticks: number): Promise<Map<string, Sample[]>> {
  const out = new Map<string, Sample[]>(entities.map((e) => [e.id, []]));
  for (let i = 0; i < ticks; i++) {
    await test.idle(1);
    for (const e of entities) out.get(e.id)?.push({ tick: system.currentTick, fire: fireTicks(e), wet: wet(e) });
  }
  return out;
}
const at = (s: Sample[] | undefined, tick: number): Sample | undefined => s?.find((x) => x.tick === tick);
/** The last tick that still read fire, or undefined when none did. */
const lastBurning = (s: Sample[] | undefined): number | undefined => [...(s ?? [])].reverse().find((x) => x.fire > 0)?.tick;
const firstOut = (s: Sample[] | undefined, from: number): number | undefined => s?.find((x) => x.tick >= from && x.fire === 0)?.tick;
const showFire = (s: Sample[] | undefined, origin: number, every = 10): string =>
  (s ?? [])
    .filter((x) => (x.tick - origin) % every === 0 || x.tick - origin === 1)
    .map((x) => `+${x.tick - origin}:${x.fire}${x.wet ? "w" : ""}`)
    .join(" ");

// ------------------------------------------------------------------ helpers

function inventoryOf(p: Player): Container {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) throw new Error(`${p.name} has no inventory`);
  return c;
}

/** A Survival SimulatedPlayer on 40 HP that breathes under water; `immune` adds Resistance V. */
async function survivor(test: Test, rel: Vector3, name: string, immune = false): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  p.addEffect("water_breathing", 20000, { showParticles: false });
  if (immune) p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return p;
}

function bow(id: string, flame: boolean): ItemStack {
  const stack = new ItemStack(id);
  if (flame) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("flame"), level: 1 });
  return stack;
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
  /** The tick the arrow's hurt landed on the target. */
  hit: number | undefined;
  damage: number | undefined;
  samples: Map<string, Sample[]>;
}

/** A full-draw shot from `from` at `aim` (test-relative), then `ticks` ticks of fire samples on `target`. */
async function shoot(test: Test, shooter: SimulatedPlayer, target: Entity, stack: ItemStack, from: Vector3, aim: Vector3, ticks: number): Promise<Shot> {
  shooter.teleport(test.worldLocation(center(from)), { rotation: { x: 0, y: 0 } });
  shooter.setItem(stack, SLOT, true);
  inventoryOf(shooter).setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
  await test.idle(2);
  shooter.lookAtLocation(aim, LookDuration.Continuous);
  await test.idle(4);
  const started = await startUse(test, shooter);
  await test.idle(FULL_DRAW);
  const release = system.currentTick;
  shooter.stopUsingItem();
  const samples = await sample(test, [target], ticks);
  const landed = hurtsOf(target, release - 1, release + ticks, "projectile")[0];
  return { started, release, hit: landed?.tick, damage: landed?.damage, samples };
}

function fill(dim: Dimension, test: Test, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(test.worldBlockLocation(a), test.worldBlockLocation(b)), block);
}

function clearArrows(test: Test): void {
  for (const e of test.getDimension().getEntities({ location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 40, type: ARROW })) {
    if (e.isValid) e.remove();
  }
}

// ------------------------------------------------------------- AC1: the 2 s fire of an ordinary hit

const SHOOTER_AT: Vector3 = { x: 3, y: 2, z: 0 };
const TARGET_AT: Vector3 = { x: 3, y: 2, z: 4 };
/** Test-relative, mid-body of the target: lookAtLocation takes a relative point (probe-ubow row 1, 53 of 53 hits). */
const AIM: Vector3 = { x: 3.5, y: 3.0, z: 4.5 };

registerAsync("andrew", "ubow_fire_normal_hit", async (test: Test): Promise<void> => {
  const shooter = await survivor(test, SHOOTER_AT, "ubowf_shooter", true);
  const target = await survivor(test, TARGET_AT, "ubowf_target");
  watch(target);
  const failures: string[] = [];
  const plans = [
    { label: "underwater_bow", item: UBOW, flame: false, ticks: 70 },
    { label: "vanilla_bow_control", item: BOW, flame: false, ticks: 70 },
    { label: "underwater_bow_flame", item: UBOW, flame: true, ticks: 130 },
  ];
  try {
    await test.idle(5);
    for (const plan of plans) {
      target.teleport(test.worldLocation(center(TARGET_AT)), { rotation: { x: 0, y: 180 } });
      target.extinguishFire(false);
      target.getComponent("minecraft:health")?.resetToMaxValue();
      await test.idle(CLEAR);
      const n = reports.length;
      const shot = await shoot(test, shooter, target, bow(plan.item, plan.flame), SHOOTER_AT, AIM, plan.ticks);
      clearArrows(test);
      const s = shot.samples.get(target.id);
      const normal = reportsOf(n, target.id, "normal");
      const hit = shot.hit;
      const fireAfterHit = hit === undefined ? undefined : at(s, hit + 1)?.fire;
      const maxFire = Math.max(0, ...(s ?? []).map((x) => x.fire));
      const last = lastBurning(s);
      const burn = hit === undefined || last === undefined ? 0 : last - hit + 1;
      const burns = hit === undefined ? [] : hurtsOf(target, hit, hit + plan.ticks, "fireTick");
      log(
        `normal ROW ${plan.label}: use started=${shot.started}; arrow hurt ${f2(shot.damage)} at release+${hit === undefined ? "-" : hit - shot.release}; ` +
          `module reports [${normal.map((r) => `normal fireBefore=${r.fireBefore} set=${r.set ?? "kept"} ok=${String(r.ok)}`).join("; ")}]; ` +
          `fire ticks at hit+1 ${fireAfterHit ?? "-"}, max ${maxFire}, burning for ${burn} ticks; burns ${showHurts(burns, hit ?? shot.release)}; ` +
          `series ${showFire(s, hit ?? shot.release)}`
      );
      if (hit === undefined) {
        failures.push(`${plan.label}: the arrow never hurt the target`);
        continue;
      }
      if (plan.label === "underwater_bow") {
        if (normal.length !== 1 || normal[0].set !== NORMAL_TICKS || normal[0].ok !== true) failures.push(`${plan.label}: expected one normal report setting ${NORMAL_TICKS} ticks, got ${normal.length}`);
        if (Math.abs(burn - NORMAL_TICKS) > BURN_SLACK) failures.push(`${plan.label}: burned ${burn} ticks, expected ${NORMAL_TICKS} ± ${BURN_SLACK} (2 s)`);
        if (burns.length === 0) failures.push(`${plan.label}: the fire dealt no fireTick damage`);
      } else if (plan.label === "vanilla_bow_control") {
        if (normal.length !== 0) failures.push(`${plan.label}: a vanilla bow's arrow got the module's fire`);
        if (maxFire !== 0) failures.push(`${plan.label}: the target burned ${maxFire} ticks after a vanilla arrow`);
      } else {
        // Flame's own 5 s (probe-ubow row 3: 99 ticks) must neither be cut to 2 s nor have 2 s added to it.
        if (Math.abs(burn - SUPER_TICKS) > BURN_SLACK) failures.push(`${plan.label}: burned ${burn} ticks, expected Flame's ${SUPER_TICKS} ± ${BURN_SLACK}`);
      }
      await test.idle(plan.ticks > 100 ? 5 : 20);
    }
  } finally {
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
    clearArrows(test);
  }
  log(`normal RESULT ${failures.length === 0 ? "pass" : `fail: ${failures.join(" | ")}`}`);
  test.assert(failures.length === 0, failures.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

// ------------------------------------------------------------- AC2: water puts out the ordinary fire, not Super Fire

/** Three 1×2 water columns in glass at z=5: x=1 for the normal-hit target, x=3 for a pig, x=5 for the Super Fire target. */
const BOX_LO: Vector3 = { x: 0, y: 2, z: 4 };
const BOX_HI: Vector3 = { x: 6, y: 4, z: 6 };
const COLUMNS = [1, 3, 5];
const NEAR_TARGET: Vector3 = { x: 3, y: 2, z: 2 };
const NEAR_AIM: Vector3 = { x: 3.5, y: 3.0, z: 2.5 };
const SUPER_DRY: Vector3 = { x: 5, y: 2, z: 1 };
const WATCH_WET = 125;

registerAsync("andrew", "ubow_fire_water", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  fill(dim, test, BOX_LO, BOX_HI, GLASS);
  for (const x of COLUMNS) {
    fill(dim, test, { x, y: 2, z: 5 }, { x, y: 3, z: 5 }, WATER);
    fill(dim, test, { x, y: 4, z: 5 }, { x, y: 4, z: 5 }, AIR);
  }
  const shooter = await survivor(test, SHOOTER_AT, "ubowf_wshooter", true);
  const normal = await survivor(test, NEAR_TARGET, "ubowf_wnormal");
  const hot = await survivor(test, SUPER_DRY, "ubowf_wsuper");
  watch(normal);
  watch(hot);
  let pig: Entity | undefined;
  const failures: string[] = [];
  try {
    await test.idle(CLEAR);
    const n = reports.length;
    // The normal fire comes from a real hit of the bow; Super Fire is lit beside it on land in the same tick.
    normal.teleport(test.worldLocation(center(NEAR_TARGET)), { rotation: { x: 0, y: 180 } });
    const shot = await shoot(test, shooter, normal, bow(UBOW, false), SHOOTER_AT, NEAR_AIM, 3);
    clearArrows(test);
    const lit = system.currentTick;
    igniteSuperFire(hot, SUPER_FIRE_SECONDS);
    await test.idle(5);
    const dryNormal = fireTicks(normal);
    const dryHot = fireTicks(hot);
    const dryLeft = superFireTicksLeft(hot);

    // Both into water in the same tick; a pig is lit straight in water.
    const dunk = system.currentTick;
    normal.teleport(test.worldLocation({ x: 1.5, y: 2, z: 5.5 }));
    hot.teleport(test.worldLocation({ x: 5.5, y: 2, z: 5.5 }));
    pig = test.spawnWithoutBehaviors("minecraft:pig", { x: 3, y: 2, z: 5 });
    watch(pig);
    const pigHp0 = hp(pig);
    igniteSuperFire(pig, SUPER_FIRE_SECONDS);
    const samples = await sample(test, [normal, hot, pig], WATCH_WET);
    const end = system.currentTick;

    const normalReports = reportsOf(n, normal.id, "normal");
    const sNormal = samples.get(normal.id);
    const sHot = samples.get(hot.id);
    const sPig = samples.get(pig.id);
    const normalOut = firstOut(sNormal, dunk + 1);
    const normalBurnsWet = hurtsOf(normal, dunk + 1, end, "fireTick");
    const hotBurns = reportsOf(n, hot.id, "burn");
    const hotHurts = hurtsOf(hot, dunk, end, "fireTick");
    const hotEnd = reportsOf(n, hot.id, "end");
    const pigBurns = reportsOf(n, pig.id, "burn");
    const pigHurts = hurtsOf(pig, dunk, end, "fireTick");
    const pigLost = pigHp0 - hp(pig);
    const allWet = (s: Sample[] | undefined): boolean => (s ?? []).slice(2).every((x) => x.wet);

    log(
      `water ROW normal: arrow hurt ${f2(shot.damage)} at release+${shot.hit === undefined ? "-" : shot.hit - shot.release}; reports [${normalReports.map((r) => `set=${r.set ?? "kept"} ok=${String(r.ok)}`).join("; ")}]; ` +
        `fire on land ${dryNormal}; into water at +0: out at +${normalOut === undefined ? "never" : normalOut - dunk}; fireTick after +1 ${showHurts(normalBurnsWet, dunk)}; in water ${allWet(sNormal)}; series ${showFire(sNormal, dunk)}`
    );
    log(
      `water ROW super: lit at dunk-${dunk - lit}, engine fire on land ${dryHot}, Super Fire left ${dryLeft}; burns [${hotBurns.map((b) => `+${b.tick - lit}${b.inWater ? "w" : "dry"} applied=${String(b.applied)}`).join(" ")}]; ` +
        `fireTick hurts in water ${showHurts(hotHurts, lit)}; end [${hotEnd.map((e) => `${e.reason} ${e.burns} burns @+${e.tick - lit}`).join("; ")}]; in water ${allWet(sHot)}; series ${showFire(sHot, dunk)}`
    );
    log(
      `water ROW pig: lit in water; burns [${pigBurns.map((b) => `+${b.tick - dunk}${b.inWater ? "w" : "dry"} applied=${String(b.applied)}`).join(" ")}]; fireTick hurts ${showHurts(pigHurts, dunk)}; ` +
        `hp lost ${f2(pigLost)}; in water ${allWet(sPig)}`
    );

    if (shot.hit === undefined || normalReports.length !== 1) failures.push(`normal: the bow's hit did not light the ordinary fire (hit=${String(shot.hit)}, reports ${normalReports.length})`);
    if (!(dryNormal > 0)) failures.push(`normal: not burning on land before the water (fire ${dryNormal})`);
    if (!(dryLeft > 0)) failures.push(`super: no Super Fire on land before the water (left ${dryLeft})`);
    if (!allWet(sNormal) || !allWet(sHot) || !allWet(sPig)) failures.push("a target was not in water for the whole watch");
    if (normalOut === undefined || normalOut - dunk > 2) failures.push(`normal: water did not put the ordinary fire out within 2 ticks (out at ${normalOut === undefined ? "never" : `+${normalOut - dunk}`})`);
    if (normalBurnsWet.length !== 0) failures.push(`normal: ${normalBurnsWet.length} fireTick hurt(s) in water after the fire went out`);
    if (hotBurns.length !== SUPER_FIRE_SECONDS || !hotBurns.every((b) => b.inWater && b.applied)) failures.push(`super: ${hotBurns.length} burns, expected ${SUPER_FIRE_SECONDS}, all in water and applied`);
    if (hotHurts.length !== SUPER_FIRE_SECONDS || !hotHurts.every((h) => Math.abs(h.damage - 1) < 0.01)) failures.push(`super: ${hotHurts.length} fireTick hurts in water, expected ${SUPER_FIRE_SECONDS} × 1.00`);
    if (hotEnd.length !== 1 || hotEnd[0].reason !== "spent") failures.push("super: the record did not end as spent");
    if (pigBurns.length !== SUPER_FIRE_SECONDS || pigHurts.length !== SUPER_FIRE_SECONDS || Math.abs(pigLost - SUPER_FIRE_SECONDS) > 0.01) {
      failures.push(`pig: ${pigBurns.length} burns, ${pigHurts.length} hurts, ${f2(pigLost)} HP lost; expected ${SUPER_FIRE_SECONDS} each`);
    }
  } finally {
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(normal);
    test.removeSimulatedPlayer(hot);
    if (pig?.isValid === true) pig.remove();
    clearArrows(test);
    fill(dim, test, BOX_LO, BOX_HI, AIR);
  }
  log(`water RESULT ${failures.length === 0 ? "pass" : `fail: ${failures.join(" | ")}`}`);
  test.assert(failures.length === 0, failures.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ------------------------------------------------------------- AC3: 5 s of ordinary burn damage; two fires do not add

const SUPER_AT: Vector3 = { x: 1, y: 2, z: 1 };
const VANILLA_AT: Vector3 = { x: 5, y: 2, z: 1 };
const BOTH_AT: Vector3 = { x: 3, y: 2, z: 5 };
/** The overlap target's vanilla fire: longer than Super Fire, so the longer one has to burn on after the window. */
const LONG_FIRE_SECONDS = 8;
const OVERLAP_DELAY = 5;
const WATCH_DRY = 185;

registerAsync("andrew", "ubow_fire_super", async (test: Test): Promise<void> => {
  const hot = await survivor(test, SUPER_AT, "ubowf_super");
  const control = await survivor(test, VANILLA_AT, "ubowf_vanilla");
  const both = await survivor(test, BOTH_AT, "ubowf_both");
  for (const p of [hot, control, both]) watch(p);
  const failures: string[] = [];
  try {
    await test.idle(CLEAR);
    const n = reports.length;
    const t0 = system.currentTick;
    const vanillaOk = control.setOnFire(SUPER_FIRE_SECONDS, true);
    const longOk = both.setOnFire(LONG_FIRE_SECONDS, true);
    igniteSuperFire(hot, SUPER_FIRE_SECONDS);
    await test.idle(OVERLAP_DELAY);
    const tBoth = system.currentTick;
    const bothFireBefore = fireTicks(both);
    igniteSuperFire(both, SUPER_FIRE_SECONDS);
    const samples = await sample(test, [hot, control, both], WATCH_DRY);
    const end = system.currentTick;

    // Super Fire alone, against the vanilla 5 s control.
    const hotBurns = reportsOf(n, hot.id, "burn");
    const hotHurts = hurtsOf(hot, t0, end, "fireTick");
    const hotEnd = reportsOf(n, hot.id, "end");
    const hotSuppressed = reportsOf(n, hot.id, "suppressed");
    const sHot = samples.get(hot.id);
    const ctlHurts = hurtsOf(control, t0, end, "fireTick");
    const burnTicks = hotBurns.map((b) => b.tick - t0);
    const expectedTicks = [1, 2, 3, 4, 5].map((k) => k * 20);
    log(
      `super ROW alone: burns at [${burnTicks.map((t) => `+${t}`).join(" ")}]; fireTick hurts ${showHurts(hotHurts, t0)}; vanilla flames cancelled ${hotSuppressed.length}; ` +
        `end [${hotEnd.map((e) => `${e.reason} ${e.burns} burns @+${e.tick - t0}`).join("; ")}]; left at the end ${superFireTicksLeft(hot)}; series ${showFire(sHot, t0)}`
    );
    log(`super ROW vanilla control setOnFire(${SUPER_FIRE_SECONDS})=${String(vanillaOk)}: fireTick hurts ${showHurts(ctlHurts, t0)}`);

    if (burnTicks.join() !== expectedTicks.join()) failures.push(`alone: burns at [${burnTicks.join(",")}], expected [${expectedTicks.join(",")}]`);
    if (hotHurts.length !== SUPER_FIRE_SECONDS || !hotHurts.every((h) => burnTicks.includes(h.tick - t0))) failures.push(`alone: ${hotHurts.length} fireTick hurts landed, expected exactly the ${SUPER_FIRE_SECONDS} burns`);
    if (hotEnd.length !== 1 || hotEnd[0].reason !== "spent" || hotEnd[0].tick - t0 !== SUPER_TICKS) failures.push(`alone: the record did not end as spent at +${SUPER_TICKS}`);
    if (hurtsOf(hot, t0 + SUPER_TICKS, end, "fireTick").length !== 0) failures.push("alone: burning after 5 s");
    if (!vanillaOk || ctlHurts.length !== SUPER_FIRE_SECONDS) failures.push(`control: vanilla ${SUPER_FIRE_SECONDS} s dealt ${ctlHurts.length} burns, the probe measured ${SUPER_FIRE_SECONDS}`);
    const perHit = (hs: Hurt[]): string => [...new Set(hs.map((h) => f2(h.damage)))].join("/");
    if (perHit(hotHurts) !== perHit(ctlHurts) || perHit(hotHurts) !== "1.00") failures.push(`alone: a burn deals ${perHit(hotHurts)}, vanilla burning ${perHit(ctlHurts)}`);

    // Vanilla 8 s, then Super Fire 5 s on the same target.
    const sBoth = samples.get(both.id);
    const windowEnd = tBoth + SUPER_TICKS;
    const bothBurns = reportsOf(n, both.id, "burn");
    const bothSuppressed = reportsOf(n, both.id, "suppressed");
    const inWindow = hurtsOf(both, tBoth, windowEnd, "fireTick");
    const afterWindow = hurtsOf(both, windowEnd, end, "fireTick");
    const all = hurtsOf(both, t0 - 1, end, "fireTick");
    const out = firstOut(sBoth, windowEnd + 1);
    const additive = Math.ceil(LONG_FIRE_SECONDS) + SUPER_FIRE_SECONDS;
    log(
      `super ROW overlap: setOnFire(${LONG_FIRE_SECONDS})=${String(longOk)}, ${bothFireBefore} ticks left when Super Fire was lit at +${tBoth - t0}; ` +
        `in the window ${showHurts(inWindow, t0)} (vanilla cancelled ${bothSuppressed.length}, module burns ${bothBurns.length}); after it ${showHurts(afterWindow, t0)}; ` +
        `fire out at +${out === undefined ? "never" : out - t0}; all fireTick ${all.length} (adding the two fires would be ${additive}); series ${showFire(sBoth, t0)}`
    );
    const bothBurnTicks = new Set(bothBurns.map((b) => b.tick));
    if (!longOk || !(bothFireBefore > SUPER_TICKS)) failures.push(`overlap: the vanilla fire was not longer than Super Fire (${bothFireBefore} ticks)`);
    if (inWindow.length !== SUPER_FIRE_SECONDS || !inWindow.every((h) => bothBurnTicks.has(h.tick))) failures.push(`overlap: ${inWindow.length} burns landed in the window, expected only the ${SUPER_FIRE_SECONDS} of Super Fire`);
    if (bothSuppressed.length === 0) failures.push("overlap: no vanilla burn was cancelled in the window: the case did not happen");
    if (afterWindow.length === 0 || !(at(sBoth, windowEnd + 1)?.fire ?? 0)) failures.push("overlap: the longer vanilla fire did not burn on after the window");
    if (out === undefined || Math.abs(out - t0 - LONG_FIRE_SECONDS * 20) > BURN_SLACK) failures.push(`overlap: the fire went out at ${out === undefined ? "never" : `+${out - t0}`}, expected the longer ${LONG_FIRE_SECONDS * 20} ticks`);
    if (all.length >= additive) failures.push(`overlap: ${all.length} burns, as many as two fires added`);
  } finally {
    for (const p of [hot, control, both]) test.removeSimulatedPlayer(p);
  }
  log(`super RESULT ${failures.length === 0 ? "pass" : `fail: ${failures.join(" | ")}`}`);
  test.assert(failures.length === 0, failures.join(" | "));
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");
