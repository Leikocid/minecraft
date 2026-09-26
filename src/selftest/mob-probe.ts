// stage4-probe, strf-p006 question 5 and the restart half of question 6, on
// the stable @minecraft/server 2.10.0 surface only.
//
// It spans two server runs over one saved world, driven by bds:check:
//   run 1 (no marker in the world): force-load a far chunk with /tickingarea,
//     build two open pens, spawn 10 zombie villagers with nameTag + tag and 10
//     control ones with the tag only, give all 20 infinite fire_resistance,
//     remove the area and wait for the chunk to unload. The marker is saved.
//   run 2 (marker present): re-add the area, count who is still there, read
//     names and the effect, clear the marker.
// The GameTest lane imports the effect helpers from here.

import { Difficulty, Dimension, Effect, Entity, Vector3, world } from "@minecraft/server";
import { type Log, type Wait, errText } from "./chunk-probe";

/** 2.10.0 caps addEffect's duration, so "infinite" only exists as a command. */
export function grantInfiniteFireResistance(e: Entity): string {
  try {
    const r = e.runCommand("effect @s fire_resistance infinite 0 true");
    return `effect … infinite -> successCount=${r.successCount}, now ${effectText(e.getEffect("fire_resistance"))}`;
  } catch (err) {
    return `effect … infinite threw ${errText(err)}`;
  }
}

export function stripHelmet(e: Entity): void {
  try {
    e.runCommand("replaceitem entity @s slot.armor.head 0 air");
  } catch {
    // No head slot to clear is the outcome we want anyway.
  }
}

export const effectText = (fx: Effect | undefined): string =>
  fx === undefined ? "none" : `${fx.typeId} amp=${fx.amplifier} duration=${fx.duration}`;

const MARKER = "andrew:probe_q5";
const AREA = "andrew_probe_q5";
export const Q5_TAG = "andrew_probe_q5";
const CONTROL_TAG = "andrew_probe_q5_control";
const ZOMBIE_VILLAGER = "minecraft:zombie_villager_v2";
const COUNT = 10;
/** Pens float in the air so terrain and water never decide the result. */
const PEN_Y = 200;

interface Marker {
  center: Vector3;
  names: string[];
}

const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

/**
 * The server starts every run in peaceful (compose.yaml), which deletes hostile
 * mobs as soon as their chunk ticks. Raised before the chunk is loaded, so a
 * missing zombie villager is persistence, not the difficulty.
 */
function allowHostiles(log: Log): void {
  const before = world.getDifficulty();
  world.setDifficulty(Difficulty.Easy);
  log(`Q5 difficulty ${before} -> ${world.getDifficulty()}`);
}

function readMarker(): Marker | undefined {
  const raw = world.getDynamicProperty(MARKER);
  return typeof raw === "string" ? (JSON.parse(raw) as Marker) : undefined;
}

export const mobProbePhase = (): 1 | 2 => (readMarker() === undefined ? 1 : 2);

async function forceLoad(dim: Dimension, center: Vector3, wait: Wait, log: Log): Promise<number> {
  const r = dim.runCommand(`tickingarea add circle ${center.x} ${center.y} ${center.z} 2 ${AREA}`);
  log(`Q5 tickingarea add ${AREA} @${fmt(center)} -> successCount=${r.successCount}`);
  for (let t = 0; t <= 600; t++) {
    if (dim.isChunkLoaded(center) && dim.getBlock(center) !== undefined) return t;
    await wait(1);
  }
  throw new Error(`the Q5 chunk @${fmt(center)} did not load within 600 ticks`);
}

function pen(dim: Dimension, floor: Vector3): void {
  for (let x = -3; x <= 3; x++)
    for (let z = -3; z <= 3; z++) {
      dim.setBlockType({ x: floor.x + x, y: floor.y, z: floor.z + z }, "minecraft:stone");
      if (Math.abs(x) === 3 || Math.abs(z) === 3)
        for (let y = 1; y <= 3; y++) dim.setBlockType({ x: floor.x + x, y: floor.y + y, z: floor.z + z }, "minecraft:glass");
    }
}

/** Run 1: spawn, unload, save the marker. */
export async function mobProbeSpawn(dim: Dimension, origin: Vector3, wait: Wait, log: Log): Promise<void> {
  // 50 chunks out: far beyond anything a player-less spawn keeps loaded.
  const cx = Math.floor((origin.x + 800) / 16) * 16 + 8;
  const center = { x: cx, y: PEN_Y, z: Math.floor(origin.z / 16) * 16 + 8 };
  allowHostiles(log);
  const loadedBefore = dim.isChunkLoaded(center);
  const ticks = await forceLoad(dim, center, wait, log);
  log(`Q5 run 1: chunk loaded before=${loadedBefore}, after add in ${ticks} tick(s); difficulty=${world.getDifficulty()}`);

  const namedFloor = { x: center.x - 4, y: PEN_Y, z: center.z };
  const controlFloor = { x: center.x + 4, y: PEN_Y, z: center.z };
  pen(dim, namedFloor);
  pen(dim, controlFloor);

  const names: string[] = [];
  const fr: string[] = [];
  for (let i = 0; i < COUNT; i++) {
    const at = (floor: Vector3) => ({ x: floor.x - 1.5 + (i % 4), y: PEN_Y + 1, z: floor.z - 1.5 + Math.floor(i / 4) });
    const named = dim.spawnEntity(ZOMBIE_VILLAGER, at(namedFloor));
    const name = `Страж поля ${i + 1}`;
    named.nameTag = name;
    named.addTag(Q5_TAG);
    names.push(name);
    const control = dim.spawnEntity(ZOMBIE_VILLAGER, at(controlFloor));
    control.addTag(CONTROL_TAG);
    for (const e of [named, control]) {
      stripHelmet(e);
      fr.push(grantInfiniteFireResistance(e));
    }
  }
  log(`Q5 run 1: fire_resistance grant, first of ${fr.length}: ${fr[0]}; failures=${fr.filter((s) => s.includes("threw") || s.includes("none")).length}`);

  await wait(100);
  const named = dim.getEntities({ tags: [Q5_TAG] }).length;
  const control = dim.getEntities({ tags: [CONTROL_TAG] }).length;
  log(`Q5 run 1: after 100 ticks loaded: named=${named}/${COUNT} control=${control}/${COUNT}`);
  if (named < COUNT) throw new Error(`only ${named} of ${COUNT} named zombie villagers exist before the unload — nothing to measure`);

  world.setDynamicProperty(MARKER, JSON.stringify({ center, names } satisfies Marker));
  const removed = dim.runCommand(`tickingarea remove ${AREA}`).successCount;
  let unloadTicks = -1;
  for (let t = 0; t <= 600; t++) {
    if (!dim.isChunkLoaded(center)) {
      unloadTicks = t;
      break;
    }
    await wait(1);
  }
  // The chunk reports unloaded before its entities leave getEntities.
  let visible = dim.getEntities({ tags: [Q5_TAG] }).length;
  let goneTicks = -1;
  for (let t = 0; t <= 600; t += 5) {
    visible = dim.getEntities({ tags: [Q5_TAG] }).length;
    if (visible === 0) {
      goneTicks = t;
      break;
    }
    await wait(5);
  }
  log(
    `Q5 run 1: tickingarea remove -> successCount=${removed}; chunk ${unloadTicks < 0 ? "STILL loaded after 600 ticks" : `unloaded after ${unloadTicks} tick(s)`}; ` +
      `named entities ${goneTicks < 0 ? `STILL visible (${visible}) 600 ticks later` : `left getEntities ${goneTicks} tick(s) after that`}; marker saved — restart next`
  );
}

/** Run 2: reload the chunk, count, read names and the effect. */
export async function mobProbeCount(dim: Dimension, wait: Wait, log: Log): Promise<void> {
  const marker = readMarker();
  if (marker === undefined) throw new Error(`${MARKER} is absent — run 1 never saved it`);
  world.setDynamicProperty(MARKER, undefined);
  const { center } = marker;

  allowHostiles(log);
  const loadedBefore = dim.isChunkLoaded(center);
  const visibleBefore = dim.getEntities({ tags: [Q5_TAG] }).length;
  const ticks = await forceLoad(dim, center, wait, log);

  // Entities arrive after their chunk; wait until the count stops moving.
  let named: Entity[] = [];
  let control: Entity[] = [];
  let stable = 0;
  let waited = 0;
  for (; waited < 400 && stable < 40; waited += 5) {
    const n = dim.getEntities({ tags: [Q5_TAG] });
    const c = dim.getEntities({ tags: [CONTROL_TAG] });
    stable = n.length === named.length && c.length === control.length && n.length > 0 ? stable + 5 : 0;
    named = n;
    control = c;
    await wait(5);
  }

  const kept = named.filter((e) => marker.names.includes(e.nameTag)).length;
  const effects = [...named, ...control].map((e) => e.getEffect("fire_resistance"));
  const withFr = effects.filter((fx) => fx !== undefined).length;
  const sample = effects.find((fx) => fx !== undefined);
  // Effect handles die with their entity, so read them before the cleanup.
  const sampleText = sample === undefined ? "" : ` (${effectText(sample)})`;
  const positions = named.map((e) => fmt({ x: Math.round(e.location.x), y: Math.round(e.location.y), z: Math.round(e.location.z) }));
  try {
    dim.runCommand(`tickingarea remove ${AREA}`);
  } catch (err) {
    log(`Q5 cleanup: tickingarea remove threw ${errText(err)}`);
  }
  for (const e of [...named, ...control]) e.remove();

  log(
    `Q5 run 2: chunk loaded before re-add=${loadedBefore} (named visible before=${visibleBefore}); loaded in ${ticks} tick(s); ` +
      `entities settled after ${waited} tick(s); named=${named.length}/${COUNT} (names intact ${kept}); control=${control.length}/${COUNT}; ` +
      `positions=[${positions.join(" ")}]`
  );
  const q5 =
    named.length === COUNT && kept === COUNT
      ? `PASS — ${COUNT}/${COUNT} named zombie villagers survived unload + restart with their names`
      : `FAIL — ${named.length}/${COUNT} survived (${kept} with names); fallback: keep a roster of guard ids in a world ` +
        "dynamic property and respawn the missing ones when the structure chunk loads";
  const controlNote =
    control.length === COUNT
      ? "nothing despawns with no player online, so this proves persistence across unload + restart, not nameTag vs distance despawn"
      : "the nameTag is what kept the named ones";
  log(`Q5 RESULT ${q5}; control (tag, no nameTag) ${control.length}/${COUNT} — ${controlNote}`);
  log(
    `Q6 RESULT restart: fire_resistance present on ${withFr}/${named.length + control.length} after unload + restart` +
      `${sampleText} — ${withFr === named.length + control.length && withFr > 0 ? "PASS, the infinite effect persists" : "FAIL, the effect did not persist on every mob"}`
  );
}
