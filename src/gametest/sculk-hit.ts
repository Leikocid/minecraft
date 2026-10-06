// SCLK-HIT-01 scenarios for the entity hit (L0-sclk-p004, r002, r004, xasm24; T06 ac06, T07 ac07, T08 ac08,
// T09 ac09, T10 ac10, T17 ac17). Real bolts hit SimulatedPlayers and mobs through projectileHitEntity — placed with
// launchBolt, or fired from a Multishot crossbow for T17. The witnesses are the world's own reads: health read
// by the test in the hit tick and after it, entityHurt and entityDie events, and block snapshots. Each scenario
// logs "[gametest] sculk-hit <name> RESULT …" lines.

import {
  BlockVolume,
  Difficulty,
  type Dimension,
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
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { SCULK_CROSSBOW } from "../legendary/registry";
import {
  BOLT_LIFETIME_TICKS,
  type BoltEvent,
  type CarveReport,
  HURT_WINDOW_TICKS,
  type HitReport,
  SCULK,
  SONIC_BOOM_DAMAGE,
  launchBolt,
  liveBoltCount,
  observeBolts,
  observeCarves,
  observeHits,
  pendingCarves,
  setWindowWrite,
} from "../sculk";

const STRUCTURE = "andrew:platform";
const STONE = "minecraft:stone";
const AIR = "minecraft:air";
const ARROW = "minecraft:arrow";
const D = SONIC_BOOM_DAMAGE;
/** health_boost amplifier 4: 40 HP, so three bolts leave the target alive. */
const FULL = 40;
/** Waits out the hurt window of the hit before. */
const CLEAR = HURT_WINDOW_TICKS + 2;
const SLOT = 0;
const AMMO_SLOT = 9;
/** A full load is 25 ticks (max_draw_duration 1.25 s); the probe loaded 27. */
const LOAD_TICKS = 27;
/** The platform floor: relative y 1, 7×7 from 0,0. */
const FLOOR_Y = 1;
const SHOOTER_AT: Vector3 = { x: 0, y: 2, z: 0 };

const log = (msg: string): void => console.warn(`[gametest] sculk-hit ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined ? "-" : n.toFixed(2));
const key = (c: Vector3): string => `${c.x},${c.y},${c.z}`;
const short = (id: string): string => id.replace("minecraft:", "");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

function hp(e: Entity): number {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? Number.NaN;
  } catch {
    return Number.NaN;
  }
}

function setHp(e: Entity, v: number): void {
  e.getComponent("minecraft:health")?.setCurrentValue(v);
}

/** A bolt or a patch from an earlier scenario lives at most BOLT_LIFETIME_TICKS; this one starts with none. */
async function quiet(test: Test): Promise<void> {
  for (let t = 0; t < BOLT_LIFETIME_TICKS + 20 && (liveBoltCount() > 0 || pendingCarves() > 0); t++) await test.idle(1);
  test.assert(liveBoltCount() === 0 && pendingCarves() === 0, `${liveBoltCount()} bolt(s), ${pendingCarves()} job(s) left from an earlier scenario`);
}

function floor(test: Test, type = STONE): void {
  test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation({ x: 0, y: FLOOR_Y, z: 0 }), test.worldBlockLocation({ x: 6, y: FLOOR_Y, z: 6 })), type);
}

interface Hurt {
  tick: number;
  damage: number;
  cause: string;
  by: string | undefined;
}

interface Witness {
  /** Hit reports, each with the target's health as the test read it in the hit tick. */
  hits: Array<{ report: HitReport; hpSeen: number }>;
  hurts: Map<string, Hurt[]>;
  deaths: Map<string, { cause: string; by: string | undefined; tick: number }>;
  endings: Map<string, BoltEvent["kind"]>;
  patches: Map<string, CarveReport>;
  hurtsOf(e: Entity, from?: number): Hurt[];
  stop(): void;
}

/** Everything the scenarios measure, from the engine's events and the test's own reads. */
function witness(): Witness {
  const hits: Witness["hits"] = [];
  const hurts = new Map<string, Hurt[]>();
  const deaths: Witness["deaths"] = new Map();
  const endings = new Map<string, BoltEvent["kind"]>();
  const patches = new Map<string, CarveReport>();
  const stopHits = observeHits((report) => {
    const target = report.targetId === undefined ? undefined : world.getEntity(report.targetId);
    hits.push({ report, hpSeen: target === undefined ? Number.NaN : hp(target) });
  });
  const stopBolts = observeBolts((e) => {
    if (e.kind !== "launched" && e.kind !== "trail") endings.set(e.record.id, e.kind);
  });
  const stopCarves = observeCarves((r) => patches.set(r.boltId, r));
  const hurtSub = world.afterEvents.entityHurt.subscribe((e) => {
    let id: string;
    try {
      id = e.hurtEntity.id;
    } catch {
      return;
    }
    const list = hurts.get(id) ?? [];
    list.push({ tick: system.currentTick, damage: e.damage, cause: e.damageSource.cause, by: e.damageSource.damagingEntity?.id });
    hurts.set(id, list);
  });
  const dieSub = world.afterEvents.entityDie.subscribe((e) => {
    try {
      deaths.set(e.deadEntity.id, { cause: e.damageSource.cause, by: e.damageSource.damagingEntity?.id, tick: system.currentTick });
    } catch {
      // a removed entity's death has no id left to read
    }
  });
  return {
    hits,
    hurts,
    deaths,
    endings,
    patches,
    hurtsOf: (e, from = 0) => (hurts.get(e.id) ?? []).filter((h) => h.tick >= from),
    stop() {
      stopHits();
      stopBolts();
      stopCarves();
      world.afterEvents.entityHurt.unsubscribe(hurtSub);
      world.afterEvents.entityDie.unsubscribe(dieSub);
    },
  };
}

const hurtText = (list: readonly Hurt[], from: number): string => `[${list.map((h) => `+${h.tick - from}:${f2(h.damage)}/${h.cause}`).join(" ")}]`;

/** A bolt from `from` at `to` (world coordinates), owned by `owner`; resolves with the bolt id. */
function shoot(test: Test, owner: Entity, from: Vector3, to: Vector3, speed = 2): string {
  const d = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const n = Math.hypot(d.x, d.y, d.z);
  const record = launchBolt(owner, test.getDimension(), from, { x: (d.x / n) * speed, y: (d.y / n) * speed, z: (d.z / n) * speed });
  test.assert(record !== undefined, "launchBolt refused the bolt");
  return record!.id;
}

/** A bolt from 3.5 blocks in front of `target` (toward −z) into its chest. */
function shootAt(test: Test, owner: Entity, target: Entity): string {
  const at = target.location;
  return shoot(test, owner, { x: at.x, y: at.y + 1.0, z: at.z - 3.5 }, { x: at.x, y: at.y + 1.0, z: at.z });
}

async function waitHits(test: Test, w: Witness, ids: readonly string[], ticks = 40): Promise<HitReport[]> {
  for (let t = 0; t < ticks && ids.some((id) => !w.hits.some((h) => h.report.boltId === id)); t++) await test.idle(1);
  const missing = ids.filter((id) => !w.hits.some((h) => h.report.boltId === id));
  test.assert(missing.length === 0, `bolt(s) ${missing.join(",")} never hit an entity: ended [${missing.map((id) => w.endings.get(id) ?? "in flight").join(",")}]`);
  return ids.map((id) => w.hits.find((h) => h.report.boltId === id)!.report);
}

const ARMOUR: Array<[EquipmentSlot, string]> = [
  [EquipmentSlot.Head, "minecraft:netherite_helmet"],
  [EquipmentSlot.Chest, "minecraft:netherite_chestplate"],
  [EquipmentSlot.Legs, "minecraft:netherite_leggings"],
  [EquipmentSlot.Feet, "minecraft:netherite_boots"],
];

interface Kit {
  armour?: boolean;
  shield?: boolean;
}

/** Netherite with Protection IV on every piece, and/or a shield in the off hand raised by sneaking (CNTR-X23). */
function equip(p: SimulatedPlayer, kit: Kit): string {
  const eq = p.getComponent("minecraft:equippable");
  const parts: string[] = [];
  if (kit.armour === true) {
    for (const [slot, id] of ARMOUR) {
      const stack = new ItemStack(id);
      stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("protection"), level: 4 });
      eq?.setEquipment(slot, stack);
    }
    const chest = eq?.getEquipment(EquipmentSlot.Chest);
    parts.push(`${short(chest?.typeId ?? "none")}+protection${chest?.getComponent("minecraft:enchantable")?.getEnchantment("protection")?.level ?? 0}`);
  }
  if (kit.shield === true) {
    const ok = eq?.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:shield")) ?? false;
    p.isSneaking = true;
    parts.push(`shield ${String(ok)} ${short(eq?.getEquipment(EquipmentSlot.Offhand)?.typeId ?? "none")}`);
  }
  return parts.join(" ") || "bare";
}

/** A Survival SimulatedPlayer at `hp` of a 40-HP maximum, facing `face` when given. */
async function target(test: Test, rel: Vector3, name: string, kit: Kit = {}, face?: Entity): Promise<{ p: SimulatedPlayer; kit: string }> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("health_boost", 12000, { amplifier: 4, showParticles: false });
  const desc = equip(p, kit);
  if (face !== undefined) p.lookAtEntity(face);
  await test.idle(2);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return { p, kit: desc };
}

/** Regen off for the scenario; the world's difficulty and regen come back in `restore`. */
function pinWorld(): () => void {
  const regen = world.gameRules.naturalRegeneration;
  const difficulty = world.getDifficulty();
  world.gameRules.naturalRegeneration = false;
  return () => {
    world.gameRules.naturalRegeneration = regen;
    world.setDifficulty(difficulty);
  };
}

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[], w: Witness) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const restore = pinWorld();
    const w = witness();
    try {
      await quiet(test);
      await body(test, players, w);
    } finally {
      w.stop();
      setWindowWrite(true);
      restore();
      for (const p of players) {
        try {
          test.removeSimulatedPlayer(p);
        } catch (err) {
          log(`${name} cleanup: ${errText(err)}`);
        }
      }
      floor(test);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(maxTicks)
    .tag("andrew");
}

function shooter(test: Test, players: SimulatedPlayer[], name: string, rel: Vector3 = SHOOTER_AT): SimulatedPlayer {
  const s = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  players.push(s);
  return s;
}

// ---------------------------------------------------------------- AC#1, T06/T07: exactly D, at every difficulty

scenario("sculk_hit_fixed_damage", 900, async (test, players, w) => {
  const s = shooter(test, players, "sk_hit_dmg_s");
  const { p: t } = await target(test, { x: 3, y: 2, z: 4 }, "sk_hit_dmg_t");
  players.push(t);
  const rounds: Array<[string, Difficulty]> = [
    ["peaceful", Difficulty.Peaceful],
    ["easy", Difficulty.Easy],
    ["normal", Difficulty.Normal],
    ["hard", Difficulty.Hard],
  ];
  const lines: string[] = [];
  const taken: number[] = [];
  // applyDamage with a damagingEntity knocks the target back; every bolt starts from the same spot.
  const spot = async (): Promise<void> => {
    t.teleport(test.worldLocation({ x: 3.5, y: 2, z: 4.5 }));
    t.lookAtEntity(s);
    await test.idle(CLEAR);
  };
  for (const [label, difficulty] of rounds) {
    world.setDifficulty(difficulty);
    await spot();
    setHp(t, FULL);
    await test.idle(1);
    const before = hp(t);
    const from = system.currentTick;
    const id = shootAt(test, s, t);
    const [r] = await waitHits(test, w, [id]);
    const seen = w.hits.find((h) => h.report.boltId === id)!.hpSeen;
    await test.idle(2);
    const later = hp(t);
    const hurts = w.hurtsOf(t, from);
    taken.push(before - seen);
    lines.push(
      `${label}(${world.getDifficulty()}): hp ${f2(before)} -> ${f2(seen)} in the hit tick, ${f2(later)} at +2; path ${r.path}; hurts ${hurtText(hurts, from)}`
    );
    test.assert(before === FULL, `${label}: the target started at ${before}, not ${FULL}`);
    test.assert(seen === FULL - D && later === FULL - D, `${label}: the bolt took ${f2(before - seen)} (then ${f2(before - later)}), not exactly ${D}`);
    test.assert(
      hurts.length === 1 && hurts[0].cause === EntityDamageCause.sonicBoom && hurts[0].damage === D && hurts[0].by === s.id,
      `${label}: hurt events ${hurtText(hurts, from)}, not one sonicBoom ${D} by the shooter`
    );
  }

  // Absorption first, never twice (C-28): 16 absorption takes the first bolt whole and 6 of the second.
  world.setDifficulty(Difficulty.Normal);
  await spot();
  setHp(t, FULL);
  t.addEffect("absorption", 2400, { amplifier: 3, showParticles: false });
  await test.idle(2);
  const a0 = hp(t);
  const [ra] = await waitHits(test, w, [shootAt(test, s, t)]);
  await test.idle(2);
  const a1 = hp(t);
  await spot();
  const [rb] = await waitHits(test, w, [shootAt(test, s, t)]);
  await test.idle(2);
  const a2 = hp(t);
  t.removeEffect("absorption");
  lines.push(`absorption 16: hp ${f2(a0)} -> ${f2(a1)} (${ra.path}) -> ${f2(a2)} (${rb.path}), written ${ra.wrote}/${rb.wrote}`);

  log(`fixed_damage RESULT D ${D}; ${lines.join("; ")}`);
  test.assert(new Set(taken).size === 1, `the damage changed with the difficulty: [${taken.map(f2).join(",")}]`);
  test.assert(a0 === FULL && a1 === FULL && a2 === FULL - (D - 6), `absorption: hp ${a0} -> ${a1} -> ${a2}, not ${FULL} -> ${FULL} -> ${FULL - (D - 6)}`);
});

// ---------------------------------------------------------------- AC#2, T08: armour, Protection IV, a raised shield

scenario("sculk_hit_armour_shield", 900, async (test, players, w) => {
  const s = shooter(test, players, "sk_hit_arm_s", { x: 3, y: 2, z: 0 });
  const kits: Array<[string, Kit, number]> = [
    ["bare", {}, 0],
    ["armour", { armour: true }, 2],
    ["shield", { shield: true }, 4],
    ["armour+shield", { armour: true, shield: true }, 6],
  ];
  const targets: Array<{ label: string; p: SimulatedPlayer; kit: string }> = [];
  for (const [label, kit, x] of kits) {
    const { p, kit: desc } = await target(test, { x, y: 2, z: 4 }, `sk_hit_arm_${label.replace("+", "_")}`, kit, s);
    players.push(p);
    targets.push({ label, p, kit: desc });
  }
  await test.idle(CLEAR);
  for (const { p } of targets) {
    p.lookAtEntity(s);
    setHp(p, FULL);
  }
  await test.idle(2);
  const from = system.currentTick;
  const ids = targets.map(({ p }) => shootAt(test, s, p));
  const reports = await waitHits(test, w, ids);
  const seen = ids.map((id) => w.hits.find((h) => h.report.boltId === id)!.hpSeen);
  await test.idle(2);
  const later = targets.map(({ p }) => hp(p));

  // Controls: the same 10 as entityAttack from the shooter is what armour soaks and the shield blocks.
  await test.idle(CLEAR);
  const controls = targets.map(({ p }) => {
    const h0 = hp(p);
    const applied = p.applyDamage(D, { cause: EntityDamageCause.entityAttack, damagingEntity: s });
    return { applied, took: h0 - hp(p) };
  });

  const lines = targets.map(
    ({ label, p, kit }, i) =>
      `${label} [${kit}]: bolt ${f2(FULL - seen[i])} (${reports[i].path}, hurts ${hurtText(w.hurtsOf(p, from).filter((h) => h.cause === EntityDamageCause.sonicBoom), from)}), ` +
      `+2 ${f2(FULL - later[i])}; control entityAttack ${D}: applied ${controls[i].applied} took ${f2(controls[i].took)}`
  );
  log(`armour_shield RESULT ${lines.join("; ")}`);
  for (const [i, { label }] of targets.entries()) {
    test.assert(FULL - seen[i] === D && FULL - later[i] === D, `${label}: the bolt took ${f2(FULL - seen[i])} (then ${f2(FULL - later[i])}), not ${D} like the bare target`);
  }
  test.assert(controls[0].took === D, `control: the bare target took ${f2(controls[0].took)} from entityAttack, not ${D}`);
  test.assert(controls[1].took < D / 2, `control: armour let ${f2(controls[1].took)} of entityAttack through — it is not on`);
  test.assert(!controls[2].applied && controls[2].took === 0, `control: the shield did not block entityAttack (${controls[2].applied}, ${f2(controls[2].took)}) — it is not raised`);
  test.assert(!controls[3].applied && controls[3].took === 0, `control: armour+shield did not block entityAttack (${controls[3].applied}, ${f2(controls[3].took)})`);
});

// ---------------------------------------------------------------- AC#3, T17: a Multishot volley inside the hurt window

function multishotCrossbow(): ItemStack {
  const stack = new ItemStack(SCULK_CROSSBOW.itemId, 1);
  const ench = stack.getComponent("minecraft:enchantable");
  const e = { type: new EnchantmentType("multishot"), level: 1 };
  if (ench === undefined || !ench.canAddEnchantment(e)) throw new Error(`${SCULK_CROSSBOW.itemId} refuses multishot`);
  ench.addEnchantment(e);
  return stack;
}

/** A use right after a one-tick use returns false and starts nothing; one tick later it starts (probe P1). */
async function startUse(test: Test, p: SimulatedPlayer): Promise<number> {
  for (let attempt = 1; attempt <= 20; attempt++) {
    const tick = system.currentTick;
    if (p.useItemInSlot(SLOT)) return tick;
    await test.idle(1);
  }
  return -1;
}

/** Loads the held crossbow and fires it with one press at `aim` (test-relative). */
async function fireCrossbow(test: Test, p: SimulatedPlayer, aim: Vector3): Promise<number> {
  p.lookAtLocation(aim, LookDuration.Continuous);
  await test.idle(3);
  test.assert((await startUse(test, p)) >= 0, "the load never started");
  await test.idle(LOAD_TICKS);
  p.stopUsingItem();
  await test.idle(3);
  const press = await startUse(test, p);
  test.assert(press >= 0, "the press never fired");
  await test.idle(1);
  p.stopUsingItem();
  return press;
}

scenario("sculk_hit_multishot_window", 900, async (test, players, w) => {
  const s = shooter(test, players, "sk_hit_ms_s", { x: 3, y: 2, z: 1 });
  const { p: t, kit } = await target(test, { x: 3, y: 2, z: 3 }, "sk_hit_ms_t", { armour: true }, s);
  players.push(t);
  s.getComponent("minecraft:inventory")?.container?.setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
  s.setItem(multishotCrossbow(), SLOT, true);
  // The side bolts leave at ±10°: 1.5 blocks out, all three still cross the target's 0.6-wide box.
  const stand = { x: 3.5, y: 2, z: 3.0 };
  const aim = { x: 3.5, y: 3.2, z: 3.0 };
  const spawns: string[] = [];
  const stopLaunches = observeBolts((e) => {
    if (e.kind !== "launched" || e.record.ownerId !== s.id) return;
    const o = s.location;
    spawns.push(`#${e.record.volleyIndex} Δ${f2(e.record.lastPos.x - o.x)},${f2(e.record.lastPos.y - o.y)},${f2(e.record.lastPos.z - o.z)}`);
  });

  async function volley(label: string, write: boolean): Promise<{ text: string; taken: number; hits: HitReport[]; span: number }> {
    t.teleport(test.worldLocation(stand));
    t.lookAtEntity(s);
    await test.idle(CLEAR);
    setHp(t, FULL);
    await test.idle(1);
    const before = hp(t);
    const n0 = w.hits.length;
    setWindowWrite(write);
    let press = -1;
    try {
      press = await fireCrossbow(test, s, aim);
      for (let i = 0; i < 20 && w.hits.length - n0 < 3; i++) await test.idle(1);
      await test.idle(3);
    } finally {
      setWindowWrite(true);
    }
    const hits = w.hits.slice(n0).map((h) => h.report).filter((r) => r.targetId === t.id);
    const after = hp(t);
    const ticks = hits.map((r) => r.tick);
    const span = ticks.length === 0 ? -1 : Math.max(...ticks) - Math.min(...ticks);
    const text =
      `${label}: ${hits.length} bolts hit the target at press+[${ticks.map((x) => x - press).join(",")}] (span ${span} ticks), ` +
      `paths [${hits.map((r) => `${r.path}${r.inWindow ? "*" : ""}`).join(",")}], hp ${f2(before)} -> ${f2(after)} = ${f2(before - after)}, ` +
      `other hits [${w.hits.slice(n0).filter((h) => h.report.targetId !== t.id).map((h) => h.report.targetType).join(",")}]`;
    return { text, taken: before - after, hits, span };
  }

  let pattern: Awaited<ReturnType<typeof volley>>;
  let control: Awaited<ReturnType<typeof volley>>;
  try {
    pattern = await volley("with the write", true);
    control = await volley("negative control, applyDamage alone", false);
  } finally {
    stopLaunches();
  }
  log(`multishot_window RESULT target [${kit}] D ${D}; bolt spawns from the shooter [${spawns.join(" ")}]; ${pattern.text}; ${control.text}`);
  test.assert(pattern.hits.length === 3 && control.hits.length === 3, `the volleys hit the target ${pattern.hits.length} and ${control.hits.length} times, not 3 and 3`);
  test.assert(pattern.span < HURT_WINDOW_TICKS && control.span < HURT_WINDOW_TICKS, `the three hits spread over ${pattern.span}/${control.span} ticks: not inside one window`);
  test.assert(pattern.taken === 3 * D, `three bolts inside the window took ${f2(pattern.taken)}, not ${3 * D}`);
  test.assert(control.taken < 3 * D, `control: without the write the volley still took ${f2(control.taken)} — the window was never in play`);
});

// ---------------------------------------------------------------- AC#4, T09: nothing for anyone but the target

scenario("sculk_hit_only_target", 600, async (test, players, w) => {
  const s = shooter(test, players, "sk_hit_only_s");
  const { p: t } = await target(test, { x: 3, y: 2, z: 4 }, "sk_hit_only_t");
  // Beside the target on the patch, and one block off the bolt's line half-way along it.
  const { p: beside } = await target(test, { x: 5, y: 2, z: 4 }, "sk_hit_only_b");
  const { p: line } = await target(test, { x: 4, y: 2, z: 2 }, "sk_hit_only_l");
  players.push(t, beside, line);
  const cow = test.spawnWithoutBehaviors("minecraft:cow", { x: 1, y: 2, z: 4 });
  const others: Array<[string, Entity]> = [["beside", beside], ["line", line], ["cow", cow], ["shooter", s]];
  try {
    await test.idle(CLEAR);
    for (const e of [t, beside, line, s]) setHp(e, hp(e) > 20 ? FULL : 20);
    await test.idle(2);
    const before = new Map([t, ...others.map(([, e]) => e)].map((e) => [e.id, hp(e)]));
    const from = system.currentTick;
    const id = shootAt(test, s, t);
    const [r] = await waitHits(test, w, [id]);
    await test.idle(CLEAR);
    const witnessed = others.map(([label, e]) => ({ label, e, took: before.get(e.id)! - hp(e), hurts: w.hurtsOf(e, from) }));
    const targetHurts = w.hurtsOf(t, from);

    // Control: the same witness sees a bystander's hurt when there is one.
    const h0 = hp(beside);
    beside.applyDamage(1, { cause: EntityDamageCause.entityAttack });
    await test.idle(2);
    const controlSeen = w.hurtsOf(beside, from).length;

    log(
      `only_target RESULT bolt ${id} hit ${r.targetType === "minecraft:player" && r.targetId === t.id ? "the target" : `${r.targetType} ${r.targetId}`}: ` +
        `target took ${f2(before.get(t.id)! - hp(t))} hurts ${hurtText(targetHurts, from)}; ` +
        witnessed.map((x) => `${x.label} took ${f2(x.took)} hurts ${hurtText(x.hurts, from)}`).join("; ") +
        `; control applyDamage(1) on beside: hp ${f2(h0)} -> ${f2(hp(beside))}, hurts seen ${controlSeen}; patch ${r.patch?.sculked.length ?? "-"} cells`
    );
    test.assert(r.targetId === t.id, `the bolt hit ${r.targetType} ${r.targetId}, not the target`);
    test.assert(targetHurts.length === 1 && targetHurts[0].damage === D, `the target's hurts ${hurtText(targetHurts, from)}`);
    for (const x of witnessed) test.assert(x.took === 0 && x.hurts.length === 0, `${x.label} took ${f2(x.took)}, hurts ${hurtText(x.hurts, from)}`);
    test.assert(controlSeen === 1, `control: the witness saw ${controlSeen} hurts on a bystander hit once`);
  } finally {
    if (cow.isValid) cow.remove();
  }
});

// ---------------------------------------------------------------- AC#5, T10: a sculk patch under the target, no crater

interface Site {
  label: string;
  build(test: Test): void;
}

const SITES: Site[] = [
  { label: "stone", build: () => undefined },
  { label: "grass", build: (test) => floor(test, "minecraft:grass_block") },
  {
    label: "step",
    build: (test) => test.getDimension().fillBlocks(new BlockVolume(test.worldBlockLocation({ x: 4, y: FLOOR_Y + 1, z: 0 }), test.worldBlockLocation({ x: 6, y: FLOOR_Y + 1, z: 6 })), STONE),
  },
];

function snapshot(dim: Dimension, min: Vector3, max: Vector3): Map<string, string> {
  const out = new Map<string, string>();
  for (let x = min.x; x <= max.x; x++) for (let y = min.y; y <= max.y; y++) for (let z = min.z; z <= max.z; z++) out.set(key({ x, y, z }), dim.getBlock({ x, y, z })?.typeId ?? "unloaded");
  return out;
}

scenario("sculk_hit_patch_no_crater", 900, async (test, players, w) => {
  const dim = test.getDimension();
  const s = shooter(test, players, "sk_hit_patch_s");
  const { p: t } = await target(test, { x: 3, y: 2, z: 3 }, "sk_hit_patch_t");
  players.push(t);
  const feet = test.worldBlockLocation({ x: 3, y: 2, z: 3 });
  const min = test.worldBlockLocation({ x: -1, y: 0, z: -1 });
  const max = test.worldBlockLocation({ x: 7, y: 4, z: 7 });
  const verdicts: string[] = [];
  const shapes = new Set<string>();
  try {
    for (const site of SITES) {
      floor(test);
      dim.fillBlocks(new BlockVolume(test.worldBlockLocation({ x: 0, y: FLOOR_Y + 1, z: 0 }), test.worldBlockLocation({ x: 6, y: FLOOR_Y + 3, z: 6 })), AIR);
      site.build(test);
      t.teleport(test.worldLocation({ x: 3.5, y: 2, z: 3.5 }));
      await test.idle(CLEAR);
      setHp(t, FULL);
      const before = snapshot(dim, min, max);
      const id = shootAt(test, s, t);
      const [r] = await waitHits(test, w, [id]);
      for (let i = 0; i < 20 && !w.patches.has(id); i++) await test.idle(1);
      await test.idle(3);
      const job = w.patches.get(id);
      const after = snapshot(dim, min, max);
      const diff = [...before].filter(([k, v]) => after.get(k) !== v).map(([k, from]) => ({ at: k, from, to: after.get(k) ?? "missing" }));
      const sculk = diff.filter((d) => d.to === SCULK).map((d) => d.at.split(",").map(Number));
      const removed = diff.filter((d) => d.to === AIR);
      const other = diff.filter((d) => d.to !== SCULK && d.to !== AIR);
      const rel = sculk.map(([x, y, z]) => ({ dx: x - feet.x, dy: y - feet.y, dz: z - feet.z }));
      const outside = rel.filter((c) => Math.abs(c.dx) > 2 || Math.abs(c.dz) > 2 || (Math.abs(c.dx) === 2 && Math.abs(c.dz) === 2));
      const buried = sculk.filter(([x, y, z]) => after.get(key({ x, y: y + 1, z })) !== AIR);
      const levels = [...new Set(rel.map((c) => c.dy))].sort();
      const shape = rel.map((c) => `${c.dx},${c.dz}`).sort().join(";");
      if (site.label !== "step") shapes.add(shape);
      const ok =
        job !== undefined &&
        job.kind === "patch" &&
        job.plan.air.length === 0 &&
        job.carved.length === 0 &&
        w.endings.get(id) === "entity" &&
        removed.length === 0 &&
        other.length === 0 &&
        outside.length === 0 &&
        buried.length === 0 &&
        sculk.length >= 9 &&
        sculk.length <= 21 &&
        sculk.length === job.sculked.length &&
        (site.label !== "step" || levels.length === 2);
      verdicts.push(`${site.label}:${ok ? "ok" : "FAIL"}`);
      log(
        `patch_no_crater RESULT ${site.label} bolt ${id} seed ${job?.plan.seed ?? "-"} ending ${w.endings.get(id) ?? "-"}, path ${r.path}: ` +
          `sculk ${sculk.length} (job ${job?.kind ?? "-"} planned ${job?.plan.sculk.length ?? "-"} written ${job?.sculked.length ?? "-"}, crater cells planned ${job?.plan.air.length ?? "-"}) on ` +
          `[${[...new Set(diff.filter((d) => d.to === SCULK).map((d) => short(d.from)))].join(",")}] at dy [${levels.join(",")}]; ` +
          `cells removed ${removed.length} [${removed.slice(0, 3).map((d) => `${d.at} ${short(d.from)}`).join("; ")}], other changes ${other.length} ` +
          `[${other.slice(0, 3).map((d) => `${d.at} ${short(d.from)}->${short(d.to)}`).join("; ")}], outside 5×5 or on a corner ${outside.length}, not on the surface ${buried.length}; ` +
          `shape ${shape}`
      );
    }
  } finally {
    dim.fillBlocks(new BlockVolume(test.worldBlockLocation({ x: 0, y: FLOOR_Y + 1, z: 0 }), test.worldBlockLocation({ x: 6, y: FLOOR_Y + 3, z: 6 })), AIR);
  }
  log(`patch_no_crater RESULT ${verdicts.join(" ")}; distinct flat shapes ${shapes.size} of 2`);
  test.assert(verdicts.every((v) => v.endsWith(":ok")), `a patch broke its rules: ${verdicts.join(" ")}`);
});

// ---------------------------------------------------------------- AC#6: the kill is the crossbow owner's

scenario("sculk_hit_kill_credit", 600, async (test, players, w) => {
  const s = shooter(test, players, "sk_hit_kill_s");
  const plain = test.spawnSimulatedPlayer({ x: 2, y: 2, z: 4 }, "sk_hit_kill_p", GameMode.Survival);
  const shielded = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 4 }, "sk_hit_kill_sh", GameMode.Survival);
  players.push(plain, shielded);
  const cow = test.spawnWithoutBehaviors("minecraft:cow", { x: 6, y: 2, z: 4 });
  try {
    await test.idle(2);
    const kit = equip(shielded, { shield: true });
    shielded.lookAtEntity(s);
    await test.idle(CLEAR);
    setHp(plain, 6);
    setHp(shielded, 6);
    // Control: the raised shield stops a lethal entityAttack from the shooter, the cause the Scythe pattern uses.
    const controlApplied = shielded.applyDamage(106, { cause: EntityDamageCause.entityAttack, damagingEntity: s });
    const controlHp = hp(shielded);
    await test.idle(2);
    const victims: Array<[string, Entity]> = [["player", plain], ["shield", shielded], ["cow", cow]];
    const hps = victims.map(([, e]) => hp(e));
    const ids = victims.map(([, e]) => shootAt(test, s, e));
    const reports = await waitHits(test, w, ids);
    await test.idle(5);
    const lines = victims.map(([label, e], i) => {
      const d = w.deaths.get(e.id);
      return `${label} hp ${f2(hps[i])} path ${reports[i].path}: ${d === undefined ? "ALIVE" : `died, cause ${d.cause}, killer ${d.by === s.id ? "the shooter" : (d.by ?? "none")}`}`;
    });
    log(`kill_credit RESULT shield [${kit}] control lethal entityAttack: applied ${controlApplied}, hp ${f2(controlHp)}; ${lines.join("; ")}`);
    test.assert(!controlApplied && controlHp === 6, `control: the shield did not stop entityAttack (${controlApplied}, hp ${controlHp}) — it is not raised`);
    for (const [label, e] of victims) {
      const d = w.deaths.get(e.id);
      test.assert(d !== undefined, `the ${label} survived a ${D}-damage bolt at hp ≤ ${D}`);
      test.assert(d!.by === s.id && d!.cause === EntityDamageCause.sonicBoom, `the ${label}'s death went to ${d!.by ?? "nobody"} by ${d!.cause}, not the shooter by sonicBoom`);
    }
  } finally {
    if (cow.isValid) cow.remove();
  }
});
