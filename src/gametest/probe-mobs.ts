// stage4-probe, strf-p006 questions 3 and 6 against BDS 1.26.51.1: does a
// template shrieker with can_summon=true summon a Warden, does infinite
// fire_resistance stop sun damage, and does a cured zombie villager keep its
// name and effect.
//
// Same contract as probe-place.ts: a test passes when its measurement
// completed; the engine's answer is the "[probe] Qn RESULT …" line. Q5 and the
// restart half of Q6 need two server runs over one saved world, so they live in
// the selftest lane of bds:check (src/selftest/mob-probe.ts).

import { BlockVolume, Difficulty, Dimension, Entity, GameMode, ItemStack, Vector3, WeatherType, world } from "@minecraft/server";
import { type SimulatedPlayer, Test, registerAsync } from "@minecraft/server-gametest";
import { effectText, grantInfiniteFireResistance, stripHelmet } from "../selftest/mob-probe";

const STRUCTURE = "andrew:platform";
const STAND: Vector3 = { x: 3, y: 2, z: 5 };

const PROBE_BOX_ID = "andrew:probe_box";
const BOX_SIZE: Vector3 = { x: 9, y: 5, z: 7 };
/** Test-relative min corner of the probe box, beside the platform (as Q1 places it). */
const BOX_AT: Vector3 = { x: 9, y: 1, z: 0 };
/** Template-local cells. Must match src/structures/templates/probe_box.json. */
const BOX_SPAWNER: Vector3 = { x: 4, y: 1, z: 3 };
const BOX_SHRIEKER: Vector3 = { x: 4, y: 1, z: 5 };

const ZOMBIE_VILLAGER = "minecraft:zombie_villager_v2";
// The platform's stone is at test-relative y=1: a mob spawned there suffocates.
const MOB_WEST: Vector3 = { x: 1, y: 2, z: 1 };
const MOB_EAST: Vector3 = { x: 5, y: 2, z: 1 };
const MOB_CURE: Vector3 = { x: 3, y: 2, z: 3 };

const NOON = 6000;
const MIDNIGHT = 18000;

const log = (msg: string): void => console.warn(`[probe] ${msg}`);
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err));

const health = (e: Entity): number => (e.isValid ? (e.getComponent("minecraft:health")?.currentValue ?? -1) : -1);
const onFire = (e: Entity): boolean => e.isValid && e.getComponent("minecraft:onfire") !== undefined;

/**
 * Peaceful (the server default) removes hostile mobs — zombie villagers and the
 * Warden included — so each test raises the world to Easy and puts back what it
 * found.
 */
function worldSnapshot(): () => void {
  const difficulty = world.getDifficulty();
  const mobSpawning = world.gameRules.doMobSpawning;
  const daylight = world.gameRules.doDayLightCycle;
  const time = world.getTimeOfDay();
  return () => {
    world.setDifficulty(difficulty);
    world.gameRules.doMobSpawning = mobSpawning;
    world.gameRules.doDayLightCycle = daylight;
    world.setTimeOfDay(time);
  };
}

function removeAll(dim: Dimension, around: Vector3, radius: number, typeIds: string[]): number {
  let removed = 0;
  for (const e of dim.getEntities({ location: around, maxDistance: radius })) {
    if (typeIds.includes(e.typeId)) {
      e.remove();
      removed++;
    }
  }
  return removed;
}

// ------------------------------------------------ Q3: template shrieker summons a Warden

/** A player's shriek cooldown is 10 s; five cycles cover the four warnings with slack. */
const Q3_STAGE_TICKS = 1300;
const Q3_WARDEN_GRACE_TICKS = 300;

registerAsync("andrew", "probe_shrieker_summons_warden", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  const boxAt = test.worldBlockLocation(BOX_AT);
  const shriekerAt = add(boxAt, BOX_SHRIEKER);
  const center = add(shriekerAt, { x: 0.5, y: 0.5, z: 0.5 });

  try {
    world.structureManager.place(PROBE_BOX_ID, dim, boxAt, { includeEntities: false });
    // The spawner's zombies would attack the player and muddy "which mob appeared".
    dim.setBlockType(add(boxAt, BOX_SPAWNER), "minecraft:stone_bricks");
    const placed = dim.getBlock(shriekerAt)?.permutation;
    log(
      `Q3 placed shrieker @${fmt(shriekerAt)}: ${placed?.type.id ?? "unloaded"} ` +
        `states=${JSON.stringify(placed?.getAllStates() ?? {})}`
    );
    if (placed?.type.id !== "minecraft:sculk_shrieker") throw new Error(`shrieker cell is ${placed?.type.id}`);

    world.setDifficulty(Difficulty.Easy);
    world.gameRules.doDayLightCycle = false;
    world.setTimeOfDay(NOON);

    // Walk back and forth over the shrieker: stepping on it is the vanilla
    // player-attributed trigger. Test-relative x 12 and 14 flank the shrieker (13).
    const west: Vector3 = { x: 12.5, y: 2, z: 5.5 };
    const east: Vector3 = { x: 14.5, y: 2, z: 5.5 };
    const player = test.spawnSimulatedPlayer({ x: 12, y: 2, z: 5 }, "andrew_probe_q3", GameMode.Survival);

    let shrieks = 0;
    let wasActive = false;
    const shriekTicks: number[] = [];
    let darknessSeen = 0;
    let warden: Entity | undefined;
    let wardenTick = -1;
    let elapsed = 0;
    let lastShriekTick = -1;

    const runStage = async (label: string, ticks: number, stimulus: (t: number) => void): Promise<void> => {
      for (let t = 0; t < ticks && warden === undefined; t++, elapsed++) {
        stimulus(t);
        const active = dim.getBlock(shriekerAt)?.permutation.getState("active") === true;
        if (active && !wasActive) {
          shrieks++;
          lastShriekTick = elapsed;
          shriekTicks.push(elapsed);
          const darkness = player.isValid ? player.getEffect("darkness") : undefined;
          if (darkness !== undefined) darknessSeen++;
          log(`Q3 ${label}: shriek #${shrieks} at tick ${elapsed}; player darkness=${effectText(darkness)} @${fmt(player.location)}`);
        }
        wasActive = active;
        const found = dim.getEntities({ type: "minecraft:warden", location: center, maxDistance: 40 });
        if (found.length > 0) {
          warden = found[0];
          wardenTick = elapsed;
          log(`Q3 ${label}: Warden ${warden.id} at tick ${elapsed} @${fmt(warden.location)}, ${elapsed - lastShriekTick} tick(s) after shriek #${shrieks}`);
        }
        if (shrieks >= 4 && lastShriekTick >= 0 && elapsed - lastShriekTick > Q3_WARDEN_GRACE_TICKS) break;
        await test.idle(1);
      }
    };

    const walk = (t: number): void => {
      if (!player.isValid) return;
      if (t % 40 === 0) player.moveToLocation(east);
      else if (t % 40 === 20) player.moveToLocation(west);
      else if (t % 40 === 10) player.jump();
    };

    log(`Q3 stage A: difficulty=${world.getDifficulty()} doMobSpawning=${world.gameRules.doMobSpawning}; player walks over the shrieker`);
    await runStage("A", Q3_STAGE_TICKS, walk);

    let stages = "A (doMobSpawning as the GameTest world has it)";
    if (warden === undefined && shrieks >= 4 && !world.gameRules.doMobSpawning) {
      // A real world has doMobSpawning=true; the GameTest world does not.
      world.gameRules.doMobSpawning = true;
      log(`Q3 stage B: no Warden after ${shrieks} shriek(s) with doMobSpawning=false — retrying with doMobSpawning=true`);
      stages += ", B (doMobSpawning=true)";
      shrieks = 0;
      lastShriekTick = -1;
      await runStage("B", Q3_STAGE_TICKS, walk);
    }

    if (warden === undefined && shriekTicks.length === 0) {
      // Stepping never triggered it: fall back to a sensor-relayed vibration.
      const sensorAt = add(boxAt, { x: 6, y: 1, z: 3 });
      dim.setBlockType(sensorAt, "minecraft:sculk_sensor");
      world.gameRules.doMobSpawning = true;
      log(`Q3 stage C: stepping produced no shriek; sculk_sensor @${fmt(sensorAt)}, player jumps beside it`);
      stages += ", C (sculk_sensor relay)";
      await runStage("C", Q3_STAGE_TICKS, (t) => {
        if (player.isValid && t % 20 === 0) player.jump();
      });
    }

    const verdict =
      warden !== undefined
        ? `PASS — a Warden appeared ${wardenTick} tick(s) in, after ${shriekTicks.length} shriek(s)`
        : shriekTicks.length === 0
          ? "FAIL — the template shrieker never shrieked, so can_summon was not exercised"
          : `FAIL — ${shriekTicks.length} shriek(s), no Warden within ${Q3_WARDEN_GRACE_TICKS} ticks of the last one`;
    log(
      `Q3 RESULT ${verdict}; stages ${stages}; shriek ticks=[${shriekTicks.join(" ")}]; ` +
        `darkness on the player at ${darknessSeen} shriek(s) (darkness = the shriek counted as a warning); ` +
        `can_summon after the run=${String(dim.getBlock(shriekerAt)?.permutation.getState("can_summon"))}`
    );
    test.succeed();
  } finally {
    restore();
    removeAll(dim, center, 48, ["minecraft:warden", "minecraft:zombie"]);
    dim.fillBlocks(new BlockVolume(boxAt, add(boxAt, { x: BOX_SIZE.x - 1, y: BOX_SIZE.y - 1, z: BOX_SIZE.z - 1 })), "minecraft:air");
  }
})
  .structureName(STRUCTURE)
  .maxTicks(3 * Q3_STAGE_TICKS + 400)
  .tag("andrew");

// ------------------------------------------------ Q6a: fire_resistance at noon

const Q6_SUN_TICKS = 300;

registerAsync("andrew", "probe_fire_resistance_noon", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  const spawned: Entity[] = [];
  try {
    world.setDifficulty(Difficulty.Easy);
    world.gameRules.doDayLightCycle = false;
    world.setTimeOfDay(NOON);
    dim.setWeather(WeatherType.Clear, 24000);
    // Creative: hostile mobs ignore it, so the zombie villagers stay in the open.
    test.spawnSimulatedPlayer({ x: 6, y: 2, z: 6 }, "andrew_probe_q6_sun", GameMode.Creative);

    const guarded = test.spawn(ZOMBIE_VILLAGER, MOB_WEST);
    const control = test.spawn(ZOMBIE_VILLAGER, MOB_EAST);
    spawned.push(guarded, control);
    for (const e of spawned) {
      // A helmet stops sun damage on its own and zombies may spawn with one.
      stripHelmet(e);
      e.addEffect("slowness", Q6_SUN_TICKS + 200, { amplifier: 255, showParticles: false });
    }
    const granted = grantInfiniteFireResistance(guarded);
    log(`Q6 sun: guarded ${guarded.id} ${granted}; control ${control.id} none`);
    const head = add(guarded.location, { x: 0, y: 1, z: 0 });
    log(`Q6 sun: sky light at the guarded mob's head=${dim.getSkyLightLevel(head)}, time=${world.getTimeOfDay()}`);
    await test.idle(2);

    const start = { guarded: health(guarded), control: health(control) };
    let guardedFireTicks = 0;
    let controlFireTicks = 0;
    let controlDiedAt = -1;
    for (let t = 0; t < Q6_SUN_TICKS; t++) {
      if (onFire(guarded)) guardedFireTicks++;
      if (onFire(control)) controlFireTicks++;
      if (controlDiedAt < 0 && !control.isValid) controlDiedAt = t;
      await test.idle(1);
    }
    const end = { guarded: health(guarded), control: health(control) };
    const fr = guarded.isValid ? guarded.getEffect("fire_resistance") : undefined;
    log(
      `Q6 sun: guarded hp ${start.guarded}->${end.guarded}, onfire ${guardedFireTicks}/${Q6_SUN_TICKS} ticks, fire_resistance=${effectText(fr)}; ` +
        `control hp ${start.control}->${end.control}${controlDiedAt >= 0 ? ` (died at tick ${controlDiedAt})` : ""}, onfire ${controlFireTicks}/${Q6_SUN_TICKS} ticks`
    );

    const controlBurned = controlFireTicks > 0 && (controlDiedAt >= 0 || end.control < start.control);
    const saved = guarded.isValid && end.guarded >= start.guarded;
    const verdict = !controlBurned
      ? "INCONCLUSIVE — the control did not burn, so the sun was not reaching them"
      : saved
        ? "PASS — infinite fire_resistance kept the guarded zombie villager at full health at noon"
        : `FAIL — the guarded zombie villager lost health (${start.guarded}->${end.guarded})`;
    log(
      `Q6 RESULT sun: ${verdict}; visible fire on the guarded mob: ${
        guardedFireTicks > 0 ? `YES, minecraft:onfire present ${guardedFireTicks}/${Q6_SUN_TICKS} ticks` : "NO, minecraft:onfire never present"
      } (server-side flag; what the client draws is confirmed on the iPad)`
    );
    test.succeed();
  } finally {
    restore();
    for (const e of spawned) if (e.isValid) e.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(Q6_SUN_TICKS + 200)
  .tag("andrew");

// ------------------------------------------------ Q6b: a cured villager keeps name and effect

/** Vanilla conversion takes 2-5 minutes; 6000 ticks is the upper bound plus slack. */
const Q6_CURE_WAIT_TICKS = 6600;
const CURE_NAME = "Мельник Q6";
const CURE_TAG = "andrew_probe_q6_cure";

registerAsync("andrew", "probe_cured_villager_keeps_name", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const restore = worldSnapshot();
  let zombie: Entity | undefined;
  let villager: Entity | undefined;
  try {
    world.setDifficulty(Difficulty.Easy);
    world.gameRules.doDayLightCycle = false;
    // Night: the cure must not depend on fire_resistance holding in the sun.
    world.setTimeOfDay(MIDNIGHT);

    const player: SimulatedPlayer = test.spawnSimulatedPlayer(STAND, "andrew_probe_q6_cure", GameMode.Survival);
    zombie = test.spawn(ZOMBIE_VILLAGER, MOB_CURE);
    zombie.nameTag = CURE_NAME;
    zombie.addTag(CURE_TAG);
    stripHelmet(zombie);
    zombie.addEffect("slowness", Q6_CURE_WAIT_TICKS, { amplifier: 255, showParticles: false });
    log(`Q6 cure: zombie villager ${zombie.id} ${grantInfiniteFireResistance(zombie)}`);
    // Weakness also takes the zombie's melee to zero, so the player survives the wait.
    zombie.addEffect("weakness", 1200, { amplifier: 0 });
    await test.idle(5);

    const apples = (): number => {
      const c = player.getComponent("minecraft:inventory")?.container;
      let n = 0;
      if (c) for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === "minecraft:golden_apple") n += c.getItem(i)?.amount ?? 0;
      return n;
    };
    player.setItem(new ItemStack("minecraft:golden_apple", 4), 0, true);
    player.lookAtEntity(zombie);
    let interacted = false;
    let tries = 0;
    for (; tries < 10 && !interacted; tries++) {
      try {
        const before = apples();
        player.interactWithEntity(zombie);
        await test.idle(2);
        interacted = apples() < before;
      } catch (err) {
        log(`Q6 cure: interactWithEntity threw ${errText(err)}`);
        await test.idle(5);
      }
    }
    log(`Q6 cure: golden apple ${interacted ? `consumed on try ${tries}` : "NOT consumed in 10 tries"}; zombie effects: weakness=${effectText(zombie.isValid ? zombie.getEffect("weakness") : undefined)}`);

    const zombieAt = zombie.location;
    let waited = 0;
    for (; waited < Q6_CURE_WAIT_TICKS; waited += 20) {
      if (!zombie.isValid) {
        villager = dim
          .getEntities({ location: zombieAt, maxDistance: 6 })
          .find((e) => e.typeId.includes("villager") && !e.typeId.includes("zombie"));
        if (villager !== undefined) break;
      }
      await test.idle(20);
    }

    let verdict: string;
    if (villager === undefined) {
      verdict = `FAIL — no villager replaced the zombie villager within ${waited} ticks (zombie still ${zombie.isValid ? "present" : "gone"})`;
    } else {
      const fr = villager.getEffect("fire_resistance");
      const keptName = villager.nameTag === CURE_NAME;
      const keptEffect = fr !== undefined;
      log(
        `Q6 cure: ${villager.typeId} ${villager.id} after ${waited} tick(s): nameTag=${JSON.stringify(villager.nameTag)} ` +
          `tags=[${villager.getTags().join(" ")}] fire_resistance=${effectText(fr)}`
      );
      verdict =
        `${keptName && keptEffect ? "PASS" : "FAIL"} — cured in ~${waited} ticks; name ${keptName ? "KEPT" : `LOST (${JSON.stringify(villager.nameTag)})`}, ` +
        `fire_resistance ${keptEffect ? `KEPT (${effectText(fr)})` : "LOST"}, tag ${villager.hasTag(CURE_TAG) ? "KEPT" : "LOST"}` +
        (keptEffect && villager.hasTag(CURE_TAG)
          ? ""
          : "; fallback: on entitySpawn of a villager whose nameTag is a known guard name, re-run `effect … infinite` and re-add the tag");
    }
    log(`Q6 RESULT cure: ${verdict}`);
    test.succeed();
  } finally {
    restore();
    if (zombie?.isValid) zombie.remove();
    if (villager?.isValid) villager.remove();
  }
})
  .structureName(STRUCTURE)
  .maxTicks(Q6_CURE_WAIT_TICKS + 600)
  .tag("andrew");

// A mob that vanishes mid-measurement is only explicable with its cause of death.
world.afterEvents.entityDie.subscribe((ev) => {
  if (ev.deadEntity.typeId === ZOMBIE_VILLAGER) log(`Q6 death: ${ev.deadEntity.id} cause=${ev.damageSource.cause}`);
});

export const PROBE_MOBS_TESTS = [
  "probe_shrieker_summons_warden",
  "probe_fire_resistance_noon",
  "probe_cured_villager_keeps_name",
];

log(`registered ${PROBE_MOBS_TESTS.length} probe test(s): ${PROBE_MOBS_TESTS.join(" ")}`);
