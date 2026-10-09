// SCLKUI-LOADED-01: the engine facts the crossbow's loaded look stands on. No query tells "loaded"
// for this id (docs/feedback/probe-crossbow-look.md, Q3), so the attachable reads the shape of the
// use session. Each kind of session a player can make is pinned here with its shape and the engine's
// answer (an arrow spent at the load, a shot on the next tap), computed from the item's own
// use_duration and max_draw_duration. tests/sculk-crossbow-attachable.test.mjs runs 25-tick shapes
// through the attachable's Molang, not these (src/sculk/README.md, the loaded state).

import { EnchantmentType, type Entity, GameMode, ItemStack, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";
import { SCULK_CROSSBOW } from "../legendary/registry";
import { BOLT_ID } from "../sculk";
import sculkCrossbowItem from "../../packs/behavior/items/sculk_crossbow.json";

const STRUCTURE = "andrew:platform";
const ARROW = "minecraft:arrow";
const SLOT = 0;
const OTHER_SLOT = 1;
const AMMO_SLOT = 9;
const TICKS_PER_SECOND = 20;
const COMPONENTS = sculkCrossbowItem["minecraft:item"].components;
/** The use session of a copy without Quick Charge. */
const SESSION = Math.round(COMPONENTS["minecraft:use_modifiers"].use_duration * TICKS_PER_SECOND);
/** charge_on_draw loads a held press at max_draw_duration, and Quick Charge does not move it (CNTR-SCLK-CX02). */
const LOAD_AT = Math.round(COMPONENTS["minecraft:shooter"].max_draw_duration * TICKS_PER_SECOND);
/** Quick Charge takes this many ticks a level off the session (docs/feedback/probe-crossbow-look.md, addendum). */
const QUICK_CHARGE_TICKS = 5;
/** Longer than any session: an unended session at this point is reported, not waited for. */
const HOLD_TICKS = SESSION + 10;
/** A tap, mid-draw, the two ticks short of the load, the load, mid-way to the session's end and its last tick. */
const RELEASES = [...new Set([1, Math.floor(LOAD_AT / 2), LOAD_AT - 2, LOAD_AT - 1, LOAD_AT, Math.floor((LOAD_AT + SESSION) / 2), SESSION - 1])].filter((k) => k >= 1 && k < SESSION);

const log = (msg: string): void => console.warn(`[gametest] sculk-look ${msg}`);

interface Session {
  t0: number;
  /** "start@+0(ud=50)", "complete@+50(ud=0)", "bolt@+0", … stamped from t0. */
  events: string[];
  startUd?: number;
  /** The use duration left when the session ended, and how: complete, release or stop. */
  end?: { kind: string; ud: number; at: number };
  shots: number;
}

function watch(p: SimulatedPlayer): { open: () => Session; close: () => void } {
  let cur: Session = { t0: system.currentTick, events: [], shots: 0 };
  const stamp = (): number => system.currentTick - cur.t0;
  const on =
    (kind: string) =>
    (e: { source: { id: string }; useDuration?: number }): void => {
      if (e.source.id !== p.id) return;
      const ud = e.useDuration ?? -1;
      cur.events.push(`${kind}@+${stamp()}(ud=${ud})`);
      if (kind === "start" && cur.startUd === undefined) cur.startUd = ud;
      if (kind !== "start" && cur.end === undefined) cur.end = { kind, ud, at: stamp() };
    };
  const start = world.afterEvents.itemStartUse.subscribe(on("start"));
  const complete = world.afterEvents.itemCompleteUse.subscribe(on("complete"));
  const release = world.afterEvents.itemReleaseUse.subscribe(on("release"));
  const stop = world.afterEvents.itemStopUse.subscribe(on("stop"));
  const spawn = world.afterEvents.entitySpawn.subscribe((e) => {
    const a: Entity = e.entity;
    if (!a.isValid || (a.typeId !== ARROW && a.typeId !== BOLT_ID)) return;
    if (a.getComponent("minecraft:projectile")?.owner?.id !== p.id) return;
    cur.shots++;
    cur.events.push(`${a.typeId === BOLT_ID ? "bolt" : "arrow"}@+${stamp()}`);
    system.runTimeout(() => {
      if (a.isValid) a.remove();
    }, 2);
  });
  return {
    open: () => (cur = { t0: system.currentTick, events: [], shots: 0 }),
    close: () => {
      world.afterEvents.itemStartUse.unsubscribe(start);
      world.afterEvents.itemCompleteUse.unsubscribe(complete);
      world.afterEvents.itemReleaseUse.unsubscribe(release);
      world.afterEvents.itemStopUse.unsubscribe(stop);
      world.afterEvents.entitySpawn.unsubscribe(spawn);
    },
  };
}

function inventoryOf(p: SimulatedPlayer) {
  const container = p.getComponent("minecraft:inventory")?.container;
  if (container === undefined) throw new Error(`${p.name} has no inventory`);
  return container;
}

function ammo(p: SimulatedPlayer): number {
  const c = inventoryOf(p);
  let n = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.getItem(i);
    if (s?.typeId === ARROW) n += s.amount;
  }
  return n;
}

function crossbow(quickCharge: number): ItemStack {
  const stack = new ItemStack(SCULK_CROSSBOW.itemId, 1);
  if (quickCharge > 0) stack.getComponent("minecraft:enchantable")?.addEnchantment({ type: new EnchantmentType("quick_charge"), level: quickCharge });
  return stack;
}

/** The shooter refuses a use for up to ~9 ticks after a shot (probe report, "Сопутствующее"). */
async function startUse(test: Test, p: SimulatedPlayer, s: Session): Promise<boolean> {
  for (let attempt = 1; attempt <= 30; attempt++) {
    s.t0 = system.currentTick;
    if (p.useItemInSlot(SLOT)) return true;
    await test.idle(1);
  }
  return false;
}

/** One session: press, hold `release` ticks (or until the engine ends it), let go. */
async function hold(test: Test, p: SimulatedPlayer, s: Session, release = HOLD_TICKS): Promise<{ started: boolean; ammoSpent: number }> {
  const before = ammo(p);
  const started = await startUse(test, p, s);
  if (started) {
    await test.idle(release);
    p.stopUsingItem();
  }
  await test.idle(3);
  return { started, ammoSpent: before - ammo(p) };
}

/** The engine's answer: a loaded crossbow shoots on a tap, an empty one only opens a one-tick session. */
async function tap(test: Test, p: SimulatedPlayer, s: Session): Promise<boolean> {
  test.assert(await startUse(test, p, s), "the tap never started");
  await test.idle(1);
  p.stopUsingItem();
  await test.idle(4);
  return s.shots > 0;
}

interface Fact {
  startUd: number;
  end: string;
  /** Arrows spent by the session: a load spends one, outside Creative. */
  ammoSpent: number;
  /** Shots during the session itself: the press of a loaded crossbow. */
  shots: number;
  /** The engine's answer: the next tap shoots. */
  loaded: boolean;
}

/** One kind of session, as the scenario plays it. */
interface Draw {
  /** Ticks the press is held; a shorter session completes on its own. */
  held: number;
  quickCharge?: number;
  noArrows?: boolean;
  creative?: boolean;
  /** The press finds the crossbow loaded, so it fires before it draws. */
  firesFirst?: boolean;
}

const DRAWS: Readonly<Record<string, Draw>> = {
  full_draw: { held: HOLD_TICKS },
  ...Object.fromEntries(RELEASES.map((k) => [`release_at_${k}`, { held: k }])),
  fire_then_hold: { held: HOLD_TICKS, firesFirst: true },
  full_draw_then_hotbar_away_and_back: { held: HOLD_TICKS },
  no_arrows_survival: { held: HOLD_TICKS, noArrows: true },
  quick_charge_1: { held: HOLD_TICKS, quickCharge: 1 },
  quick_charge_3: { held: HOLD_TICKS, quickCharge: 3 },
  no_arrows_creative: { held: HOLD_TICKS, noArrows: true, creative: true },
  creative_with_arrows: { held: HOLD_TICKS, creative: true },
};

/** The engine's answer for a draw, from the item's own use_duration and max_draw_duration. */
function expected(d: Draw): Fact {
  const session = SESSION - QUICK_CHARGE_TICKS * (d.quickCharge ?? 0);
  const end = d.held >= session ? `complete@+${session}(ud=0)` : `release@+${d.held}(ud=${session - d.held})`;
  // A release on the load tick keeps the load. With no arrows, Creative loads and spends none, and
  // Survival runs the whole session and loads nothing.
  const loaded = Math.min(d.held, session) >= LOAD_AT && (d.noArrows !== true || d.creative === true);
  return { startUd: session, end, ammoSpent: loaded && d.creative !== true ? 1 : 0, shots: d.firesFirst ? 1 : 0, loaded };
}

const show = (f: Fact): string => `start ud=${f.startUd} end=${f.end} ammo spent=${f.ammoSpent} shots=${f.shots} next tap ${f.loaded ? "SHOT" : "nothing"}`;

registerAsync("andrew", "sculk_look_loaded_sessions", async (test: Test): Promise<void> => {
  const p = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 1 }, "sk_look", GameMode.Survival);
  const ev = watch(p);
  const seen = new Map<string, Fact>();
  try {
    p.lookAtLocation(test.worldLocation({ x: 1, y: 60, z: 40 }));
    const arm = async (quickCharge = 0, arrows = 64): Promise<void> => {
      p.selectedSlotIndex = SLOT;
      p.setItem(crossbow(quickCharge), SLOT, false);
      inventoryOf(p).setItem(AMMO_SLOT, arrows > 0 ? new ItemStack(ARROW, arrows) : undefined);
      await test.idle(12);
    };
    const record = async (name: string, s: Session, h: { started: boolean; ammoSpent: number }): Promise<void> => {
      test.assert(h.started, `${name}: the session never started`);
      const shots = s.shots;
      const loaded = await tap(test, p, ev.open());
      const end = s.end === undefined ? "none" : `${s.end.kind}@+${s.end.at}(ud=${s.end.ud})`;
      const fact: Fact = { startUd: s.startUd ?? -1, end, ammoSpent: h.ammoSpent, shots, loaded };
      seen.set(name, fact);
      log(`${name}: ${show(fact)} | [${s.events.join(" ")}]`);
    };

    await arm();
    let s = ev.open();
    await record("full_draw", s, await hold(test, p, s));

    for (const k of RELEASES) {
      s = ev.open();
      await record(`release_at_${k}`, s, await hold(test, p, s, k));
    }

    // A press on a loaded crossbow, kept down past a full draw.
    s = ev.open();
    await hold(test, p, s);
    s = ev.open();
    await record("fire_then_hold", s, await hold(test, p, s));

    // Loaded, then the hand leaves the crossbow and comes back.
    s = ev.open();
    const h = await hold(test, p, s);
    p.selectedSlotIndex = OTHER_SLOT;
    await test.idle(10);
    p.selectedSlotIndex = SLOT;
    await test.idle(3);
    await record("full_draw_then_hotbar_away_and_back", s, h);

    await arm(0, 0);
    s = ev.open();
    await record("no_arrows_survival", s, await hold(test, p, s));

    for (const qc of [1, 3]) {
      await arm(qc);
      s = ev.open();
      await record(`quick_charge_${qc}`, s, await hold(test, p, s));
    }

    p.setGameMode(GameMode.Creative);
    await arm(0, 0);
    s = ev.open();
    await record("no_arrows_creative", s, await hold(test, p, s));
    await arm(0, 64);
    s = ev.open();
    await record("creative_with_arrows", s, await hold(test, p, s));

    const changed = Object.keys(DRAWS).filter((name) => {
      const f = seen.get(name);
      return f === undefined || show(f) !== show(expected(DRAWS[name]));
    });
    log(`loaded_sessions RESULT session=${SESSION} load=+${LOAD_AT} ${seen.size} sessions, ${changed.length} differ from the item: ${[...seen].map(([name, f]) => `${name}=${f.loaded ? "L" : "-"}`).join(" ")}`);
    for (const name of changed) {
      const f = seen.get(name);
      test.assert(false, `${name}: engine gave ${f === undefined ? "nothing" : show(f)}, the item's use_duration and max_draw_duration give ${show(expected(DRAWS[name]))}`);
    }
  } finally {
    ev.close();
    if (p.isValid) test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(2400)
  .tag("andrew");
