// STRM-DMG-01 scenarios for the Storm Blade damage helper (src/storm/damage.ts; L0-strm-rdmg, L0-adr-sbdm R and C,
// L0-xcx26, L0-strm-acd 1–5). A vanilla diamond sword in a SimulatedPlayer's main hand stands in for the blade: the
// helper never looks at the item. This file's beforeEvents.entityHurt handler stands in for the passive's: it calls
// raiseHit on the one hit a case arms. Witnesses are health read by the test in the call's own tick, the engine's
// entityHurt and entityDie events, and the off-hand slot. Each scenario logs "[gametest] storm-damage <tag> ROW …" and
// fails on the first scenario-end check that does not hold; every row is printed first.

import { EnchantmentType, type Entity, EntityDamageCause, EquipmentSlot, GameMode, ItemStack, type Vector3, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import {
  ACTIVE_DAMAGE,
  PASSIVE_DAMAGE,
  type RaiseReport,
  type StrikeReport,
  afterArmour,
  defenceOf,
  observeStorm,
  raiseHit,
  registerStormDamage,
  stormDamage,
} from "../storm/damage";

registerStormDamage();

const STRUCTURE = "andrew:platform";
/** Waits out any hurt window and lets the knockback settle before the next case. */
const CLEAR = 30;
/** Ticks between a melee and the active inside its window. */
const GAP = 3;
const TOL = 0.01;
const EYE = 1.62;
const TOTEM = "minecraft:totem_of_undying";

const log = (msg: string): void => console.warn(`[gametest] storm-damage ${msg}`);
const r2 = (n: number | undefined): string => (n === undefined ? "-" : Number.isFinite(n) ? n.toFixed(2) : String(n));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const close = (a: number, b: number): boolean => Math.abs(a - b) <= TOL + 1e-9;

// ------------------------------------------------------------------ witnesses

interface Ev {
  tick: number;
  kind: "before" | "hurt" | "die";
  text: string;
  damage: number;
  by: string;
}

const journal = new Map<string, Ev[]>();
const strikes: StrikeReport[] = [];
observeStorm((r) => {
  if (r.type === "strike") strikes.push(r);
});

function watch(e: Entity): void {
  journal.set(e.id, []);
}

function note(id: string, ev: Omit<Ev, "tick">): void {
  journal.get(id)?.push({ tick: system.currentTick, ...ev });
}

/** How the next entityAttack hurt of a target from `from` is rewritten. */
type ArmMode = "helper" | "flat" | "unchecked";
interface Arm {
  from: string;
  mode: ArmMode;
  read?: number;
  set?: number;
  report?: RaiseReport;
}
const armed = new Map<string, Arm>();

world.beforeEvents.entityHurt.subscribe((e) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  const read = e.damage;
  const arm = armed.get(id);
  if (arm !== undefined && e.damageSource.cause === EntityDamageCause.entityAttack && e.damageSource.damagingEntity?.id === arm.from) {
    armed.delete(id);
    arm.read = read;
    if (arm.mode === "helper") {
      arm.report = raiseHit(e, PASSIVE_DAMAGE);
    } else if (arm.mode === "flat") {
      // Negative control: +6 after armour, i.e. true damage.
      e.damage = read + PASSIVE_DAMAGE;
    } else {
      // Negative control: the formula's raise with no lethal check (probe-storm P3).
      e.damage = read + afterArmour(PASSIVE_DAMAGE, defenceOf(e.hurtEntity));
    }
    arm.set = e.damage;
  }
  if (journal.has(id)) note(id, { kind: "before", text: `${r2(read)}${arm?.set === undefined ? "" : `->${r2(arm.set)}`}/${e.damageSource.cause}`, damage: e.damage, by: "" });
});

world.afterEvents.entityHurt.subscribe((e) => {
  let id: string;
  try {
    id = e.hurtEntity.id;
  } catch {
    return;
  }
  let by = "none";
  try {
    by = e.damageSource.damagingEntity?.id ?? "none";
  } catch {
    by = "?";
  }
  note(id, { kind: "hurt", text: `${r2(e.damage)}/${e.damageSource.cause}`, damage: e.damage, by });
});

world.afterEvents.entityDie.subscribe((e) => {
  let id: string;
  try {
    id = e.deadEntity.id;
  } catch {
    return;
  }
  let by = "none";
  try {
    by = e.damageSource.damagingEntity?.id ?? "none";
  } catch {
    by = "?";
  }
  note(id, { kind: "die", text: `${e.damageSource.cause}/${by}`, damage: 0, by });
});

function since(e: Entity, from: number, kind?: Ev["kind"]): Ev[] {
  return (journal.get(e.id) ?? []).filter((ev) => ev.tick >= from && (kind === undefined || ev.kind === kind));
}

function events(e: Entity, from: number): string {
  return `[${since(e, from)
    .map((ev) => `+${ev.tick - from}:${ev.kind}:${ev.text}`)
    .join(" ")}]`;
}

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

function plainApply(t: Entity, amount: number, from: Entity | undefined, cause = EntityDamageCause.entityAttack): { ret: string; delta: number } {
  const before = hp(t);
  let ret: string;
  try {
    ret = String(t.applyDamage(amount, from === undefined ? { cause } : { cause, damagingEntity: from }));
  } catch (err) {
    ret = `threw(${errText(err)})`;
  }
  return { ret, delta: before - hp(t) };
}

function swing(a: SimulatedPlayer, t: Entity): { ok: boolean; delta: number } {
  const before = hp(t);
  const ok = a.attackEntity(t);
  return { ok, delta: before - hp(t) };
}

// ------------------------------------------------------------------ kits and rigs

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

/** The numbers each kit must give, from diagnose-CNTR-X26 (melee, references) and the spec's AC (raise). */
const EXPECT: Record<Kit, { melee: number; apply6: number; raise: number; flat: number; active: number; activeAfterMelee: number }> = {
  bare: { melee: 8.0, apply6: 6.0, raise: 14.0, flat: 14.0, active: 10.0, activeAfterMelee: 2.0 },
  diamond: { melee: 2.24, apply6: 1.56, raise: 3.8, flat: 8.24, active: 3.0, activeAfterMelee: 0.76 },
  netherite_p4: { melee: 0.76, apply6: 0.54, raise: 1.3, flat: 6.76, active: 1.01, activeAfterMelee: 0.25 },
};

function equip(p: SimulatedPlayer, kit: Kit): string {
  const eq = p.getComponent("minecraft:equippable");
  const { ids, protection } = KITS[kit];
  for (const [slot, id] of ids) {
    const stack = new ItemStack(id);
    if (protection > 0) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("protection"), level: protection });
    eq?.setEquipment(slot, stack);
  }
  const d = defenceOf(p);
  return `${kit} A${d.armor} T${d.toughness} P${d.protection}`;
}

function attacker(test: Test, players: SimulatedPlayer[], name: string, at: Vector3 = { x: 3, y: 2, z: 4 }): SimulatedPlayer {
  const a = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  players.push(a);
  a.setItem(new ItemStack("minecraft:diamond_sword"), 0, true);
  return a;
}

/** A Survival SimulatedPlayer wearing `kit`: 40 HP with health_boost IV, or 20 HP. */
async function target(test: Test, players: SimulatedPlayer[], name: string, kit: Kit, boost: boolean, at: Vector3 = { x: 3, y: 2, z: 2 }): Promise<SimulatedPlayer> {
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

interface Rig {
  test: Test;
  a: SimulatedPlayer;
  t: SimulatedPlayer;
  full: number;
  tag: string;
  fails: string[];
}

const AT: Vector3 = { x: 3.5, y: 2, z: 2.5 };

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

function check(w: { fails: string[]; tag: string }, ok: boolean, what: string): void {
  if (!ok) w.fails.push(`${w.tag}: ${what}`);
}

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[], fails: string[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const fails: string[] = [];
    const regen = world.gameRules.naturalRegeneration;
    const pvp = world.gameRules.pvp;
    world.gameRules.naturalRegeneration = false;
    world.gameRules.pvp = true;
    try {
      log(`${name} START difficulty=${world.getDifficulty()}`);
      await body(test, players, fails);
    } catch (err) {
      log(`${name} ERROR ${errText(err)}`);
      throw err;
    } finally {
      world.gameRules.naturalRegeneration = regen;
      world.gameRules.pvp = pvp;
      armed.clear();
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
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

// ------------------------------------------------------------------ AC1, AC3, AC4: the passive raise and its controls

scenario("storm_damage_passive", 4000, async (test, players, fails) => {
  const a = attacker(test, players, "sd_pas_a");
  for (const kit of ["bare", "diamond", "netherite_p4"] as Kit[]) {
    const t = await target(test, players, `sd_pas_${kit}`, kit, true);
    const w: Rig = { test, a, t, full: 40, tag: `PASSIVE ${kit}`, fails };
    const want = EXPECT[kit];
    const d = defenceOf(t);
    const f6 = afterArmour(PASSIVE_DAMAGE, d);

    let t0 = await fresh(w);
    const melee = swing(a, t);
    check(w, melee.ok && close(melee.delta, want.melee), `melee alone ${r2(melee.delta)} (measured ${r2(want.melee)})`);
    log(`${w.tag} ROW melee-alone swing(${melee.ok})=${r2(melee.delta)} ev=${events(t, t0)}`);

    t0 = await fresh(w);
    const ref6 = plainApply(t, PASSIVE_DAMAGE, a);
    check(w, close(ref6.delta, want.apply6) && close(ref6.delta, f6), `reference apply6 alone ${r2(ref6.delta)} (measured ${r2(want.apply6)}, f(6) ${r2(f6)})`);
    log(`${w.tag} ROW reference-apply6-alone ret=${ref6.ret} took=${r2(ref6.delta)} f(6)=${r2(f6)} ev=${events(t, t0)}`);

    // The helper: one native hurt event, melee + f(6).
    t0 = await fresh(w);
    let arm: Arm = { from: a.id, mode: "helper" };
    armed.set(t.id, arm);
    const hp0 = hp(t);
    const raised = swing(a, t);
    await test.idle(3);
    const total = hp0 - hp(t);
    const hurts = since(t, t0, "hurt");
    check(w, arm.report?.plan === "raise", `helper plan ${arm.report?.plan ?? "never called"}`);
    check(w, close(raised.delta, want.raise), `helper raise ${r2(raised.delta)} (AC ${r2(want.raise)})`);
    check(w, close(raised.delta, melee.delta + ref6.delta), `helper raise ${r2(raised.delta)} vs native melee + apply6 ${r2(melee.delta + ref6.delta)}`);
    check(w, close(total, raised.delta), `nothing after the hit tick: ${r2(total)} vs ${r2(raised.delta)}`);
    check(w, hurts.length === 1 && close(hurts[0].damage, want.raise) && hurts[0].by === a.id, `one native hurt event from the wielder, got ${events(t, t0)}`);
    log(
      `${w.tag} ROW helper-raise swing(${raised.ok})=${r2(raised.delta)} total+3=${r2(total)} read=${r2(arm.read)} set=${r2(arm.set)} bonus=${r2(arm.report?.bonus)} ` +
        `plan=${arm.report?.plan ?? "-"} expect=${r2(want.raise)} native-sum=${r2(melee.delta + ref6.delta)} hurt-events=${hurts.length} ev=${events(t, t0)}`
    );

    // AC3: a plain applyDamage(6) in the melee's tick takes 0 and still returns true.
    t0 = await fresh(w);
    const s = swing(a, t);
    const naive = plainApply(t, PASSIVE_DAMAGE, a);
    check(w, naive.ret === "true" && Math.abs(naive.delta) < 0.005, `NEGATIVE CONTROL apply6 in the melee tick took ${r2(naive.delta)} ret=${naive.ret}, expected 0.00 and true`);
    log(`${w.tag} ROW NEGATIVE-CONTROL apply6-same-tick swing(${s.ok})=${r2(s.delta)} apply6(${naive.ret})=${r2(naive.delta)} ev=${events(t, t0)}`);

    // AC4: +6 flat, with no formula, is true damage.
    t0 = await fresh(w);
    arm = { from: a.id, mode: "flat" };
    armed.set(t.id, arm);
    const flat = swing(a, t);
    check(w, close(flat.delta, want.flat), `NEGATIVE CONTROL flat +6 took ${r2(flat.delta)} (measured ${r2(want.flat)})`);
    if (kit !== "bare") check(w, flat.delta - want.raise > 1, `NEGATIVE CONTROL flat +6 ${r2(flat.delta)} is not above damage before armour ${r2(want.raise)}`);
    log(
      `${w.tag} ROW NEGATIVE-CONTROL flat+6 swing(${flat.ok})=${r2(flat.delta)} read=${r2(arm.read)} set=${r2(arm.set)} true-damage-sum=${r2(want.melee + PASSIVE_DAMAGE)} ` +
        `before-armour=${r2(want.raise)}${kit === "bare" ? " (bare: the two coincide)" : ""} ev=${events(t, t0)}`
    );

    // Absorption first: Absorption I holds 4; the raise is one native hit, so health loses only what passes it.
    t0 = await fresh(w);
    t.addEffect("absorption", 2400, { amplifier: 0, showParticles: false });
    await test.idle(2);
    arm = { from: a.id, mode: "helper" };
    armed.set(t.id, arm);
    const h0 = hp(t);
    const abs = swing(a, t);
    await test.idle(12);
    const lost = h0 - hp(t);
    const p0 = hp(t);
    const probe = plainApply(t, 20, undefined, EntityDamageCause.sonicBoom);
    const left = 20 - (p0 - hp(t));
    t.removeEffect("absorption");
    const wantLost = Math.max(0, want.raise - 4);
    const wantLeft = Math.max(0, 4 - want.raise);
    check(w, close(lost, wantLost) && close(left, wantLeft), `absorption: health lost ${r2(lost)} left ${r2(left)}, expected ${r2(wantLost)} / ${r2(wantLeft)}`);
    log(`${w.tag} ROW absorption-I helper-raise swing(${abs.ok}) health-lost=${r2(lost)} absorption-left=${r2(left)} probe(${probe.ret}) expect=${r2(wantLost)}/${r2(wantLeft)} plan=${arm.report?.plan ?? "-"}`);

    // Resistance II multiplies after armour: (melee + f(6))·0.6.
    t0 = await fresh(w);
    t.addEffect("resistance", 2400, { amplifier: 1, showParticles: false });
    await test.idle(2);
    arm = { from: a.id, mode: "helper" };
    armed.set(t.id, arm);
    const res = swing(a, t);
    t.removeEffect("resistance");
    const wantRes = want.raise * 0.6;
    check(w, close(res.delta, wantRes), `resistance II raise ${r2(res.delta)}, expected ${r2(wantRes)}`);
    log(`${w.tag} ROW resistance-II helper-raise swing(${res.ok})=${r2(res.delta)} read=${r2(arm.read)} bonus=${r2(arm.report?.bonus)} expect=${r2(wantRes)} ev=${events(t, t0)}`);

    test.removeSimulatedPlayer(t);
  }
});

// ------------------------------------------------------------------ AC2: the active inside a window

scenario("storm_damage_active", 4000, async (test, players, fails) => {
  const a = attacker(test, players, "sd_act_a");
  for (const kit of ["bare", "diamond"] as Kit[]) {
    const t = await target(test, players, `sd_act_${kit}`, kit, true);
    const w: Rig = { test, a, t, full: 40, tag: `ACTIVE ${kit}`, fails };
    const want = EXPECT[kit];

    let t0 = await fresh(w);
    const ref = plainApply(t, ACTIVE_DAMAGE, a);
    check(w, close(ref.delta, want.active), `reference apply10 alone ${r2(ref.delta)} (measured ${r2(want.active)})`);
    log(`${w.tag} ROW reference-apply10-alone ret=${ref.ret} took=${r2(ref.delta)}`);

    t0 = await fresh(w);
    let r = stormDamage(t, ACTIVE_DAMAGE, a);
    check(w, r.path === "native" && close((r.hpBefore ?? 0) - (r.hpAfter ?? 0), want.active), `out of window: path ${r.path} took ${r2((r.hpBefore ?? 0) - (r.hpAfter ?? 0))}`);
    log(`${w.tag} ROW helper-out-of-window path=${r.path} applied=${String(r.applied)} took=${r2((r.hpBefore ?? 0) - (r.hpAfter ?? 0))} D'=${r2(r.dPrime)} ev=${events(t, t0)}`);

    // Negative control: the window swallows a plain applyDamage(10) after a melee.
    t0 = await fresh(w);
    swing(a, t);
    await test.idle(GAP);
    const naive = plainApply(t, ACTIVE_DAMAGE, a);
    check(w, close(naive.delta, want.activeAfterMelee) && naive.ret === "true", `NEGATIVE CONTROL apply10 ${GAP} ticks after a melee took ${r2(naive.delta)} ret=${naive.ret}, measured ${r2(want.activeAfterMelee)}`);
    log(`${w.tag} ROW NEGATIVE-CONTROL apply10-k${GAP}-after-melee ret=${naive.ret} took=${r2(naive.delta)} full=${r2(want.active)} ev=${events(t, t0)}`);

    for (const k of [1, GAP, 9]) {
      t0 = await fresh(w);
      const m = swing(a, t);
      await test.idle(k);
      r = stormDamage(t, ACTIVE_DAMAGE, a);
      const took = (r.hpBefore ?? 0) - (r.hpAfter ?? 0);
      await test.idle(12);
      const total = w.full - hp(t);
      check(w, r.path === "window" && r.inWindow && close(took, want.active), `k=${k} after a melee: path ${r.path} took ${r2(took)} (expected ${r2(want.active)})`);
      check(w, close(total, m.delta + want.active), `k=${k}: total ${r2(total)} is not melee + active ${r2(m.delta + want.active)} (doubled or lost)`);
      log(`${w.tag} ROW helper-k${k}-after-melee melee=${r2(m.delta)} path=${r.path} applied=${String(r.applied)} wrote=${String(r.wrote)} took=${r2(took)} total+12=${r2(total)} ev=${events(t, t0)}`);
    }

    t0 = await fresh(w);
    const arm: Arm = { from: a.id, mode: "helper" };
    armed.set(t.id, arm);
    const m = swing(a, t);
    await test.idle(GAP);
    r = stormDamage(t, ACTIVE_DAMAGE, a);
    let took = (r.hpBefore ?? 0) - (r.hpAfter ?? 0);
    check(w, arm.report?.plan === "raise" && close(m.delta, want.raise), `raised melee ${r2(m.delta)} plan ${arm.report?.plan ?? "-"}`);
    check(w, r.path === "window" && close(took, want.active), `k=${GAP} after a raised melee: path ${r.path} took ${r2(took)} (expected ${r2(want.active)})`);
    log(`${w.tag} ROW helper-k${GAP}-after-raised-melee melee=${r2(m.delta)} path=${r.path} applied=${String(r.applied)} wrote=${String(r.wrote)} took=${r2(took)} ev=${events(t, t0)}`);

    // The window closes at 10: the helper goes native again.
    t0 = await fresh(w);
    swing(a, t);
    await test.idle(10);
    r = stormDamage(t, ACTIVE_DAMAGE, a);
    took = (r.hpBefore ?? 0) - (r.hpAfter ?? 0);
    check(w, r.path === "native" && close(took, want.active), `k=10: path ${r.path} took ${r2(took)}`);
    log(`${w.tag} ROW helper-k10-after-melee path=${r.path} took=${r2(took)} ev=${events(t, t0)}`);

    test.removeSimulatedPlayer(t);
  }
});

// ------------------------------------------------------------------ AC5: a raised shield

const CENTRE: Vector3 = { x: 3.5, y: 2, z: 3.5 };
/** Where the wielder stands, by the angle from the holder's view (the holder faces +z). */
const SPOTS: [number, Vector3][] = [
  [0, { x: 3.5, y: 2, z: 5.5 }],
  [90, { x: 1.5, y: 2, z: 3.5 }],
  [180, { x: 3.5, y: 2, z: 1.5 }],
];

function shieldUp(test: Test, p: SimulatedPlayer, full: number): void {
  p.teleport(test.worldLocation(CENTRE), { rotation: { x: 0, y: 0 } });
  p.setBodyRotation(0);
  // lookAtLocation takes structure-relative coordinates.
  p.lookAtLocation({ x: CENTRE.x, y: CENTRE.y + EYE, z: CENTRE.z + 20 }, LookDuration.Continuous);
  p.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:shield"));
  p.isSneaking = true;
  setHp(p, full);
}

/** Horizontal angle between the holder's view and the direction to `src`. */
function angleTo(p: SimulatedPlayer, src: Vector3): number {
  const v = p.getViewDirection();
  const dx = src.x - p.location.x;
  const dz = src.z - p.location.z;
  const n = Math.hypot(v.x, v.z) * Math.hypot(dx, dz);
  return n === 0 ? Number.NaN : (Math.acos(Math.max(-1, Math.min(1, (v.x * dx + v.z * dz) / n))) * 180) / Math.PI;
}

scenario("storm_damage_shield", 3000, async (test, players, fails) => {
  const w = { tag: "SHIELD diamond", fails };
  const a = attacker(test, players, "sd_sh_a", { x: 3, y: 2, z: 5 });
  const t = await target(test, players, "sd_sh_t", "diamond", true, { x: 3, y: 2, z: 3 });
  const dPrime = afterArmour(ACTIVE_DAMAGE, defenceOf(t));
  for (const [deg, spot] of SPOTS) {
    for (const window of [false, true]) {
      for (const how of deg === 0 && window ? ["helper", "naive"] : ["helper"]) {
        shieldUp(test, t, 40);
        a.teleport(test.worldLocation(spot), { facingLocation: t.getHeadLocation() });
        await test.idle(CLEAR);
        const t0 = system.currentTick;
        let opened = "";
        if (window) {
          // sonicBoom passes the shield and armour: a 4.00 hit opens the window above f(10) = 3.00.
          const o = plainApply(t, 4, undefined, EntityDamageCause.sonicBoom);
          opened = ` window-opener sonic4(${o.ret})=${r2(o.delta)}`;
          await test.idle(2);
        }
        const angle = angleTo(t, a.location);
        const before = hp(t);
        let row: string;
        if (how === "helper") {
          const r = stormDamage(t, ACTIVE_DAMAGE, a);
          const took = before - hp(t);
          row = `helper path=${r.path} inWindow=${String(r.inWindow)} applied=${String(r.applied)} wrote=${String(r.wrote)} took=${r2(took)}`;
          if (deg < 90) {
            check(w, r.applied === false && !r.wrote && Math.abs(took) < 0.005, `${deg}° ${window ? "in" : "out of"} window: applied=${String(r.applied)} wrote=${String(r.wrote)} took ${r2(took)}, expected false / no write / 0`);
          } else {
            check(w, r.applied === true && close(took, dPrime), `${deg}° ${window ? "in" : "out of"} window: applied=${String(r.applied)} took ${r2(took)}, expected ${r2(dPrime)} through armour`);
            check(w, r.path === (window ? "window" : "native"), `${deg}° path ${r.path}`);
          }
        } else {
          // Negative control: the window write without the applied guard passes the shield.
          const n = plainApply(t, ACTIVE_DAMAGE, a);
          const wrote = setHp(t, before - dPrime);
          const took = before - hp(t);
          row = `NEGATIVE-CONTROL unguarded-write apply10(${n.ret}) wrote=${String(wrote)} took=${r2(took)}`;
          check(w, n.ret === "false" && close(took, dPrime), `NEGATIVE CONTROL unguarded write: apply ${n.ret} took ${r2(took)}, expected false and ${r2(dPrime)} through the shield`);
        }
        await test.idle(2);
        log(`${w.tag} ROW ${deg}deg ${window ? "in-window" : "no-window"} angle=${r2(angle)} sneaking=${String(t.isSneaking)}${opened} ${row} ev=${events(t, t0)}`);
      }
    }
  }
});

// ------------------------------------------------------------------ AC6: lethal — the totem and the kill credit

type Lethal = "passive" | "passive-alone" | "passive-unchecked" | "active-window" | "active-window-unguarded" | "active-native";

scenario("storm_damage_lethal", 4000, async (test, players, fails) => {
  const a = attacker(test, players, "sd_let_a");
  const cases: [string, Lethal, boolean, number][] = [
    ["passive raise would be lethal, totem", "passive", true, 10],
    ["passive raise would be lethal, no totem", "passive", false, 10],
    ["passive on a melee lethal by itself, totem", "passive-alone", true, 5],
    ["passive on a melee lethal by itself, no totem", "passive-alone", false, 5],
    ["NEGATIVE-CONTROL lethal raise without the check, totem", "passive-unchecked", true, 10],
    ["active in a window, lethal, totem", "active-window", true, 12],
    ["active in a window, lethal, no totem", "active-window", false, 12],
    ["NEGATIVE-CONTROL window write to 0 instead of the overkill, totem", "active-window-unguarded", true, 12],
    ["active out of a window, lethal, totem", "active-native", true, 5],
    ["active out of a window, lethal, no totem", "active-native", false, 5],
  ];
  let n = 0;
  for (const [label, mode, totem, hpStart] of cases) {
    const w = { tag: `LETHAL ${label}`, fails };
    const t = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 2 }, `sd_let_t${++n}`, GameMode.Survival);
    players.push(t);
    watch(t);
    await test.idle(3);
    t.addEffect("slow_falling", 2000, { showParticles: false });
    const eq = t.getComponent("minecraft:equippable");
    if (totem) eq?.setEquipment(EquipmentSlot.Offhand, new ItemStack(TOTEM));
    a.lookAtEntity(t);
    setHp(t, hpStart);
    await test.idle(2);
    const off0 = eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
    const t0 = system.currentTick;
    const struck = strikes.length;
    let act = "";
    let path = "-";
    if (mode === "passive" || mode === "passive-alone" || mode === "passive-unchecked") {
      const arm: Arm = { from: a.id, mode: mode === "passive-unchecked" ? "unchecked" : "helper" };
      armed.set(t.id, arm);
      const s = swing(a, t);
      act = `swing(${s.ok}) read=${r2(arm.read)} set=${r2(arm.set)} plan=${arm.report?.plan ?? "-"} hp-left-seen=${r2(arm.report?.hpLeft)}`;
      if (mode === "passive") check(w, arm.report?.plan === "lethal" && arm.set === arm.read, `plan ${arm.report?.plan ?? "-"}, the hit was rewritten to ${r2(arm.set)}`);
      if (mode === "passive-alone") check(w, arm.report?.plan === "kills-alone" && arm.set === arm.read, `plan ${arm.report?.plan ?? "-"}, the hit was rewritten to ${r2(arm.set)}`);
    } else if (mode === "active-native") {
      const r = stormDamage(t, ACTIVE_DAMAGE, a);
      path = r.path;
      act = `stormDamage path=${r.path} applied=${String(r.applied)}`;
      check(w, r.path === "native", `path ${r.path}`);
    } else {
      const s = swing(a, t);
      await test.idle(GAP);
      if (mode === "active-window") {
        const r = stormDamage(t, ACTIVE_DAMAGE, a);
        path = r.path;
        act = `swing(${s.ok})=${r2(s.delta)} +${GAP} stormDamage path=${r.path} applied=${String(r.applied)} hp ${r2(r.hpBefore)}->${r2(r.hpAfter)}`;
        check(w, r.path === "lethal", `path ${r.path}`);
      } else {
        const before = hp(t);
        const ap = plainApply(t, ACTIVE_DAMAGE, a);
        const wrote = setHp(t, Math.max(0, before - ACTIVE_DAMAGE));
        act = `swing(${s.ok})=${r2(s.delta)} +${GAP} apply10(${ap.ret}) write0(${String(wrote)})`;
      }
    }
    await test.idle(6);
    const deaths = since(t, t0, "die");
    const death = deaths[0];
    const off1 = eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "empty";
    const alive = death === undefined && hp(t) > 0;
    const popped = totem && off0 === TOTEM && off1 === "empty";
    let fx = "";
    try {
      fx = t
        .getEffects()
        .map((e) => `${e.typeId.replace("minecraft:", "")}:${e.amplifier}`)
        .filter((e) => !e.startsWith("slow_falling"))
        .join(",");
    } catch (err) {
      fx = `unreadable(${errText(err)})`;
    }
    const passiveLethal = strikes.slice(struck).find((r) => r.from === "passive");
    if (passiveLethal !== undefined) path = `${passiveLethal.path} applied=${String(passiveLethal.applied)} +${passiveLethal.tick - t0}`;
    const credited = death !== undefined && death.by === a.id;
    if (mode === "passive-unchecked") {
      check(w, popped && death !== undefined, `NEGATIVE CONTROL: expected the totem eaten and a death, got popped=${String(popped)} died=${String(death !== undefined)}`);
    } else if (mode === "active-window-unguarded") {
      check(w, popped && death !== undefined && !credited, `NEGATIVE CONTROL: expected the totem eaten and an uncredited death, got popped=${String(popped)} died=${String(death !== undefined)} by=${death?.by ?? "-"}`);
    } else if (totem) {
      check(w, alive && popped, `expected the totem to save: alive=${String(alive)} offhand ${off0} -> ${off1} hp=${r2(hp(t))}`);
    } else {
      check(w, death !== undefined && credited && death.text.startsWith(EntityDamageCause.entityAttack), `expected a death credited to the wielder, got ${death === undefined ? "no death" : death.text}`);
    }
    // system.run lands it after the event; on BDS that is still the hit's tick. probe-storm P3: +0 and +1 both keep the totem.
    if (mode === "passive") check(w, passiveLethal?.applied === true && passiveLethal.tick - t0 <= 1, `deferred overkill ${passiveLethal === undefined ? "never ran" : `at +${passiveLethal.tick - t0} applied=${String(passiveLethal.applied)}`}`);
    if (mode === "passive-alone") check(w, passiveLethal === undefined, `a melee lethal by itself got an overkill at +${(passiveLethal?.tick ?? t0) - t0}`);
    log(
      `LETHAL ROW ${label}: hp0=${hpStart} offhand ${off0} -> ${off1} ${act} path=${path} alive=${String(alive)} hp=${r2(hp(t))} ` +
        `died=${death === undefined ? "no" : `yes ${death.text} +${death.tick - t0}`} credited-to-wielder=${death === undefined ? "n/a" : String(credited)} effects=[${fx}] ev=${events(t, t0)}`
    );
    test.removeSimulatedPlayer(t);
    await test.idle(2);
  }

  // A mob: the deferred overkill is the wielder's kill.
  const cow = test.spawnWithoutBehaviors("minecraft:cow", { x: 3, y: 2, z: 2 });
  watch(cow);
  await test.idle(2);
  a.lookAtEntity(cow);
  setHp(cow, 10);
  await test.idle(1);
  const t0 = system.currentTick;
  const arm: Arm = { from: a.id, mode: "helper" };
  armed.set(cow.id, arm);
  const s = swing(a, cow);
  await test.idle(6);
  const death = since(cow, t0, "die")[0];
  const w = { tag: "LETHAL cow", fails };
  check(w, arm.report?.plan === "lethal" && death !== undefined && death.by === a.id, `cow: plan ${arm.report?.plan ?? "-"} death ${death?.text ?? "none"}`);
  log(`LETHAL ROW cow hp 10, passive raise would be lethal: swing(${s.ok}) read=${r2(arm.read)} plan=${arm.report?.plan ?? "-"} died=${death === undefined ? "no" : `yes ${death.text} +${death.tick - t0}`} credited-to-wielder=${String(death?.by === a.id)} ev=${events(cow, t0)}`);
  if (cow.isValid) cow.remove();
});
