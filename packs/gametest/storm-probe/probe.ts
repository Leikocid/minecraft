// Storm Blade probe on BDS 1.26.51.1 (STRM-PROBE-01-AA, docs/feedback/probe-storm.md). A vanilla
// diamond sword in a SimulatedPlayer's hand stands in for the unbuilt blade.
// - P1 what the server says about real and made-up particle ids;
// - P2 the before-event raise by f(6) against Resistance, an armoured mob, a critical hit, absorption;
// - P3 a lethal raise against a totem, and whose kill it is;
// - P4 knockback of applyDamage(entityAttack) with a source;
// - P5 TRACE_FLAGS and the cell-step budget of src/katana/plan.ts at a range of 10;
// - P6 the engine's Math.random at the acceptance sample size, and how many hits a tick can land.
//
// Not part of the shipped gametest pack: run.sh copies this file to src/gametest/probe-storm.ts for one
// run and restores the tree. A scenario passes when its measurement completed; the answers are the
// "[probe] STRM …" lines.

import {
  Difficulty,
  EnchantmentType,
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
import { TRACE_FLAGS } from "../katana/plan";

const STRUCTURE = "andrew:platform";
/** Ticks that clear any hurt window and let knockback settle before the next case. */
const CLEAR = 30;
const L_SWORD = 8;
const PASSIVE = 6;
const ACTIVE = 10;
const RANGE = 10;
/** P6: the acceptance sample size run.sh derives (exact binomial, p6-sample-size.mjs). */
const N_ACCEPT = 3700;

const log = (msg: string): void => console.warn(`[probe] STRM ${msg}`);
const r2 = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : String(n));
const r3 = (n: number): string => (Number.isFinite(n) ? n.toFixed(3) : String(n));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const v3 = (v: Vector3): string => `(${r2(v.x)},${r2(v.y)},${r2(v.z)})`;

interface Ev {
  tick: number;
  kind: string;
  text: string;
}
const journal = new Map<string, Ev[]>();
/** Target id → the last value beforeEvents.entityHurt read for an entityAttack hit. */
const lastRead = new Map<string, number>();
interface Death {
  tick: number;
  cause: string;
  by: string;
}
const deaths = new Map<string, Death>();

function note(id: string, kind: string, text: string): void {
  journal.get(id)?.push({ tick: system.currentTick, kind, text });
}

function watch(e: Entity): void {
  journal.set(e.id, []);
}

interface Boost {
  from: string;
  to: (read: number) => number;
  armed: boolean;
  result: string;
}
/** Target id → a one-shot rewrite of the next entityAttack hurt from `from`, applied in beforeEvents.entityHurt. */
const boosts = new Map<string, Boost>();

world.beforeEvents.entityHurt.subscribe((e) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  if (!journal.has(id)) return;
  const src = e.damageSource;
  const read = e.damage;
  if (src.cause === EntityDamageCause.entityAttack) lastRead.set(id, read);
  let extra = "";
  const boost = boosts.get(id);
  if (boost?.armed === true && src.cause === EntityDamageCause.entityAttack && src.damagingEntity?.id === boost.from) {
    boost.armed = false;
    try {
      e.damage = boost.to(read);
      boost.result = `read=${r2(read)} set=${r2(e.damage)}`;
    } catch (err) {
      boost.result = `read=${r2(read)} set-threw(${errText(err)})`;
    }
    extra = `->${r2(e.damage)}`;
  }
  note(id, "before", `${r2(read)}${extra}/${src.cause}`);
});

world.afterEvents.entityHurt.subscribe((e) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  note(id, "hurt", `${r2(e.damage)}/${e.damageSource.cause}`);
});

world.afterEvents.entityDie.subscribe((e) => {
  let id: string;
  try {
    id = e.deadEntity.id;
  } catch {
    return;
  }
  if (!journal.has(id)) return;
  const src = e.damageSource;
  let by = "none";
  try {
    by = src.damagingEntity === undefined ? "none" : `${src.damagingEntity.typeId}#${src.damagingEntity.id}`;
  } catch (err) {
    by = `unreadable(${errText(err)})`;
  }
  deaths.set(id, { tick: system.currentTick, cause: String(src.cause), by });
  note(id, "die", `${src.cause}/${by}`);
});

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function setHp(e: Entity, v: number): boolean {
  try {
    return e.getComponent("minecraft:health")?.setCurrentValue(v) ?? false;
  } catch {
    return false;
  }
}

function apply(t: Entity, amount: number, cause: EntityDamageCause, from?: Entity): { ret: string; delta: number } {
  const before = hp(t);
  let ret: string;
  try {
    ret = String(t.applyDamage(amount, from === undefined ? { cause } : { cause, damagingEntity: from }));
  } catch (err) {
    ret = `threw(${errText(err)})`;
  }
  return { ret, delta: before - hp(t) };
}

interface Armour {
  a: number;
  t: number;
  epf: number;
}
const NONE: Armour = { a: 0, t: 0, epf: 0 };
const ARMOUR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];

/** What a build can read: zeros where the entity has no equippable (mobs in 2.10.0). */
function armourOf(e: Entity): Armour {
  const eq = e.getComponent("minecraft:equippable");
  if (eq === undefined) return NONE;
  let epf = 0;
  for (const slot of ARMOUR_SLOTS) epf += eq.getEquipment(slot)?.getComponent("minecraft:enchantable")?.getEnchantment("protection")?.level ?? 0;
  return { a: eq.totalArmor, t: eq.totalToughness, epf: Math.min(20, epf) };
}

/** Armour + toughness + Protection on d, the formula diagnose-CNTR-X26 fitted; no Resistance. */
function reduced(d: number, ar: Armour): number {
  const f = Math.min(20, Math.max(ar.a / 5, ar.a - d / (2 + ar.t / 4)));
  return d * (1 - f / 25) * (1 - ar.epf / 25);
}

function swing(a: SimulatedPlayer, t: Entity): { ok: boolean; delta: number } {
  const before = hp(t);
  const ok = a.attackEntity(t);
  return { ok, delta: before - hp(t) };
}

type Kit = "bare" | "diamond" | "netherite_p4";

const KITS: Record<Kit, { ids: [EquipmentSlot, string][]; protection: number }> = {
  bare: { ids: [], protection: 0 },
  diamond: {
    ids: [
      [EquipmentSlot.Head, "minecraft:diamond_helmet"],
      [EquipmentSlot.Chest, "minecraft:diamond_chestplate"],
      [EquipmentSlot.Legs, "minecraft:diamond_leggings"],
      [EquipmentSlot.Feet, "minecraft:diamond_boots"],
    ],
    protection: 0,
  },
  netherite_p4: {
    ids: [
      [EquipmentSlot.Head, "minecraft:netherite_helmet"],
      [EquipmentSlot.Chest, "minecraft:netherite_chestplate"],
      [EquipmentSlot.Legs, "minecraft:netherite_leggings"],
      [EquipmentSlot.Feet, "minecraft:netherite_boots"],
    ],
    protection: 4,
  },
};

function equip(p: SimulatedPlayer, kit: Kit): string {
  const eq = p.getComponent("minecraft:equippable");
  const { ids, protection } = KITS[kit];
  for (const [slot, id] of ids) {
    const stack = new ItemStack(id);
    if (protection > 0) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("protection"), level: protection });
    eq?.setEquipment(slot, stack);
  }
  const worn = ids.map(([slot]) => eq?.getEquipment(slot)?.typeId ?? "none");
  return worn.length === 0 ? "bare" : `${worn.join("+")} protection=${protection}`;
}

interface Rig {
  test: Test;
  a: SimulatedPlayer;
  t: Entity;
  full: number;
  tag: string;
}

const AT = { x: 3.5, y: 2, z: 2.5 };

/** Waits the window out, puts the target back in reach, refills health; the case's tick zero. */
async function fresh(w: Rig): Promise<number> {
  await w.test.idle(CLEAR);
  w.t.teleport(w.test.worldLocation(AT));
  await w.test.idle(2);
  w.a.lookAtEntity(w.t);
  setHp(w.t, w.full);
  await w.test.idle(1);
  return system.currentTick;
}

function events(t: Entity, from: number): string {
  const list = (journal.get(t.id) ?? []).filter((ev) => ev.tick >= from);
  return `[${list.map((ev) => `+${ev.tick - from}:${ev.kind}:${ev.text}`).join(" ")}]`;
}

/** One case on a fresh target; total = health lost from tick zero to 3 ticks after the body. */
async function kase(w: Rig, label: string, body: (t0: number) => Promise<string> | string): Promise<number> {
  const t0 = await fresh(w);
  const hp0 = hp(w.t);
  lastRead.delete(w.t.id);
  const detail = await body(t0);
  await w.test.idle(3);
  const total = hp0 - hp(w.t);
  log(`${w.tag} ${label}: ${detail} total=${r2(total)} ev=${events(w.t, t0)}`);
  return total;
}

const swingOnly = (w: Rig) => (): string => {
  const s = swing(w.a, w.t);
  return `swing(${s.ok})=${r2(s.delta)}`;
};

const applyOnly = (w: Rig, amount: number) => (): string => {
  const h = apply(w.t, amount, EntityDamageCause.entityAttack, w.a);
  return `apply${amount}(${h.ret})=${r2(h.delta)}`;
};

/** Swing with the melee hit's damage rewritten in beforeEvents.entityHurt. */
const raisedSwing = (w: Rig, to: (read: number) => number) => async (): Promise<string> => {
  const boost: Boost = { from: w.a.id, to, armed: true, result: "before-event never fired" };
  boosts.set(w.t.id, boost);
  const s = swing(w.a, w.t);
  await w.test.idle(2);
  boosts.delete(w.t.id);
  return `swing(${s.ok})=${r2(s.delta)} before:${boost.result}`;
};

const add = (n: number) => (read: number): number => read + n;

function noise(tag: string, t: Entity): void {
  const stray = (journal.get(t.id) ?? []).filter(
    (ev) => ev.kind === "hurt" && ![EntityDamageCause.entityAttack, EntityDamageCause.sonicBoom, EntityDamageCause.magic].some((c) => ev.text.endsWith(`/${c}`))
  );
  log(`${tag} NOISE ${stray.length === 0 ? "none" : stray.map((ev) => ev.text).join(" ")}`);
}

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const regen = world.gameRules.naturalRegeneration;
    const pvp = world.gameRules.pvp;
    world.gameRules.naturalRegeneration = false;
    world.gameRules.pvp = true;
    try {
      log(`${name} START difficulty=${world.getDifficulty()} regen=false pvp=${String(world.gameRules.pvp)}`);
      await body(test, players);
      log(`${name} RESULT done`);
    } catch (err) {
      log(`${name} ERROR ${errText(err)}`);
      throw err;
    } finally {
      world.gameRules.naturalRegeneration = regen;
      world.gameRules.pvp = pvp;
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

function attacker(test: Test, players: SimulatedPlayer[], name: string, at: Vector3 = { x: 3, y: 2, z: 4 }): SimulatedPlayer {
  const a = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  players.push(a);
  a.setItem(new ItemStack("minecraft:diamond_sword"), 0, true);
  return a;
}

/** A Survival SimulatedPlayer wearing `kit`; 40 HP unless `boost` is false (20 HP). */
async function playerTarget(test: Test, players: SimulatedPlayer[], name: string, kit: Kit, boost = true, at: Vector3 = { x: 3, y: 2, z: 2 }): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  players.push(p);
  watch(p);
  await test.idle(2);
  if (boost) p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  p.addEffect("slow_falling", 20000, { showParticles: false });
  const desc = equip(p, kit);
  await test.idle(2);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  log(`SETUP ${name} hp=${r2(hp(p))} kit=${desc}`);
  return p;
}

// ------------------------------------------------------------------ P1: particle ids

/** [role, id]. Roles: the three uses adr-sblt names, the iPad-seen ids, and made-up controls. */
const PARTICLES: [string, string][] = [
  ["spark", "minecraft:electric_spark_particle"],
  ["spark", "minecraft:critical_hit_emitter"],
  ["spark", "minecraft:magic_critical_hit_emitter"],
  ["spark", "minecraft:sparkler_emitter"],
  ["spark", "minecraft:wax_particle"],
  ["spark-javaname", "minecraft:electric_spark"],
  ["spark-guess", "minecraft:spark"],
  ["flash", "minecraft:huge_explosion_lab_misc_emitter"],
  ["flash", "minecraft:knockback_roar_particle"],
  ["flash", "minecraft:totem_particle"],
  ["flash", "minecraft:explosion_particle"],
  ["flash", "minecraft:camera_shoot_explosion"],
  ["flash", "minecraft:white_smoke_particle"],
  ["flash-javaname", "minecraft:flash"],
  ["flash-guess", "minecraft:lightning"],
  ["gust", "minecraft:wind_explosion_emitter"],
  ["gust", "minecraft:breeze_wind_explosion_emitter"],
  ["gust", "minecraft:wind_charged_emitter"],
  ["gust", "minecraft:wind_charged_ambient"],
  ["gust", "minecraft:breeze_ground_particle"],
  ["gust-javaname", "minecraft:gust"],
  ["gust-javaname", "minecraft:gust_emitter_large"],
  ["ipad-seen", "minecraft:sonic_explosion"],
  ["ipad-seen", "minecraft:huge_explosion_emitter"],
  ["ipad-seen", "minecraft:large_explosion"],
  ["ipad-seen", "minecraft:campfire_tall_smoke_particle"],
  ["ipad-seen", "andrew:katana_petal"],
  ["made-up", "andrew:no_such_particle"],
  ["made-up", "minecraft:no_such_particle"],
];

scenario("probe_strm_particles", 400, async (test) => {
  const dim = test.getDimension();
  const at = test.worldLocation({ x: 3.5, y: 3, z: 3.5 });
  for (const [role, id] of PARTICLES) {
    let spawn = "ok";
    const t0 = Date.now();
    for (let i = 0; i < 3; i++) {
      try {
        dim.spawnParticle(id, at);
      } catch (err) {
        spawn = `threw(${errText(err)})`;
      }
    }
    const ms = Date.now() - t0;
    let cmd: string;
    try {
      cmd = `success=${dim.runCommand(`particle ${id} ${at.x} ${at.y} ${at.z}`).successCount}`;
    } catch (err) {
      cmd = `threw(${errText(err)})`;
    }
    log(`PARTICLE role=${role} id=${id} spawn3=${spawn} ms=${ms} cmd=${cmd}`);
    await test.idle(1);
  }
  let unloaded: string;
  try {
    dim.spawnParticle("andrew:no_such_particle", { x: at.x + 100000, y: at.y, z: at.z });
    unloaded = "ok";
  } catch (err) {
    unloaded = `threw(${errText(err)})`;
  }
  log(`PARTICLE CONTROL unloaded-point spawn=${unloaded}`);
  await test.idle(20);
});

// ------------------------------------------------------------------ P2: Resistance

for (const kit of ["bare", "diamond"] as Kit[]) {
  scenario(`probe_strm_resistance_${kit}`, 3600, async (test, players) => {
    const a = attacker(test, players, `strm_res_${kit}_a`);
    const t = await playerTarget(test, players, `strm_res_${kit}_t`, kit);
    const w: Rig = { test, a, t, full: 40, tag: `RES ${kit}` };
    const ar = armourOf(t);
    log(`${w.tag} ARMOUR totalArmor=${r2(ar.a)} totalToughness=${r2(ar.t)} epf=${ar.epf}`);
    const rows: string[] = [];
    for (const level of [0, 1, 2, 3, 4]) {
      t.removeEffect("resistance");
      if (level > 0) t.addEffect("resistance", 20000, { amplifier: level - 1, showParticles: false });
      const k = 1 - 0.2 * level;
      const melee = await kase(w, `R${level} melee alone`, swingOnly(w));
      const read = lastRead.get(t.id) ?? Number.NaN;
      const apply6 = await kase(w, `R${level} reference apply6 alone`, applyOnly(w, PASSIVE));
      const raisedF = await kase(w, `R${level} raise +f(6)`, raisedSwing(w, add(reduced(PASSIVE, ar))));
      const raisedFk = await kase(w, `R${level} raise +f(6)*k`, raisedSwing(w, add(reduced(PASSIVE, ar) * k)));
      const e1 = (reduced(L_SWORD, ar) + reduced(PASSIVE, ar)) * k;
      const e2 = reduced(L_SWORD * k, ar) + reduced(PASSIVE * k, ar);
      rows.push(
        `R${level} k=${r2(k)} melee=${r2(melee)} read=${r2(read)} f(8)k=${r2(reduced(L_SWORD, ar) * k)} f(8k)=${r2(reduced(L_SWORD * k, ar))} ` +
          `apply6=${r2(apply6)} f(6)k=${r2(reduced(PASSIVE, ar) * k)} native-sum=${r2(melee + apply6)} expect-armour-then-R=${r2(e1)} ` +
          `expect-R-then-armour=${r2(e2)} raised-f6=${r2(raisedF)} raised-f6k=${r2(raisedFk)}`
      );
    }
    t.removeEffect("resistance");
    for (const row of rows) log(`${w.tag} ROW ${row}`);
    noise(w.tag, t);
  });
}

// ------------------------------------------------------------------ P2: an armoured mob

const HUSK_DIAMOND = [
  "replaceitem entity @s slot.armor.head 0 diamond_helmet",
  "replaceitem entity @s slot.armor.chest 0 diamond_chestplate",
  "replaceitem entity @s slot.armor.legs 0 diamond_leggings",
  "replaceitem entity @s slot.armor.feet 0 diamond_boots",
];
const HUSK_HAS = [
  "hasitem={item=diamond_helmet,location=slot.armor.head}",
  "hasitem={item=diamond_chestplate,location=slot.armor.chest}",
  "hasitem={item=diamond_leggings,location=slot.armor.legs}",
  "hasitem={item=diamond_boots,location=slot.armor.feet}",
];

scenario("probe_strm_mob", 3600, async (test, players) => {
  const difficulty = world.getDifficulty();
  world.setDifficulty(Difficulty.Easy);
  try {
    const a = attacker(test, players, "strm_mob_a");
    const kits: [string, string[], Armour][] = [
      ["bare", [], NONE],
      ["diamond", HUSK_DIAMOND, { a: 20, t: 8, epf: 0 }],
    ];
    for (const [label, cmds, known] of kits) {
      const husk = test.spawnWithoutBehaviors("minecraft:husk", { x: 3, y: 2, z: 2 });
      watch(husk);
      await test.idle(2);
      const ran = cmds.map((c) => {
        try {
          return String(husk.runCommand(c).successCount);
        } catch (err) {
          return `threw(${errText(err)})`;
        }
      });
      await test.idle(2);
      const has = HUSK_HAS.map((h) => {
        try {
          return String(husk.runCommand(`testfor @s[${h}]`).successCount);
        } catch (err) {
          return `threw(${errText(err)})`;
        }
      });
      const eq = husk.getComponent("minecraft:equippable");
      const full = husk.getComponent("minecraft:health")?.effectiveMax ?? 20;
      const tag = `MOB husk ${label}`;
      log(`${tag} SETUP hp=${r2(hp(husk))} max=${r2(full)} replaceitem=[${ran.join(",")}] hasitem=[${has.join(",")}] equippable=${eq === undefined ? "absent" : `present a=${eq.totalArmor} t=${eq.totalToughness}`}`);
      const w: Rig = { test, a, t: husk, full, tag };
      const read = armourOf(husk);
      const melee = await kase(w, "melee alone", swingOnly(w));
      const meleeRead = lastRead.get(husk.id) ?? Number.NaN;
      const apply6 = await kase(w, "reference apply6 alone", applyOnly(w, PASSIVE));
      const raisedRead = await kase(w, "raise +f(6) from equippable", raisedSwing(w, add(reduced(PASSIVE, read))));
      const raisedKnown = await kase(w, "raise +f(6) from the known kit", raisedSwing(w, add(reduced(PASSIVE, known))));
      log(
        `${tag} ROW melee=${r2(melee)} read=${r2(meleeRead)} f_known(8)=${r2(reduced(L_SWORD, known))} apply6=${r2(apply6)} f_known(6)=${r2(reduced(PASSIVE, known))} ` +
          `native-sum=${r2(melee + apply6)} expect-known=${r2(reduced(L_SWORD, known) + reduced(PASSIVE, known))} f_equippable(6)=${r2(reduced(PASSIVE, read))} ` +
          `raised-equippable=${r2(raisedRead)} raised-known=${r2(raisedKnown)}`
      );
      noise(tag, husk);
      if (husk.isValid) husk.remove();
    }
  } finally {
    world.setDifficulty(difficulty);
  }
});

// ------------------------------------------------------------------ P2: a critical hit

/** Jump, wait `k` ticks, swing; the attacker's air state is read at the swing. */
const jumpSwing = (w: Rig, k: number, raise?: number) => async (): Promise<string> => {
  const jumped = w.a.jump();
  await w.test.idle(k);
  const state = `ground=${String(w.a.isOnGround)} falling=${String(w.a.isFalling)} vy=${r3(w.a.getVelocity().y)}`;
  let boost: Boost | undefined;
  if (raise !== undefined) {
    boost = { from: w.a.id, to: add(raise), armed: true, result: "before-event never fired" };
    boosts.set(w.t.id, boost);
  }
  const s = swing(w.a, w.t);
  await w.test.idle(2);
  boosts.delete(w.t.id);
  return `jump(${String(jumped)}) k=${k} ${state} swing(${s.ok})=${r2(s.delta)}${boost === undefined ? "" : ` before:${boost.result}`}`;
};

for (const kit of ["bare", "diamond"] as Kit[]) {
  scenario(`probe_strm_crit_${kit}`, 3600, async (test, players) => {
    const a = attacker(test, players, `strm_crit_${kit}_a`);
    const t = await playerTarget(test, players, `strm_crit_${kit}_t`, kit);
    const w: Rig = { test, a, t, full: 40, tag: `CRIT ${kit}` };
    const ar = armourOf(t);
    const plain = reduced(L_SWORD, ar);
    const sweep: string[] = [];
    let critK = -1;
    for (const k of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const d = await kase(w, `sweep k=${k}`, jumpSwing(w, k));
      sweep.push(`k=${k}:${r2(d)}`);
      if (critK < 0 && d > plain + 0.5) critK = k;
    }
    log(`${w.tag} SWEEP ${sweep.join(" ")} plain f(8)=${r2(plain)} critK=${critK}`);
    if (critK < 0) {
      log(`${w.tag} ROW no crit in the sweep`);
      noise(w.tag, t);
      return;
    }
    const crit1 = await kase(w, "crit alone", jumpSwing(w, critK));
    const critRead = lastRead.get(t.id) ?? Number.NaN;
    const crit2 = await kase(w, "crit alone again", jumpSwing(w, critK));
    const apply6 = await kase(w, "reference apply6 alone", applyOnly(w, PASSIVE));
    const raised1 = await kase(w, "crit raised +f(6)", jumpSwing(w, critK, reduced(PASSIVE, ar)));
    const raised2 = await kase(w, "crit raised +f(6) again", jumpSwing(w, critK, reduced(PASSIVE, ar)));
    const f12 = reduced(L_SWORD * 1.5, ar);
    log(
      `${w.tag} ROW critK=${critK} crit=${r2(crit1)}/${r2(crit2)} read=${r2(critRead)} f(12)=${r2(f12)} apply6=${r2(apply6)} f(6)=${r2(reduced(PASSIVE, ar))} ` +
        `native-sum=${r2(crit1 + apply6)} expect=${r2(f12 + reduced(PASSIVE, ar))} raised=${r2(raised1)}/${r2(raised2)}`
    );
    noise(w.tag, t);
  });
}

// ------------------------------------------------------------------ P2: absorption over armour

scenario("probe_strm_absorption", 4800, async (test, players) => {
  const a = attacker(test, players, "strm_abs_a");
  for (const kit of ["bare", "diamond", "netherite_p4"] as Kit[]) {
    const t = await playerTarget(test, players, `strm_abs_${kit}_t`, kit);
    const w: Rig = { test, a, t, full: 40, tag: `ABS ${kit}` };
    const ar = armourOf(t);
    const out: string[] = [];
    const modes: [string, () => Promise<string> | string][] = [
      ["control no hit", () => "untouched"],
      ["melee alone", swingOnly(w)],
      ["raise +f(6)", raisedSwing(w, add(reduced(PASSIVE, ar)))],
    ];
    for (const [label, body] of modes) {
      let lost = Number.NaN;
      let left = Number.NaN;
      await kase(w, `absorption I ${label}`, async () => {
        t.removeEffect("absorption");
        t.addEffect("absorption", 2400, { amplifier: 0, showParticles: false });
        await test.idle(2);
        const h0 = hp(t);
        const detail = await body();
        await test.idle(12);
        lost = h0 - hp(t);
        const p0 = hp(t);
        const probe = apply(t, 20, EntityDamageCause.sonicBoom);
        left = 20 - (p0 - hp(t));
        t.removeEffect("absorption");
        return `${detail} health-lost=${r2(lost)} probe-sonic20(${probe.ret}) absorption-left=${r2(left)}`;
      });
      out.push(`${label}: health-lost=${r2(lost)} absorption-left=${r2(left)}`);
    }
    const total = reduced(L_SWORD, ar) + reduced(PASSIVE, ar);
    log(
      `${w.tag} ROW f(8)+f(6)=${r2(total)} expect raise: health-lost=${r2(Math.max(0, total - 4))} absorption-left=${r2(Math.max(0, 4 - total))} | ${out.join(" | ")}`
    );
    noise(w.tag, t);
    test.removeSimulatedPlayer(t);
  }
});

// ------------------------------------------------------------------ P3: totem and kill credit

type Lethal = "melee" | "raise" | "write" | "apply";
/** P3 cases: melee, raise +6, raise to exactly 10, reference applyDamage(30), health write 0, and two
 * candidate ways out — no raise but a native lethal applyDamage(100) in the same tick or the next. */
type Kill = Lethal | "raiseTo10" | "sameTick100" | "nextTick100";

scenario("probe_strm_totem", 3600, async (test, players) => {
  const a = attacker(test, players, "strm_tot_a");
  const cases: [string, boolean, number, Kill][] = [
    ["control melee 8 into hp 10, totem", true, 10, "melee"],
    ["control melee 8 into hp 5 (lethal without a raise), totem", true, 5, "melee"],
    ["raise +6 makes the melee lethal, totem (1)", true, 10, "raise"],
    ["raise +6 makes the melee lethal, totem (2)", true, 10, "raise"],
    ["raise +6 makes the melee lethal, totem (3)", true, 10, "raise"],
    ["raise +6 on a melee already lethal (hp 5), totem", true, 5, "raise"],
    ["raise to exactly hp (10 into hp 10), totem", true, 10, "raiseTo10"],
    ["raise +6 makes the melee lethal, no totem", false, 10, "raise"],
    ["reference applyDamage(30, entityAttack, wielder), totem", true, 10, "apply"],
    ["reference applyDamage(30, entityAttack, wielder), no totem", false, 10, "apply"],
    ["health write 0, totem", true, 10, "write"],
    ["health write 0, no totem", false, 10, "write"],
    ["way out: melee unraised + applyDamage(100) same tick, totem", true, 10, "sameTick100"],
    ["way out: melee unraised + applyDamage(100) next tick, totem", true, 10, "nextTick100"],
    ["way out: melee unraised + applyDamage(100) next tick, no totem", false, 10, "nextTick100"],
  ];
  let n = 0;
  for (const [label, totem, hpStart, mode] of cases) {
    const t = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 2 }, `strm_tot_t${++n}`, GameMode.Survival);
    players.push(t);
    watch(t);
    await test.idle(3);
    t.addEffect("slow_falling", 2000, { showParticles: false });
    const eq = t.getComponent("minecraft:equippable");
    const put = totem ? String(eq?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:totem_of_undying"))) : "-";
    a.lookAtEntity(t);
    setHp(t, hpStart);
    await test.idle(2);
    const t0 = system.currentTick;
    const hp0 = hp(t);
    const off0 = eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
    let act = "";
    if (mode === "apply") {
      act = `apply30(${apply(t, 30, EntityDamageCause.entityAttack, a).ret})`;
    } else if (mode === "write") {
      act = `write0(${String(setHp(t, 0))})`;
    } else {
      let boost: Boost | undefined;
      if (mode === "raise" || mode === "raiseTo10") {
        boost = { from: a.id, to: mode === "raise" ? add(PASSIVE) : () => 10, armed: true, result: "before-event never fired" };
        boosts.set(t.id, boost);
      }
      const ok = a.attackEntity(t);
      act = `swing(${String(ok)})${boost === undefined ? "" : ` before:${boost.result}`} hp-same-tick=${r2(hp(t))}`;
      if (mode === "sameTick100") act += ` apply100(${apply(t, 100, EntityDamageCause.entityAttack, a).ret})`;
      if (mode === "nextTick100") {
        await test.idle(1);
        act += ` +${system.currentTick - t0} apply100(${apply(t, 100, EntityDamageCause.entityAttack, a).ret})`;
      }
    }
    await test.idle(4);
    boosts.delete(t.id);
    const death = deaths.get(t.id);
    const off1 = eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
    let fx = "";
    try {
      fx = t.getEffects().map((e) => `${e.typeId}:${e.amplifier}`).filter((s) => !s.includes("slow_falling")).join(",");
    } catch (err) {
      fx = `threw(${errText(err)})`;
    }
    const credited = death === undefined ? "n/a" : String(death.by.endsWith(`#${a.id}`));
    log(
      `TOTEM ROW ${label}: put=${put} hp0=${r2(hp0)} offhand ${off0} -> ${off1} ${act} hp-after=${r2(hp(t))} ` +
        `died=${death === undefined ? "no" : `yes cause=${death.cause} by=${death.by} +${death.tick - t0}`} credited-to-wielder=${credited} effects=[${fx}] ev=${events(t, t0)}`
    );
    test.removeSimulatedPlayer(t);
    await test.idle(2);
  }
});

scenario("probe_strm_credit", 2400, async (test, players) => {
  const a = attacker(test, players, "strm_cred_a");
  log(`CREDIT doMobLoot=${String(world.gameRules.doMobLoot)}`);
  const cases: [string, number, Lethal | "sourceless"][] = [
    ["control melee 8 into hp 10", 10, "melee"],
    ["raise +6 makes the melee lethal", 10, "raise"],
    ["positive control: melee 8 into hp 5", 5, "melee"],
    ["negative control: sourceless applyDamage(30)", 10, "sourceless"],
    ["health write 0", 10, "write"],
  ];
  for (const [label, hp0, mode] of cases) {
    const cow = test.spawnWithoutBehaviors("minecraft:cow", { x: 3, y: 2, z: 2 });
    watch(cow);
    await test.idle(2);
    a.lookAtEntity(cow);
    setHp(cow, hp0);
    await test.idle(1);
    const xp0 = a.getTotalXp();
    const t0 = system.currentTick;
    let act = "";
    if (mode === "melee" || mode === "raise") {
      let boost: Boost | undefined;
      if (mode === "raise") {
        boost = { from: a.id, to: add(PASSIVE), armed: true, result: "before-event never fired" };
        boosts.set(cow.id, boost);
      }
      act = `swing(${String(a.attackEntity(cow))})${boost === undefined ? "" : ` before:${boost.result}`}`;
    } else if (mode === "sourceless") {
      act = `apply30(${apply(cow, 30, EntityDamageCause.entityAttack).ret})`;
    } else {
      act = `write0(${String(setHp(cow, 0))})`;
    }
    const where = cow.location;
    await test.idle(40);
    boosts.delete(cow.id);
    const dim = test.getDimension();
    const orbs = dim.getEntities({ type: "minecraft:xp_orb", location: where, maxDistance: 6 });
    const items = dim.getEntities({ type: "minecraft:item", location: where, maxDistance: 6 });
    const death = deaths.get(cow.id);
    log(
      `CREDIT ROW ${label}: ${act} alive=${String(cow.isValid && hp(cow) > 0)} died=${death === undefined ? "no" : `yes cause=${death.cause} by=${death.by}`} ` +
        `credited-to-wielder=${death === undefined ? "n/a" : String(death.by.endsWith(`#${a.id}`))} wielder-xp=${xp0}->${a.getTotalXp()} orbs=${orbs.length} drops=${items.length} ev=${events(cow, t0)}`
    );
    for (const e of [...orbs, ...items]) if (e.isValid) e.remove();
    if (cow.isValid) cow.remove();
    await test.idle(2);
  }
});

// ------------------------------------------------------------------ P4: knockback

type Push = "none" | "melee" | "raise" | "apply4" | "apply10" | "apply4-nosource" | "sonic4" | "magic4";
const PUSHES: Push[] = ["none", "melee", "raise", "apply4", "apply10", "apply4-nosource", "sonic4", "magic4"];

function push(a: SimulatedPlayer, t: Entity, mode: Push): string {
  switch (mode) {
    case "none":
      return "-";
    case "melee":
      return `swing(${String(a.attackEntity(t))})`;
    case "raise": {
      const boost: Boost = { from: a.id, to: add(PASSIVE), armed: true, result: "before-event never fired" };
      boosts.set(t.id, boost);
      const ok = a.attackEntity(t);
      boosts.delete(t.id);
      return `swing(${String(ok)}) before:${boost.result}`;
    }
    case "apply4":
      return `ret=${apply(t, 4, EntityDamageCause.entityAttack, a).ret}`;
    case "apply10":
      return `ret=${apply(t, 10, EntityDamageCause.entityAttack, a).ret}`;
    case "apply4-nosource":
      return `ret=${apply(t, 4, EntityDamageCause.entityAttack).ret}`;
    case "sonic4":
      return `ret=${apply(t, 4, EntityDamageCause.sonicBoom, a).ret}`;
    case "magic4":
      return `ret=${apply(t, 4, EntityDamageCause.magic, a).ret}`;
  }
}

async function knockbackRows(test: Test, a: SimulatedPlayer, t: Entity, tag: string, full: number): Promise<void> {
  const aAt = test.worldLocation({ x: 1.5, y: 2, z: 3.5 });
  const tAt = test.worldLocation({ x: 3.5, y: 2, z: 3.5 });
  for (const mode of PUSHES) {
    for (const rep of [1, 2]) {
      await test.idle(CLEAR);
      if (!t.isValid) {
        log(`${tag} ROW ${mode} rep=${rep}: target gone`);
        continue;
      }
      a.teleport(aAt);
      t.teleport(tAt);
      await test.idle(4);
      setHp(t, full);
      a.lookAtEntity(t);
      await test.idle(1);
      const p0 = t.location;
      const h0 = hp(t);
      const what = push(a, t, mode);
      const v0 = t.getVelocity();
      let maxUp = 0;
      let p1: Vector3 = p0;
      let v1: Vector3 = v0;
      for (let i = 1; i <= 10; i++) {
        await test.idle(1);
        maxUp = Math.max(maxUp, t.location.y - p0.y);
        if (i === 1) {
          p1 = t.location;
          v1 = t.getVelocity();
        }
      }
      const p10 = t.location;
      const dx = p10.x - p0.x;
      const dz = p10.z - p0.z;
      log(
        `${tag} ROW ${mode} rep=${rep}: ${what} lost=${r2(h0 - hp(t))} v0=${v3(v0)} v1=${v3(v1)} d1=${r2(Math.hypot(p1.x - p0.x, p1.z - p0.z))} ` +
          `d10=${r2(Math.hypot(dx, dz))} away=${r2(dx)} side=${r2(dz)} maxUp=${r2(maxUp)}`
      );
    }
  }
}

scenario("probe_strm_knockback", 4800, async (test, players) => {
  const a = attacker(test, players, "strm_kb_a", { x: 1, y: 2, z: 3 });
  const t = await playerTarget(test, players, "strm_kb_t", "bare", true, { x: 3, y: 2, z: 3 });
  await knockbackRows(test, a, t, "KB player", 40);
  noise("KB player", t);
  test.removeSimulatedPlayer(t);
  // 20 HP: the raise (14) and applyDamage(10) must not kill the mob between rows.
  const mob = test.spawn("minecraft:villager_v2", { x: 3, y: 2, z: 3 });
  watch(mob);
  mob.addEffect("slowness", 20000, { amplifier: 255, showParticles: false });
  await test.idle(2);
  const full = mob.getComponent("minecraft:health")?.effectiveMax ?? 20;
  log(`KB villager SETUP hp=${r2(hp(mob))} max=${r2(full)}`);
  await knockbackRows(test, a, mob, "KB villager", full);
  noise("KB villager", mob);
  if (mob.isValid) mob.remove();
});

// ------------------------------------------------------------------ P5: the trace

const AXES = ["x", "y", "z"] as const;

function norm(v: Vector3): Vector3 {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

/** plan.ts cellsAlong + trace: cell steps up to `range`, plus one past it (the part-block exit step). */
function budget(from: Vector3, dir: Vector3, range: number): number {
  const cell = { x: Math.floor(from.x), y: Math.floor(from.y), z: Math.floor(from.z) };
  const next = { x: Infinity, y: Infinity, z: Infinity };
  const delta = { x: Infinity, y: Infinity, z: Infinity };
  for (const a of AXES) {
    if (dir[a] !== 0) {
      next[a] = ((dir[a] > 0 ? cell[a] + 1 : cell[a]) - from[a]) / dir[a];
      delta[a] = 1 / Math.abs(dir[a]);
    }
  }
  let steps = 0;
  for (;;) {
    const a = next.x <= next.y && next.x <= next.z ? "x" : next.y <= next.z ? "y" : "z";
    if (next[a] > range) return steps + 1;
    next[a] += delta[a];
    steps++;
  }
}

const FACE_NORMALS: Record<string, Vector3> = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 },
};

interface BlockShot {
  text: string;
  dist: number;
}

function blockShot(test: Test, from: Vector3, dir: Vector3, maxDistance: number): BlockShot {
  try {
    const hit = test.getDimension().getBlockFromRay(from, dir, { ...TRACE_FLAGS, maxDistance });
    if (hit === undefined) return { text: `none(steps=${maxDistance})`, dist: Infinity };
    const n = FACE_NORMALS[hit.face] ?? { x: 0, y: 0, z: 0 };
    const f = hit.faceLocation;
    const b = hit.block.location;
    const wrap = (v: number, axis: number): number => (axis === 1 && v === 0 ? 1 : v);
    const p = { x: b.x + wrap(f.x, n.x), y: b.y + wrap(f.y, n.y), z: b.z + wrap(f.z, n.z) };
    const dist = Math.hypot(p.x - from.x, p.y - from.y, p.z - from.z);
    const rel = test.relativeLocation(b);
    return { text: `${hit.block.typeId.replace("minecraft:", "")}@rel${v3(rel)}/${hit.face} d=${r2(dist)}(steps=${maxDistance})`, dist };
  } catch (err) {
    return { text: `threw(${errText(err)})`, dist: Number.NaN };
  }
}

function entityShot(test: Test, from: Vector3, dir: Vector3, opts: { maxDistance: number; ignoreBlockCollision?: boolean; includePassableBlocks?: boolean; includeLiquidBlocks?: boolean }): string {
  try {
    const hits = test.getDimension().getEntitiesFromRay(from, dir, opts);
    return `[${hits.map((h) => `${(h.entity.nameTag || h.entity.typeId).replace("minecraft:", "")}@${r2(h.distance)}`).join(" ")}]`;
  } catch (err) {
    return `threw(${errText(err)})`;
  }
}

scenario("probe_strm_trace", 3600, async (test, players) => {
  const dim = test.getDimension();
  const placed = new Map<string, { at: Vector3; was: string }>();
  const set = (rel: Vector3, id: string): void => {
    const at = test.worldLocation(rel);
    const key = `${at.x},${at.y},${at.z}`;
    if (!placed.has(key)) placed.set(key, { at, was: dim.getBlock(at)?.typeId ?? "minecraft:air" });
    try {
      dim.setBlockType(at, id);
    } catch (err) {
      log(`TRACE set ${id} at rel${v3(rel)} threw(${errText(err)})`);
    }
  };
  const cows: Entity[] = [];
  const cow = (name: string, rel: Vector3): Entity => {
    const c = test.spawnWithoutBehaviors("minecraft:cow", { x: Math.floor(rel.x), y: 2, z: Math.floor(rel.z) });
    c.nameTag = name;
    c.teleport(test.worldLocation(rel));
    cows.push(c);
    return c;
  };
  const clearCows = (): void => {
    for (const c of cows.splice(0)) if (c.isValid) c.remove();
  };
  try {
    for (let x = 0; x <= 12; x++) for (let z = 0; z <= 9; z++) if (x > 6 || z > 6) set({ x, y: 1, z }, "minecraft:stone");
    for (let x = 0; x <= 12; x++) for (let z = 0; z <= 9; z++) for (let y = 2; y <= 9; y++) if (x > 6 || z > 6) set({ x, y, z }, "minecraft:air");
    await test.idle(2);

    // A — along +x from rel (0.5, 2.6, 3.5): wall, two in a row, the range edge.
    const oA = test.worldLocation({ x: 0.5, y: 2.6, z: 3.5 });
    const east = { x: 1, y: 0, z: 0 };
    const stepsA = budget(oA, east, RANGE);
    set({ x: 6, y: 2, z: 3 }, "minecraft:stone");
    set({ x: 6, y: 3, z: 3 }, "minecraft:stone");
    cow("front", { x: 3.5, y: 2, z: 3.5 });
    cow("behind", { x: 8.5, y: 2, z: 3.5 });
    await test.idle(3);
    let stop = blockShot(test, oA, east, stepsA);
    log(`TRACE A1 wall@x6: block=${stop.text} entities(maxD=stop)=${entityShot(test, oA, east, { maxDistance: stop.dist })} entities(maxD=10)=${entityShot(test, oA, east, { maxDistance: RANGE })} entities(maxD=10,ignoreBlockCollision)=${entityShot(test, oA, east, { maxDistance: RANGE, ignoreBlockCollision: true })} entities(maxD=stop,ignoreBlockCollision)=${entityShot(test, oA, east, { maxDistance: stop.dist, ignoreBlockCollision: true })}`);
    for (const c of cows) if (c.nameTag === "front" && c.isValid) c.remove();
    await test.idle(1);
    log(`TRACE A1b wall@x6 front cow removed: entities(maxD=stop)=${entityShot(test, oA, east, { maxDistance: stop.dist })} entities(maxD=10)=${entityShot(test, oA, east, { maxDistance: RANGE })}`);
    clearCows();
    set({ x: 6, y: 2, z: 3 }, "minecraft:air");
    set({ x: 6, y: 3, z: 3 }, "minecraft:air");
    cow("first", { x: 3.5, y: 2, z: 3.5 });
    cow("second", { x: 6.5, y: 2, z: 3.5 });
    await test.idle(3);
    stop = blockShot(test, oA, east, stepsA);
    log(`TRACE A2 two in a row, no wall: block=${stop.text} entities(maxD=10)=${entityShot(test, oA, east, { maxDistance: RANGE })}`);
    clearCows();
    cow("in9.4", { x: 9.9, y: 2, z: 3.5 });
    await test.idle(3);
    log(`TRACE A3 centre 9.40 out: entities(maxD=10)=${entityShot(test, oA, east, { maxDistance: RANGE })}`);
    clearCows();
    cow("out10.6", { x: 11.1, y: 2, z: 3.5 });
    await test.idle(3);
    log(`TRACE A3 centre 10.60 out: entities(maxD=10)=${entityShot(test, oA, east, { maxDistance: RANGE })} entities(maxD=11)=${entityShot(test, oA, east, { maxDistance: 11 })}`);
    clearCows();

    // B — the xz diagonal from rel (0.5, 2.6, 0.7): a staircase wall the ray meets at ~7.8.
    const oB = test.worldLocation({ x: 0.5, y: 2.6, z: 0.7 });
    const diag = norm({ x: 1, y: 0, z: 1 });
    const stepsB = budget(oB, diag, RANGE);
    const wallB: Vector3[] = [];
    for (let k = -3; k <= 3; k++) for (const y of [2, 3]) wallB.push({ x: 6 - k, y, z: 6 + k }, { x: 7 - k, y, z: 6 + k });
    for (const c of wallB) set(c, "minecraft:stone");
    cow("front", { x: 0.5 + 4 / Math.SQRT2, y: 2, z: 0.7 + 4 / Math.SQRT2 });
    cow("behind", { x: 0.5 + 10 / Math.SQRT2, y: 2, z: 0.7 + 10 / Math.SQRT2 });
    await test.idle(3);
    const naiveB = blockShot(test, oB, diag, RANGE);
    stop = blockShot(test, oB, diag, stepsB);
    log(
      `TRACE B diagonal xz wall: block(maxD=10)=${naiveB.text} block(budget)=${stop.text} entities(maxD=stop)=${entityShot(test, oB, diag, { maxDistance: stop.dist })} ` +
        `entities(maxD=10)=${entityShot(test, oB, diag, { maxDistance: RANGE })} entities(maxD=10,ignoreBlockCollision)=${entityShot(test, oB, diag, { maxDistance: RANGE, ignoreBlockCollision: true })} entities(maxD=stop,ignoreBlockCollision)=${entityShot(test, oB, diag, { maxDistance: stop.dist, ignoreBlockCollision: true })}`
    );
    for (const c of wallB) set(c, "minecraft:air");
    await test.idle(2);
    log(`TRACE B2 diagonal, wall removed: block(budget)=${blockShot(test, oB, diag, stepsB).text} entities(maxD=10)=${entityShot(test, oB, diag, { maxDistance: RANGE })}`);
    clearCows();

    // C — the (1,1,1) diagonal from rel (0.5, 2.3, 0.7): a 3×3×3 cube the ray enters at ~6.4.
    const oC = test.worldLocation({ x: 0.5, y: 2.3, z: 0.7 });
    const diag3 = norm({ x: 1, y: 1, z: 1 });
    const cube: Vector3[] = [];
    for (let x = 4; x <= 6; x++) for (let y = 6; y <= 8; y++) for (let z = 4; z <= 6; z++) cube.push({ x, y, z });
    for (const c of cube) set(c, "minecraft:stone");
    await test.idle(2);
    log(`TRACE C diagonal xyz cube: block(maxD=10)=${blockShot(test, oC, diag3, RANGE).text} block(budget)=${blockShot(test, oC, diag3, budget(oC, diag3, RANGE)).text}`);
    for (const c of cube) set(c, "minecraft:air");
    await test.idle(2);

    // D — one block at rel (3, 2, 3) in the +x row, a cow behind it at x 5.5.
    const materials = [
      "minecraft:stone",
      "minecraft:glass",
      "minecraft:glass_pane",
      "minecraft:iron_bars",
      "minecraft:oak_fence",
      "minecraft:oak_leaves",
      "minecraft:iron_chain",
      "minecraft:barrier",
      "minecraft:scaffolding",
      "minecraft:powder_snow",
      "minecraft:web",
      "minecraft:short_grass",
      "minecraft:poppy",
      "minecraft:torch",
      "minecraft:standing_sign",
      "minecraft:white_carpet",
      "minecraft:snow_layer",
      "minecraft:light_block_15",
      "minecraft:water",
      "minecraft:air",
    ];
    // Water can spread: the cells around it are recorded (and later restored) before any is placed.
    for (let x = 2; x <= 4; x++) for (let z = 2; z <= 4; z++) set({ x, y: 2, z }, "minecraft:air");
    cow("target", { x: 5.5, y: 2, z: 3.5 });
    for (const id of materials) {
      set({ x: 3, y: 2, z: 3 }, id);
      await test.idle(2);
      const read = dim.getBlock(test.worldLocation({ x: 3, y: 2, z: 3 }))?.typeId ?? "unreadable";
      const shot = blockShot(test, oA, east, stepsA);
      const clamp = Number.isFinite(shot.dist) ? shot.dist : RANGE;
      log(
        `TRACE D ${id.replace("minecraft:", "")} (reads ${read.replace("minecraft:", "")}): block=${shot.text} ` +
          `pick(maxD=stop,ignoreBlockCollision)=${entityShot(test, oA, east, { maxDistance: clamp, ignoreBlockCollision: true })} ` +
          `entity(default)=${entityShot(test, oA, east, { maxDistance: RANGE })} entity(TRACE_FLAGS)=${entityShot(test, oA, east, { maxDistance: RANGE, ...TRACE_FLAGS })} ` +
          `entity(ignoreBlockCollision)=${entityShot(test, oA, east, { maxDistance: RANGE, ignoreBlockCollision: true })}`
      );
    }
    for (let x = 2; x <= 4; x++) for (let z = 2; z <= 4; z++) set({ x, y: 2, z }, "minecraft:air");
    clearCows();

    // E — from a SimulatedPlayer's own head and view direction: does the ray return the wielder?
    const w = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 3 }, "strm_trace_w", GameMode.Survival);
    players.push(w);
    const target = cow("target", { x: 4.5, y: 2, z: 3.5 });
    await test.idle(3);
    w.lookAtEntity(target);
    await test.idle(3);
    const head = w.getHeadLocation();
    const view = w.getViewDirection();
    log(`TRACE E wielder head=${v3(test.relativeLocation(head))} view=${v3(view)} entities(maxD=10)=${entityShot(test, head, view, { maxDistance: RANGE })}`);
    test.removeSimulatedPlayer(w);
    clearCows();

    // F — a non-living entity in front of a cow: is it in the ray, and does it carry health?
    const kinds = ["minecraft:armor_stand", "minecraft:minecart", "minecraft:boat", "minecraft:item", "minecraft:xp_orb", "minecraft:arrow", "minecraft:snowball"];
    const ref = cow("target", { x: 5.5, y: 2, z: 3.5 });
    log(`TRACE F reference cow families=${ref.getComponent("minecraft:type_family")?.getTypeFamilies().join("+") ?? "absent"}`);
    for (const kind of kinds) {
      const at = test.worldLocation({ x: 3.5, y: 2.3, z: 3.5 });
      let e: Entity | undefined;
      try {
        e = kind === "minecraft:item" ? dim.spawnItem(new ItemStack("minecraft:stick"), at) : dim.spawnEntity(kind, at);
      } catch (err) {
        log(`TRACE F ${kind} spawn threw(${errText(err)})`);
        continue;
      }
      const now = entityShot(test, oA, east, { maxDistance: RANGE });
      await test.idle(1);
      const health = e.isValid ? e.getComponent("minecraft:health") : undefined;
      let families = "absent";
      try {
        families = e.isValid ? (e.getComponent("minecraft:type_family")?.getTypeFamilies().join("+") ?? "absent") : "gone";
      } catch (err) {
        families = `threw(${errText(err)})`;
      }
      log(
        `TRACE F ${kind.replace("minecraft:", "")}: entities(+0)=${now} entities(+1)=${entityShot(test, oA, east, { maxDistance: RANGE })} ` +
          `health=${health === undefined ? "absent" : `${r2(health.currentValue)}/${r2(health.effectiveMax)}`} families=${families}`
      );
      if (e.isValid) e.remove();
      await test.idle(1);
    }
    clearCows();
  } finally {
    clearCows();
    for (const { at, was } of placed.values()) {
      try {
        dim.setBlockType(at, was);
      } catch {
        // an unchanged block throws; nothing to restore
      }
    }
  }
});

// ------------------------------------------------------------------ P6: Math.random and hit throughput

scenario("probe_strm_random", 3000, async (test, players) => {
  const bins = new Array<number>(10).fill(0);
  let under30 = 0;
  let total = 0;
  const t0 = Date.now();
  for (let tick = 0; tick < 20; tick++) {
    for (let i = 0; i < 50000; i++) {
      const r = Math.random();
      bins[Math.min(9, Math.floor(r * 10))]++;
      if (r < 0.3) under30++;
      total++;
    }
    await test.idle(1);
  }
  const ms = Date.now() - t0;
  const e = total / 10;
  const chi = bins.reduce((s, b) => s + ((b - e) * (b - e)) / e, 0);
  log(`RANDOM UNIFORM rolls=${total} p(<0.3)=${(under30 / total).toFixed(5)} chi2(9df)=${r2(chi)} bins=[${bins.join(",")}] ms=${ms}`);

  const trials = 1000;
  for (const p of [0.3, 0.25, 0.35]) {
    let inside = 0;
    let sum = 0;
    let sum2 = 0;
    let lo = 1;
    let hi = 0;
    for (let tr = 0; tr < trials; tr++) {
      let k = 0;
      for (let i = 0; i < N_ACCEPT; i++) if (Math.random() < p) k++;
      const ph = k / N_ACCEPT;
      sum += ph;
      sum2 += ph * ph;
      lo = Math.min(lo, ph);
      hi = Math.max(hi, ph);
      if (ph >= 0.275 && ph <= 0.325) inside++;
      if (tr % 25 === 24) await test.idle(1);
    }
    const mean = sum / trials;
    const sd = Math.sqrt(sum2 / trials - mean * mean);
    log(
      `RANDOM TRIALS p=${p} N=${N_ACCEPT} trials=${trials} mean=${mean.toFixed(4)} sd=${sd.toFixed(4)} theory-sd=${Math.sqrt((p * (1 - p)) / N_ACCEPT).toFixed(4)} ` +
        `min=${lo.toFixed(4)} max=${hi.toFixed(4)} accepted[0.275,0.325]=${inside}`
    );
  }

  // Landed melee hits per tick. One attacker swinging every tick over ten cows (each out of its
  // window), then five attackers with a cow each, swinging every tick.
  const centre = test.worldLocation({ x: 3.5, y: 2, z: 3.5 });
  const ring: Entity[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5;
    const c = test.spawnWithoutBehaviors("minecraft:cow", { x: 3, y: 2, z: 3 });
    c.teleport({ x: centre.x + 2.2 * Math.cos(ang), y: centre.y, z: centre.z + 2.2 * Math.sin(ang) });
    watch(c);
    ring.push(c);
  }
  const a = attacker(test, players, "strm_rate_a", { x: 3, y: 2, z: 3 });
  await test.idle(5);
  const rate = async (label: string, pairs: [SimulatedPlayer, Entity[]][]): Promise<void> => {
    const start = system.currentTick;
    let swings = 0;
    const okTicks: number[] = [];
    for (let i = 0; i < 200; i++) {
      for (const [who, targets] of pairs) {
        const c = targets[i % targets.length];
        setHp(c, 10);
        who.lookAtEntity(c);
        if (who.attackEntity(c)) okTicks.push(i);
        swings++;
      }
      await test.idle(1);
    }
    let landed = 0;
    for (const [, targets] of pairs) for (const c of targets) landed += (journal.get(c.id) ?? []).filter((ev) => ev.kind === "hurt" && ev.tick >= start).length;
    const gaps = okTicks.slice(1).map((t, i) => t - okTicks[i]);
    const gapSet = [...new Set(gaps)].sort((x, y) => x - y).join(",");
    log(`RANDOM RATE ${label}: attackers=${pairs.length} swings=${swings} accepted=${okTicks.length} landed=${landed} ticks=${system.currentTick - start} first-ok=${okTicks.slice(0, 6).join(",")} gaps=[${gapSet}]`);
  };
  await rate("one attacker, ten cows in turn", [[a, ring]]);
  await test.idle(20);
  const crew: [SimulatedPlayer, Entity[]][] = [[a, [ring[0]]]];
  for (let i = 1; i < 5; i++) {
    const ang = (i * 2 * Math.PI) / 5;
    const extra = attacker(test, players, `strm_rate_a${i}`, { x: 3, y: 2, z: 3 });
    extra.teleport({ x: centre.x + 0.8 * Math.cos(ang), y: centre.y, z: centre.z + 0.8 * Math.sin(ang) });
    crew.push([extra, [ring[i * 2]]]);
  }
  await test.idle(5);
  await rate("five attackers, a cow each", crew);
  for (const c of ring) if (c.isValid) c.remove();
});
