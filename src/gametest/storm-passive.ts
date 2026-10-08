// STRM-PASSIVE-01 scenarios for the Storm Blade passive (src/storm/passive.ts; spec §02, §06; L0-strm-ppas,
// L0-strm-rdmg). SimulatedPlayers swing the real andrew:storm_blade. Witnesses: health read by the test around each
// swing, the engine's entityHurt, the passive's own reports, the strikes it draws and the raw cooldown property.
// Every scenario logs "[gametest] storm-passive <tag> ROW …" and fails on the first scenario-end check that does not
// hold; every row is printed first.

import {
  BlockPermutation,
  type Entity,
  EntityDamageCause,
  EquipmentSlot,
  GameMode,
  ItemStack,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { isReady, startCooldown } from "../legendary/cooldown";
import { STORM_BLADE, cooldownKey } from "../legendary/registry";
import { bumpGen, makeMark, markItem } from "../legendary/state";
import { ACTIVE_DAMAGE, PASSIVE_DAMAGE, afterArmour, defenceOf, registerStormDamage, stormDamage } from "../storm/damage";
import { PASSIVE_CHANCE, type PassiveReport, drawStrike, observePassive, registerStormPassive, setStormRng, setStrikeVisual } from "../storm/passive";

registerStormDamage();
registerStormPassive();

const STRUCTURE = "andrew:platform";
const BLADE = STORM_BLADE.itemId;
const SWORD = "minecraft:diamond_sword";
const CD_KEY = cooldownKey(STORM_BLADE.abilityKey);
/** Waits out any hurt window and lets knockback settle. */
const CLEAR = 22;
const TOL = 0.01;
const FLOOR_Y = 1;

/**
 * docs/feedback/probe-storm.md P6, exact binomial: at N = 3 700 landed hits a 30 % passive leaves [27.5 %; 32.5 %] in
 * 0.090 % of runs, a 25 % one enters it in 0.025 %, a 35 % one in 0.068 % (N ≥ 3 656 for every error under 0.1 %).
 */
const RATE_N = 3700;
const RATE_LO = 0.275;
const RATE_HI = 0.325;
/** Ready vs on-cooldown halves, ~1 850 rolls each: σ of the difference ≈ 0.015, so 0.05 is 3.3 σ. */
const HALVES_MAX_GAP = 0.05;
/** Lag-1 dependence over ~3 700 transitions: σ ≈ 0.016; 0.08 catches only a gross streak or pity rule. */
const LAG1_MAX_GAP = 0.08;

const log = (msg: string): void => console.warn(`[gametest] storm-passive ${msg}`);
const r2 = (n: number | undefined): string => (n === undefined ? "-" : Number.isFinite(n) ? n.toFixed(2) : String(n));
const r4 = (n: number): string => n.toFixed(4);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const close = (a: number, b: number): boolean => Math.abs(a - b) <= TOL + 1e-9;
const cellKey = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

// ------------------------------------------------------------------ witnesses

const reports: PassiveReport[] = [];
observePassive((r) => reports.push(r));

interface Strike {
  tick: number;
  at: Vector3;
}
const strikes: Strike[] = [];
setStrikeVisual((dimension, at) => {
  strikes.push({ tick: system.currentTick, at });
  drawStrike(dimension, at);
});

interface Hurt {
  tick: number;
  damage: number;
  cause: string;
  by: string;
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
  list.push({ tick: system.currentTick, damage: e.damage, cause: e.damageSource.cause, by });
});

function watch(e: Entity): void {
  hurts.set(e.id, []);
}

function hurtsSince(e: Entity, from: number): Hurt[] {
  return (hurts.get(e.id) ?? []).filter((h) => h.tick >= from);
}

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

/** One swing: health taken in the swing's own call, and the passive reports it produced. */
function swing(a: SimulatedPlayer, t: Entity): { ok: boolean; delta: number; rolls: PassiveReport[] } {
  const n = reports.length;
  const before = hp(t);
  const ok = a.attackEntity(t);
  return { ok, delta: before - hp(t), rolls: reports.slice(n) };
}

function hold(a: SimulatedPlayer, id: string): void {
  a.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Mainhand, new ItemStack(id));
}

const FORCE_PROC = (): number => 0;
const FORCE_MISS = (): number => 0.999;

// ------------------------------------------------------------------ rigs

function check(fails: string[], tag: string, ok: boolean, what: string): void {
  if (!ok) fails.push(`${tag}: ${what}`);
}

class Arena {
  private readonly saved = new Map<string, { at: Vector3; permutation: BlockPermutation }>();

  constructor(private readonly test: Test) {}

  fill(from: Vector3, to: Vector3, id: string): void {
    const permutation = BlockPermutation.resolve(id);
    for (let x = from.x; x <= to.x; x++)
      for (let y = from.y; y <= to.y; y++)
        for (let z = from.z; z <= to.z; z++) {
          const at = this.test.worldBlockLocation({ x, y, z });
          const block = this.test.getDimension().getBlock(at);
          if (block === undefined) throw new Error(`arena cell ${cellKey({ x, y, z })} is not loaded`);
          if (!this.saved.has(cellKey(at))) this.saved.set(cellKey(at), { at, permutation: block.permutation });
          if (!block.permutation.matches(id)) block.setPermutation(permutation);
        }
  }

  restore(): void {
    for (const { at, permutation } of this.saved.values()) {
      try {
        this.test.getDimension().getBlock(at)?.setPermutation(permutation);
      } catch (err) {
        log(`arena restore ${cellKey(at)}: ${errText(err)}`);
      }
    }
  }
}

function scenario(name: string, maxTicks: number, body: (test: Test, players: SimulatedPlayer[], fails: string[], arena: Arena) => Promise<void>): void {
  registerAsync("andrew", name, async (test: Test): Promise<void> => {
    const players: SimulatedPlayer[] = [];
    const fails: string[] = [];
    const arena = new Arena(test);
    const regen = world.gameRules.naturalRegeneration;
    const pvp = world.gameRules.pvp;
    world.gameRules.naturalRegeneration = false;
    world.gameRules.pvp = true;
    try {
      log(`${name} START`);
      await body(test, players, fails, arena);
    } catch (err) {
      log(`${name} ERROR ${errText(err)}`);
      throw err;
    } finally {
      setStormRng();
      world.gameRules.naturalRegeneration = regen;
      world.gameRules.pvp = pvp;
      for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
      arena.restore();
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

function wielder(test: Test, players: SimulatedPlayer[], name: string, at: Vector3): SimulatedPlayer {
  const a = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  players.push(a);
  hold(a, BLADE);
  return a;
}

const DIAMOND_KIT: [EquipmentSlot, string][] = [
  [EquipmentSlot.Head, "minecraft:diamond_helmet"],
  [EquipmentSlot.Chest, "minecraft:diamond_chestplate"],
  [EquipmentSlot.Legs, "minecraft:diamond_leggings"],
  [EquipmentSlot.Feet, "minecraft:diamond_boots"],
];

/** A Survival SimulatedPlayer on 40 HP (health_boost IV), bare or in full diamond. */
async function playerTarget(test: Test, players: SimulatedPlayer[], name: string, diamond: boolean, at: Vector3): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(at, name, GameMode.Survival);
  players.push(p);
  watch(p);
  await test.idle(2);
  p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  p.addEffect("slow_falling", 20000, { showParticles: false });
  if (diamond) for (const [slot, id] of DIAMOND_KIT) p.getComponent("minecraft:equippable")?.setEquipment(slot, new ItemStack(id));
  await test.idle(2);
  refill(p);
  return p;
}

// ------------------------------------------------------------------ AC2 (+ the helper only, the guard, the strike)

const T_AT: Vector3 = { x: 3.5, y: 2, z: 2.5 };
const A_AT: Vector3 = { x: 3.5, y: 2, z: 4.5 };

scenario("storm_passive_damage", 3000, async (test, players, fails) => {
  const a = wielder(test, players, "sp_dmg_a", A_AT);
  const bystander = test.spawnWithoutBehaviors("minecraft:cow", { x: 1.5, y: 2, z: 1.5 });
  watch(bystander);

  for (const diamond of [false, true]) {
    const kit = diamond ? "diamond" : "bare";
    const tag = `DAMAGE ${kit}`;
    const t = await playerTarget(test, players, `sp_dmg_${kit}`, diamond, T_AT);
    const f6 = afterArmour(PASSIVE_DAMAGE, defenceOf(t));
    const f10 = afterArmour(ACTIVE_DAMAGE, defenceOf(t));
    const fresh = async (): Promise<number> => {
      await test.idle(CLEAR);
      t.teleport(test.worldLocation(T_AT));
      bystander.teleport(test.worldLocation({ x: 1.5, y: 2, z: 1.5 }));
      await test.idle(2);
      a.lookAtEntity(t);
      refill(t);
      await test.idle(1);
      return system.currentTick;
    };

    // The diamond sword is the yardstick for "a plain hit".
    hold(a, SWORD);
    setStormRng(FORCE_PROC);
    await fresh();
    const ref = swing(a, t);
    check(fails, tag, ref.ok && ref.delta > 0 && ref.rolls.length === 0, `diamond sword reference ${r2(ref.delta)}, rolls ${ref.rolls.length} (a sword never rolls)`);
    log(`${tag} ROW diamond-sword-reference swing(${ref.ok})=${r2(ref.delta)} rolls=${ref.rolls.length} f(6)=${r2(f6)}`);
    hold(a, BLADE);

    for (let i = 0; i < 3; i++) {
      setStormRng(FORCE_MISS);
      let t0 = await fresh();
      const miss = swing(a, t);
      const missHurts = hurtsSince(t, t0);
      check(fails, tag, miss.ok && close(miss.delta, ref.delta), `forced miss #${i} took ${r2(miss.delta)}, a diamond sword takes ${r2(ref.delta)}`);
      check(fails, tag, miss.rolls.length === 1 && !miss.rolls[0].proc && !miss.rolls[0].strike, `forced miss #${i}: ${miss.rolls.length} roll(s), proc=${String(miss.rolls[0]?.proc)}`);
      log(`${tag} ROW blade-forced-miss#${i} swing(${miss.ok})=${r2(miss.delta)} ref=${r2(ref.delta)} rolls=${miss.rolls.length} hurts=[${missHurts.map((h) => r2(h.damage)).join(",")}]`);

      setStormRng(FORCE_PROC);
      t0 = await fresh();
      const struck = strikes.length;
      const proc = swing(a, t);
      await test.idle(2);
      const procHurts = hurtsSince(t, t0);
      const drawn = strikes.slice(struck);
      const want = ref.delta + f6;
      check(fails, tag, proc.ok && close(proc.delta, want), `forced proc #${i} took ${r2(proc.delta)}, expected sword ${r2(ref.delta)} + f(6) ${r2(f6)} = ${r2(want)}`);
      check(fails, tag, proc.rolls.length === 1 && proc.rolls[0].proc && proc.rolls[0].raise?.plan === "raise", `forced proc #${i}: ${proc.rolls.length} roll(s), plan ${proc.rolls[0]?.raise?.plan ?? "-"}`);
      check(fails, tag, procHurts.length === 1 && close(procHurts[0].damage, want) && procHurts[0].by === a.id, `forced proc #${i}: one native hurt event from the wielder, got [${procHurts.map((h) => `${r2(h.damage)}/${h.by === a.id ? "a" : h.by}`).join(" ")}]`);
      check(fails, tag, drawn.length === 1 && drawn[0].tick - t0 <= 1, `forced proc #${i}: ${drawn.length} strike(s) drawn`);
      log(
        `${tag} ROW blade-forced-proc#${i} swing(${proc.ok})=${r2(proc.delta)} expect=${r2(want)} read=${r2(proc.rolls[0]?.raise?.read)} bonus=${r2(proc.rolls[0]?.raise?.bonus)} ` +
          `plan=${proc.rolls[0]?.raise?.plan ?? "-"} hurts=[${procHurts.map((h) => r2(h.damage)).join(",")}] strikes=${drawn.length}@+${drawn.map((s) => s.tick - t0).join(",")}`
      );
    }

    // NEGATIVE CONTROL: the build the task warns about — a separate applyDamage(6) in the hit's tick — passes "did it
    // fire" and deals nothing, and the proc check above rejects it.
    setStormRng(FORCE_MISS);
    hold(a, SWORD);
    await fresh();
    const hp0 = hp(t);
    const naiveSwing = swing(a, t);
    let naiveRet = "-";
    system.run(() => {
      try {
        naiveRet = String(t.applyDamage(PASSIVE_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: a }));
      } catch (err) {
        naiveRet = `threw(${errText(err)})`;
      }
    });
    await test.idle(2);
    const naive = hp0 - hp(t);
    const naivePasses = close(naive, ref.delta + f6);
    check(fails, tag, naiveRet === "true" && !naivePasses, `NEGATIVE CONTROL naive apply6 in the hit tick took ${r2(naive)} ret=${naiveRet}: the proc check must reject it`);
    log(`${tag} ROW NEGATIVE-CONTROL naive-apply6-same-tick swing=${r2(naiveSwing.delta)} total=${r2(naive)} ret=${naiveRet} proc-check-would-pass=${String(naivePasses)}`);
    hold(a, BLADE);

    // The active's own damage, the blade in hand and every roll forced to proc: the passive must stay out of it.
    setStormRng(FORCE_PROC);
    await fresh();
    let n = reports.length;
    const active = stormDamage(t, ACTIVE_DAMAGE, a);
    const activeRolls = reports.length - n;
    const activeTook = (active.hpBefore ?? 0) - (active.hpAfter ?? 0);
    check(fails, tag, activeRolls === 0 && active.path === "native" && close(activeTook, f10), `active helper with the blade in hand: ${activeRolls} passive roll(s), took ${r2(activeTook)}, f(10) ${r2(f10)}`);
    log(`${tag} ROW active-helper-blade-in-hand path=${active.path} took=${r2(activeTook)} f(10)=${r2(f10)} passive-rolls=${activeRolls}`);

    // CONTROL: a plain applyDamage(10) as an entityAttack from the wielder does roll, inside the call — the reason the
    // helper marks its own calls.
    await fresh();
    n = reports.length;
    const h0 = hp(t);
    const ret = t.applyDamage(ACTIVE_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: a });
    const insideCall = reports.length - n;
    const plainTook = h0 - hp(t);
    check(fails, tag, insideCall === 1 && close(plainTook, f10 + f6), `CONTROL plain apply10 from the wielder: ${insideCall} roll(s) inside the call, took ${r2(plainTook)} (f(10) + f(6) = ${r2(f10 + f6)})`);
    log(`${tag} ROW CONTROL plain-apply10-from-wielder ret=${String(ret)} rolls-inside-the-call=${insideCall} took=${r2(plainTook)} f(10)+f(6)=${r2(f10 + f6)}`);

    test.removeSimulatedPlayer(t);
    await test.idle(2);
  }

  // Off hand: Bedrock never melees with it (L0-xasm30); the main-hand sword's hit stays plain.
  const offTag = "OFF-HAND";
  const t = await playerTarget(test, players, "sp_dmg_off", false, T_AT);
  setStormRng(FORCE_PROC);
  await test.idle(CLEAR);
  hold(a, SWORD);
  a.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, new ItemStack(BLADE));
  a.lookAtEntity(t);
  refill(t);
  await test.idle(1);
  const off = swing(a, t);
  check(fails, offTag, off.ok && off.rolls.length === 0, `blade in the off hand rolled ${off.rolls.length} time(s)`);
  log(`${offTag} ROW sword-main-blade-off swing(${off.ok})=${r2(off.delta)} rolls=${off.rolls.length}`);
  a.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Offhand, undefined);

  // A stale copy (its generation superseded, R-lgnd-005) is not the blade.
  const staleTag = "STALE";
  const mark = makeMark("admin", a);
  const stale = markItem(STORM_BLADE, new ItemStack(BLADE), mark);
  bumpGen(STORM_BLADE, mark.id);
  await test.idle(CLEAR);
  a.lookAtEntity(t);
  refill(t);
  await test.idle(1);
  // The legendary framework deletes a stale copy on its next inventory change, so it is put in hand and swung in
  // one tick; if it is already gone, this row proves nothing and says so.
  a.getComponent("minecraft:equippable")?.setEquipment(EquipmentSlot.Mainhand, stale);
  const heldStale = a.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId ?? "empty";
  const st = swing(a, t);
  if (heldStale === BLADE) check(fails, staleTag, st.ok && st.rolls.length === 0, `a stale blade rolled ${st.rolls.length} time(s)`);
  log(`${staleTag} ROW stale-blade held=${heldStale} swing(${st.ok})=${r2(st.delta)} rolls=${st.rolls.length}${heldStale === BLADE ? "" : " NOT MEASURED: the copy left the hand"}`);
  hold(a, BLADE);
  test.removeSimulatedPlayer(t);

  // An armour stand has health (probe-storm P5 F) but is no living thing.
  const standTag = "INANIMATE";
  const stand = test.spawn("minecraft:armor_stand", { x: 3.5, y: 2, z: 2.5 });
  watch(stand);
  await test.idle(CLEAR);
  a.lookAtEntity(stand);
  await test.idle(1);
  const sn = reports.length;
  const s0 = system.currentTick;
  const standHp = hp(stand);
  const standOk = a.attackEntity(stand);
  await test.idle(2);
  // The stand counts as hit if the engine raised a hurt on it or it broke; otherwise the row proves nothing.
  const standHit = hurtsSince(stand, s0).length > 0 || !stand.isValid;
  if (standHit) check(fails, standTag, reports.length === sn, `a hit on an armour stand rolled ${reports.length - sn} time(s)`);
  log(
    `${standTag} ROW armour-stand swing(${standOk}) hp=${r2(standHp)} hurts=${hurtsSince(stand, s0).length} broken=${String(!stand.isValid)} rolls=${reports.length - sn}` +
      `${standHit ? "" : " NOT MEASURED: the hit did not land"}`
  );
  if (stand.isValid) stand.remove();

  // The strikes are spectacle only (C-30): the cow two blocks away took nothing, nothing burns, no lightning entity.
  const visTag = "VISUAL";
  const cowHurts = hurtsSince(bystander, 0);
  check(fails, visTag, cowHurts.length === 0, `the bystander cow was hurt: ${cowHurts.map((h) => `${r2(h.damage)}/${h.cause}`).join(" ")}`);
  const dim = test.getDimension();
  let fire = 0;
  for (const s of strikes.slice(-8)) {
    for (let dx = -3; dx <= 3; dx++)
      for (let dy = -1; dy <= 3; dy++)
        for (let dz = -3; dz <= 3; dz++) {
          const b = dim.getBlock({ x: Math.floor(s.at.x) + dx, y: Math.floor(s.at.y) + dy, z: Math.floor(s.at.z) + dz });
          if (b?.typeId === "minecraft:fire") fire++;
        }
  }
  const bolts = dim.getEntities({ type: "minecraft:lightning_bolt", location: test.worldLocation(T_AT), maxDistance: 32 }).length;
  check(fails, visTag, fire === 0 && bolts === 0, `fire cells ${fire}, lightning_bolt entities ${bolts}`);
  log(`${visTag} ROW strikes=${strikes.length} bystander-hurts=${cowHurts.length} fire-cells-within-3=${fire} lightning-bolts=${bolts}`);
  if (bystander.isValid) bystander.remove();
});

// ------------------------------------------------------------------ AC3, AC4: the active's timer

scenario("storm_passive_cooldown", 2400, async (test, players, fails) => {
  const a = wielder(test, players, "sp_cd_a", A_AT);
  const t = await playerTarget(test, players, "sp_cd_t", false, T_AT);
  const f6 = afterArmour(PASSIVE_DAMAGE, defenceOf(t));
  const raw = (p: Player): unknown => p.getDynamicProperty(CD_KEY);
  hold(a, SWORD);
  await test.idle(CLEAR);
  a.lookAtEntity(t);
  await test.idle(1);
  const ref = swing(a, t).delta;
  hold(a, BLADE);
  log(`REFERENCE ROW diamond-sword=${r2(ref)}`);
  const series = async (tag: string, count: number, force: () => number): Promise<{ procs: number; good: number; rolls: number }> => {
    setStormRng(force);
    let procs = 0;
    let good = 0;
    let rolls = 0;
    for (let i = 0; i < count; i++) {
      await test.idle(i === 0 ? CLEAR : 12);
      t.teleport(test.worldLocation(T_AT));
      a.lookAtEntity(t);
      refill(t);
      await test.idle(1);
      const s = swing(a, t);
      rolls += s.rolls.length;
      const proc = s.rolls[0]?.proc === true;
      if (proc) procs++;
      if (s.ok && close(s.delta, proc ? ref + f6 : ref)) good++;
      log(`${tag} ROW hit#${i} swing(${s.ok})=${r2(s.delta)} proc=${String(proc)} cd=${String(raw(a))}`);
    }
    return { procs, good, rolls };
  };

  // Ready: forced procs start no timer.
  a.setDynamicProperty(CD_KEY, undefined);
  const readyBefore = isReady(a, STORM_BLADE.abilityKey);
  const ready = await series("READY", 6, FORCE_PROC);
  const readyAfter = isReady(a, STORM_BLADE.abilityKey);
  check(fails, "READY", readyBefore && readyAfter && raw(a) === undefined, `ready ${String(readyBefore)} -> ${String(readyAfter)}, property ${String(raw(a))}`);
  check(fails, "READY", ready.rolls === 6 && ready.procs === 6 && ready.good === 6, `6 forced procs: rolls ${ready.rolls} procs ${ready.procs} exact ${ready.good}`);
  log(`READY ROW before=${String(readyBefore)} after=${String(readyAfter)} property=${String(raw(a))} procs=${ready.procs}/6 exact=${ready.good}/6`);

  // On cooldown: the deadline the active armed is the same number after the series, and every forced proc lands.
  startCooldown(a, STORM_BLADE.abilityKey);
  const d0 = raw(a);
  const ms0 = Date.now();
  const left0 = typeof d0 === "number" ? d0 - ms0 : Number.NaN;
  const cool = await series("COOLDOWN", 8, FORCE_PROC);
  const coolMiss = await series("COOLDOWN-MISS", 3, FORCE_MISS);
  const d1 = raw(a);
  const ms1 = Date.now();
  const left1 = typeof d1 === "number" ? d1 - ms1 : Number.NaN;
  const stillCooling = !isReady(a, STORM_BLADE.abilityKey);
  check(fails, "COOLDOWN", typeof d0 === "number" && d1 === d0, `deadline ${String(d0)} -> ${String(d1)}`);
  check(fails, "COOLDOWN", Math.abs(left0 - left1 - (ms1 - ms0)) < 1 && stillCooling, `left ${left0} -> ${left1} ms over ${ms1 - ms0} ms of series, cooling ${String(stillCooling)}`);
  check(fails, "COOLDOWN", cool.procs === 8 && cool.good === 8, `on cooldown, 8 forced procs: procs ${cool.procs} exact ${cool.good}`);
  check(fails, "COOLDOWN", coolMiss.procs === 0 && coolMiss.good === 3, `on cooldown, 3 forced misses: procs ${coolMiss.procs} exact ${coolMiss.good}`);
  log(`COOLDOWN ROW deadline ${String(d0)} -> ${String(d1)} left ${left0} -> ${left1} ms elapsed ${ms1 - ms0} ms cooling=${String(stillCooling)} procs=${cool.procs}/8 exact=${cool.good}/8 misses-exact=${coolMiss.good}/3`);

  // NEGATIVE CONTROL: a passive that re-armed the timer on a proc would move the deadline; the check above sees it.
  startCooldown(a, STORM_BLADE.abilityKey);
  const d2 = raw(a);
  check(fails, "COOLDOWN", d2 !== d1, `NEGATIVE CONTROL re-arming left the deadline at ${String(d2)}`);
  log(`COOLDOWN ROW NEGATIVE-CONTROL re-armed deadline ${String(d1)} -> ${String(d2)} check-would-catch=${String(d2 !== d1)}`);
  a.setDynamicProperty(CD_KEY, undefined);
});

// ------------------------------------------------------------------ AC1 (+ AC2, AC3, AC4 at scale): the 30 % share

const COLS = 3;
const ROWS = 4;
/** One wielder between two iron golems: each golem is hit every 20 ticks, out of any window. */
function unitSpots(c: number, r: number): { a: Vector3; g: [Vector3, Vector3] } {
  const x = 2.5 + 5 * c;
  const z = 1.5 + 3 * r;
  return { a: { x, y: FLOOR_Y + 1, z }, g: [{ x: x - 1.6, y: FLOOR_Y + 1, z }, { x: x + 1.6, y: FLOOR_Y + 1, z }] };
}

interface Unit {
  a: SimulatedPlayer;
  golems: [Entity, Entity];
  spots: [Vector3, Vector3];
  cooling: boolean;
  deadline: unknown;
}

scenario("storm_passive_rate", 7000, async (test, players, fails, arena) => {
  arena.fill({ x: 0, y: FLOOR_Y, z: 0 }, { x: 5 * COLS, y: FLOOR_Y, z: 3 * ROWS }, "minecraft:stone");
  arena.fill({ x: 0, y: FLOOR_Y + 1, z: 0 }, { x: 5 * COLS, y: FLOOR_Y + 4, z: 3 * ROWS }, "minecraft:air");
  setStormRng();
  const units: Unit[] = [];
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++) {
      const s = unitSpots(c, r);
      const a = wielder(test, players, `sp_rate_${c}${r}`, s.a);
      const golems = s.g.map((at) => {
        const g = test.spawnWithoutBehaviors("minecraft:iron_golem", at);
        watch(g);
        return g;
      }) as [Entity, Entity];
      units.push({ a, golems, spots: s.g, cooling: units.length % 2 === 1, deadline: undefined });
    }
  await test.idle(10);
  // Half the wielders hold the active on a cooldown longer than the run, armed through the shared module's key.
  for (const u of units) {
    u.a.setDynamicProperty(CD_KEY, u.cooling ? Date.now() + 15 * 60 * 1000 : undefined);
    u.deadline = u.a.getDynamicProperty(CD_KEY);
  }
  const coolingAtStart = units.filter((u) => u.cooling && !isReady(u.a, STORM_BLADE.abilityKey)).length;

  // The plain hit on a golem, from a vanilla diamond sword out of any window.
  const u0 = units[0];
  hold(u0.a, SWORD);
  u0.a.lookAtEntity(u0.golems[0]);
  await test.idle(1);
  const ref = swing(u0.a, u0.golems[0]);
  hold(u0.a, BLADE);
  log(`RATE ROW golem-reference diamond-sword swing(${ref.ok})=${r2(ref.delta)} rolls=${ref.rolls.length}`);
  check(fails, "RATE", ref.ok && ref.delta > 0 && ref.rolls.length === 0, `golem reference ${r2(ref.delta)}`);
  await test.idle(CLEAR);

  const ids = new Set(units.map((u) => u.a.id));
  const from = reports.length;
  const struck = strikes.length;
  const start = system.currentTick;
  const startMs = Date.now();
  let round = 0;
  let swings = 0;
  let accepted = 0;
  const own = (): PassiveReport[] => reports.slice(from).filter((r) => ids.has(r.wielderId));
  while (own().length < RATE_N && system.currentTick - start < 6000) {
    for (const u of units) {
      const k = round % 2;
      const g = u.golems[k];
      if (!g.isValid) continue;
      g.teleport(test.worldLocation(u.spots[k]));
      refill(g);
      u.a.lookAtEntity(g);
      swings++;
      if (u.a.attackEntity(g)) accepted++;
    }
    round++;
    await test.idle(10);
  }
  await test.idle(3);
  const ticks = system.currentTick - start;
  const all = own();
  const sample = all.slice(0, RATE_N);
  const procs = sample.filter((r) => r.proc).length;
  const share = procs / Math.max(1, sample.length);
  check(fails, "RATE", sample.length === RATE_N, `only ${sample.length} of ${RATE_N} rolls in ${ticks} ticks`);
  check(fails, "RATE", share >= RATE_LO && share <= RATE_HI, `share ${r4(share)} (${procs}/${sample.length}) outside [${RATE_LO}; ${RATE_HI}]`);
  log(
    `RATE ROW P6 N=${RATE_N} window=[${RATE_LO};${RATE_HI}] chance=${PASSIVE_CHANCE} procs=${procs}/${sample.length} share=${r4(share)} ` +
      `rounds=${round} swings=${swings} accepted=${accepted} rolls-total=${all.length} ticks=${ticks} ms=${Date.now() - startMs}`
  );

  // AC4 at scale: the half on cooldown procs at the same rate as the ready half.
  const coolingIds = new Set(units.filter((u) => u.cooling).map((u) => u.a.id));
  const half = (cooling: boolean): { n: number; k: number; p: number } => {
    const rs = sample.filter((r) => coolingIds.has(r.wielderId) === cooling);
    const k = rs.filter((r) => r.proc).length;
    return { n: rs.length, k, p: k / Math.max(1, rs.length) };
  };
  const hReady = half(false);
  const hCool = half(true);
  check(fails, "RATE", coolingAtStart === COLS * ROWS / 2 && hCool.n > 0, `on cooldown at start: ${coolingAtStart}, rolls on cooldown ${hCool.n}`);
  check(fails, "RATE", Math.abs(hReady.p - hCool.p) <= HALVES_MAX_GAP, `ready ${r4(hReady.p)} vs on cooldown ${r4(hCool.p)} differ by more than ${HALVES_MAX_GAP}`);
  log(`RATE ROW halves ready=${hReady.k}/${hReady.n}=${r4(hReady.p)} on-cooldown=${hCool.k}/${hCool.n}=${r4(hCool.p)} gap=${r4(Math.abs(hReady.p - hCool.p))} max=${HALVES_MAX_GAP}`);

  // AC3 at scale: no deadline moved, no ready wielder started one.
  const moved = units.filter((u) => u.a.getDynamicProperty(CD_KEY) !== u.deadline).map((u) => `${u.a.name}: ${String(u.deadline)} -> ${String(u.a.getDynamicProperty(CD_KEY))}`);
  check(fails, "RATE", moved.length === 0, `cooldown property changed: ${moved.join("; ")}`);
  log(`RATE ROW cooldown-properties-unchanged=${COLS * ROWS - moved.length}/${COLS * ROWS}`);

  // Independence on the engine: after a proc and after a miss, per wielder's own sequence.
  const after = { proc: [0, 0], miss: [0, 0] };
  for (const u of units) {
    let prev: "proc" | "miss" | undefined;
    for (const r of sample.filter((x) => x.wielderId === u.a.id)) {
      const kind = r.proc ? "proc" : "miss";
      if (prev !== undefined) {
        after[prev][1]++;
        if (r.proc) after[prev][0]++;
      }
      prev = kind;
    }
  }
  const pAfterProc = after.proc[0] / Math.max(1, after.proc[1]);
  const pAfterMiss = after.miss[0] / Math.max(1, after.miss[1]);
  check(fails, "RATE", Math.abs(pAfterProc - pAfterMiss) <= LAG1_MAX_GAP, `after a proc ${r4(pAfterProc)} vs after a miss ${r4(pAfterMiss)}`);
  log(`RATE ROW lag1 after-proc=${after.proc[0]}/${after.proc[1]}=${r4(pAfterProc)} after-miss=${after.miss[0]}/${after.miss[1]}=${r4(pAfterMiss)} max-gap=${LAG1_MAX_GAP}`);

  // AC2 at scale: every roll is one landed hit; a miss is the sword's hit, a proc the sword's hit + f(6).
  let unmatched = 0;
  let badMiss = 0;
  let badProc = 0;
  const examples: string[] = [];
  for (const r of all) {
    const hs = (hurts.get(r.targetId) ?? []).filter((h) => h.tick === r.tick);
    if (hs.length !== 1) {
      unmatched++;
      if (examples.length < 6) examples.push(`unmatched ${r.targetId}@${r.tick}: ${hs.length} hurts`);
      continue;
    }
    const want = r.proc ? ref.delta + (r.raise?.bonus ?? Number.NaN) : ref.delta;
    if (!close(hs[0].damage, want) || hs[0].by !== r.wielderId) {
      if (r.proc) badProc++;
      else badMiss++;
      if (examples.length < 6) examples.push(`${r.proc ? "proc" : "miss"} took ${r2(hs[0].damage)} want ${r2(want)} by ${hs[0].by === r.wielderId ? "wielder" : hs[0].by}`);
    }
  }
  let landed = 0;
  for (const u of units) for (const g of u.golems) landed += (hurts.get(g.id) ?? []).filter((h) => h.tick >= start).length;
  const allProcs = all.filter((r) => r.proc);
  const strikeWant = allProcs.filter((r) => r.raise?.plan === "raise" || r.raise?.plan === "lethal").length;
  const drawn = strikes.length - struck;
  check(fails, "RATE", unmatched === 0 && landed === all.length, `rolls ${all.length}, golem hurts ${landed}, rolls without exactly one hurt in their tick ${unmatched}`);
  check(fails, "RATE", badMiss === 0 && badProc === 0, `${badMiss} miss(es) not the sword's ${r2(ref.delta)}, ${badProc} proc(s) not sword + f(6): ${examples.join("; ")}`);
  check(fails, "RATE", drawn === strikeWant && strikeWant === allProcs.length, `strikes drawn ${drawn}, procs ${allProcs.length}, procs with a landing bonus ${strikeWant}`);
  log(
    `RATE ROW damage rolls=${all.length} landed=${landed} unmatched=${unmatched} bad-miss=${badMiss} bad-proc=${badProc} ` +
      `strikes=${drawn} procs=${allProcs.length} ${examples.length > 0 ? `examples: ${examples.join("; ")}` : ""}`
  );

  for (const u of units) for (const g of u.golems) if (g.isValid) g.remove();
  for (const u of units) u.a.setDynamicProperty(CD_KEY, undefined);
});
