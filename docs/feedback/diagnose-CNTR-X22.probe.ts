// L0-xcx22 probe on BDS 1.26.51.1: does the hurt-invulnerability window swallow
// a script applyDamage, and does the Scythe true-damage pattern
// (src/scythe/volley.ts:115-133) still take exactly D per hit inside it —
// through netherite + Protection IV, a raised shield and absorption?
//
// Not part of the shipped gametest pack: diagnose-CNTR-X22.repro.sh copies this
// file to src/gametest/ for one run and restores the tree. A scenario passes
// when its measurement completed; the answers are the "[probe] X22 …" lines.

import {
  Difficulty,
  EnchantmentType,
  type Entity,
  EntityDamageCause,
  type EntityApplyDamageByProjectileOptions,
  type EntityApplyDamageOptions,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { type VolleyObserver, launchVolley } from "../scythe/volley";

const STRUCTURE = "andrew:platform";
/** SONIC_BOOM_DAMAGE, L0-sclk-r002. */
const D = 10;
/** Ticks that clear any hurt window before the next case. */
const CLEAR = 40;

const log = (msg: string): void => console.warn(`[probe] X22 ${msg}`);
const r2 = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : String(n));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

interface Hurt {
  tick: number;
  damage: number;
  cause: string;
}
const hurts = new Map<string, Hurt[]>();
const deaths = new Map<string, string>();

world.afterEvents.entityHurt.subscribe((e) => {
  try {
    const list = hurts.get(e.hurtEntity.id);
    list?.push({ tick: system.currentTick, damage: e.damage, cause: e.damageSource.cause });
  } catch {
    // a removed entity: nothing to record
  }
});
world.afterEvents.entityDie.subscribe((e) => {
  try {
    if (!hurts.has(e.deadEntity.id)) return;
    deaths.set(e.deadEntity.id, `${e.damageSource.cause}/killer=${e.damageSource.damagingEntity?.typeId ?? "none"}`);
  } catch {
    // ignore
  }
});

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function setHp(e: Entity, v: number): boolean {
  return e.getComponent("minecraft:health")?.setCurrentValue(v) ?? false;
}

/** Hurt events of `e` since `from`, as "+dt:damage/cause". */
function hurtsSince(e: Entity, from: number): string {
  const list = (hurts.get(e.id) ?? []).filter((h) => h.tick >= from);
  return `[${list.map((h) => `+${h.tick - from}:${r2(h.damage)}/${h.cause}`).join(" ")}]`;
}

function damage(target: Entity, amount: number, options: EntityApplyDamageOptions | EntityApplyDamageByProjectileOptions): string {
  try {
    return String(target.applyDamage(amount, options));
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

type Mode = "pattern" | "plain";

/**
 * One hit. "pattern" replays volley.ts strike() line for line: hp read first,
 * applyDamage(D) then setCurrentValue(hp - D), or an overkill applyDamage when
 * hp - D <= 0. "plain" is applyDamage(D) alone, the negative control.
 */
function strike(target: Entity, owner: Entity, mode: Mode, cause: EntityDamageCause = EntityDamageCause.entityAttack): string {
  const before = hp(target);
  const left = before - D;
  if (mode === "pattern" && left <= 0) {
    const ret = damage(target, before + 100, { cause, damagingEntity: owner });
    return `${r2(before)}-lethal(${ret})->${r2(hp(target))}`;
  }
  const ret = damage(target, D, { cause, damagingEntity: owner });
  const afterApply = hp(target);
  if (mode === "plain") return `${r2(before)}-apply(${ret})->${r2(afterApply)}`;
  const wrote = setHp(target, left);
  return `${r2(before)}-apply(${ret})->${r2(afterApply)}-write(${wrote})->${r2(hp(target))}`;
}

const ARMOUR: [EquipmentSlot, string][] = [
  [EquipmentSlot.Head, "minecraft:netherite_helmet"],
  [EquipmentSlot.Chest, "minecraft:netherite_chestplate"],
  [EquipmentSlot.Legs, "minecraft:netherite_leggings"],
  [EquipmentSlot.Feet, "minecraft:netherite_boots"],
];

function armourUp(p: SimulatedPlayer): string {
  const eq = p.getComponent("minecraft:equippable");
  for (const [slot, id] of ARMOUR) {
    const stack = new ItemStack(id);
    stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("protection"), level: 4 });
    eq?.setEquipment(slot, stack);
  }
  const chest = eq?.getEquipment(EquipmentSlot.Chest);
  const prot = chest?.getComponent("minecraft:enchantable")?.getEnchantment("protection")?.level ?? 0;
  return `${chest?.typeId ?? "none"}+protection${prot}`;
}

interface Who {
  test: Test;
  owner: SimulatedPlayer;
  at: Vector3;
}

/** A Survival SimulatedPlayer at 40 HP (health_boost amplifier 4) with no fall damage. */
async function target(test: Test, rel: Vector3, name: string, opts: { armour?: boolean; shield?: boolean } = {}): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  hurts.set(p.id, []);
  await test.idle(2);
  p.addEffect("health_boost", 12000, { amplifier: 4, showParticles: false });
  p.addEffect("slow_falling", 12000, { showParticles: false });
  let kit = "bare";
  if (opts.armour === true) kit = armourUp(p);
  if (opts.shield === true) {
    const ok = p.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:shield"));
    kit += ` shield=${String(ok)}`;
  }
  await test.idle(2);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  const h = p.getComponent("minecraft:health");
  log(`SETUP ${name} hp=${r2(hp(p))} max=${r2(h?.effectiveMax ?? Number.NaN)} kit=${kit}`);
  return p;
}

/** Waits the window out, puts the target back in place facing the owner, refills health. */
async function fresh(w: Who, t: SimulatedPlayer, value = 40): Promise<number> {
  await w.test.idle(CLEAR);
  t.teleport(w.test.worldLocation(w.at));
  t.lookAtEntity(w.owner);
  await w.test.idle(2);
  setHp(t, value);
  return system.currentTick;
}

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const regen = world.gameRules.naturalRegeneration;
    world.gameRules.naturalRegeneration = false;
    const difficulty = world.getDifficulty();
    try {
      await body(test, players);
    } catch (err) {
      log(`${name} ERROR ${errText(err)}`);
      throw err;
    } finally {
      world.gameRules.naturalRegeneration = regen;
      world.setDifficulty(difficulty);
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

function owner(test: Test, players: SimulatedPlayer[], rel: Vector3, name: string): SimulatedPlayer {
  const o = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  players.push(o);
  return o;
}

// ------------------------------------------------------------------ window

scenario("probe_x22_window", 2400, async (test, players) => {
  const at = { x: 3, y: 1, z: 2 };
  const o = owner(test, players, { x: 3, y: 1, z: 4 }, "x22_win_owner");
  const t = await target(test, at, "x22_win_target");
  players.push(t);
  const w: Who = { test, owner: o, at };
  log(`WIN difficulty=${world.getDifficulty()} regen=${String(world.gameRules.naturalRegeneration)}`);

  // single: is applyDamage applied synchronously?
  let t0 = await fresh(w, t);
  log(`WIN single ${strike(t, o, "plain")} next=${await nextTicks(test, t, [1, 2])} hurts=${hurtsSince(t, t0)}`);

  // three in the same tick
  t0 = await fresh(w, t);
  const same = [strike(t, o, "plain"), strike(t, o, "plain"), strike(t, o, "plain")];
  await test.idle(1);
  log(`WIN same-tick x3 ${same.join(" | ")} total=${r2(40 - hp(t))} hurts=${hurtsSince(t, t0)}`);

  // on three adjacent ticks
  t0 = await fresh(w, t);
  const adj: string[] = [];
  for (let i = 0; i < 3; i++) {
    adj.push(`@${system.currentTick - t0}:${strike(t, o, "plain")}`);
    if (i < 2) await test.idle(1);
  }
  await test.idle(1);
  log(`WIN adjacent x3 ${adj.join(" | ")} total=${r2(40 - hp(t))} hurts=${hurtsSince(t, t0)}`);

  // gap sweep: does a second equal hit k ticks after the first land?
  const lands: string[] = [];
  for (const k of [1, 2, 4, 6, 8, 9, 10, 11, 12, 15, 20]) {
    t0 = await fresh(w, t);
    const first = strike(t, o, "plain");
    await test.idle(k);
    const gap = system.currentTick - t0;
    const before = hp(t);
    const second = strike(t, o, "plain");
    const d2 = before - hp(t);
    lands.push(`k=${k}:${d2 > 0 ? "lands" : "swallowed"}`);
    log(`WIN gap k=${k} measured=${gap} first=${first} second=${second} second-delta=${r2(d2)}`);
  }
  log(`WIN SWEEP ${lands.join(" ")}`);

  // rising amounts inside one window: full amount or the difference?
  t0 = await fresh(w, t);
  const rise: string[] = [];
  for (const [dt, amount] of [
    [0, 5],
    [2, 8],
    [1, 8],
    [1, 4],
    [1, 20],
  ] as [number, number][]) {
    if (dt > 0) await test.idle(dt);
    const before = hp(t);
    const ret = damage(t, amount, { cause: EntityDamageCause.entityAttack, damagingEntity: o });
    rise.push(`@${system.currentTick - t0}:${amount}->${ret}/delta=${r2(before - hp(t))}`);
  }
  log(`WIN rising ${rise.join(" ")} hurts=${hurtsSince(t, t0)}`);

  // the pattern's lethal branch one tick into a window
  t0 = await fresh(w, t);
  const first = strike(t, o, "plain");
  await test.idle(1);
  setHp(t, 5);
  const lethal = strike(t, o, "pattern");
  await test.idle(2);
  log(`WIN lethal-in-window first=${first} lethal=${lethal} valid=${String(t.isValid)} hp=${r2(hp(t))} death=${deaths.get(t.id) ?? "none"} hurts=${hurtsSince(t, t0)}`);
});

async function nextTicks(test: Test, t: Entity, at: number[]): Promise<string> {
  const out: string[] = [];
  let done = 0;
  for (const k of at) {
    await test.idle(k - done);
    done = k;
    out.push(`+${k}:${r2(hp(t))}`);
  }
  return out.join(",");
}

// ------------------------------------------------------------------ pattern on armour

async function volley3(w: Who, t: SimulatedPlayer, mode: Mode, spacing: number, label: string): Promise<void> {
  const t0 = await fresh(w, t);
  const parts: string[] = [];
  for (let i = 0; i < 3; i++) {
    parts.push(`@${system.currentTick - t0}:${strike(t, w.owner, mode)}`);
    if (i < 2 && spacing > 0) await w.test.idle(spacing);
  }
  const atEnd = hp(t);
  const later = await nextTicks(w.test, t, [1, 2, 5, 20]);
  log(
    `PAT ${label} mode=${mode} spacing=${spacing} ${parts.join(" | ")} total=${r2(40 - atEnd)} later=${later} hurts=${hurtsSince(t, t0)}`
  );
}

scenario("probe_x22_pattern", 2400, async (test, players) => {
  const at = { x: 3, y: 1, z: 2 };
  const o = owner(test, players, { x: 3, y: 1, z: 4 }, "x22_pat_owner");
  const t = await target(test, at, "x22_pat_target", { armour: true });
  players.push(t);
  const w: Who = { test, owner: o, at };
  log(`PAT difficulty=${world.getDifficulty()}`);

  let t0 = await fresh(w, t);
  log(`PAT reference one plain hit through netherite+P4: ${strike(t, o, "plain")} hurts=${hurtsSince(t, t0)}`);

  await volley3(w, t, "pattern", 0, "same-tick");
  await volley3(w, t, "plain", 0, "same-tick NEGATIVE-CONTROL");
  await volley3(w, t, "pattern", 1, "adjacent");
  await volley3(w, t, "plain", 1, "adjacent NEGATIVE-CONTROL");
  await volley3(w, t, "pattern", 10, "scythe-spacing");

  world.setDifficulty(Difficulty.Normal);
  log(`PAT difficulty=${world.getDifficulty()}`);
  t0 = await fresh(w, t);
  log(`PAT reference one plain hit at Normal: ${strike(t, o, "plain")} hurts=${hurtsSince(t, t0)}`);
  await volley3(w, t, "pattern", 0, "same-tick normal");

  // the third bolt lethal inside the window: 25 -> 15 -> 5 -> overkill
  t0 = await fresh(w, t, 25);
  const parts: string[] = [];
  for (let i = 0; i < 3; i++) {
    parts.push(`@${system.currentTick - t0}:${strike(t, o, "pattern")}`);
    if (i < 2) await test.idle(1);
  }
  await test.idle(2);
  log(`PAT lethal-third ${parts.join(" | ")} valid=${String(t.isValid)} hp=${r2(hp(t))} death=${deaths.get(t.id) ?? "none"} hurts=${hurtsSince(t, t0)}`);
});

// ------------------------------------------------------------------ shield

async function shot(test: Test, from: Vector3, to: Entity, typeId: string, ownerEntity: Entity | undefined): Promise<Entity | undefined> {
  const dim = test.getDimension();
  const aim = { x: to.location.x, y: to.location.y + 1.2, z: to.location.z };
  const dx = aim.x - from.x;
  const dy = aim.y - from.y;
  const dz = aim.z - from.z;
  const len = Math.hypot(dx, dy, dz);
  const speed = 2.0;
  try {
    const e = dim.spawnEntity(typeId, from);
    const proj = e.getComponent("minecraft:projectile");
    if (proj === undefined) return e;
    if (ownerEntity !== undefined) proj.owner = ownerEntity;
    proj.shoot({ x: (dx / len) * speed, y: (dy / len) * speed, z: (dz / len) * speed });
    return e;
  } catch (err) {
    log(`SHOT ${typeId} threw ${errText(err)}`);
    return undefined;
  }
}

scenario("probe_x22_shield_raised", 2400, async (test, players) => {
  const at = { x: 3, y: 1, z: 2 };
  const o = owner(test, players, { x: 3, y: 1, z: 5 }, "x22_shd_owner");
  const t = await target(test, at, "x22_shd_target", { shield: true });
  players.push(t);
  const w: Who = { test, owner: o, at };

  for (const sneak of [false, true]) {
    // vanilla arrow from the owner's side: the shield's own positive control
    let t0 = await fresh(w, t);
    t.isSneaking = sneak;
    await test.idle(10);
    const before = hp(t);
    const from = test.worldLocation({ x: 3.5, y: 2.3, z: 4.2 });
    await shot(test, from, t, "minecraft:arrow", o);
    await test.idle(10);
    log(`SHD sneak=${String(sneak)} read=${String(t.isSneaking)} arrow delta=${r2(before - hp(t))} hurts=${hurtsSince(t, t0)}`);

    for (const cause of [EntityDamageCause.entityAttack, EntityDamageCause.sonicBoom]) {
      t0 = await fresh(w, t);
      t.isSneaking = sneak;
      await test.idle(10);
      log(`SHD sneak=${String(sneak)} plain cause=${cause} ${strike(t, o, "plain", cause)} hurts=${hurtsSince(t, t0)}`);
    }

    t0 = await fresh(w, t);
    t.isSneaking = sneak;
    await test.idle(10);
    const same = [strike(t, o, "pattern"), strike(t, o, "pattern"), strike(t, o, "pattern")];
    await test.idle(1);
    log(`SHD sneak=${String(sneak)} pattern same-tick x3 ${same.join(" | ")} total=${r2(40 - hp(t))} hurts=${hurtsSince(t, t0)}`);
  }
});

scenario("probe_x22_shield_lethal", 1200, async (test, players) => {
  const o = owner(test, players, { x: 3, y: 1, z: 5 }, "x22_shl_owner");
  const causes = [EntityDamageCause.entityAttack, EntityDamageCause.sonicBoom, EntityDamageCause.override];
  const ts: SimulatedPlayer[] = [];
  for (let i = 0; i < causes.length; i++) {
    const p = await target(test, { x: 1 + 2 * i, y: 1, z: 2 }, `x22_shl_${causes[i]}`, { shield: true });
    players.push(p);
    ts.push(p);
  }
  for (const p of ts) {
    p.lookAtEntity(o);
    p.isSneaking = true;
  }
  await test.idle(20);
  const t0 = system.currentTick;
  const lines: string[] = [];
  for (let i = 0; i < ts.length; i++) {
    setHp(ts[i], 5);
    lines.push(`${causes[i]}:${strike(ts[i], o, "pattern", causes[i])}`);
  }
  await test.idle(3);
  for (let i = 0; i < ts.length; i++) {
    log(
      `SHL raised-shield lethal cause=${causes[i]} ${lines[i]} sneaking=${String(ts[i].isSneaking)} hp=${r2(hp(ts[i]))} death=${deaths.get(ts[i].id) ?? "none"} hurts=${hurtsSince(ts[i], t0)}`
    );
  }
});

// ------------------------------------------------------------------ absorption

scenario("probe_x22_absorption", 1200, async (test, players) => {
  const o = owner(test, players, { x: 3, y: 1, z: 5 }, "x22_abs_owner");
  const modes: ("pattern" | "plain" | "none")[] = ["pattern", "plain", "none"];
  const ts: SimulatedPlayer[] = [];
  for (let i = 0; i < modes.length; i++) {
    const p = await target(test, { x: 1 + 2 * i, y: 1, z: 2 }, `x22_abs_${modes[i]}`);
    players.push(p);
    ts.push(p);
  }
  for (const p of ts) p.addEffect("absorption", 2400, { amplifier: 3, showParticles: false });
  await test.idle(4);
  const t0 = system.currentTick;
  const first: string[] = [];
  for (let i = 0; i < ts.length; i++) {
    const m = modes[i];
    first.push(m === "none" ? `${r2(hp(ts[i]))}-untouched` : strike(ts[i], o, m));
  }
  await test.idle(CLEAR);
  // 16 more after the window: whatever the absorption no longer covers comes off the health bar
  for (let i = 0; i < ts.length; i++) {
    const before = hp(ts[i]);
    const ret = damage(ts[i], 16, { cause: EntityDamageCause.entityAttack, damagingEntity: o });
    const probe = before - hp(ts[i]);
    log(
      `ABS mode=${modes[i]} first=${first[i]} probe16(${ret}) health-delta=${r2(probe)} absorption-left-before-probe=${r2(16 - probe)} hurts=${hurtsSince(ts[i], t0)}`
    );
  }
});

// ------------------------------------------------------------------ causes and the bolt's own impact

scenario("probe_x22_causes", 2400, async (test, players) => {
  const at = { x: 3, y: 1, z: 2 };
  const o = owner(test, players, { x: 3, y: 1, z: 5 }, "x22_cau_owner");
  const t = await target(test, at, "x22_cau_target", { armour: true });
  players.push(t);
  const w: Who = { test, owner: o, at };

  for (const cause of [
    EntityDamageCause.projectile,
    EntityDamageCause.entityAttack,
    EntityDamageCause.sonicBoom,
    EntityDamageCause.magic,
    EntityDamageCause.override,
  ]) {
    const t0 = await fresh(w, t);
    log(`CAU armoured cause=${cause} with-owner ${strike(t, o, "plain", cause)} hurts=${hurtsSince(t, t0)}`);
  }

  // ByProjectile form with a snowball standing in for the bolt
  {
    const t0 = await fresh(w, t);
    const ball = test.getDimension().spawnEntity("minecraft:snowball", test.worldLocation({ x: 3.5, y: 4, z: 4.5 }));
    const before = hp(t);
    const ret = damage(t, D, { damagingProjectile: ball, damagingEntity: o });
    log(`CAU armoured by-projectile(snowball) ret=${ret} delta=${r2(before - hp(t))} hurts=${hurtsSince(t, t0)}`);
    if (ball.isValid) ball.remove();
  }

  // the snowball's own impact, then applyDamage(D) from projectileHitEntity: does the impact open the window first?
  {
    const t0 = await fresh(w, t);
    let seen = "no-hit";
    const sub = world.afterEvents.projectileHitEntity.subscribe((e) => {
      const hit = e.getEntityHit().entity;
      if (hit === undefined || hit.id !== t.id) return;
      const before = hp(t);
      const ret = damage(t, D, { cause: EntityDamageCause.entityAttack, damagingEntity: o });
      seen = `hit@+${system.currentTick - t0} hp-at-hit=${r2(before)} applyDamage(${ret}) delta=${r2(before - hp(t))}`;
    });
    await shot(test, test.worldLocation({ x: 3.5, y: 2.3, z: 4.2 }), t, "minecraft:snowball", o);
    await test.idle(15);
    world.afterEvents.projectileHitEntity.unsubscribe(sub);
    log(`CAU snowball-impact ${seen} hurts=${hurtsSince(t, t0)}`);
  }
});

// ------------------------------------------------------------------ the shipped Scythe, live

scenario("probe_x22_scythe_live", 600, async (test, players) => {
  const o = owner(test, players, { x: 3, y: 1, z: 6 }, "x22_scy_owner");
  const t = await target(test, { x: 3, y: 1, z: 1 }, "x22_scy_target", { armour: true });
  players.push(t);
  await test.idle(4);
  const hits: string[] = [];
  let ended = "";
  const t0 = system.currentTick;
  const before = hp(t);
  const observer: VolleyObserver = {
    onHit(n, after) {
      hits.push(`#${n}@+${system.currentTick - t0}:hp=${r2(after)}`);
    },
    onEnd(reason, n) {
      ended = `${reason}/hits=${n}`;
    },
  };
  const launched = launchVolley(o, t, observer);
  for (let i = 0; i < 300 && ended === ""; i++) await test.idle(1);
  log(`SCY launched=${String(launched)} hp ${r2(before)} -> ${r2(hp(t))} total=${r2(before - hp(t))} hits=${hits.join(" ")} end=${ended} hurts=${hurtsSince(t, t0)}`);
});
