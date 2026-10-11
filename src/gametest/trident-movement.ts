// The Above-Water Trident's movement on a real engine (L0-trdt-a003; spec §02 items 2–3): the
// sneaking-release dash against the Riptide III numbers of docs/feedback/probe-trident.md §4, in all
// three dimensions and back to back, the one-shot fall cancel, and the swim boost held in either hand.
// SimulatedPlayers regenerate, so damage is read from entityHurt, never from health.

import { BlockVolume, type Dimension, EntityDamageCause, EquipmentSlot, GameMode, ItemStack, type Vector3, WeatherType, system, world } from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { TRIDENT } from "../legendary/registry";
import { hasFallGrant, movementStats, registerTridentMovement } from "../trident/movement";
import {
  DASH_TOLERANCE,
  GRANT_TICKS,
  RIPTIDE_LANDING,
  RIPTIDE_SPEED,
  SWIM_BASE_BPS,
  SWIM_TARGET_BPS,
  USE_TICKS,
} from "../trident/movement-rules";
import type { Box } from "../structures/clear";
import { loadBox } from "./structures-place";

// The release pack's handlers receive no SimulatedPlayer (src/gametest/main.ts, "binding problem"),
// so the scenarios below drive this pack's copy of the module.
registerTridentMovement();

const STRUCTURE = "andrew:platform";
/** Yaw −90 looks along +x. */
const EAST = -90;
const SWIM_TOLERANCE = 0.15;
const BASE_TOLERANCE = 0.1;

const log = (msg: string): void => console.warn(`[gametest] trident-move ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const f3 = (n: number): string => n.toFixed(3);
const v3 = (v: Vector3): string => `${f3(v.x)},${f3(v.y)},${f3(v.z)}`;
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: Vector3, k: number): Vector3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const hlen = (v: Vector3): number => Math.hypot(v.x, v.z);
const within = (got: number, want: number, tol: number): boolean => Math.abs(got / want - 1) <= tol;

function viewOf(pitch: number, yaw: number): Vector3 {
  const p = (pitch * Math.PI) / 180;
  const y = (yaw * Math.PI) / 180;
  return { x: -Math.sin(y) * Math.cos(p), y: -Math.sin(p), z: Math.cos(y) * Math.cos(p) };
}

function fill(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  dim.fillBlocks(new BlockVolume(a, b), block);
}

/** fillBlocks refuses a volume over 32768 cells, so wide boxes go in x-slabs. */
function fillSlabs(dim: Dimension, a: Vector3, b: Vector3, block: string): void {
  const per = Math.max(1, Math.floor(32768 / ((b.y - a.y + 1) * (b.z - a.z + 1))));
  for (let x = a.x; x <= b.x; x += per) fill(dim, { x, y: a.y, z: a.z }, { x: Math.min(b.x, x + per - 1), y: b.y, z: b.z }, block);
}

/** A Survival SimulatedPlayer with 40 HP; `immune` adds Resistance V. */
async function survivor(test: Test, rel: Vector3, name: string, immune = false): Promise<SimulatedPlayer> {
  const p = test.spawnSimulatedPlayer(rel, name, GameMode.Survival);
  await test.idle(2);
  p.addEffect("health_boost", 20000, { amplifier: 4, showParticles: false });
  if (immune) p.addEffect("resistance", 20000, { amplifier: 4, showParticles: false });
  await test.idle(1);
  p.getComponent("minecraft:health")?.resetToMaxValue();
  return p;
}

function trident(): ItemStack {
  return new ItemStack(TRIDENT.itemId);
}

/**
 * A teleport's pitch does not reach a SimulatedPlayer's head; lookAtLocation (test-relative) does (probe §4).
 * An Instant look drifts back to level within ~20 ticks of a sneaking charge, so the look is Continuous, at
 * a point far enough that a 20-block dash turns the view by under a degree.
 */
async function aimAt(test: Test, ps: SimulatedPlayer[], pitch: number, yaw: number): Promise<void> {
  const want = viewOf(pitch, yaw);
  for (const p of ps) p.teleport(p.location, { rotation: { x: pitch, y: yaw } });
  await test.idle(2);
  for (const p of ps) p.lookAtLocation(add(test.relativeLocation(p.getHeadLocation()), mul(want, 1000)), LookDuration.Continuous);
  await test.idle(2);
  for (const p of ps) test.assert(len(sub(p.getViewDirection(), want)) <= 0.02, `${p.name} looks ${v3(p.getViewDirection())}, not ${v3(want)}`);
}

/** Start Use on slot 0; a use right after another is refused once (project memory), so retry once. */
async function startUse(test: Test, p: SimulatedPlayer): Promise<void> {
  if (p.useItemInSlot(0)) return;
  await test.idle(2);
  test.assert(p.useItemInSlot(0), `${p.name}: useItemInSlot refused twice`);
}

/** Hold Use for `hold` ticks and let go; the charge the module reads is exactly `hold` (probe §3). */
async function chargeRelease(test: Test, p: SimulatedPlayer, hold: number, pitch: number): Promise<number> {
  await startUse(test, p);
  await test.idle(hold);
  assertView(test, p, pitch);
  p.stopUsingItem();
  return system.currentTick;
}

function assertView(test: Test, p: SimulatedPlayer, pitch: number): void {
  const want = viewOf(pitch, EAST);
  test.assert(len(sub(p.getViewDirection(), want)) <= 0.02, `${p.name} lets go looking ${v3(p.getViewDirection())}, not ${v3(want)} — the aim drifted`);
}

/** Every itemReleaseUse this pack sees, by player id: the charge and the live sneak flag. */
function watchReleases(): { of: (id: string) => Array<{ charge: number; sneaking: boolean }>; stop: () => void } {
  const seen = new Map<string, Array<{ charge: number; sneaking: boolean }>>();
  const sub = world.afterEvents.itemReleaseUse.subscribe((e) => {
    if (e.source === undefined || e.itemStack?.typeId !== TRIDENT.itemId) return;
    const list = seen.get(e.source.id) ?? [];
    list.push({ charge: USE_TICKS - e.useDuration, sneaking: e.source.isSneaking });
    seen.set(e.source.id, list);
  });
  return { of: (id) => seen.get(id) ?? [], stop: () => world.afterEvents.itemReleaseUse.unsubscribe(sub) };
}

/** Fall hurts that got through, by player id. */
function watchFalls(): { of: (id: string) => number[]; stop: () => void } {
  const seen = new Map<string, number[]>();
  const sub = world.afterEvents.entityHurt.subscribe((e) => {
    if (e.damageSource.cause !== EntityDamageCause.fall) return;
    const list = seen.get(e.hurtEntity.id) ?? [];
    list.push(e.damage);
    seen.set(e.hurtEntity.id, list);
  });
  return { of: (id) => seen.get(id) ?? [], stop: () => world.afterEvents.entityHurt.unsubscribe(sub) };
}

interface Sample {
  pos: Vector3;
  ground: boolean;
}

/** Positions from now for `ticks` ticks, one per tick; index 0 is the moment of the call. */
async function track(test: Test, ps: SimulatedPlayer[], ticks: number): Promise<Sample[][]> {
  const out = ps.map((p) => [{ pos: { ...p.location }, ground: p.isOnGround }]);
  for (let t = 0; t < ticks; t++) {
    await test.idle(1);
    ps.forEach((p, i) => {
      if (p.isValid) out[i].push({ pos: { ...p.location }, ground: p.isOnGround });
    });
  }
  return out;
}

interface Flight {
  peak: number;
  /** Ticks to the first resting ground contact after leaving the ground, and its horizontal distance. */
  landT?: number;
  landH?: number;
  /** Largest one-tick displacement in the first three ticks. */
  burst: number;
  moved: number;
}

/** The probe §4 reading of a launch: the same landing rule as its shape(). */
function flightOf(s: Sample[]): Flight {
  const s0 = s[0].pos;
  let peak = 0;
  for (const x of s) peak = Math.max(peak, x.pos.y - s0.y);
  let burst = 0;
  for (let i = 1; i <= 3 && i < s.length; i++) burst = Math.max(burst, len(sub(s[i].pos, s[i - 1].pos)));
  let moved = 0;
  for (const x of s) moved = Math.max(moved, len(sub(x.pos, s0)));
  const firstAir = s.findIndex((x, i) => i > 0 && (x.pos.y - s0.y > 0.1 || !x.ground));
  let landT: number | undefined;
  if (firstAir > 0) {
    for (let i = firstAir + 2; i < s.length; i++) {
      if (s[i].ground && Math.abs(s[i].pos.y - s[i - 1].pos.y) < 0.001) {
        landT = i;
        break;
      }
    }
  }
  return { peak, landT, landH: landT === undefined ? undefined : hlen(sub(s[landT].pos, s0)), burst, moved };
}

const showFlight = (f: Flight): string =>
  `burst ${f3(f.burst)} b/t; peak +${f2(f.peak)}; landed ${f.landT === undefined ? "never" : `+${f.landT} t at ${f2(f.landH ?? 0)}`}; moved at most ${f3(f.moved)}`;

/** A two-layer stone floor at test-relative y=1 over a far, loaded box; the cleanup clears `height` layers up. */
async function farPad(test: Test, area: string, origin: Vector3, size: { x: number; z: number }, height: number): Promise<() => void> {
  const dim = test.getDimension();
  const box: Box = { min: [origin.x - 4, 0, origin.z - 4], max: [origin.x + size.x + 4, 0, origin.z + size.z + 4] };
  const unload = await loadBox(test, dim, area, box);
  const lo = { x: origin.x - 2, y: origin.y, z: origin.z - 2 };
  const hi = { x: origin.x + size.x + 2, y: origin.y + height, z: origin.z + size.z + 2 };
  fillSlabs(dim, { x: lo.x, y: lo.y - 1, z: lo.z }, { x: hi.x, y: lo.y, z: hi.z }, "minecraft:stone");
  return () => {
    try {
      fillSlabs(dim, { x: lo.x, y: lo.y - 1, z: lo.z }, hi, "minecraft:air");
    } catch (err) {
      log(`cleanup of ${area} threw ${String(err)}`);
    }
    unload();
  };
}

// ---------------------------------------------------------------- AC#1, AC#3: distance against Riptide III, and the short charge

const DASH_FIELD = { x: 3200, y: 1, z: 0 };

registerAsync("andrew", "trident_dash_distance", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const cleanup = await farPad(test, "andrew_gt_trdm_d", test.worldBlockLocation(DASH_FIELD), { x: 40, z: 15 }, 0);
  const rel = (x: number, y: number, z: number): Vector3 => ({ x: DASH_FIELD.x + x, y: DASH_FIELD.y + y, z: DASH_FIELD.z + z });
  const lanes: Array<{ label: string; pitch: number; hold: number; ref?: number }> = [
    { label: "pitch −30, charge 20", pitch: -30, hold: 20, ref: RIPTIDE_LANDING.get(-30) },
    { label: "pitch −45, charge 20", pitch: -45, hold: 20, ref: RIPTIDE_LANDING.get(-45) },
    { label: "pitch −30, charge 10 (the least that dashes)", pitch: -30, hold: 10, ref: RIPTIDE_LANDING.get(-30) },
    { label: "pitch −30, charge 5", pitch: -30, hold: 5 },
    { label: "pitch −30, charge 9", pitch: -30, hold: 9 },
  ];
  const players: SimulatedPlayer[] = [];
  const releases = watchReleases();
  try {
    dim.setWeather(WeatherType.Clear, 24000);
    for (let i = 0; i < lanes.length; i++) players.push(await survivor(test, rel(1, 1, 1 + i * 3), `trdm_d${i}`));
    players.forEach((p, i) => {
      p.setItem(trident(), 0, true);
      p.teleport(test.worldLocation(rel(1.5, 1, 1.5 + i * 3)));
    });
    for (const pitch of new Set(lanes.map((l) => l.pitch))) await aimAt(test, players.filter((_, i) => lanes[i].pitch === pitch), pitch, EAST);
    for (const p of players) p.isSneaking = true;
    await test.idle(2);
    // 2.10.0 has no weather getter; setWeather(Clear) above is the dry sky, isInWater the dry pad.
    const wet = players.filter((p) => p.isInWater).map((p) => p.name);
    test.assert(wet.length === 0, `not dry: in water ${wet.join(" ")}`);

    // Every lane lets go on the same tick, so one track covers them all; each starts from its own release spot.
    const longest = Math.max(...lanes.map((l) => l.hold));
    const released = await Promise.all(
      lanes.map(async (l, i) => {
        if (longest > l.hold) await test.idle(longest - l.hold);
        const tick = await chargeRelease(test, players[i], l.hold, l.pitch);
        return { tick, pos: { ...players[i].location } };
      })
    );
    const trackTick = system.currentTick;
    const tracks = await track(test, players, 90);
    released.forEach((r, i) => (tracks[i][0] = { pos: r.pos, ground: true }));
    for (const p of players) p.isSneaking = false;
    const ticks = new Set(released.map((r) => r.tick));
    test.assert(ticks.size === 1 && released[0].tick === trackTick, `the lanes let go on ticks [${[...ticks].join(" ")}], the track began on ${trackTick}`);

    lanes.forEach((l, i) => {
      const p = players[i];
      const f = flightOf(tracks[i]);
      const seen = releases.of(p.id);
      const st = movementStats(p.id);
      log(
        `RESULT dash ${l.label}: release seen [${seen.map((r) => `charge ${r.charge} sneaking ${r.sneaking}`).join("; ")}], dashes ${st.dashes}, ` +
          `${showFlight(f)}${l.ref === undefined ? "" : `; Riptide III lands at ${f2(l.ref)} (probe §4) -> ${f2((f.landH ?? 0) / l.ref)}×`}; ` +
          `fall cancelled [${st.cancelled.map(f2).join(" ")}]`
      );
      test.assert(seen.length === 1 && seen[0].charge === l.hold && seen[0].sneaking, `${l.label}: the release arrived as ${JSON.stringify(seen)}`);
      if (l.ref !== undefined) {
        test.assert(st.dashes === 1, `${l.label}: ${st.dashes} dashes`);
        test.assert(f.landH !== undefined && within(f.landH, l.ref, DASH_TOLERANCE), `${l.label}: landed at ${f.landH === undefined ? "never" : f2(f.landH)}, Riptide III ${f2(l.ref)} ±${DASH_TOLERANCE * 100} %`);
      } else {
        test.assert(st.dashes === 0, `${l.label}: ${st.dashes} dashes from a short charge`);
        test.assert(f.moved < 0.05, `${l.label}: the player moved ${f3(f.moved)} after a short charge`);
      }
    });
  } finally {
    releases.stop();
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    cleanup();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");

// ---------------------------------------------------------------- AC#2: three dimensions, and a second dash right after the first

registerAsync("andrew", "trident_dash_dimensions", async (test: Test): Promise<void> => {
  const origin = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  // The Overworld pad far from the platform; the Nether over its lava sea in a netherrack shell; the End
  // 520 out, in the void clear of the dragon's island and of the orbital End rooms at +400 and +460.
  const sites = [
    { label: "Overworld", dim: test.getDimension(), x: origin.x + 3600, floor: origin.y, shell: undefined as string | undefined },
    { label: "Nether", dim: world.getDimension("nether"), x: origin.x + 120, floor: 69, shell: "minecraft:netherrack" },
    { label: "End", dim: world.getDimension("the_end"), x: origin.x + 520, floor: 69, shell: undefined },
  ];
  const z0 = origin.z;
  // Two dashes back to back carry the player ~32 blocks before the landing.
  const SIZE = { x: 56, y: 24, z: 6 };
  const unloads: Array<() => void> = [];
  const restores: Array<() => void> = [];
  const players: SimulatedPlayer[] = [];
  const releases = watchReleases();
  try {
    test.getDimension().setWeather(WeatherType.Clear, 24000);
    for (const s of sites) {
      unloads.push(await loadBox(test, s.dim, `andrew_gt_trdm_${s.label.toLowerCase()}`, { min: [s.x - 4, 0, z0 - 4], max: [s.x + SIZE.x + 4, 0, z0 + SIZE.z + 4] }));
      const lo = { x: s.x - 2, y: s.floor - 1, z: z0 - 2 };
      const hi = { x: s.x + SIZE.x, y: s.floor + SIZE.y, z: z0 + SIZE.z };
      if (s.shell !== undefined) fillSlabs(s.dim, add(lo, { x: -1, y: -1, z: -1 }), add(hi, { x: 1, y: 1, z: 1 }), s.shell);
      fillSlabs(s.dim, lo, hi, "minecraft:air");
      fillSlabs(s.dim, lo, { x: hi.x, y: s.floor, z: hi.z }, "minecraft:stone");
      restores.push(() => fillSlabs(s.dim, lo, { x: hi.x, y: s.floor, z: hi.z }, "minecraft:air"));
    }
    for (let i = 0; i < sites.length; i++) players.push(await survivor(test, { x: 2, y: 2, z: 2 + i }, `trdm_dim${i}`));
    await Promise.all(
      sites.map(async (s, i) => {
        const p = players[i];
        p.teleport({ x: s.x + 0.5, y: s.floor + 1, z: z0 + 2.5 }, { dimension: s.dim, forceProvidedPositionOnDimensionChange: true });
        for (let t = 0; t < 200 && !(p.dimension.id === s.dim.id && Math.abs(p.location.y - (s.floor + 1)) < 0.01 && p.isOnGround); t++) await test.idle(1);
        test.assert(p.dimension.id === s.dim.id, `${p.name} did not reach the ${s.label} (in ${p.dimension.id} at ${v3(p.location)})`);
      })
    );
    for (const p of players) p.setItem(trident(), 0, true);
    await aimAt(test, players, -30, EAST);
    for (const p of players) p.isSneaking = true;
    await test.idle(2);

    await Promise.all(players.map((p) => chargeRelease(test, p, 20, -30)));
    const first = await track(test, players, 3);
    // Straight back to Use: the second release comes 10 ticks of charge later, still in the air.
    for (const p of players) await startUse(test, p);
    await test.idle(9);
    const pre = players.map((p) => ({ ...p.location }));
    await test.idle(1);
    for (const p of players) assertView(test, p, -30);
    for (const p of players) p.stopUsingItem();
    const second = await track(test, players, 70);
    for (const p of players) p.isSneaking = false;

    sites.forEach((s, i) => {
      const p = players[i];
      const a = flightOf(first[i]);
      const b = flightOf(second[i]);
      const before = len(sub(second[i][0].pos, pre[i]));
      const st = movementStats(p.id);
      const airborne = !second[i][0].ground;
      log(
        `RESULT dash in the ${s.label} (${p.dimension.id}): releases [${releases.of(p.id).map((r) => r.charge).join(" ")}], dashes ${st.dashes}; ` +
          `first: ${showFlight(a)}; one tick before the second release ${f3(before)} b/t, airborne ${airborne}; second: ${showFlight(b)}; ` +
          `fall cancelled [${st.cancelled.map(f2).join(" ")}]`
      );
      test.assert(p.dimension.id === s.dim.id, `${s.label}: the player left for ${p.dimension.id}`);
      test.assert(within(a.burst, RIPTIDE_SPEED, DASH_TOLERANCE), `${s.label}: the first dash launched at ${f3(a.burst)} b/t, Riptide III ${RIPTIDE_SPEED} ±${DASH_TOLERANCE * 100} %`);
      test.assert(st.dashes === 2, `${s.label}: ${st.dashes} dashes from two sneaking releases`);
      test.assert(b.burst >= RIPTIDE_SPEED * (1 - DASH_TOLERANCE) && b.burst > before * 1.5, `${s.label}: the second dash moved ${f3(b.burst)} b/t after ${f3(before)} — no second launch`);
    });
  } finally {
    releases.stop();
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    for (const r of restores) {
      try {
        r();
      } catch (err) {
        log(`dimension pad cleanup threw ${String(err)}`);
      }
    }
    for (const u of unloads) u();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(900)
  .tag("andrew");

// ---------------------------------------------------------------- AC#4: the first landing is free, the next one from the same height is not

const FALL_FIELD = { x: 4000, y: 1, z: 0 };

registerAsync("andrew", "trident_dash_fall_once", async (test: Test): Promise<void> => {
  const cleanup = await farPad(test, "andrew_gt_trdm_f", test.worldBlockLocation(FALL_FIELD), { x: 30, z: 6 }, 30);
  const rel = (x: number, y: number, z: number): Vector3 => ({ x: FALL_FIELD.x + x, y: FALL_FIELD.y + y, z: FALL_FIELD.z + z });
  const falls = watchFalls();
  let p: SimulatedPlayer | undefined;
  try {
    test.getDimension().setWeather(WeatherType.Clear, 24000);
    p = await survivor(test, rel(1, 1, 3), "trdm_fall");
    p.setItem(trident(), 0, true);
    p.teleport(test.worldLocation(rel(1.5, 1, 3.5)));
    await aimAt(test, [p], -30, EAST);
    p.isSneaking = true;
    await test.idle(2);
    const floorTop = p.location.y;

    const dashTick = await chargeRelease(test, p, 20, -30);
    const [dashTrack] = await track(test, [p], 80);
    p.isSneaking = false;
    const dashFlight = flightOf(dashTrack);
    const st = movementStats(p.id);
    const cancelled = [...st.cancelled];
    const dashFalls = [...falls.of(p.id)];
    const grantAfter = hasFallGrant(p.id);
    log(
      `RESULT fall dash: ${showFlight(dashFlight)}; landing fall cancelled [${cancelled.map(f2).join(" ")}], fall hurts through [${dashFalls.map(f2).join(" ")}], grant left ${grantAfter}`
    );
    test.assert(dashFlight.landT !== undefined, "the dash never landed");
    test.assert(cancelled.length === 1 && cancelled[0] >= 5, `the dash's landing was worth [${cancelled.map(f2).join(" ")}], not one fall of 5+ HP`);
    test.assert(dashFalls.length === 0, `the first landing dealt fall damage [${dashFalls.map(f2).join(" ")}]`);
    test.assert(!grantAfter, "the grant outlived the landing it cancelled");

    // The same height again, from rest over the landing spot, inside the grant's 10 s.
    const height = dashFlight.peak;
    const land = p.location;
    p.teleport({ x: land.x, y: floorTop + height, z: land.z });
    let landed: number | undefined;
    for (let t = 1; t <= 80 && landed === undefined; t++) {
      await test.idle(1);
      if (t > 3 && p.isOnGround && Math.abs(p.location.y - floorTop) < 0.01) landed = system.currentTick;
    }
    await test.idle(5);
    const second = falls.of(p.id);
    const sinceDash = (landed ?? system.currentTick) - dashTick;
    log(
      `RESULT fall again from ${f2(height)}: fall hurts [${second.map(f2).join(" ")}], expected ${f2(height - 3)} (height minus 3) and equal to the cancelled ${f2(cancelled[0])}; ` +
        `landed ${sinceDash} ticks after the dash (grant would live ${GRANT_TICKS}); cancelled now [${movementStats(p.id).cancelled.map(f2).join(" ")}]`
    );
    test.assert(landed !== undefined, "the second fall never landed");
    test.assert(sinceDash < GRANT_TICKS, `the second landing came ${sinceDash} ticks after the dash — past the grant, it proves nothing`);
    test.assert(second.length === 1, `the second fall dealt [${second.map(f2).join(" ")}], expected one fall hurt`);
    // The engine rounds the fall to whole points, and a launched body's fall reads a little shorter than a
    // dropped one's from the same peak (cancelled 9.00 vs 10.00 from 12.14 measured here), so "the same" is ±1.
    test.assert(Math.abs(second[0] - (height - 3)) < 1, `the second fall dealt ${f2(second[0])}, not height ${f2(height)} minus 3`);
    test.assert(Math.abs(second[0] - cancelled[0]) <= 1, `the second fall dealt ${f2(second[0])}, the cancelled one was worth ${f2(cancelled[0])}`);
    test.assert(movementStats(p.id).cancelled.length === 1, "a second landing was cancelled");
  } finally {
    falls.stop();
    if (p?.isValid === true) test.removeSimulatedPlayer(p);
    cleanup();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// ---------------------------------------------------------------- AC#5, AC#6: swim boost in either hand, nobody else, gone on a switch

const SWIM_FIELD = { x: 4400, y: 1, z: 0 };
const SWIM_LEN = 60;
const SWITCH_AT = 60;

registerAsync("andrew", "trident_swim_boost", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const cleanup = await farPad(test, "andrew_gt_trdm_s", test.worldBlockLocation(SWIM_FIELD), { x: SWIM_LEN, z: 16 }, 3);
  const at = (x: number, y: number, z: number): Vector3 => test.worldBlockLocation({ x: SWIM_FIELD.x + x, y: SWIM_FIELD.y + y, z: SWIM_FIELD.z + z });
  type Hold = "main" | "off" | "inventory" | "none" | "switch";
  // Channels: z 0–2 holds the main-hand swimmer and the bystander side by side in one water; the rest are one wide.
  const lanes: Array<{ label: string; z: number; hold: Hold; want: number; tol: number }> = [
    { label: "trident in the main hand", z: 0, hold: "main", want: SWIM_TARGET_BPS, tol: SWIM_TOLERANCE },
    { label: "no trident, two blocks beside the main-hand swimmer", z: 2, hold: "none", want: SWIM_BASE_BPS, tol: BASE_TOLERANCE },
    { label: "trident in the off hand", z: 5, hold: "off", want: SWIM_TARGET_BPS, tol: SWIM_TOLERANCE },
    { label: "trident in the inventory, hands empty", z: 8, hold: "inventory", want: SWIM_BASE_BPS, tol: BASE_TOLERANCE },
    { label: `trident in the main hand, switched away at +${SWITCH_AT}`, z: 11, hold: "switch", want: SWIM_BASE_BPS, tol: BASE_TOLERANCE },
  ];
  const channels: Array<[number, number]> = [
    [0, 2],
    [5, 5],
    [8, 8],
    [11, 11],
  ];
  const players: SimulatedPlayer[] = [];
  try {
    fill(dim, at(-1, 1, -1), at(SWIM_LEN, 3, 12), "minecraft:stone");
    for (const [a, b] of channels) {
      fill(dim, at(0, 1, a), at(SWIM_LEN - 1, 2, b), "minecraft:water");
      fill(dim, at(0, 3, a), at(SWIM_LEN - 1, 3, b), "minecraft:air");
    }
    await test.idle(5);
    for (const l of lanes) players.push(await survivor(test, { x: SWIM_FIELD.x + 1, y: SWIM_FIELD.y + 1, z: SWIM_FIELD.z + l.z }, `trdm_swim${players.length}`, true));
    lanes.forEach((l, i) => {
      const p = players[i];
      p.teleport(test.worldLocation({ x: SWIM_FIELD.x + 1.5, y: SWIM_FIELD.y + 1, z: SWIM_FIELD.z + l.z + 0.5 }), { rotation: { x: 0, y: EAST } });
      p.setRotation({ x: 0, y: EAST });
      const equippable = p.getComponent("minecraft:equippable");
      if (l.hold === "main" || l.hold === "switch") p.setItem(trident(), 0, true);
      if (l.hold === "off") test.assert(equippable?.setEquipment(EquipmentSlot.Offhand, trident()) === true, "the off hand refused the trident");
      if (l.hold === "inventory") {
        p.setItem(trident(), 5, false);
        p.selectedSlotIndex = 0;
      }
    });
    await test.idle(10);
    for (const p of players) {
      p.swim();
      p.isSprinting = true;
      p.moveRelative(0, 1, 1);
    }
    const t0 = system.currentTick;
    const samples: Sample[][] = players.map((p) => [{ pos: { ...p.location }, ground: p.isOnGround }]);
    const kicksAt: number[][] = players.map(() => []);
    let switchTick = -1;
    for (let t = 1; t <= 150; t++) {
      if (t === SWITCH_AT) {
        players[4].selectedSlotIndex = 1;
        switchTick = system.currentTick;
      }
      await test.idle(1);
      players.forEach((p, i) => {
        samples[i].push({ pos: { ...p.location }, ground: p.isOnGround });
        kicksAt[i].push(movementStats(p.id).kicks);
      });
    }
    const flags = players.map((p) => `swimming ${p.isSwimming} sprinting ${p.isSprinting} inWater ${p.isInWater} view ${v3(p.getViewDirection())}`);

    /** Steady speed in b/s over ticks [from, to], cut where the lane ends. */
    const speed = (i: number, from: number, to: number): number => {
      const s = samples[i];
      const end = s.findIndex((q) => q.pos.x - s[0].pos.x > SWIM_LEN - 6);
      const last = Math.min(to, end > 0 ? end : s.length - 1);
      return last > from ? ((s[last].pos.x - s[from].pos.x) / (last - from)) * 20 : Number.NaN;
    };
    const lastKick = (i: number): number => movementStats(players[i].id).lastKickTick;

    lanes.forEach((l, i) => {
      const p = players[i];
      const st = movementStats(p.id);
      const v = l.hold === "switch" ? speed(i, SWITCH_AT + 20, 150) : speed(i, 20, 150);
      const extra =
        l.hold === "switch"
          ? `; held ${f2(speed(i, 20, SWITCH_AT))} b/s, last kick +${lastKick(i) - switchTick} ticks after the switch`
          : "";
      log(
        `RESULT swim ${l.label}: ${f2(v)} b/s against ${f2(l.want)} ±${l.tol * 100} % (probe §6); kicks ${st.kicks}${extra}; at the end ${flags[i]}`
      );
      test.assert(Number.isFinite(v) && within(v, l.want, l.tol), `${l.label}: ${f2(v)} b/s, expected ${f2(l.want)} ±${l.tol * 100} %`);
      if (l.hold === "none" || l.hold === "inventory") test.assert(st.kicks === 0, `${l.label}: kicked ${st.kicks} times`);
    });
    const held = speed(4, 20, SWITCH_AT);
    test.assert(within(held, SWIM_TARGET_BPS, SWIM_TOLERANCE), `switch lane: ${f2(held)} b/s while holding, expected ${f2(SWIM_TARGET_BPS)} ±15 %`);
    test.assert(lastKick(4) - switchTick <= 2, `switch lane: kicked ${lastKick(4) - switchTick} ticks after the switch`);
    test.assert(t0 < switchTick, "the switch never happened");
  } finally {
    for (const p of players) if (p.isValid) test.removeSimulatedPlayer(p);
    try {
      for (const [a, b] of channels) fill(dim, at(0, 1, a), at(SWIM_LEN - 1, 2, b), "minecraft:air");
    } catch (err) {
      log(`swim cleanup threw ${String(err)}`);
    }
    cleanup();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(800)
  .tag("andrew");
