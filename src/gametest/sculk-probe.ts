// L0-sclk-p001 probes (L0-sclk-ac21) on BDS 1.26.51.1: the engine facts that
// L0-adr-scbs, L0-adr-scdm and L0-adr-sctr rest on, measured before any
// crossbow code exists. A scenario passes when its measurement completed and
// its controls behaved; the answers are the "[probe] SCLK Pn RESULT …" lines,
// recorded in docs/feedback/probe-sculk.md. The probe shooter and the two probe
// bolts live in packs/gametest/{items,entities} and never ship.

import {
  BlockVolume,
  type Dimension,
  EnchantmentType,
  type Entity,
  GameMode,
  ItemStack,
  ListBlockVolume,
  type Vector3,
  BlockTypes,
  system,
  world,
} from "@minecraft/server";
import { LookDuration, type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { loadBox } from "./structures-place";

const STRUCTURE = "andrew:platform";
const ARROW = "minecraft:arrow";
const AIR = "minecraft:air";
const STONE = "minecraft:stone";
const SCULK = "minecraft:sculk";
/** The shape L0-sclk-ent1 writes down: charge_on_draw, max_draw_duration 1.25 s, slot crossbow. */
const SHOOTER = "andrew:probe_sculk_shooter";
/** L0-sclk-ent2 as written: power 0, gravity 0.05, inertia 0.99, no on_hit. */
const BOLT = "andrew:probe_sculk_bolt";
/** The bolt diagnose-CNTR-X23 measured: power 3, impact_damage 0, remove_on_hit. */
const BOLT_ROH = "andrew:probe_sculk_bolt_roh";
const SONIC = "minecraft:sonic_explosion";
const SLOT = 0;
const AMMO_SLOT = 9;

const log = (msg: string): void => console.warn(`[probe] SCLK ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const v2 = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const len = (v: Vector3): number => Math.hypot(v.x, v.y, v.z);
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const short = (id: string): string => id.replace("andrew:probe_sculk_", "").replace("minecraft:", "");
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** remove_on_hit removes the bolt before its hit handler runs; the id still reads (P1, P2c), the guard is for anything else. */
function idOf(e: Entity): string | undefined {
  try {
    return e.id;
  } catch {
    return undefined;
  }
}

function typeOf(e: Entity | undefined): string {
  if (e === undefined) return "-";
  try {
    return short(e.typeId);
  } catch {
    return "gone";
  }
}

function ammo(p: SimulatedPlayer): number {
  const c = p.getComponent("minecraft:inventory")?.container;
  if (c === undefined) return -1;
  let n = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s?.typeId === ARROW) n += s.amount;
  }
  return n;
}

function weapon(id: string, multishot: boolean): ItemStack {
  const stack = new ItemStack(id, 1);
  if (!multishot) return stack;
  const ench = stack.getComponent("minecraft:enchantable");
  const e = { type: new EnchantmentType("multishot"), level: 1 };
  if (ench === undefined || !ench.canAddEnchantment(e)) throw new Error(`${id} refuses multishot`);
  ench.addEnchantment(e);
  return stack;
}

/** A use right after a one-tick use returns false and starts nothing; one tick later it starts. */
async function startUse(test: Test, p: SimulatedPlayer): Promise<number> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const tick = system.currentTick;
    if (p.useItemInSlot(SLOT)) return tick;
    await test.idle(1);
  }
  return -1;
}

function spawnShot(dim: Dimension, id: string, at: Vector3, v: Vector3): Entity {
  const e = dim.spawnEntity(id, at);
  const proj = e.getComponent("minecraft:projectile");
  if (proj === undefined) throw new Error(`${id} has no projectile component`);
  proj.shoot(v, { uncertainty: 0 });
  return e;
}

function fill(dim: Dimension, a: Vector3, b: Vector3, block: string): number {
  return dim.fillBlocks(new BlockVolume(a, b), block).getCapacity();
}

function typeAt(dim: Dimension, at: Vector3): string {
  try {
    return dim.getBlock(at)?.typeId ?? "unloaded";
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

interface Flight {
  kind: string;
  entity: Entity;
  id: string;
  born: number;
  owner: string;
  at0: Vector3;
  v0: Vector3;
  path: Map<number, Vector3>;
  vel: Map<number, Vector3>;
  fate: string[];
  goneAt?: number;
}

function track(kind: string, e: Entity, owner = "-"): Flight {
  return { kind, entity: e, id: e.id, born: system.currentTick, owner, at0: { ...e.location }, v0: e.getVelocity(), path: new Map(), vel: new Map(), fate: [] };
}

/** One interval samples every live flight and wires the hit events to them. */
function flightRecorder(label: (e: Entity | undefined) => string): { flights: Map<string, Flight>; stop: () => void } {
  const flights = new Map<string, Flight>();
  const interval = system.runInterval(() => {
    for (const f of flights.values()) {
      const dt = system.currentTick - f.born;
      if (f.entity.isValid) {
        f.path.set(dt, { ...f.entity.location });
        f.vel.set(dt, f.entity.getVelocity());
      } else if (f.goneAt === undefined) f.goneAt = dt;
    }
  }, 1);
  const flightOf = (e: Entity): Flight | undefined => {
    const id = idOf(e);
    return id === undefined ? undefined : flights.get(id);
  };
  const hitE = world.afterEvents.projectileHitEntity.subscribe((e) => {
    const f = flightOf(e.projectile);
    if (f === undefined) return;
    f.fate.push(`hitEntity ${label(e.getEntityHit().entity)}@+${system.currentTick - f.born}`);
  });
  const hitB = world.afterEvents.projectileHitBlock.subscribe((e) => {
    const f = flightOf(e.projectile);
    if (f === undefined) return;
    const b = e.getBlockHit().block;
    f.fate.push(`hitBlock ${short(b.typeId)}@${v2(b.location)}+${system.currentTick - f.born}`);
  });
  const removed = world.afterEvents.entityRemove.subscribe((e) => {
    const f = flights.get(e.removedEntityId);
    if (f !== undefined) f.fate.push(`removed@+${system.currentTick - f.born}`);
  });
  return {
    flights,
    stop: () => {
      system.clearRun(interval);
      world.afterEvents.projectileHitEntity.unsubscribe(hitE);
      world.afterEvents.projectileHitBlock.unsubscribe(hitB);
      world.afterEvents.entityRemove.unsubscribe(removed);
      for (const f of flights.values()) if (f.entity.isValid) f.entity.remove();
    },
  };
}

// P1: which event lets a script swap the fired arrow (adr-scdm §1)

interface Phase {
  label: string;
  swap?: string;
  press: number;
  events: string[];
  arrows: Flight[];
  bolts: Flight[];
  hurts: string[];
  swapErrors: string[];
}

const NEAR = { x: 3, y: 2, z: 2 };
const ASIDE = { x: 6, y: 2, z: 5 };
const WALL_Z = 12;
const LOAD_TICKS = 27;
const FLIGHT_TICKS = 14;

registerAsync("andrew", "probe_sculk_swap_event", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const members: string[] = [];
  for (let o: object | null = world.afterEvents; o !== null; o = Object.getPrototypeOf(o) as object | null) {
    for (const n of Object.getOwnPropertyNames(o)) if (/projectile|shoot/i.test(n) && !members.includes(n)) members.push(n);
  }
  const has = (name: string): boolean => (Reflect.get(world.afterEvents, name) as unknown) !== undefined;
  log(
    `P1 RESULT projectileShoot: world.afterEvents.projectileShoot ${has("projectileShoot") ? "PRESENT" : "absent"}; members matching /projectile|shoot/: [${members.join(", ")}]; ` +
      `control entitySpawn ${has("entitySpawn") ? "present" : "ABSENT"}`
  );
  test.assert(has("entitySpawn"), "control: world.afterEvents.entitySpawn is missing");

  const shooter = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 0 }, "sclk_shooter", GameMode.Survival);
  const target = test.spawnSimulatedPlayer(NEAR, "sclk_target", GameMode.Survival);
  const wallA = test.worldBlockLocation({ x: -3, y: 1, z: WALL_Z });
  const wallB = test.worldBlockLocation({ x: 9, y: 7, z: WALL_Z });
  let cur: Phase | undefined;
  const rec = flightRecorder((e) => (e === undefined ? "-" : idOf(e) === target.id ? "target" : idOf(e) === shooter.id ? "shooter" : typeOf(e)));
  const subs: Array<() => void> = [];
  const onItem =
    (kind: string) =>
    (e: { source: { id: string } }): void => {
      if (cur !== undefined && e.source.id === shooter.id) cur.events.push(`${kind}@+${system.currentTick - cur.press}`);
    };
  const startS = world.afterEvents.itemStartUse.subscribe(onItem("start"));
  const useS = world.afterEvents.itemUse.subscribe(onItem("use"));
  const releaseS = world.afterEvents.itemReleaseUse.subscribe(onItem("release"));
  subs.push(() => world.afterEvents.itemStartUse.unsubscribe(startS));
  subs.push(() => world.afterEvents.itemUse.unsubscribe(useS));
  subs.push(() => world.afterEvents.itemReleaseUse.unsubscribe(releaseS));
  const spawnS = world.afterEvents.entitySpawn.subscribe((e) => {
    const ph = cur;
    const a = e.entity;
    if (ph === undefined || !a.isValid || a.typeId !== ARROW) return;
    const proj = a.getComponent("minecraft:projectile");
    const owner = proj?.owner;
    const ownerName = owner === undefined ? "undefined" : owner.id === shooter.id ? "self" : owner.typeId;
    const f = track("arrow", a, ownerName);
    f.fate.push(`spawn@press+${system.currentTick - ph.press}`);
    ph.arrows.push(f);
    rec.flights.set(f.id, f);
    if (ph.swap === undefined) return;
    try {
      const at = { ...a.location };
      const vel = a.getVelocity();
      a.remove();
      const b = dim.spawnEntity(ph.swap, at);
      const bp = b.getComponent("minecraft:projectile");
      if (bp === undefined) throw new Error(`${ph.swap} has no projectile component`);
      if (owner !== undefined) bp.owner = owner;
      bp.shoot(vel, { uncertainty: 0 });
      const bf = track(short(ph.swap), b, bp.owner === undefined ? "undefined" : bp.owner.id === shooter.id ? "self" : bp.owner.typeId);
      bf.at0 = at;
      bf.v0 = vel;
      ph.bolts.push(bf);
      rec.flights.set(bf.id, bf);
    } catch (err) {
      ph.swapErrors.push(errText(err));
    }
  });
  subs.push(() => world.afterEvents.entitySpawn.unsubscribe(spawnS));
  const hurtS = world.afterEvents.entityHurt.subscribe((e) => {
    if (cur === undefined || e.hurtEntity.id !== target.id) return;
    const s = e.damageSource;
    cur.hurts.push(`${s.cause}:${f2(e.damage)} by ${typeOf(s.damagingEntity)} proj ${typeOf(s.damagingProjectile)} @press+${system.currentTick - cur.press}`);
  });
  subs.push(() => world.afterEvents.entityHurt.unsubscribe(hurtS));

  const phases = new Map<string, Phase>();
  const run = async (label: string, item: string, multishot: boolean, swap: string | undefined, near: boolean): Promise<Phase> => {
    target.teleport(test.worldLocation(near ? { x: NEAR.x + 0.5, y: 2, z: NEAR.z + 0.5 } : { x: ASIDE.x + 0.5, y: 2, z: ASIDE.z + 0.5 }));
    target.getComponent("minecraft:health")?.resetToMaxValue();
    shooter.setItem(weapon(item, multishot), SLOT, true);
    // SimulatedPlayer.lookAtLocation takes a test-relative point, not a world one.
    shooter.lookAtLocation(near ? { x: 3.5, y: 3.0, z: 2.5 } : { x: 3.5, y: 3.52, z: WALL_Z }, LookDuration.Continuous);
    await test.idle(3);
    const loadStart = await startUse(test, shooter);
    await test.idle(LOAD_TICKS);
    shooter.stopUsingItem();
    await test.idle(3);
    const a0 = ammo(shooter);
    const ph: Phase = { label, swap, press: system.currentTick, events: [], arrows: [], bolts: [], hurts: [], swapErrors: [] };
    cur = ph;
    ph.press = await startUse(test, shooter);
    await test.idle(1);
    shooter.stopUsingItem();
    await test.idle(FLIGHT_TICKS);
    cur = undefined;
    const a1 = ammo(shooter);
    const fl = (f: Flight): string => `${f.kind}[owner=${f.owner} |v0|=${f2(len(f.v0))} v0=${v2(f.v0)} ${f.fate.join(" ")}${f.goneAt !== undefined ? ` gone@+${f.goneAt}` : ""} samples=${f.path.size}]`;
    log(
      `P1 RESULT ${label}: load started ${loadStart >= 0 ? "yes" : "NO"}, press ${ph.press >= 0 ? "ok" : "REFUSED"}; arrows ${ph.arrows.length}: ${ph.arrows.map(fl).join(" ")}; ` +
        `${swap === undefined ? "no swap" : `swapped to ${short(swap)}: ${ph.bolts.length} bolt(s) ${ph.bolts.map(fl).join(" ")} errors [${ph.swapErrors.join(" | ")}]`}; ` +
        `target hurt [${ph.hurts.join("; ")}]; ammo ${a0}->${a1}; item events [${ph.events.join(" ")}]`
    );
    for (const f of [...ph.arrows, ...ph.bolts]) if (f.entity.isValid) f.entity.remove();
    phases.set(label, ph);
    return ph;
  };

  try {
    fill(dim, wallA, wallB, STONE);
    shooter.getComponent("minecraft:inventory")?.container?.setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
    await test.idle(10);

    const nearControl = await run("near control (vanilla crossbow, target 2 blocks)", "minecraft:crossbow", false, undefined, true);
    const nearRoh = await run("near swap->bolt_roh", "minecraft:crossbow", false, BOLT_ROH, true);
    await run("near swap->bolt (ent2)", "minecraft:crossbow", false, BOLT, true);
    const farControl = await run("far control single", "minecraft:crossbow", false, undefined, false);
    const farRoh = await run("far swap->bolt_roh single", "minecraft:crossbow", false, BOLT_ROH, false);
    const farBolt = await run("far swap->bolt (ent2) single", "minecraft:crossbow", false, BOLT, false);
    const msControl = await run("far control multishot", "minecraft:crossbow", true, undefined, false);
    const msRoh = await run("far swap->bolt_roh multishot", "minecraft:crossbow", true, BOLT_ROH, false);
    const shooterPlain = await run("custom shooter (ent1 shape) single", SHOOTER, false, undefined, false);
    const shooterMs = await run("custom shooter (ent1 shape) multishot", SHOOTER, true, undefined, false);

    // The "jump": where the swapped bolt is on each tick against where an unswapped arrow of the same shot is.
    const jump = (a: Flight | undefined, b: Flight | undefined): string => {
      if (a === undefined || b === undefined) return "n/a";
      const out: string[] = [];
      for (let dt = 0; dt <= 4; dt++) {
        const pa = a.path.get(dt);
        const pb = b.path.get(dt);
        out.push(`+${dt}:${pa !== undefined && pb !== undefined ? f2(len(sub(pa, pb))) : `${pa === undefined ? "-" : "a"}/${pb === undefined ? "-" : "b"}`}`);
      }
      return `spawn Δ ${f2(len(sub(a.at0, b.at0)))}, v0 Δ ${f2(len(sub(a.v0, b.v0)))}; |Δpos| ${out.join(" ")}`;
    };
    log(
      `P1 RESULT jump: far single control arrow vs swapped bolt_roh: ${jump(farControl.arrows[0], farRoh.bolts[0])} | vs swapped bolt (ent2): ${jump(farControl.arrows[0], farBolt.bolts[0])} | ` +
        `swapped arrows sampled after their spawn tick: ${[...farRoh.arrows, ...farBolt.arrows, ...msRoh.arrows].reduce((n, f) => n + f.path.size, 0)}`
    );
    const ms = (ph: Phase): string => {
      const born = [...new Set(ph.arrows.map((f) => f.born))];
      const yaw = ph.arrows.map((f) => f2((Math.atan2(f.v0.x, f.v0.z) * 180) / Math.PI)).join("/");
      return `${ph.arrows.length} arrows in ${born.length} tick(s), yaw ${yaw}°`;
    };
    log(
      `P1 RESULT multishot: vanilla crossbow ${ms(msControl)}; swapped ${msRoh.bolts.length} bolts with ${new Set(msRoh.bolts.map((f) => f.id)).size} distinct ids, ` +
        `bolt outcomes ${msRoh.bolts.map((f) => f.fate.join(",") || "none").join(" | ")}; custom shooter single ${ms(shooterPlain)}, multishot ${ms(shooterMs)}`
    );

    test.assert(nearControl.arrows.length >= 1 && nearControl.arrows[0].owner === "self", `control: the near shot spawned ${nearControl.arrows.length} arrow(s), owner ${nearControl.arrows[0]?.owner}`);
    test.assert(nearControl.hurts.some((h) => h.includes("arrow")), `control: the unswapped arrow did not hurt the target: [${nearControl.hurts.join("; ")}]`);
    test.assert(msControl.arrows.length === 3, `control: a multishot vanilla crossbow spawned ${msControl.arrows.length} arrows, not 3`);
    test.assert(nearRoh.press >= 0 && farControl.arrows.length >= 1, "a press was refused or the far control shot nothing");
  } finally {
    cur = undefined;
    for (const s of subs) s();
    rec.stop();
    fill(dim, wallA, wallB, AIR);
    for (const e of dim.getEntities({ type: ARROW, location: test.worldLocation({ x: 3, y: 3, z: 6 }), maxDistance: 24 })) e.remove();
    test.removeSimulatedPlayer(shooter);
    test.removeSimulatedPlayer(target);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1400)
  .tag("andrew");

// P2: the bolt in water, lava and cobweb (adr-scdm §1, as01)

const LANES = [
  { x: 1, type: ARROW },
  { x: 3, type: BOLT },
  { x: 5, type: BOLT_ROH },
];

interface Medium {
  name: string;
  block?: string;
  ys: readonly number[];
}

const COLUMN_TOP = 7;
const MEDIA: readonly Medium[] = [
  { name: "air (control)", ys: [] },
  { name: "water", block: "minecraft:water", ys: [2, 3, 4, 5, 6, 7] },
  { name: "lava", block: "minecraft:lava", ys: [2, 3, 4, 5, 6, 7] },
  { name: "cobweb", block: "minecraft:web", ys: [6] },
];
/** The crossbow's speed, and a slow drop that spends several ticks inside the medium. */
const DROPS = [
  { name: "3.0 b/t", y: COLUMN_TOP + 7.5, vy: -3 },
  { name: "0.5 b/t", y: COLUMN_TOP + 1.5, vy: -0.5 },
];

function pathText(f: Flight, upto: number, floor: number): string {
  const ys: string[] = [];
  for (let dt = 0; dt <= upto; dt++) {
    const p = f.path.get(dt);
    if (p !== undefined) ys.push(`${dt}:${f2(p.y - floor)}`);
  }
  return ys.join(" ");
}

registerAsync("andrew", "probe_sculk_bolt_media", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const base = test.worldBlockLocation({ x: 0, y: 0, z: 0 });
  const floorTop = base.y + 2;
  const rec = flightRecorder(typeOf);
  const outcomes = new Map<string, string>();
  try {
    for (const m of MEDIA) for (const drop of DROPS) {
      fill(dim, test.worldBlockLocation({ x: 0, y: 2, z: 2 }), test.worldBlockLocation({ x: 6, y: COLUMN_TOP, z: 4 }), "minecraft:glass");
      for (const lane of LANES) {
        for (let y = 2; y <= COLUMN_TOP; y++) dim.setBlockType(test.worldBlockLocation({ x: lane.x, y, z: 3 }), m.block !== undefined && m.ys.includes(y) ? m.block : AIR);
      }
      await test.idle(2);
      const placed = LANES.map((l) => m.ys.map((y) => short(typeAt(dim, test.worldBlockLocation({ x: l.x, y, z: 3 })))).join("/") || "air").join(" ");
      const shots = LANES.map((l) => {
        const f = track(short(l.type), spawnShot(dim, l.type, test.worldLocation({ x: l.x + 0.5, y: drop.y, z: 3.5 }), { x: 0, y: drop.vy, z: 0 }));
        rec.flights.set(f.id, f);
        return f;
      });
      await test.idle(30);
      for (const f of shots) {
        const fire = f.entity.isValid ? f.entity.getComponent("minecraft:onfire")?.onFireTicksRemaining : undefined;
        const last = [...f.path.entries()].pop();
        const vy: string[] = [];
        for (let dt = 1; dt <= 8; dt++) {
          const v = f.vel.get(dt);
          if (v !== undefined) vy.push(f2(v.y));
        }
        const text =
          `y over the floor by tick [${pathText(f, 14, floorTop)}] (medium ${m.ys.length > 0 ? `${Math.min(...m.ys) - 2}..${Math.max(...m.ys) - 1}` : "none"}); vy +1..+8 [${vy.join(" ")}]; ` +
          `fate [${f.fate.join(" ") || "none"}]${f.goneAt !== undefined ? ` gone@+${f.goneAt}` : ""}; ` +
          `after 30 ticks ${f.entity.isValid ? `still there at y ${f2((last?.[1].y ?? 0) - floorTop)} over the floor, onFire ${fire ?? "-"}` : "gone"}`;
        outcomes.set(`${m.name}/${drop.name}/${f.kind}`, text);
        log(`P2 RESULT ${m.name} ${drop.name} ${f.kind}: ${text}; cells ${placed}`);
        if (f.entity.isValid) f.entity.remove();
        rec.flights.delete(f.id);
      }
    }
    const air = MEDIA[0].name;
    for (const lane of LANES) {
      const o = outcomes.get(`${air}/${DROPS[0].name}/${short(lane.type)}`) ?? "";
      test.assert(o.includes("hitBlock stone") || lane.type === BOLT, `control: ${short(lane.type)} through air did not hit the floor: ${o}`);
    }
  } finally {
    rec.stop();
    fill(dim, test.worldBlockLocation({ x: 0, y: 2, z: 2 }), test.worldBlockLocation({ x: 6, y: COLUMN_TOP, z: 4 }), AIR);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1000)
  .tag("andrew");

// P2b: does the bolt fly like the arrow (as01, p001 Q9)

registerAsync("andrew", "probe_sculk_bolt_flight", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const rec = flightRecorder(typeOf);
  try {
    const comps: string[] = [];
    for (const type of [ARROW, BOLT, BOLT_ROH]) {
      const e = dim.spawnEntity(type, test.worldLocation({ x: 3.5, y: 4, z: 3.5 }));
      const p = e.getComponent("minecraft:projectile");
      comps.push(
        p === undefined
          ? `${short(type)} no projectile component`
          : `${short(type)} gravity=${p.gravity} airInertia=${p.airInertia} liquidInertia=${p.liquidInertia} stopOnHit=${p.stopOnHit} bounce=${p.shouldBounceOnHit}`
      );
      e.remove();
    }
    log(`P2b RESULT projectile components: ${comps.join(" | ")}`);

    const shots: Array<{ name: string; v: Vector3; ticks: number }> = [
      { name: "level at 2.0 b/t", v: { x: 0, y: 0, z: 2 }, ticks: 40 },
      { name: "level at 3.1 b/t (crossbow)", v: { x: 0, y: 0, z: 3.1 }, ticks: 30 },
      { name: "lob 0.5 up, 1.0 forward", v: { x: 0, y: 0.5, z: 1 }, ticks: 50 },
    ];
    let controlLanded = 0;
    for (const s of shots) {
      const fs = LANES.map((l) => {
        const f = track(short(l.type), spawnShot(dim, l.type, test.worldLocation({ x: l.x + 0.5, y: 4.5, z: 0.5 }), s.v));
        rec.flights.set(f.id, f);
        return f;
      });
      await test.idle(s.ticks);
      const arrow = fs[0];
      const describe = (f: Flight): string => {
        const step = (dt: number): string => {
          const a = f.path.get(dt - 1);
          const b = f.path.get(dt);
          return a !== undefined && b !== undefined ? f2(len(sub(b, a))) : "-";
        };
        const drop = (dt: number): string => {
          const p = f.path.get(dt);
          return p === undefined ? "-" : f2(p.y - f.at0.y);
        };
        const vsArrow: string[] = [];
        for (const dt of [1, 3, 5, 8, 10]) {
          const a = arrow.path.get(dt);
          const b = f.path.get(dt);
          vsArrow.push(a !== undefined && b !== undefined ? f2(len(sub(sub(b, a), { x: f.at0.x - arrow.at0.x, y: 0, z: 0 }))) : "-");
        }
        const hit = f.fate.find((x) => x.startsWith("hitBlock"));
        return `${f.kind}: step +1/+2/+3 ${step(1)}/${step(2)}/${step(3)}; dy +5/+10 ${drop(5)}/${drop(10)}; |Δ vs arrow| +1/+3/+5/+8/+10 ${vsArrow.join("/")}; ` +
          `landed ${hit === undefined ? "no block hit" : `${hit} z-run ${f2((f.path.get(Math.max(...f.path.keys()))?.z ?? f.at0.z) - f.at0.z)}`}; fate [${f.fate.join(" ")}]`;
      };
      if (arrow.fate.some((x) => x.startsWith("hitBlock"))) controlLanded++;
      log(`P2b RESULT ${s.name}: ${fs.map(describe).join(" | ")}`);
      for (const f of fs) {
        if (f.entity.isValid) f.entity.remove();
        rec.flights.delete(f.id);
      }
    }
    test.assert(controlLanded >= 2, `control: the arrow landed in ${controlLanded} of 3 shots`);
  } finally {
    rec.stop();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// P2c: does the bolt raise projectileHitEntity / HitBlock

registerAsync("andrew", "probe_sculk_bolt_hits", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const target = test.spawnSimulatedPlayer({ x: 3, y: 2, z: 4 }, "sclk_hit_target", GameMode.Survival);
  // An ownerless script arrow hits a player for 0 and bounces off: the control needs a shooter.
  const owner = test.spawnSimulatedPlayer({ x: 0, y: 2, z: 0 }, "sclk_hit_owner", GameMode.Survival);
  const rec = flightRecorder((e) => (e === undefined ? "-" : idOf(e) === target.id ? "target" : typeOf(e)));
  const hurts: string[] = [];
  const hurtS = world.afterEvents.entityHurt.subscribe((e) => {
    if (e.hurtEntity.id === target.id) hurts.push(`${e.damageSource.cause}:${f2(e.damage)} proj ${typeOf(e.damageSource.damagingProjectile)}`);
  });
  const results = new Map<string, Flight>();
  try {
    fill(dim, test.worldBlockLocation({ x: 0, y: 2, z: 6 }), test.worldBlockLocation({ x: 6, y: 4, z: 6 }), STONE);
    await test.idle(10);
    const trials: Array<{ name: string; type: string; dx: number }> = [
      { name: "arrow at the target (control)", type: ARROW, dx: 0 },
      { name: "bolt (ent2) at the target", type: BOLT, dx: 0 },
      { name: "bolt_roh at the target", type: BOLT_ROH, dx: 0 },
      { name: "bolt (ent2) 1.2 to the side (miss)", type: BOLT, dx: 1.2 },
      { name: "bolt_roh 1.2 to the side (miss)", type: BOLT_ROH, dx: 1.2 },
    ];
    for (const t of trials) {
      target.teleport(test.worldLocation({ x: 3.5, y: 2, z: 4.5 }));
      target.getComponent("minecraft:health")?.resetToMaxValue();
      await test.idle(12);
      const before = hurts.length;
      const e = dim.spawnEntity(t.type, test.worldLocation({ x: 3.5 + t.dx, y: 3, z: 1.5 }));
      const proj = e.getComponent("minecraft:projectile");
      test.assert(proj !== undefined, `${t.type} has no projectile component`);
      proj!.owner = owner;
      proj!.shoot({ x: 0, y: 0, z: 2 }, { uncertainty: 0 });
      const f = track(short(t.type), e, "owner");
      rec.flights.set(f.id, f);
      await test.idle(15);
      const last = [...f.path.entries()].pop();
      const v = f.entity.isValid ? f.entity.getVelocity() : undefined;
      log(
        `P2c RESULT ${t.name}: fate [${f.fate.join(" ") || "none"}]${f.goneAt !== undefined ? ` gone@+${f.goneAt}` : ""}; target hurt [${hurts.slice(before).join("; ")}]; ` +
          `after 15 ticks ${f.entity.isValid ? `still there at ${v2(sub(last?.[1] ?? f.at0, test.worldLocation({ x: 0, y: 0, z: 0 })))} rel, |v| ${f2(len(v ?? { x: 0, y: 0, z: 0 }))}` : "gone"}`
      );
      results.set(t.name, f);
      if (f.entity.isValid) f.entity.remove();
      rec.flights.delete(f.id);
    }
    const control = results.get(trials[0].name);
    test.assert(control?.fate.some((x) => x.startsWith("hitEntity target")) === true, `control: the arrow did not hit the target: [${control?.fate.join(" ")}]`);
    const miss = results.get(trials[4].name);
    test.assert(miss?.fate.some((x) => x.startsWith("hitEntity")) === false, `control: the side shot raised projectileHitEntity: [${miss?.fate.join(" ")}]`);
  } finally {
    world.afterEvents.entityHurt.unsubscribe(hurtS);
    rec.stop();
    fill(dim, test.worldBlockLocation({ x: 0, y: 2, z: 6 }), test.worldBlockLocation({ x: 6, y: 4, z: 6 }), AIR);
    test.removeSimulatedPlayer(target);
    test.removeSimulatedPlayer(owner);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(400)
  .tag("andrew");

// P3: minecraft:sonic_explosion from a script (ad02, ac23)

function tryParticle(dim: Dimension, id: string, at: Vector3): string {
  try {
    dim.spawnParticle(id, at);
    return "no throw";
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

function tryCommand(dim: Dimension, cmd: string): string {
  try {
    return `successCount=${dim.runCommand(cmd).successCount}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

/** L0-sclk-as04 TRAIL_PER_TICK. */
const TRAIL_PER_TICK = 3;

registerAsync("andrew", "probe_sculk_sonic_particle", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  // Three bolts of one Multishot volley on falling arcs, three rings per bolt per tick, for 20 ticks.
  const starts = [-1, 0, 1].map((k) => ({ at: test.worldLocation({ x: 3.5 + k, y: 4.5, z: 0.5 }), v: { x: 0.15 * k, y: 0.1, z: 1.5 } }));
  const tickMs: number[] = [];
  const errors: string[] = [];
  let calls = 0;
  for (let t = 0; t < 20; t++) {
    const started = Date.now();
    for (const s of starts) {
      const a = add(s.at, { x: s.v.x * t, y: s.v.y * t - 0.025 * t * t, z: s.v.z * t });
      const b = add(s.at, { x: s.v.x * (t + 1), y: s.v.y * (t + 1) - 0.025 * (t + 1) * (t + 1), z: s.v.z * (t + 1) });
      for (let i = 0; i < TRAIL_PER_TICK; i++) {
        const k = (i + 1) / TRAIL_PER_TICK;
        calls++;
        const answer = tryParticle(dim, SONIC, add(a, { x: (b.x - a.x) * k, y: (b.y - a.y) * k, z: (b.z - a.z) * k }));
        if (answer !== "no throw") errors.push(answer);
      }
    }
    tickMs.push(Date.now() - started);
    await test.idle(1);
  }
  const burstStart = Date.now();
  let burstErrors = 0;
  for (let i = 0; i < 300; i++) if (tryParticle(dim, SONIC, test.worldLocation({ x: 3.5, y: 4 + (i % 10) * 0.3, z: 3.5 })) !== "no throw") burstErrors++;
  const burstMs = Date.now() - burstStart;
  const at = test.worldLocation({ x: 3.5, y: 3.5, z: 3.5 });
  const unknown = tryParticle(dim, "andrew:no_such_particle", at);
  const far = { x: at.x + 10000, y: at.y, z: at.z + 10000 };
  const unloaded = tryParticle(dim, SONIC, far);
  const xyz = `${f2(at.x)} ${f2(at.y)} ${f2(at.z)}`;
  const cmdSonic = tryCommand(dim, `particle ${SONIC} ${xyz}`);
  const cmdUnknown = tryCommand(dim, `particle andrew:no_such_particle ${xyz}`);
  log(
    `P3 RESULT ${SONIC}: ${calls} calls over 20 ticks (${TRAIL_PER_TICK} per bolt × 3 bolts per tick), ${errors.length} threw${errors.length > 0 ? ` (${errors[0]})` : ""}, ` +
      `max ${Math.max(...tickMs)} ms per tick; burst of 300 in one tick: ${burstErrors} threw, ${burstMs} ms; ` +
      `control unknown id andrew:no_such_particle: ${unknown}; control unloaded location (loaded=${dim.isChunkLoaded(far)}): ${unloaded}; ` +
      `/particle ${SONIC}: ${cmdSonic}; /particle andrew:no_such_particle: ${cmdUnknown}`
  );
  test.assert(errors.length === 0, `spawnParticle(${SONIC}) threw: ${errors[0]}`);
  test.assert(unloaded.startsWith("threw"), "control: spawnParticle in an unloaded chunk did not throw — the call is not reaching the engine");
  await test.idle(1);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(200)
  .tag("andrew");

// P4: how many cells a tick can change (adr-sctr §2, ad04, as04)

const BATCHES = [0, 25, 75, 150, 300, 600, 1200, 2400];
const REPEATS = 2;

interface Timing {
  batch: number;
  gap: number;
  next: number;
  changed: number;
}

registerAsync("andrew", "probe_sculk_carve_budget", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const rMin = test.worldBlockLocation({ x: 8, y: 6, z: 0 });
  const rMax = test.worldBlockLocation({ x: 23, y: 15, z: 15 });
  const cells: Vector3[] = [];
  for (let y = rMax.y; y >= rMin.y; y--) for (let x = rMin.x; x <= rMax.x; x++) for (let z = rMin.z; z <= rMax.z; z++) cells.push({ x, y, z });
  const f0 = test.worldBlockLocation({ x: 26, y: 6, z: 0 });
  const f1 = add(f0, { x: 4, y: 2, z: 4 });
  const center = add(f0, { x: 2, y: 1, z: 2 });
  const chunkX = Math.round((test.worldBlockLocation({ x: 3, y: 0, z: 0 }).x) / 16) * 16;
  const s0 = { x: chunkX - 2, y: rMin.y + 4, z: test.worldBlockLocation({ x: 0, y: 0, z: -8 }).z };
  const s1 = add(s0, { x: 4, y: 2, z: 4 });
  const items = (): string[] => dim.getEntities({ type: "minecraft:item", location: center, maxDistance: 8 }).map((e) => e.getComponent("minecraft:item")?.itemStack.typeId ?? "?");
  const clearItems = (): void => {
    for (const e of dim.getEntities({ type: "minecraft:item", location: center, maxDistance: 8 })) e.remove();
  };
  try {
    test.assert(dim.isChunkLoaded(rMin) && dim.isChunkLoaded(rMax) && dim.isChunkLoaded(f1), "setup: the carve region is not loaded");
    let t = Date.now();
    const filled = fill(dim, rMin, rMax, STONE);
    log(`P4 setup: fillBlocks stone over ${cells.length} cells returned ${filled} in ${Date.now() - t} ms`);
    await test.idle(2);

    const rows: string[] = [];
    let overrun = "none up to 2400";
    const time = async (n: number, write: (at: Vector3) => boolean): Promise<Timing> => {
      fill(dim, rMin, rMax, STONE);
      await test.idle(2);
      const t0 = Date.now();
      let changed = 0;
      for (let i = 0; i < n; i++) if (write(cells[i])) changed++;
      const t1 = Date.now();
      await test.idle(1);
      const t2 = Date.now();
      await test.idle(1);
      const t3 = Date.now();
      return { batch: t1 - t0, gap: t2 - t0, next: t3 - t2, changed };
    };
    const carve = (at: Vector3): boolean => {
      const b = dim.getBlock(at);
      if (b === undefined || b.typeId === AIR) return false;
      b.setType(AIR);
      return true;
    };
    for (const n of BATCHES) {
      const runs: Timing[] = [];
      for (let r = 0; r < REPEATS; r++) runs.push(await time(n, carve));
      rows.push(`n=${n} (changed ${runs.map((x) => x.changed).join("/")}): batch ${runs.map((x) => x.batch).join("/")} ms, tick gap ${runs.map((x) => x.gap).join("/")} ms, next ${runs.map((x) => x.next).join("/")} ms`);
      if (overrun.startsWith("none") && runs.some((x) => x.gap > 60)) overrun = `first at n=${n}`;
    }
    log(`P4 RESULT getBlock+setType(air) per cell, ${REPEATS} runs each: ${rows.join(" | ")}; tick gap over 60 ms: ${overrun}`);
    const sculk = await time(300, (at) => {
      const b = dim.getBlock(at);
      if (b === undefined) return false;
      b.setType(SCULK);
      return true;
    });
    const direct = await time(1200, (at) => {
      dim.setBlockType(at, AIR);
      return true;
    });
    log(
      `P4 RESULT variants: getBlock+setType(sculk) n=300 batch ${sculk.batch} ms gap ${sculk.gap} ms (changed ${sculk.changed}); ` +
        `dimension.setBlockType(air) n=1200 batch ${direct.batch} ms gap ${direct.gap} ms`
    );
    fill(dim, rMin, rMax, AIR);

    // fillBlocks on the 5×5×3 the spec names, with and without the deny list as a filter.
    const keep = ["minecraft:chest", "minecraft:bedrock", "minecraft:obsidian"];
    const keepAt = [add(f0, { x: 1, y: 1, z: 1 }), add(f0, { x: 3, y: 0, z: 3 }), add(f0, { x: 2, y: 2, z: 0 })];
    const layout = (): string => {
      fill(dim, f0, f1, STONE);
      keep.forEach((id, i) => dim.setBlockType(keepAt[i], id));
      const chest = dim.getBlock(keepAt[0])?.getComponent("minecraft:inventory")?.container;
      chest?.setItem(0, new ItemStack("minecraft:diamond", 1));
      return chest?.getItem(0)?.typeId ?? "nothing";
    };
    const airIn = (a: Vector3, b: Vector3): number => {
      let n = 0;
      for (let x = a.x; x <= b.x; x++) for (let y = a.y; y <= b.y; y++) for (let z = a.z; z <= b.z; z++) if (typeAt(dim, { x, y, z }) === AIR) n++;
      return n;
    };
    fill(dim, f0, f1, STONE);
    t = Date.now();
    const plain = fill(dim, f0, f1, AIR);
    const plainMs = Date.now() - t;
    const plainAir = airIn(f0, f1);
    const again = fill(dim, f0, f1, AIR);
    const held = layout();
    await test.idle(1);
    clearItems();
    const filtered = dim.fillBlocks(new BlockVolume(f0, f1), AIR, { blockFilter: { excludeTypes: keep } }).getCapacity();
    await test.idle(3);
    const keptAfter = keepAt.map((p) => short(typeAt(dim, p))).join("/");
    const filteredItems = items();
    layout();
    await test.idle(1);
    clearItems();
    const unfiltered = fill(dim, f0, f1, AIR);
    await test.idle(3);
    const unfilteredKept = keepAt.map((p) => short(typeAt(dim, p))).join("/");
    const unfilteredItems = items();
    clearItems();
    // The same chest removed by setType, as the per-cell carve would.
    layout();
    await test.idle(1);
    clearItems();
    dim.getBlock(keepAt[0])?.setType(AIR);
    await test.idle(3);
    const setTypeItems = items();
    clearItems();
    fill(dim, f0, f1, AIR);
    log(
      `P4 RESULT fillBlocks 5x5x3=75: stone->air returned ${plain} in ${plainMs} ms, air read back ${plainAir}/75; same volume again (already air) returned ${again}; ` +
        `with blockFilter.excludeTypes [chest,bedrock,obsidian] returned ${filtered}, those cells read ${keptAfter}, items dropped [${filteredItems.join(",")}]; ` +
        `no filter returned ${unfiltered}, those cells read ${unfilteredKept}, items dropped [${unfilteredItems.join(",")}]; ` +
        `the chest held ${held}; the same chest set to air by Block.setType dropped [${setTypeItems.join(",")}]`
    );

    // An irregular crater as a ListBlockVolume: does fillBlocks take exactly the listed cells?
    fill(dim, f0, f1, STONE);
    const listed: Vector3[] = [];
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 2; dy++) if ((dx * dx + dz * dz) / 6.25 + (dy * dy) / 9 <= 1) listed.push(add(center, { x: dx, y: 1 - dy, z: dz }));
    t = Date.now();
    const listCount = dim.fillBlocks(new ListBlockVolume(listed), AIR).getCapacity();
    const listMs = Date.now() - t;
    const listedAir = listed.filter((p) => typeAt(dim, p) === AIR).length;
    const allAir = airIn(f0, f1);
    log(`P4 RESULT fillBlocks ListBlockVolume (ellipsoid, ${listed.length} cells) returned ${listCount} in ${listMs} ms; listed cells air ${listedAir}/${listed.length}; air in the whole 5x5x3 ${allAir} (unlisted cells left stone: ${allAir === listedAir ? "yes" : "NO"})`);
    fill(dim, f0, f1, AIR);

    // Across a chunk border, and (negative control) into chunks that are not loaded.
    fill(dim, s0, s1, STONE);
    const straddle = fill(dim, s0, s1, AIR);
    const straddleAir = airIn(s0, s1);
    const u0 = test.worldBlockLocation({ x: 4000, y: 6, z: 0 });
    const u1 = add(u0, { x: 4, y: 2, z: 4 });
    let unloadedThrow: string;
    try {
      unloadedThrow = `returned ${fill(dim, u0, u1, AIR)}`;
    } catch (err) {
      unloadedThrow = `threw ${errText(err)}`;
    }
    let unloadedIgnore: string;
    try {
      unloadedIgnore = `returned ${dim.fillBlocks(new BlockVolume(u0, u1), AIR, { ignoreChunkBoundErrors: true }).getCapacity()}`;
    } catch (err) {
      unloadedIgnore = `threw ${errText(err)}`;
    }
    log(
      `P4 RESULT fillBlocks across the chunk border x=${chunkX} (x ${s0.x}..${s1.x}): returned ${straddle}, air ${straddleAir}/75; ` +
        `control in unloaded chunks (loaded=${dim.isChunkLoaded(u0)}): ${unloadedThrow}; with ignoreChunkBoundErrors: ${unloadedIgnore}`
    );
    test.assert(plainAir === 75 && straddleAir === 75, `control: fillBlocks left ${75 - plainAir} / ${75 - straddleAir} cells uncarved`);
    test.assert(!dim.isChunkLoaded(u0) && unloadedThrow.startsWith("threw"), "control: the unloaded fill did not throw");
  } finally {
    fill(dim, rMin, rMax, AIR);
    fill(dim, f0, f1, AIR);
    fill(dim, s0, s1, AIR);
    clearItems();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(600)
  .tag("andrew");

// P5: does sculk take every surface, and survive a chunk reload (r004, ac13)

/** Natural and common building surfaces; the first id the engine knows is used. */
const SURFACES: ReadonlyArray<readonly string[]> = [
  ["minecraft:grass_block"],
  ["minecraft:dirt"],
  ["minecraft:coarse_dirt"],
  ["minecraft:podzol"],
  ["minecraft:mycelium"],
  ["minecraft:rooted_dirt", "minecraft:dirt_with_roots"],
  ["minecraft:mud"],
  ["minecraft:clay"],
  ["minecraft:sand"],
  ["minecraft:red_sand"],
  ["minecraft:gravel"],
  ["minecraft:stone"],
  ["minecraft:cobblestone"],
  ["minecraft:mossy_cobblestone"],
  ["minecraft:deepslate"],
  ["minecraft:cobbled_deepslate"],
  ["minecraft:tuff"],
  ["minecraft:calcite"],
  ["minecraft:andesite"],
  ["minecraft:diorite"],
  ["minecraft:granite"],
  ["minecraft:sandstone"],
  ["minecraft:red_sandstone"],
  ["minecraft:hardened_clay", "minecraft:terracotta"],
  ["minecraft:snow"],
  ["minecraft:ice"],
  ["minecraft:packed_ice"],
  ["minecraft:moss_block"],
  ["minecraft:netherrack"],
  ["minecraft:soul_sand"],
  ["minecraft:soul_soil"],
  ["minecraft:basalt"],
  ["minecraft:blackstone"],
  ["minecraft:end_stone"],
  ["minecraft:oak_planks"],
  ["minecraft:oak_log"],
  ["minecraft:brick_block", "minecraft:bricks"],
  ["minecraft:dripstone_block"],
];

/** A surface with something passable on its exposed face. */
const COVERED: ReadonlyArray<{ surface: string; cover: readonly string[] }> = [
  { surface: "minecraft:grass_block", cover: ["minecraft:short_grass", "minecraft:tallgrass"] },
  { surface: "minecraft:grass_block", cover: ["minecraft:snow_layer"] },
  { surface: "minecraft:dirt", cover: ["minecraft:poppy", "minecraft:red_flower"] },
  { surface: "minecraft:stone", cover: ["minecraft:white_carpet", "minecraft:carpet"] },
  { surface: "minecraft:stone", cover: ["minecraft:torch"] },
];

function knownId(ids: readonly string[]): string | undefined {
  return ids.find((id) => BlockTypes.get(id) !== undefined);
}

interface SiteCell {
  label: string;
  at: Vector3;
  surface: string;
  cover?: string;
  support: boolean;
  roof: boolean;
  placed?: string;
  after?: string;
  coverAfter?: string;
  reloaded?: string;
  coverReloaded?: string;
}

registerAsync("andrew", "probe_sculk_surfaces_reload", async (test: Test): Promise<void> => {
  const dim = test.getDimension();
  const origin = test.worldBlockLocation({ x: 512, y: 6, z: 0 });
  const site: SiteCell[] = [];
  const unknown: string[] = [];
  const at = (i: number): Vector3 => add(origin, { x: 2 * (i % 8), y: 0, z: 2 * Math.floor(i / 8) });
  for (const ids of SURFACES) {
    const id = knownId(ids);
    if (id === undefined) unknown.push(ids[0]);
    else site.push({ label: short(id), at: at(site.length), surface: id, support: true, roof: false });
  }
  for (const c of COVERED) {
    const cover = knownId(c.cover);
    if (cover === undefined) unknown.push(c.cover[0]);
    else site.push({ label: `${short(c.surface)}+${short(cover)}`, at: at(site.length), surface: c.surface, cover, support: true, roof: false });
  }
  site.push({ label: "stone wall face (solid above, air beside)", at: at(site.length), surface: STONE, support: true, roof: true });
  site.push({ label: "stone ceiling face (air below, solid above)", at: at(site.length), surface: STONE, support: false, roof: true });
  const last = site[site.length - 1].at;
  const box = { min: [origin.x - 2, 0, origin.z - 2] as [number, number, number], max: [origin.x + 16, 0, last.z + 2] as [number, number, number] };
  const middle = add(origin, { x: 7, y: 0, z: Math.floor((last.z - origin.z) / 2) });
  const items = (): string[] => dim.getEntities({ type: "minecraft:item", location: middle, maxDistance: 24 }).map((e) => short(e.getComponent("minecraft:item")?.itemStack.typeId ?? "?"));
  let release: (() => void) | undefined;
  try {
    release = await loadBox(test, dim, "andrew_gt_sclk", box);
    for (const c of site) {
      if (c.support) dim.setBlockType(add(c.at, { x: 0, y: -1, z: 0 }), STONE);
      dim.setBlockType(c.at, c.surface);
      if (c.roof) dim.setBlockType(add(c.at, { x: 0, y: 1, z: 0 }), STONE);
      if (c.cover !== undefined) dim.setBlockType(add(c.at, { x: 0, y: 1, z: 0 }), c.cover);
    }
    await test.idle(3);
    for (const c of site) c.placed = typeAt(dim, c.at);
    for (const e of dim.getEntities({ type: "minecraft:item", location: middle, maxDistance: 24 })) e.remove();
    for (const c of site) {
      const b = dim.getBlock(c.at);
      if (b !== undefined) b.setType(SCULK);
    }
    await test.idle(5);
    for (const c of site) {
      c.after = typeAt(dim, c.at);
      if (c.cover !== undefined) c.coverAfter = typeAt(dim, add(c.at, { x: 0, y: 1, z: 0 }));
    }
    const dropped = items();

    release();
    release = undefined;
    let unloadTicks = -1;
    for (let t = 0; t < 600; t++) {
      if (!dim.isChunkLoaded(origin) && !dim.isChunkLoaded(last)) {
        unloadTicks = t;
        break;
      }
      await test.idle(1);
    }
    const unloadedRead = typeAt(dim, origin);
    release = await loadBox(test, dim, "andrew_gt_sclk", box);
    await test.idle(5);
    for (const c of site) {
      c.reloaded = typeAt(dim, c.at);
      if (c.cover !== undefined) c.coverReloaded = typeAt(dim, add(c.at, { x: 0, y: 1, z: 0 }));
    }

    const surfaces = site.filter((c) => c.cover === undefined);
    const tookIt = surfaces.filter((c) => c.after === SCULK);
    const kept = site.filter((c) => c.after === SCULK && c.reloaded === SCULK);
    const placedWrong = site.filter((c) => c.placed !== c.surface).map((c) => `${c.label}=${c.placed}`);
    const covers = site.filter((c) => c.cover !== undefined).map((c) => `${c.label}: cover ${short(c.coverAfter ?? "?")} -> after reload ${short(c.coverReloaded ?? "?")}`);
    log(
      `P5 RESULT sculk via setType: ${tookIt.length}/${surfaces.length} bare surfaces read back minecraft:sculk ` +
        `(${surfaces.filter((c) => c.after !== SCULK).map((c) => `${c.label}=${c.after}`).join(", ") || "none refused"}); ` +
        `not placed as asked [${placedWrong.join(", ")}]; ids this engine lacks [${unknown.join(", ")}]`
    );
    log(`P5 RESULT covers after the surface turned to sculk: ${covers.join(" | ")}; items dropped by the swap [${dropped.join(",")}]`);
    log(
      `P5 RESULT chunk reload: chunks unloaded ${unloadTicks >= 0 ? `after ${unloadTicks} ticks` : "NEVER (600 ticks)"}, getBlock while unloaded ${unloadedRead}; ` +
        `after reload ${kept.length}/${site.filter((c) => c.after === SCULK).length} sculk cells still sculk ` +
        `(${site.filter((c) => c.after === SCULK && c.reloaded !== SCULK).map((c) => `${c.label}=${c.reloaded}`).join(", ") || "none changed"}); surfaces tested: ${surfaces.map((c) => c.label).join(",")}`
    );
    test.assert(site.find((c) => c.surface === STONE)?.placed === STONE, "control: the stone surface was not placed");
    test.assert(unloadTicks >= 0 && unloadedRead === "unloaded", `control: the site never unloaded (${unloadTicks}, ${unloadedRead}) — the reload proves nothing`);
  } finally {
    try {
      if (release === undefined) release = await loadBox(test, dim, "andrew_gt_sclk", box);
      for (const c of site) for (const dy of [-1, 0, 1]) dim.setBlockType(add(c.at, { x: 0, y: dy, z: 0 }), AIR);
      for (const e of dim.getEntities({ type: "minecraft:item", location: middle, maxDistance: 24 })) e.remove();
    } catch (err) {
      log(`P5 cleanup threw ${errText(err)}`);
    }
    release?.();
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2000)
  .tag("andrew");
