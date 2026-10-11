// TRDT-DMG-01 scenarios for the trident's hits (src/trident/damage.ts; spec §02 item 1; L0-trdt-r002, L0-trdt-a002,
// L0-adr-twlt). SimulatedPlayers swing the real andrew:above_water_trident; a throw is the gametest pack's
// snowball-runtime body andrew:probe_trident_thrown carrying andrew:tr.throw, shot with the thrower as owner, until the
// throw itself exists (TRDT-THROW-01). Witnesses: health read around each hit, the engine's entityHurt, the module's own
// reports, the visuals' sound counter and lightning_bolt entities. Every scenario logs
// "[gametest] trident-damage <tag> ROW …" and fails on the first scenario-end check that does not hold.

import {
  Difficulty,
  type Entity,
  EntityDamageCause,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { TRIDENT } from "../legendary/registry";
import { THROWN_BASE, THROW_ID_PROPERTY, TRIDENT_BONUS, type TridentReport, observeTrident, registerTridentDamage, thrownHit } from "../trident/damage";
import { visualStats } from "../storm/visuals";

registerTridentDamage();

const STRUCTURE = "andrew:platform";
const AWT = TRIDENT.itemId;
const VANILLA = "minecraft:trident";
const VANILLA_THROWN = "minecraft:thrown_trident";
const BODY = "andrew:probe_trident_thrown";
const BOLT = "minecraft:lightning_bolt";
/** probe-trident P7: a vanilla throw leaves at 3.88–4.00 blocks/tick. */
const THROW_SPEED = 3.9;
/** Waits out any hurt window and lets knockback settle. */
const CLEAR = 22;
/** R-trdt-002 / AC4: no lightning entity for this many ticks after a hit. */
const BOLT_WATCH = 40;
const TOL = 0.01;
const IRON_KIT: Array<[string, string]> = [
  ["slot.armor.head", "iron_helmet"],
  ["slot.armor.chest", "iron_chestplate"],
  ["slot.armor.legs", "iron_leggings"],
  ["slot.armor.feet", "iron_boots"],
];

const log = (msg: string): void => console.warn(`[gametest] trident-damage ${msg}`);
const r2 = (n: number | undefined): string => (n === undefined ? "-" : Number.isFinite(n) ? n.toFixed(2) : String(n));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const close = (a: number, b: number): boolean => Math.abs(a - b) <= TOL + 1e-9;
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: Vector3, k: number): Vector3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);

// ------------------------------------------------------------------ witnesses

const reports: TridentReport[] = [];
observeTrident((r) => reports.push(r));
const hitsSince = (n: number, targetId: string): TridentReport[] => reports.slice(n).filter((r) => r.type === "hit" && r.targetId === targetId);
const strikesSince = (n: number, targetId: string): TridentReport[] => reports.slice(n).filter((r) => r.type === "strike" && r.targetId === targetId);

interface Hurt {
  tick: number;
  damage: number;
  cause: string;
  by: string;
  /** The damaging projectile's type, "-" for none. */
  proj: string;
}
const hurts = new Map<string, Hurt[]>();
world.afterEvents.entityHurt.subscribe((e) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  const list = hurts.get(id);
  if (list === undefined) return;
  let by = "none";
  try {
    by = e.damageSource.damagingEntity?.id ?? "none";
  } catch {
    by = "?";
  }
  let proj = "-";
  try {
    proj = e.damageSource.damagingProjectile?.typeId ?? "-";
  } catch {
    proj = "?";
  }
  list.push({ tick: system.currentTick, damage: e.damage, cause: e.damageSource.cause, by, proj });
});
const watch = (e: Entity): void => void hurts.set(e.id, []);
const hurtsSince = (e: Entity, from: number): Hurt[] => (hurts.get(e.id) ?? []).filter((h) => h.tick >= from);
const showHurts = (hs: Hurt[]): string => `[${hs.map((h) => `${r2(h.damage)}/${h.cause}${h.proj === "-" ? "" : `/${h.proj.replace("minecraft:", "").replace("andrew:", "")}`}`).join(" ")}]`;

/** projectileHitEntity per projectile id: how many events one throw's body raised. */
const bodyHits = new Map<string, number>();
world.afterEvents.projectileHitEntity.subscribe((e) => {
  try {
    const id = e.projectile.id;
    if (bodyHits.has(id)) bodyHits.set(id, (bodyHits.get(id) ?? 0) + 1);
  } catch {
    // a body removed before the event is not one being counted
  }
});

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function refill(e: Entity): void {
  try {
    e.getComponent("minecraft:health")?.resetToMaxValue();
  } catch {
    // a removed target is caught by the checks
  }
}

function hold(p: SimulatedPlayer, id: string | undefined): void {
  p.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Mainhand, id === undefined ? undefined : new ItemStack(id));
}

/** One swing: health taken inside the swing's own call (a raise happens in the before-event, inside it). */
function swing(p: SimulatedPlayer, t: Entity): { ok: boolean; delta: number } {
  const before = hp(t);
  const ok = p.attackEntity(t);
  return { ok, delta: before - hp(t) };
}

/** The AC3 witness: a separate applyDamage(2), entityAttack with no source, which the trident's own handler skips. */
function plainApply(t: Entity): { ret: string; took: number } {
  const before = hp(t);
  let ret: string;
  try {
    ret = String(t.applyDamage(TRIDENT_BONUS, { cause: EntityDamageCause.entityAttack }));
  } catch (err) {
    ret = `threw(${errText(err)})`;
  }
  return { ret, took: before - hp(t) };
}

function check(fails: string[], tag: string, ok: boolean, what: string): void {
  if (!ok) fails.push(`${tag}: ${what}`);
}

/** lightning_bolt entities near the test, counted every tick for `ticks` ticks; `each(k)` runs at tick k first. */
async function boltWatch(test: Test, ticks: number, each?: (k: number) => void): Promise<number> {
  let worst = 0;
  for (let k = 1; k <= ticks; k++) {
    await test.idle(1);
    each?.(k);
    const n = test.getDimension().getEntities({ type: BOLT, location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 64 }).length;
    worst = Math.max(worst, n);
  }
  return worst;
}

function fireNear(test: Test, at: Vector3): number {
  const dim = test.getDimension();
  let fire = 0;
  for (let dx = -3; dx <= 3; dx++)
    for (let dy = -1; dy <= 3; dy++)
      for (let dz = -3; dz <= 3; dz++) {
        const b = dim.getBlock({ x: Math.floor(at.x) + dx, y: Math.floor(at.y) + dy, z: Math.floor(at.z) + dz });
        if (b?.typeId === "minecraft:fire") fire++;
      }
  return fire;
}

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[], fails: string[], leftovers: Entity[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const leftovers: Entity[] = [];
    const fails: string[] = [];
    const regen = world.gameRules.naturalRegeneration;
    const pvp = world.gameRules.pvp;
    const difficulty = world.getDifficulty();
    world.gameRules.naturalRegeneration = false;
    world.gameRules.pvp = true;
    // A zombie is deleted on Peaceful, where the checks world runs.
    world.setDifficulty(Difficulty.Easy);
    try {
      log(`${name} START`);
      await body(test, players, fails, leftovers);
    } catch (err) {
      log(`${name} ERROR ${errText(err)}`);
      throw err;
    } finally {
      world.gameRules.naturalRegeneration = regen;
      world.gameRules.pvp = pvp;
      world.setDifficulty(difficulty);
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
      for (const e of leftovers) if (e.isValid) e.remove();
      const dim = test.getDimension();
      for (const type of [VANILLA_THROWN, BODY, "minecraft:item"])
        for (const e of dim.getEntities({ type, location: test.worldLocation({ x: 3, y: 2, z: 3 }), maxDistance: 96 })) e.remove();
    }
    for (const f of fails) log(`${name} CHECK FAILED ${f}`);
    log(`${name} RESULT ${fails.length === 0 ? "ok" : `FAIL ${fails.length}`}`);
    test.assert(fails.length === 0, `${fails.length} check(s) failed: ${fails.join("; ").slice(0, 600)}`);
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

async function survivor(test: Test, players: SimulatedPlayer[], name: string, at: Vector3, boost: boolean): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  players.push(p);
  watch(p);
  await test.idle(2);
  if (boost) p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  p.addEffect("slow_falling", 20000, { showParticles: false });
  await test.idle(2);
  refill(p);
  return p;
}

/** A behaviourless zombie in full iron, verified slot by slot; mobs have no equippable in 2.10.0, so a command dresses it. */
async function ironZombie(test: Test, leftovers: Entity[], at: Vector3, tag: string): Promise<{ z: Entity; dressed: number }> {
  const z = test.spawnWithoutBehaviors("minecraft:zombie", at);
  leftovers.push(z);
  watch(z);
  z.addEffect("fire_resistance", 20000, { showParticles: false });
  for (const [slot, item] of IRON_KIT) z.runCommand(`replaceitem entity @s ${slot} 0 ${item}`);
  await test.idle(2);
  let dressed = 0;
  for (const [slot, item] of IRON_KIT) dressed += z.runCommand(`testfor @s[hasitem={item=${item},location=${slot}}]`).successCount;
  log(`${tag} ROW zombie ${z.id} iron pieces worn ${dressed}/4 hp ${r2(hp(z))}`);
  return { z, dressed };
}

/** The throw's stand-in: the snowball-runtime body with the throw's id, shot from the thrower's eye at the target's middle. */
function shootBody(test: Test, thrower: SimulatedPlayer, target: Entity, throwId: string): Entity {
  const head = thrower.getHeadLocation();
  const aimAt = add(target.location, { x: 0, y: 0.9, z: 0 });
  const dir = mul(sub(aimAt, head), 1 / len(sub(aimAt, head)));
  const e = test.getDimension().spawnEntity(BODY, add(head, dir));
  e.setDynamicProperty(THROW_ID_PROPERTY, throwId);
  bodyHits.set(e.id, 0);
  const proj = e.getComponent("minecraft:projectile");
  if (proj === undefined) throw new Error(`${BODY} has no projectile component`);
  proj.owner = thrower;
  proj.shoot(mul(dir, THROW_SPEED), { uncertainty: 0 });
  const v = e.getVelocity();
  const rel = (p: Vector3): string => `${r2(p.x - target.location.x)},${r2(p.y - target.location.y)},${r2(p.z - target.location.z)}`;
  shotNotes.set(e.id, `thrower feet ${rel(thrower.location)} head ${rel(head)} spawn ${rel(e.location)} v ${r2(v.x)},${r2(v.y)},${r2(v.z)} target at ${r2(target.location.x)},${r2(target.location.y)},${r2(target.location.z)}`);
  return e;
}
const shotNotes = new Map<string, string>();

/**
 * Shoots the stand-in body until one of its hits reaches `target` (a miss deals nothing, so a retry starts clean), with
 * a fresh throw id per shot; the path of every miss is logged.
 */
async function bodyThrow(test: Test, thrower: SimulatedPlayer, target: Entity, targetHome: Vector3, idBase: string, tries: number, leftovers: Entity[]): Promise<{ throwId: string; bodyId: string; landed: boolean; tries: number }> {
  let last = { throwId: `${idBase}-0`, bodyId: "-" };
  for (let i = 1; i <= tries; i++) {
    // A hit knocks the target back, off the 7×7 platform if it is near the edge; a body aimed down at it sticks in the rim.
    target.teleport(test.worldLocation(targetHome));
    await test.idle(2);
    const throwId = `${idBase}-${i}`;
    const body = shootBody(test, thrower, target, throwId);
    leftovers.push(body);
    last = { throwId, bodyId: body.id };
    const path: string[] = [];
    for (let k = 0; k < 12; k++) {
      await test.idle(1);
      if ((bodyHits.get(body.id) ?? 0) > 0) return { ...last, landed: true, tries: i };
      if (body.isValid) path.push(`${r2(body.location.x - target.location.x)},${r2(body.location.y - target.location.y)},${r2(body.location.z - target.location.z)}`);
    }
    log(`body throw ${throwId}: no hit on the target; ${shotNotes.get(body.id) ?? "-"}; path from it [${path.join(" ")}]`);
    if (body.isValid) body.remove();
  }
  return { ...last, landed: false, tries };
}

/** Charges a vanilla trident 20 ticks and releases it at `target`; the hurt it dealt, or undefined after `tries` misses. */
async function vanillaThrow(test: Test, thrower: SimulatedPlayer, target: Entity, targetHome: Vector3, home: Vector3, tries: number): Promise<{ hurt: Hurt | undefined; tries: number }> {
  for (let i = 1; i <= tries; i++) {
    thrower.teleport(test.worldLocation(home));
    target.teleport(test.worldLocation(targetHome));
    thrower.setItem(new ItemStack(VANILLA), 0, true);
    await test.idle(2);
    // lookAtLocation takes test-relative coordinates; the target's middle, not its eyes.
    thrower.lookAtLocation(test.relativeLocation(add(target.location, { x: 0, y: 0.9, z: 0 })));
    await test.idle(2);
    const t0 = system.currentTick;
    const spawned: Entity[] = [];
    const hits: string[] = [];
    const sSpawn = world.afterEvents.entitySpawn.subscribe((e) => {
      if (e.entity.typeId === VANILLA_THROWN) spawned.push(e.entity);
    });
    const sHit = world.afterEvents.projectileHitEntity.subscribe((e) => {
      if (e.projectile.typeId === VANILLA_THROWN) hits.push(`entity ${e.getEntityHit().entity?.typeId ?? "?"}`);
    });
    const sBlock = world.afterEvents.projectileHitBlock.subscribe((e) => {
      if (e.projectile.typeId === VANILLA_THROWN) hits.push(`block ${e.getBlockHit().block.typeId}`);
    });
    let ok = thrower.useItemInSlot(0);
    if (!ok) {
      await test.idle(2);
      ok = thrower.useItemInSlot(0);
    }
    await test.idle(20);
    const view = thrower.getViewDirection();
    thrower.stopUsingItem();
    const path: string[] = [];
    for (let k = 0; k < 20; k++) {
      await test.idle(1);
      const e = spawned[0];
      if (e?.isValid === true && k % 2 === 0) path.push(`${r2(e.location.x - target.location.x)},${r2(e.location.y - target.location.y)},${r2(e.location.z - target.location.z)}`);
    }
    world.afterEvents.entitySpawn.unsubscribe(sSpawn);
    world.afterEvents.projectileHitEntity.unsubscribe(sHit);
    world.afterEvents.projectileHitBlock.unsubscribe(sBlock);
    const hit = hurtsSince(target, t0).find((h) => h.cause === EntityDamageCause.projectile);
    for (const e of test.getDimension().getEntities({ type: VANILLA_THROWN, location: test.worldLocation(home), maxDistance: 96 })) e.remove();
    log(
      `vanilla throw #${i}: useItemInSlot=${String(ok)} view ${r2(view.x)},${r2(view.y)},${r2(view.z)} spawned=${spawned.length} hits=[${hits.join(", ")}] ` +
        `path-from-target=[${path.join(" ")}] hurts=${showHurts(hurtsSince(target, t0))}`
    );
    if (hit !== undefined) return { hurt: hit, tries: i };
    await test.idle(CLEAR);
  }
  return { hurt: undefined, tries };
}

// ------------------------------------------------------------------ AC1, AC3, AC4: melee

const Z_AT: Vector3 = { x: 3.5, y: 2, z: 2.5 };
const A_AT: Vector3 = { x: 3.5, y: 2, z: 4.5 };
const B_AT: Vector3 = { x: 1.5, y: 2, z: 2.5 };

scenario("trident_damage_melee", 2400, async (test, players, fails, leftovers) => {
  const a = await survivor(test, players, "td_melee_a", A_AT, false);
  const b = await survivor(test, players, "td_melee_b", B_AT, false);
  const tag = "MELEE iron-zombie";
  const { z, dressed } = await ironZombie(test, leftovers, Z_AT, tag);
  check(fails, tag, dressed === 4, `the zombie wears ${dressed}/4 iron pieces`);

  const fresh = async (): Promise<number> => {
    await test.idle(CLEAR);
    refill(z);
    a.lookAtEntity(z);
    b.lookAtEntity(z);
    await test.idle(1);
    return system.currentTick;
  };

  // The yardstick: the vanilla trident's melee on the same zombie in the same armour.
  hold(a, VANILLA);
  const vanilla: number[] = [];
  for (let i = 0; i < 2; i++) {
    await fresh();
    const v = swing(a, z);
    check(fails, tag, v.ok && v.delta > 0, `vanilla trident swing #${i} ok=${String(v.ok)} took ${r2(v.delta)}`);
    vanilla.push(v.delta);
  }
  check(fails, tag, close(vanilla[0], vanilla[1]), `the vanilla yardstick is not deterministic: ${vanilla.map(r2).join(" / ")}`);
  const afterArmourVanilla = vanilla[0];
  log(`${tag} ROW vanilla-trident afterArmour(vanilla)=${vanilla.map(r2).join("/")} (bare would be 9.00)`);

  // AC1 + AC4: every landed trident hit = afterArmour(vanilla) + 2, one strike, one impact sound.
  hold(a, AWT);
  hold(b, AWT);
  let hits = 0;
  let firstHitTick = -1;
  for (let i = 0; i < 3; i++) {
    const t0 = await fresh();
    const n = reports.length;
    const sounds0 = visualStats().sounds;
    const s = swing(a, z);
    hits++;
    if (i === 0) firstHitTick = t0;
    const want = afterArmourVanilla + TRIDENT_BONUS;
    const hit = hitsSince(n, z.id)[0];
    check(fails, tag, s.ok && close(s.delta, want), `trident hit #${i} took ${r2(s.delta)}, expected afterArmour(vanilla) ${r2(afterArmourVanilla)} + ${TRIDENT_BONUS} = ${r2(want)}`);
    check(fails, tag, hit?.type === "hit" && hit.outcome === "raise", `trident hit #${i}: report ${hit?.type === "hit" ? hit.outcome : "none"}`);

    if (i === 0) {
      // AC3, inside the first hit's window: a second trident melee not above the last, then a plain applyDamage(2).
      let second = { ok: false, delta: Number.NaN };
      let plain = { ret: "-", took: Number.NaN };
      let n2 = 0;
      const bolts = await boltWatch(test, BOLT_WATCH, (k) => {
        if (k === 3) {
          n2 = reports.length;
          second = swing(b, z);
        } else if (k === 6) {
          plain = plainApply(z);
        }
      });
      const secondHit = hitsSince(n2, z.id)[0];
      const strikes = strikesSince(n, z.id);
      const sounds = visualStats().sounds - sounds0;
      check(fails, "WINDOW", second.ok && Math.abs(second.delta) < 0.005, `a second trident melee 3 ticks into the window took ${r2(second.delta)} (ok=${String(second.ok)}), expected 0`);
      check(fails, "WINDOW", plain.ret === "true" && Math.abs(plain.took) < 0.005, `a plain applyDamage(${TRIDENT_BONUS}) 6 ticks into the window took ${r2(plain.took)} ret=${plain.ret}: the window is not armed`);
      check(fails, tag, strikes.length === 1 && sounds === 1, `hit #0 with an in-window second hit: ${strikes.length} strike report(s), ${sounds} impact sound(s), expected 1 / 1`);
      check(fails, tag, bolts === 0, `${bolts} ${BOLT} entities within ${BOLT_WATCH} ticks of hit #0`);
      log(
        `${tag} ROW trident-hit#0 took=${r2(s.delta)} want=${r2(want)} read=${r2(hit?.type === "hit" ? hit.read : undefined)} bonus=${r2(hit?.type === "hit" ? hit.bonus : undefined)} ` +
          `strikes=${strikes.length} sounds=${sounds} bolts-max-over-${BOLT_WATCH}=${bolts} hurts=${showHurts(hurtsSince(z, t0))}`
      );
      log(
        `WINDOW ROW second-trident-melee+3 ok=${String(second.ok)} took=${r2(second.delta)} report=${secondHit?.type === "hit" ? `${secondHit.outcome} set ${r2(secondHit.set)}` : "none"} ` +
          `plain-apply${TRIDENT_BONUS}+6 ret=${plain.ret} took=${r2(plain.took)}`
      );
    } else {
      await test.idle(4);
      const strikes = strikesSince(n, z.id);
      const sounds = visualStats().sounds - sounds0;
      check(fails, tag, strikes.length === 1 && sounds === 1, `hit #${i}: ${strikes.length} strike report(s), ${sounds} impact sound(s), expected 1 / 1`);
      log(`${tag} ROW trident-hit#${i} took=${r2(s.delta)} want=${r2(want)} strikes=${strikes.length} sounds=${sounds}`);
    }
  }
  const allStrikes = strikesSince(0, z.id).filter((r) => r.tick >= firstHitTick).length;
  check(fails, tag, allStrikes === hits, `${allStrikes} strikes over ${hits} landed trident hits`);
  check(fails, tag, fireNear(test, z.location) === 0, `fire within 3 blocks of the zombie`);
  z.remove();

  // A villager under the strike stays a villager (a real bolt makes it a witch), and a bare mob takes 9 + 2.
  const vTag = "VILLAGER";
  const v = test.spawnWithoutBehaviors("minecraft:villager_v2", Z_AT);
  leftovers.push(v);
  watch(v);
  await test.idle(CLEAR);
  a.lookAtEntity(v);
  await test.idle(1);
  const vn = reports.length;
  const vs = swing(a, v);
  const vBolts = await boltWatch(test, BOLT_WATCH);
  const witches = test.getDimension().getEntities({ type: "minecraft:witch", location: test.worldLocation(Z_AT), maxDistance: 16 }).length;
  const vStrikes = strikesSince(vn, v.id).length;
  check(fails, vTag, vs.ok && close(vs.delta, 9 + TRIDENT_BONUS), `a bare villager took ${r2(vs.delta)}, expected 9 + ${TRIDENT_BONUS}`);
  check(fails, vTag, v.isValid && v.typeId === "minecraft:villager_v2" && witches === 0 && vStrikes === 1 && vBolts === 0, `villager valid=${String(v.isValid)} witches=${witches} strikes=${vStrikes} bolts=${vBolts}`);
  check(fails, vTag, fireNear(test, v.location) === 0, `fire within 3 blocks of the villager`);
  log(`${vTag} ROW took=${r2(vs.delta)} still-villager=${String(v.isValid && v.typeId === "minecraft:villager_v2")} witches=${witches} strikes=${vStrikes} bolts=${vBolts}`);
  if (v.isValid) v.remove();

  // An armour stand has health 6 but is no living thing: no bonus, no strike. A melee on it reaches no hurt event at
  // all, so the thrown path, which asks before it deals anything, is the one that can be watched.
  const sTag = "INANIMATE";
  const stand = test.spawn("minecraft:armor_stand", Z_AT);
  leftovers.push(stand);
  watch(stand);
  await test.idle(CLEAR);
  const standHp = hp(stand);
  const sn = reports.length;
  const sReport = thrownHit(stand, a, "gt-trdm-stand", stand.location);
  await test.idle(4);
  const sStrikes = reports.slice(sn).filter((r) => r.type === "strike").length;
  const sTook = standHp - hp(stand);
  check(fails, sTag, sReport.outcome === "not-living" && sStrikes === 0 && Math.abs(sTook) < 0.005, `armour stand: ${sReport.outcome}, took ${r2(sTook)}, strikes ${sStrikes}`);
  log(`${sTag} ROW armour-stand thrown=${sReport.outcome} took=${r2(sTook)} strikes=${sStrikes}`);
});

// ------------------------------------------------------------------ AC2, AC3, AC4, AC5: thrown

const THROWER_AT: Vector3 = { x: 0.5, y: 2, z: 2.5 };
const TZ_AT: Vector3 = { x: 5.5, y: 2, z: 2.5 };

scenario("trident_damage_thrown", 3000, async (test, players, fails, leftovers) => {
  const thrower = await survivor(test, players, "td_thrower", THROWER_AT, false);
  const tag = "THROWN iron-zombie";
  const { z, dressed } = await ironZombie(test, leftovers, TZ_AT, tag);
  check(fails, tag, dressed === 4, `the zombie wears ${dressed}/4 iron pieces`);

  // The yardstick: a vanilla trident thrown by the player at the same zombie.
  refill(z);
  const vt = await vanillaThrow(test, thrower, z, TZ_AT, THROWER_AT, 3);
  const vanillaThrown = vt.hurt?.damage ?? Number.NaN;
  check(fails, tag, vt.hurt !== undefined && vanillaThrown > 0, `no vanilla thrown trident landed on the zombie in ${vt.tries} tries`);
  // The thrown path deals the base as an entityAttack: against armour it must equal the vanilla projectile's 8.
  await test.idle(CLEAR);
  z.teleport(test.worldLocation(TZ_AT));
  refill(z);
  let before = hp(z);
  z.applyDamage(THROWN_BASE, { cause: EntityDamageCause.entityAttack });
  const scriptedBase = before - hp(z);
  check(fails, tag, close(scriptedBase, vanillaThrown), `a scripted entityAttack ${THROWN_BASE} took ${r2(scriptedBase)}, the vanilla throw ${r2(vanillaThrown)}`);
  log(`${tag} ROW vanilla-thrown=${r2(vanillaThrown)} (tries ${vt.tries}, bare would be 8.00) scripted-entityAttack-${THROWN_BASE}=${r2(scriptedBase)}`);
  hold(thrower, undefined);
  thrower.teleport(test.worldLocation(THROWER_AT));

  // AC2 + AC4 + AC5: the throw's body lands once; vanilla thrown + 2, one strike, and every repeat of the event is a no-op.
  await test.idle(CLEAR);
  refill(z);
  thrower.lookAtEntity(z);
  await test.idle(2);
  let n = reports.length;
  let sounds0 = visualStats().sounds;
  let t0 = system.currentTick;
  before = hp(z);
  const bt = await bodyThrow(test, thrower, z, TZ_AT, "gt-trdm-1", 3, leftovers);
  const bodyId = bt.bodyId;
  await test.idle(1);
  const took = before - hp(z);
  const want = vanillaThrown + TRIDENT_BONUS;
  const first = hitsSince(n, z.id)[0];
  check(fails, tag, bt.landed && close(took, want), `${bt.landed ? "" : `no body hit in ${bt.tries} shots; `}the thrown hit took ${r2(took)}, expected vanilla thrown ${r2(vanillaThrown)} + ${TRIDENT_BONUS} = ${r2(want)}`);
  check(fails, tag, first?.type === "hit" && first.outcome === "raise", `thrown report ${first?.type === "hit" ? `${first.via ?? "-"} ${first.outcome}` : "none"}`);
  const nDup = reports.length;
  const dupBefore = hp(z);
  const dup = thrownHit(z, thrower, bt.throwId, z.location);
  const dupTook = dupBefore - hp(z);
  check(fails, "REPEAT", dup.outcome === "duplicate" && Math.abs(dupTook) < 0.005, `a second event for throw ${bt.throwId}: ${dup.outcome}, took ${r2(dupTook)}`);

  // AC3 for a throw, inside its window: a new throw not above the last, then a plain applyDamage(2).
  let next = { outcome: "-", took: Number.NaN };
  let plain = { ret: "-", took: Number.NaN };
  const bolts = await boltWatch(test, BOLT_WATCH, (k) => {
    if (k === 3) {
      const b0 = hp(z);
      const r = thrownHit(z, thrower, "gt-trdm-2", z.location);
      next = { outcome: r.outcome, took: b0 - hp(z) };
    } else if (k === 6) {
      plain = plainApply(z);
    }
  });
  const strikes = strikesSince(n, z.id);
  const sounds = visualStats().sounds - sounds0;
  const events = bodyHits.get(bodyId) ?? 0;
  check(fails, "WINDOW", Math.abs(next.took) < 0.005, `a second throw 3 ticks into the window took ${r2(next.took)} (${next.outcome}), expected 0`);
  check(fails, "WINDOW", plain.ret === "true" && Math.abs(plain.took) < 0.005, `a plain applyDamage(${TRIDENT_BONUS}) 6 ticks into the window took ${r2(plain.took)} ret=${plain.ret}`);
  check(fails, tag, strikes.length === 1 && sounds === 1, `thrown hit: ${strikes.length} strike report(s), ${sounds} impact sound(s), expected 1 / 1`);
  check(fails, tag, bolts === 0, `${bolts} ${BOLT} entities within ${BOLT_WATCH} ticks of the thrown hit`);
  check(fails, tag, fireNear(test, z.location) === 0, `fire within 3 blocks of the zombie`);
  check(fails, tag, events >= 1 && hitsSince(n, z.id).filter((r) => r.type === "hit" && r.outcome === "raise").length === 1, `${events} hit event(s) from the body gave ${hitsSince(n, z.id).filter((r) => r.type === "hit" && r.outcome === "raise").length} raise(s)`);
  log(
    `${tag} ROW body-shots=${bt.tries} thrown via=${first?.type === "hit" ? first.via ?? "-" : "-"} took=${r2(took)} want=${r2(want)} read=${r2(first?.type === "hit" ? first.read : undefined)} bonus=${r2(first?.type === "hit" ? first.bonus : undefined)} ` +
      `body-hit-events=${events} reports=[${hitsSince(n, z.id).map((r) => (r.type === "hit" ? r.outcome : "")).join(",")}] strikes=${strikes.length} sounds=${sounds} bolts-max-over-${BOLT_WATCH}=${bolts} hurts=${showHurts(hurtsSince(z, t0))}`
  );
  log(`REPEAT ROW same-throw-again outcome=${dup.outcome} took=${r2(dupTook)} reports-since=${reports.length - nDup}`);
  log(`WINDOW ROW new-throw+3 ${next.outcome} took=${r2(next.took)} plain-apply${TRIDENT_BONUS}+6 ret=${plain.ret} took=${r2(plain.took)}`);

  // A body with no impact damage (probe-trident P10) leaves the whole hit to thrownHit: the scripted base, raised.
  const sTag = "THROWN scripted";
  await test.idle(CLEAR);
  z.teleport(test.worldLocation(TZ_AT));
  refill(z);
  await test.idle(2);
  n = reports.length;
  sounds0 = visualStats().sounds;
  before = hp(z);
  const scripted = thrownHit(z, thrower, "gt-trdm-4", add(z.location, { x: 0, y: 0.9, z: 0 }));
  const sTook = before - hp(z);
  await test.idle(4);
  const sStrikes = strikesSince(n, z.id).length;
  const sSounds = visualStats().sounds - sounds0;
  check(
    fails,
    sTag,
    scripted.via === "scripted" && scripted.outcome === "raise" && close(sTook, want) && sStrikes === 1 && sSounds === 1,
    `${scripted.via ?? "-"} ${scripted.outcome} took ${r2(sTook)} (expected ${r2(want)}), strikes ${sStrikes}, sounds ${sSounds}`
  );
  log(`${sTag} ROW via=${scripted.via ?? "-"} ${scripted.outcome} read=${r2(scripted.read)} bonus=${r2(scripted.bonus)} took=${r2(sTook)} want=${r2(want)} strikes=${sStrikes} sounds=${sSounds}`);
  z.remove();

  // A bare player: the vanilla throw takes 8.00 there (probe-trident P2), the trident's 10.00.
  const pTag = "THROWN bare-player";
  const p = await survivor(test, players, "td_thrown_bare", TZ_AT, true);
  await test.idle(CLEAR);
  p.teleport(test.worldLocation(TZ_AT));
  refill(p);
  const pv = await vanillaThrow(test, thrower, p, TZ_AT, THROWER_AT, 3);
  const pVanilla = pv.hurt?.damage ?? Number.NaN;
  check(fails, pTag, close(pVanilla, THROWN_BASE), `the vanilla throw at a bare player took ${r2(pVanilla)} in ${pv.tries} tries, probe-trident P2 measured ${THROWN_BASE}`);
  hold(thrower, undefined);
  await test.idle(CLEAR);
  thrower.teleport(test.worldLocation(THROWER_AT));
  p.teleport(test.worldLocation(TZ_AT));
  refill(p);
  thrower.lookAtEntity(p);
  await test.idle(2);
  n = reports.length;
  sounds0 = visualStats().sounds;
  t0 = system.currentTick;
  before = hp(p);
  const pb = await bodyThrow(test, thrower, p, TZ_AT, "gt-trdm-3", 3, leftovers);
  await test.idle(4);
  const pTook = before - hp(p);
  const pStrikes = strikesSince(n, p.id).length;
  const pSounds = visualStats().sounds - sounds0;
  const pHit = hitsSince(n, p.id)[0];
  check(fails, pTag, close(pTook, pVanilla + TRIDENT_BONUS) && pStrikes === 1 && pSounds === 1, `${pb.landed ? "" : `no body hit in ${pb.tries} shots; `}bare player took ${r2(pTook)} (expected vanilla ${r2(pVanilla)} + ${TRIDENT_BONUS}), strikes ${pStrikes}, sounds ${pSounds}`);
  log(
    `${pTag} ROW vanilla-thrown=${r2(pVanilla)} (tries ${pv.tries}) body-shots=${pb.tries} thrown via=${pHit?.type === "hit" ? pHit.via ?? "-" : "-"} ${pHit?.type === "hit" ? pHit.outcome : "none"} ` +
      `took=${r2(pTook)} want=${r2(pVanilla + TRIDENT_BONUS)} strikes=${pStrikes} sounds=${pSounds} hurts=${showHurts(hurtsSince(p, t0))}`
  );
});

// ------------------------------------------------------------------ R-trdt-002 §2: a lethal raise keeps the totem

scenario("trident_damage_lethal", 1600, async (test, players, fails) => {
  const a = await survivor(test, players, "td_lethal_a", A_AT, false);
  hold(a, AWT);
  for (const kind of ["melee", "thrown"] as const) {
    const tag = `LETHAL ${kind}`;
    const t = await survivor(test, players, `td_lethal_${kind}`, Z_AT, false);
    t.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:totem_of_undying"));
    await test.idle(CLEAR);
    t.teleport(test.worldLocation(Z_AT));
    a.lookAtEntity(t);
    // The base alone leaves 1 HP; the +2 on top would kill, so the hit is left alone and an overkill follows.
    const start = (kind === "melee" ? 9 : THROWN_BASE) + 1;
    t.getComponent("minecraft:health")?.setCurrentValue(start);
    await test.idle(1);
    const n = reports.length;
    const t0 = system.currentTick;
    let outcome = "-";
    if (kind === "melee") {
      swing(a, t);
      const r = hitsSince(n, t.id)[0];
      outcome = r?.type === "hit" ? r.outcome : "none";
    } else {
      outcome = thrownHit(t, a, "gt-trdm-lethal", t.location).outcome;
    }
    await test.idle(6);
    const offhand = t.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
    const alive = t.isValid && hp(t) > 0;
    const strikes = strikesSince(n, t.id).length;
    check(fails, tag, outcome === "lethal" && alive && offhand === "empty" && strikes === 1, `outcome ${outcome}, alive ${String(alive)} hp ${r2(hp(t))}, off hand ${offhand}, strikes ${strikes}`);
    log(`${tag} ROW start-hp=${start} outcome=${outcome} hp-after=${r2(hp(t))} off-hand=${offhand} strikes=${strikes} hurts=${showHurts(hurtsSince(t, t0))}`);
    test.removeSimulatedPlayer(t);
  }
});
