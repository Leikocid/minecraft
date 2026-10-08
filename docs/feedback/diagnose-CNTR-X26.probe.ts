// L0-xcx26 probe on BDS 1.26.51.1, with a vanilla diamond sword standing in for the unbuilt Storm Blade:
// - what a script applyDamage(6) takes in the tick of a melee hit (the passive's +6);
// - whether difference-stacking applyDamage(L + 6) from L0-adr-sbdm nets +6 pre-armour, and what
//   beforeEvents.entityHurt (stable 2.10.0) and a health write do instead;
// - what the active's applyDamage(10) takes 1–11 ticks after a melee hit.
//
// Not part of the shipped gametest pack: diagnose-CNTR-X26.repro.sh copies this file to src/gametest/
// for one run and restores the tree. A scenario passes when its measurement completed; the answers
// are the "[probe] X26 …" lines.

import {
  EnchantmentType,
  type Entity,
  EntityDamageCause,
  EquipmentSlot,
  GameMode,
  ItemStack,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
/** Ticks that clear any hurt window before the next case. */
const CLEAR = 40;
/** Diamond sword melee, the L a constant-L build would assume. */
const L_SWORD = 8;
const PASSIVE = 6;
const ACTIVE = 10;

const log = (msg: string): void => console.warn(`[probe] X26 ${msg}`);
const r2 = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : String(n));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

interface Ev {
  seq: number;
  tick: number;
  kind: string;
  text: string;
}
/** Target id → every hit/hurt event on it, in delivery order. */
const journal = new Map<string, Ev[]>();
let seq = 0;

function note(id: string, kind: string, text: string): void {
  journal.get(id)?.push({ seq: ++seq, tick: system.currentTick, kind, text });
}

interface Boost {
  from: string;
  /** The value written to the before-event's damage, from the value read. */
  to: (read: number) => number;
  armed: boolean;
  result: string;
}
/** Target id → a one-shot rewrite of the next entityAttack hurt from `from`, applied in beforeEvents.entityHurt. */
const boosts = new Map<string, Boost>();

interface Hook {
  from: string;
  run: (damage: number) => void;
}
const hitHooks = new Map<string, Hook>();
const hurtHooks = new Map<string, Hook>();

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
  let extra = "";
  const boost = boosts.get(id);
  if (boost?.armed === true && src.cause === EntityDamageCause.entityAttack && src.damagingEntity?.id === boost.from) {
    boost.armed = false;
    let hand: string;
    try {
      hand = src.damagingEntity?.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId ?? "none";
    } catch (err) {
      hand = `threw(${errText(err)})`;
    }
    try {
      e.damage = boost.to(read);
      boost.result = `read=${r2(read)} set=${r2(e.damage)} hand=${hand}`;
    } catch (err) {
      boost.result = `read=${r2(read)} set-threw(${errText(err)}) hand=${hand}`;
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
  const hook = hurtHooks.get(id);
  if (hook !== undefined && e.damageSource.cause === EntityDamageCause.entityAttack && e.damageSource.damagingEntity?.id === hook.from) {
    hurtHooks.delete(id);
    hook.run(e.damage);
  }
});

world.afterEvents.entityHitEntity.subscribe((e) => {
  let id: string;
  try {
    id = e.hitEntity.id;
  } catch {
    return;
  }
  note(id, "hit", e.damagingEntity.typeId);
  const hook = hitHooks.get(id);
  if (hook !== undefined && e.damagingEntity.id === hook.from) {
    hitHooks.delete(id);
    hook.run(0);
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

/** applyDamage with the wielder as attacker, the form adr-sbdm prescribes. */
function hit(t: Entity, amount: number, from: Entity): { ret: string; delta: number } {
  const before = hp(t);
  let ret: string;
  try {
    ret = String(t.applyDamage(amount, { cause: EntityDamageCause.entityAttack, damagingEntity: from }));
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

const ARMOUR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];

function armourOf(e: Entity): Armour {
  const eq = e.getComponent("minecraft:equippable");
  if (eq === undefined) return { a: 0, t: 0, epf: 0 };
  let epf = 0;
  for (const slot of ARMOUR_SLOTS) epf += eq.getEquipment(slot)?.getComponent("minecraft:enchantable")?.getEnchantment("protection")?.level ?? 0;
  return { a: eq.totalArmor, t: eq.totalToughness, epf: Math.min(20, epf) };
}

/** Armour + toughness + Protection on d (the Java formula); no Resistance, no specialised Protection. */
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

function sword(sharpness: number): ItemStack {
  const s = new ItemStack("minecraft:diamond_sword");
  if (sharpness > 0) s.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("sharpness"), level: sharpness });
  return s;
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
  const h = hit(w.t, amount, w.a);
  return `apply${amount}(${h.ret})=${r2(h.delta)}`;
};

/** Swing, then applyDamage(amount) in the same synchronous block. */
const swingThenApply = (w: Rig, amount: number) => (): string => {
  const s = swing(w.a, w.t);
  const h = hit(w.t, amount, w.a);
  return `swing(${s.ok})=${r2(s.delta)} apply${amount}(${h.ret})=${r2(h.delta)}`;
};

/** Swing; applyDamage(amount) from inside the entityHitEntity after-event, the passive's trigger. */
const onHitApply = (w: Rig, amount: number) => async (t0: number): Promise<string> => {
  let out = "onHit never fired";
  hitHooks.set(w.t.id, {
    from: w.a.id,
    run: () => {
      const h = hit(w.t, amount, w.a);
      out = `onHit@+${system.currentTick - t0} apply${amount}(${h.ret})=${r2(h.delta)}`;
    },
  });
  const s = swing(w.a, w.t);
  await w.test.idle(2);
  hitHooks.delete(w.t.id);
  return `swing(${s.ok})=${r2(s.delta)} ${out}`;
};

/** Swing; applyDamage(entityHurt.damage + add) from the melee's own hurt after-event (strm-ppas step 3). */
const onHurtApply = (w: Rig, add: number) => async (t0: number): Promise<string> => {
  let out = "onHurt never fired";
  hurtHooks.set(w.t.id, {
    from: w.a.id,
    run: (damage) => {
      const h = hit(w.t, damage + add, w.a);
      out = `onHurt@+${system.currentTick - t0} L=hurt.damage=${r2(damage)} apply${r2(damage + add)}(${h.ret})=${r2(h.delta)}`;
    },
  });
  const s = swing(w.a, w.t);
  await w.test.idle(2);
  hurtHooks.delete(w.t.id);
  return `swing(${s.ok})=${r2(s.delta)} ${out}`;
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

/** Swing, then a health write of hp − amount (the crossbow's window mode, true damage). */
const swingThenWrite = (w: Rig, amount: number) => (): string => {
  const s = swing(w.a, w.t);
  const now = hp(w.t);
  const wrote = setHp(w.t, now - amount);
  return `swing(${s.ok})=${r2(s.delta)} write(${String(wrote)})=${r2(now - hp(w.t))}`;
};

/** Swing, then a health write of hp − f(amount): ADR option C, armour computed in script. */
const swingThenManual = (w: Rig, amount: number) => (): string => {
  const s = swing(w.a, w.t);
  const now = hp(w.t);
  const d = reduced(amount, armourOf(w.t));
  const wrote = setHp(w.t, now - d);
  return `swing(${s.ok})=${r2(s.delta)} f(${amount})=${r2(d)} write(${String(wrote)})=${r2(now - hp(w.t))}`;
};

const add = (n: number) => (read: number): number => read + n;

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[]) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const regen = world.gameRules.naturalRegeneration;
    const pvp = world.gameRules.pvp;
    world.gameRules.naturalRegeneration = false;
    world.gameRules.pvp = true;
    try {
      log(`${name} difficulty=${world.getDifficulty()} regen=false pvp=${String(world.gameRules.pvp)}`);
      await body(test, players);
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

function attacker(test: Test, players: SimulatedPlayer[], name: string, sharpness: number): SimulatedPlayer {
  const a = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 4 }, name, GameMode.Survival);
  players.push(a);
  a.setItem(sword(sharpness), 0, true);
  return a;
}

/** A Survival SimulatedPlayer at 40 HP (health_boost amplifier 4) wearing `kit`. */
async function playerTarget(test: Test, players: SimulatedPlayer[], name: string, kit: Kit): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 2 }, name, GameMode.Survival);
  players.push(p);
  journal.set(p.id, []);
  await test.idle(2);
  p.addEffect("health_boost", 12000, { amplifier: 4, showParticles: false });
  p.addEffect("slow_falling", 12000, { showParticles: false });
  const desc = equip(p, kit);
  await test.idle(2);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  log(`SETUP ${name} hp=${r2(hp(p))} kit=${desc}`);
  return p;
}

function noise(w: Rig): void {
  const stray = (journal.get(w.t.id) ?? []).filter((ev) => ev.kind === "hurt" && !ev.text.endsWith(`/${EntityDamageCause.entityAttack}`));
  log(`${w.tag} NOISE ${stray.length === 0 ? "none" : stray.map((ev) => ev.text).join(" ")}`);
}

async function wielderHeld(w: Rig): Promise<string> {
  await w.test.idle(1);
  const held = w.a.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand);
  const sharp = held?.getComponent("minecraft:enchantable")?.getEnchantment("sharpness")?.level ?? 0;
  return `${held?.typeId ?? "none"} sharpness=${sharp}`;
}

// ------------------------------------------------------------------ Q1 + Q2: the passive

for (const kit of ["bare", "diamond", "netherite_p4"] as Kit[]) {
  scenario(`probe_x26_passive_${kit}`, 2400, async (test, players) => {
    const a = attacker(test, players, `x26_pas_${kit}_a`, 0);
    const t = await playerTarget(test, players, `x26_pas_${kit}_t`, kit);
    const w: Rig = { test, a, t, full: 40, tag: `PAS ${kit}` };
    log(`${w.tag} wielder holds ${await wielderHeld(w)}`);
    const ar = armourOf(t);
    log(`${w.tag} ARMOUR totalArmor=${r2(ar.a)} totalToughness=${r2(ar.t)} protectionEPF=${ar.epf}`);
    const melee = await kase(w, "melee alone", swingOnly(w));
    const r6 = await kase(w, "reference apply6 alone", applyOnly(w, PASSIVE));
    const r14 = await kase(w, "reference apply14 alone", applyOnly(w, L_SWORD + PASSIVE));
    log(
      `${w.tag} FIT f(8)=${r2(reduced(L_SWORD, ar))} melee=${r2(melee)} | f(6)=${r2(reduced(PASSIVE, ar))} apply6=${r2(r6)} | ` +
        `f(14)=${r2(reduced(L_SWORD + PASSIVE, ar))} apply14=${r2(r14)}`
    );
    const naive = await kase(w, "NEGATIVE-CONTROL swing+apply6 same block", swingThenApply(w, PASSIVE));
    const naiveHit = await kase(w, "NEGATIVE-CONTROL apply6 in entityHitEntity", onHitApply(w, PASSIVE));
    const stack = await kase(w, "stack swing+apply(8+6) same block", swingThenApply(w, L_SWORD + PASSIVE));
    const stackHit = await kase(w, "stack apply(8+6) in entityHitEntity", onHitApply(w, L_SWORD + PASSIVE));
    const stackHurt = await kase(w, "stack apply(hurt.damage+6) in entityHurt", onHurtApply(w, PASSIVE));
    const raised = await kase(w, "beforeEvents.entityHurt raises the melee by 6", raisedSwing(w, add(PASSIVE)));
    const wrote = await kase(w, "swing then health write hp-6", swingThenWrite(w, PASSIVE));
    const manual = await kase(w, "C swing then health write hp-f(6)", swingThenManual(w, PASSIVE));
    const raisedF = await kase(w, "beforeEvents.entityHurt raises the melee by f(6)", raisedSwing(w, add(reduced(PASSIVE, ar))));
    log(
      `${w.tag} SUM melee=${r2(melee)} apply6=${r2(r6)} melee+apply6=${r2(melee + r6)} apply14=${r2(r14)} | naive=${r2(naive)} naive-onHit=${r2(naiveHit)} ` +
        `stack=${r2(stack)} stack-onHit=${r2(stackHit)} stack-hurtL=${r2(stackHurt)} raised=${r2(raised)} write=${r2(wrote)} manual-f6=${r2(manual)} raised-f6=${r2(raisedF)}`
    );
    noise(w);
  });
}

// ------------------------------------------------------------------ Q2: Sharpness V moves L

for (const kit of ["bare", "diamond"] as Kit[]) {
  scenario(`probe_x26_sharp_${kit}`, 2400, async (test, players) => {
    const a = attacker(test, players, `x26_shp_${kit}_a`, 5);
    const t = await playerTarget(test, players, `x26_shp_${kit}_t`, kit);
    const w: Rig = { test, a, t, full: 40, tag: `SHP ${kit}` };
    log(`${w.tag} wielder holds ${await wielderHeld(w)}`);
    const melee = await kase(w, "melee alone", swingOnly(w));
    const r6 = await kase(w, "reference apply6 alone", applyOnly(w, PASSIVE));
    const naive = await kase(w, "NEGATIVE-CONTROL swing+apply6 same block", swingThenApply(w, PASSIVE));
    const stack8 = await kase(w, "stack swing+apply(8+6) same block (constant L)", swingThenApply(w, L_SWORD + PASSIVE));
    const stackHurt = await kase(w, "stack apply(hurt.damage+6) in entityHurt", onHurtApply(w, PASSIVE));
    const raised = await kase(w, "beforeEvents.entityHurt raises the melee by 6", raisedSwing(w, add(PASSIVE)));
    log(
      `${w.tag} SUM melee=${r2(melee)} apply6=${r2(r6)} melee+apply6=${r2(melee + r6)} | naive=${r2(naive)} stack-constL=${r2(stack8)} ` +
        `stack-hurtL=${r2(stackHurt)} raised=${r2(raised)}`
    );
    noise(w);
  });
}

// ------------------------------------------------------------------ Q3: the active after a melee hit

for (const kit of ["bare", "diamond"] as Kit[]) {
  scenario(`probe_x26_active_${kit}`, 3600, async (test, players) => {
    const a = attacker(test, players, `x26_act_${kit}_a`, 0);
    const t = await playerTarget(test, players, `x26_act_${kit}_t`, kit);
    const w: Rig = { test, a, t, full: 40, tag: `ACT ${kit}` };
    const r10 = await kase(w, "reference apply10 alone", applyOnly(w, ACTIVE));
    const r18 = await kase(w, "reference apply18 alone", applyOnly(w, L_SWORD + ACTIVE));
    const sweep: string[] = [];
    for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      await kase(w, `melee then apply10 k=${k}`, async (t0) => {
        const s = swing(w.a, w.t);
        await w.test.idle(k);
        const gap = system.currentTick - t0;
        const h = hit(w.t, ACTIVE, w.a);
        sweep.push(`k=${gap}:${r2(h.delta)}`);
        return `swing(${s.ok})=${r2(s.delta)} gap=${gap} apply10(${h.ret})=${r2(h.delta)}`;
      });
    }
    log(`${w.tag} SWEEP apply10 after melee: ${sweep.join(" ")} (reference apply10 alone=${r2(r10)})`);
    const stacked: string[] = [];
    for (const k of [1, 5, 9]) {
      await kase(w, `melee then stack apply(8+10) k=${k}`, async (t0) => {
        const s = swing(w.a, w.t);
        await w.test.idle(k);
        const gap = system.currentTick - t0;
        const h = hit(w.t, L_SWORD + ACTIVE, w.a);
        stacked.push(`k=${gap}:${r2(h.delta)}`);
        return `swing(${s.ok})=${r2(s.delta)} gap=${gap} apply18(${h.ret})=${r2(h.delta)}`;
      });
    }
    log(`${w.tag} STACK apply(8+10) after melee: ${stacked.join(" ")} (reference apply10=${r2(r10)} apply18=${r2(r18)})`);
    for (const amount of [ACTIVE, L_SWORD + PASSIVE + ACTIVE]) {
      await kase(w, `raised melee (+6) then apply${amount} k=3`, async (t0) => {
        const boost: Boost = { from: w.a.id, to: add(PASSIVE), armed: true, result: "before-event never fired" };
        boosts.set(w.t.id, boost);
        const s = swing(w.a, w.t);
        await w.test.idle(3);
        boosts.delete(w.t.id);
        const gap = system.currentTick - t0;
        const h = hit(w.t, amount, w.a);
        return `swing(${s.ok})=${r2(s.delta)} before:${boost.result} gap=${gap} apply${amount}(${h.ret})=${r2(h.delta)}`;
      });
    }
    const ar = armourOf(t);
    const f10 = reduced(ACTIVE, ar);
    log(`${w.tag} FIT f(10)=${r2(f10)} apply10=${r2(r10)} | f(18)=${r2(reduced(L_SWORD + ACTIVE, ar))} apply18=${r2(r18)}`);
    const exact: string[] = [];
    for (const raise of [0, PASSIVE]) {
      const melee = raise === 0 ? "melee" : "melee raised by f(6)";
      await kase(w, `${melee} then C apply10 + write to hp-f(10) k=3`, async () => {
        const boost: Boost = { from: w.a.id, to: add(reduced(raise, ar)), armed: raise > 0, result: "-" };
        boosts.set(w.t.id, boost);
        const s = swing(w.a, w.t);
        await w.test.idle(3);
        boosts.delete(w.t.id);
        const before = hp(w.t);
        const h = hit(w.t, ACTIVE, w.a);
        const wrote = setHp(w.t, before - f10);
        const d = before - hp(w.t);
        exact.push(`${melee}/C=${r2(d)}`);
        return `swing(${s.ok})=${r2(s.delta)} apply10(${h.ret})=${r2(h.delta)} write(${String(wrote)}) active=${r2(d)}`;
      });
      await kase(w, `${melee} then before-event sets f(10) on apply(10+40) k=3`, async () => {
        const boost: Boost = { from: w.a.id, to: add(reduced(raise, ar)), armed: raise > 0, result: "-" };
        boosts.set(w.t.id, boost);
        const s = swing(w.a, w.t);
        await w.test.idle(3);
        const set: Boost = { from: w.a.id, to: () => f10, armed: true, result: "before-event never fired" };
        boosts.set(w.t.id, set);
        const h = hit(w.t, ACTIVE + 40, w.a);
        boosts.delete(w.t.id);
        exact.push(`${melee}/set=${r2(h.delta)}`);
        return `swing(${s.ok})=${r2(s.delta)} apply50(${h.ret})=${r2(h.delta)} before:${set.result}`;
      });
    }
    log(`${w.tag} EXACT active in window k=3: ${exact.join(" ")} (reference apply10 alone=${r2(r10)})`);
    noise(w);
  });
}

// ------------------------------------------------------------------ absorption on each passive path

scenario("probe_x26_absorption", 3600, async (test, players) => {
  const a = attacker(test, players, "x26_abs_a", 0);
  const t = await playerTarget(test, players, "x26_abs_t", "bare");
  const w: Rig = { test, a, t, full: 40, tag: "ABS bare" };
  const modes: [string, () => Promise<string> | string][] = [
    ["none", () => "untouched"],
    ["melee alone", swingOnly(w)],
    ["beforeEvents raise +6", raisedSwing(w, add(PASSIVE))],
    ["stack apply(8+6)", swingThenApply(w, L_SWORD + PASSIVE)],
    ["write hp-6", swingThenWrite(w, PASSIVE)],
  ];
  for (const [label, body] of modes) {
    await kase(w, `absorption16 ${label}`, async () => {
      t.removeEffect("absorption");
      t.addEffect("absorption", 600, { amplifier: 3, showParticles: false });
      await test.idle(2);
      const h0 = hp(t);
      const detail = await body();
      await test.idle(12);
      const lost = h0 - hp(t);
      const p0 = hp(t);
      const probe = hit(t, 16, a);
      const left = 16 - (p0 - hp(t));
      t.removeEffect("absorption");
      return `${detail} health-lost=${r2(lost)} probe16(${probe.ret}) absorption-left=${r2(left)}`;
    });
  }
  noise(w);
});

// ------------------------------------------------------------------ P2: a mob

scenario("probe_x26_mob", 2400, async (test, players) => {
  const a = attacker(test, players, "x26_mob_a", 0);
  const golem = test.spawnWithoutBehaviors("minecraft:iron_golem", { x: 3, y: 2, z: 2 });
  journal.set(golem.id, []);
  await test.idle(2);
  const full = golem.getComponent("minecraft:health")?.effectiveMax ?? 100;
  const w: Rig = { test, a, t: golem, full, tag: "MOB iron_golem" };
  log(`SETUP ${golem.typeId} hp=${r2(hp(golem))} max=${r2(full)}`);
  const melee = await kase(w, "melee alone", swingOnly(w));
  const r6 = await kase(w, "reference apply6 alone", applyOnly(w, PASSIVE));
  const naive = await kase(w, "NEGATIVE-CONTROL swing+apply6 same block", swingThenApply(w, PASSIVE));
  const naiveHit = await kase(w, "NEGATIVE-CONTROL apply6 in entityHitEntity", onHitApply(w, PASSIVE));
  const stack = await kase(w, "stack swing+apply(8+6) same block", swingThenApply(w, L_SWORD + PASSIVE));
  const stackHit = await kase(w, "stack apply(8+6) in entityHitEntity", onHitApply(w, L_SWORD + PASSIVE));
  const raised = await kase(w, "beforeEvents.entityHurt raises the melee by 6", raisedSwing(w, add(PASSIVE)));
  let act = Number.NaN;
  let actStack = Number.NaN;
  await kase(w, "melee then apply10 k=3", async () => {
    swing(w.a, w.t);
    await w.test.idle(3);
    act = hit(w.t, ACTIVE, w.a).delta;
    return `apply10=${r2(act)}`;
  });
  await kase(w, "melee then stack apply(8+10) k=3", async () => {
    swing(w.a, w.t);
    await w.test.idle(3);
    actStack = hit(w.t, L_SWORD + ACTIVE, w.a).delta;
    return `apply18=${r2(actStack)}`;
  });
  log(
    `${w.tag} SUM melee=${r2(melee)} apply6=${r2(r6)} | naive=${r2(naive)} naive-onHit=${r2(naiveHit)} stack=${r2(stack)} stack-onHit=${r2(stackHit)} ` +
      `raised=${r2(raised)} | active k=3 apply10=${r2(act)} stack=${r2(actStack)}`
  );
  noise(w);
  if (golem.isValid) golem.remove();
});
