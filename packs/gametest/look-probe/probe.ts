// Crossbow-look probe on BDS: what the server's Molang answers about a held custom shooter,
// and whether a script can flip a held crossbow's icon state (minecraft:dyeable) without
// losing its charge. Dev-only: packs/gametest/look-probe/run.sh copies this file into
// src/gametest/ for one run, next to the player.json readout built by player-molang.mjs.

import { type Entity, GameMode, ItemStack, type RGB, system, world } from "@minecraft/server";
import { type SimulatedPlayer, type Test, registerAsync } from "@minecraft/server-gametest";

const STRUCTURE = "andrew:platform";
const SLOT = 0;
const AMMO_SLOT = 9;
const ARROW = "minecraft:arrow";
// The product swaps every arrow for this bolt in the arrow's spawn tick.
const BOLT = "andrew:sculk_bolt";
const PROBE = "andrew:probe_look_shooter";
// Must match player-molang.mjs.
const KEYS = ["c1", "c2", "hp", "mhud", "irud", "irun", "imud", "mhmd", "iiud", "iui", "iic", "iicm", "iic0", "isc", "ischg", "gaf"] as const;
const INT_BITS = 18;
const FRAC_BITS = 10;
const DRAW_TICKS = 34;
const WHITE: RGB = { red: 1, green: 1, blue: 1 };
const CYAN: RGB = { red: 0, green: 0.8, blue: 0.8 };

const log = (msg: string): void => console.warn(`[probe] LOOK ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const num = (n: number): string => String(Math.round(n * 1000) / 1000);
const rgb = (c: RGB | undefined): string => (c === undefined ? "undefined" : `${num(c.red)},${num(c.green)},${num(c.blue)}`);

type Reading = Record<(typeof KEYS)[number], number>;

function readMolang(p: SimulatedPlayer): Reading {
  const tags = new Set(p.getTags());
  const out = {} as Reading;
  for (const k of KEYS) {
    let v = 0;
    for (let i = 0; i < INT_BITS; i++) if (tags.has(`lp_${k}_i${i}`)) v += 2 ** i;
    for (let i = 0; i < FRAC_BITS; i++) if (tags.has(`lp_${k}_f${i}`)) v += 2 ** i / 1024;
    out[k] = tags.has(`lp_${k}_s`) ? -v : v;
  }
  return out;
}

const show = (r: Reading): string =>
  KEYS.filter((k) => k !== "c1" && k !== "c2" && k !== "hp")
    .map((k) => `${k}=${num(r[k])}`)
    .join(" ");

/** The readout is only evidence if its own controls decode: two constants and the player's health. */
function assertPipe(test: Test, r: Reading, where: string): void {
  test.assert(r.c1 === 1234.5 && r.c2 === -3.25 && r.hp > 0, `${where}: Molang readout broken (c1=${r.c1} c2=${r.c2} hp=${r.hp})`);
}

interface Session {
  t0: number;
  events: string[];
  arrows: number;
}

/** Item-use events and arrow spawns of one player, stamped relative to the open session. */
function watch(p: SimulatedPlayer): { session: () => Session; open: () => Session; close: () => void } {
  let cur: Session = { t0: system.currentTick, events: [], arrows: 0 };
  const on =
    (kind: string) =>
    (e: { source: { id: string }; useDuration?: number }): void => {
      if (e.source.id !== p.id) return;
      cur.events.push(`${kind}@+${system.currentTick - cur.t0}${e.useDuration === undefined ? "" : `(ud=${e.useDuration})`}`);
    };
  const start = world.afterEvents.itemStartUse.subscribe(on("start"));
  const complete = world.afterEvents.itemCompleteUse.subscribe(on("complete"));
  const release = world.afterEvents.itemReleaseUse.subscribe(on("release"));
  const stop = world.afterEvents.itemStopUse.subscribe(on("stop"));
  const use = world.afterEvents.itemUse.subscribe(on("use"));
  const spawn = world.afterEvents.entitySpawn.subscribe((e) => {
    const a: Entity = e.entity;
    if (!a.isValid || (a.typeId !== ARROW && a.typeId !== BOLT)) return;
    if (a.getComponent("minecraft:projectile")?.owner?.id !== p.id) return;
    cur.arrows++;
    cur.events.push(`${a.typeId === BOLT ? "bolt" : "arrow"}@+${system.currentTick - cur.t0}`);
    system.runTimeout(() => {
      if (a.isValid) a.remove();
    }, 2);
  });
  return {
    session: () => cur,
    open: () => {
      cur = { t0: system.currentTick, events: [], arrows: 0 };
      return cur;
    },
    close: () => {
      world.afterEvents.itemStartUse.unsubscribe(start);
      world.afterEvents.itemCompleteUse.unsubscribe(complete);
      world.afterEvents.itemReleaseUse.unsubscribe(release);
      world.afterEvents.itemStopUse.unsubscribe(stop);
      world.afterEvents.itemUse.unsubscribe(use);
      world.afterEvents.entitySpawn.unsubscribe(spawn);
    },
  };
}

async function arm(test: Test, p: SimulatedPlayer, item: string): Promise<void> {
  p.setItem(new ItemStack(item, 1), SLOT, true);
  p.getComponent("minecraft:inventory")?.container?.setItem(AMMO_SLOT, new ItemStack(ARROW, 64));
  await test.idle(10);
  p.lookAtLocation(test.worldLocation({ x: 60, y: 3.62, z: 3.5 }));
  await test.idle(2);
}

/** The shooter refuses a new use for some ticks after a shot; the count of refused calls is logged. */
async function startUse(test: Test, p: SimulatedPlayer, s: Session): Promise<number> {
  for (let attempt = 1; attempt <= 30; attempt++) {
    s.t0 = system.currentTick;
    if (p.useItemInSlot(SLOT)) return attempt;
    await test.idle(1);
  }
  return 0;
}

interface Weapon {
  name: string;
  item: string;
  /** Bow: release this many ticks into the draw. Crossbows end their own session. */
  release?: number;
}

const WEAPONS: readonly Weapon[] = [
  { name: "product", item: "andrew:sculk_crossbow" },
  { name: "probe", item: PROBE },
  { name: "crossbow", item: "minecraft:crossbow" },
  { name: "bow", item: "minecraft:bow", release: 25 },
];

for (const w of WEAPONS) {
  registerAsync("andrew", `probe_look_molang_${w.name}`, async (test: Test): Promise<void> => {
    const p = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 3 }, `look_${w.name}`, GameMode.Survival);
    const ev = watch(p);
    try {
      await arm(test, p, w.item);
      const rest: Reading[] = [];
      for (let i = 0; i < 3; i++) {
        await test.idle(1);
        rest.push(readMolang(p));
      }
      assertPipe(test, rest[2], `${w.name} rest`);
      log(`${w.name} item=${w.item} rest: ${show(rest[2])} | hp=${rest[2].hp} c1=${rest[2].c1} c2=${rest[2].c2}`);

      const draw = ev.open();
      const tries = await startUse(test, p, draw);
      const rows: Reading[] = [];
      let seen = 0;
      for (let dt = 1; dt <= DRAW_TICKS; dt++) {
        await test.idle(1);
        const r = readMolang(p);
        rows[dt] = r;
        const fresh = draw.events.slice(seen);
        seen = draw.events.length;
        log(`${w.name} draw +${dt}: ${show(r)}${fresh.length > 0 ? ` | ${fresh.join(" ")}` : ""}`);
        if (w.release === dt) p.stopUsingItem();
      }
      const stillUsing = w.release === undefined && p.stopUsingItem() !== undefined;
      await test.idle(5);
      const loaded: Reading[] = [];
      for (let i = 0; i < 3; i++) {
        await test.idle(1);
        loaded.push(readMolang(p));
      }
      log(`${w.name} after draw (+${DRAW_TICKS + 8}): ${show(loaded[2])} | stillUsingAt+${DRAW_TICKS}=${stillUsing} arrows=${draw.arrows} events=[${draw.events.join(" ")}]`);

      const tap = ev.open();
      const tapTries = await startUse(test, p, tap);
      await test.idle(1);
      p.stopUsingItem();
      const after: Reading[] = [];
      for (let i = 0; i < 6; i++) {
        await test.idle(1);
        after.push(readMolang(p));
      }
      log(`${w.name} after tap (+7): ${show(after[5])} | tapStartedOnTry=${tapTries} arrows=${tap.arrows} events=[${tap.events.join(" ")}]`);
      assertPipe(test, after[5], `${w.name} after tap`);
      log(
        `${w.name} RESULT drawStartedOnTry=${tries} | rest: ${show(rest[2])} | mid(+12): ${show(rows[12])} | ` +
          `end(+26): ${show(rows[26])} | loaded(+${DRAW_TICKS + 8}): ${show(loaded[2])} | shot(+7): ${show(after[5])} | ` +
          `drawArrows=${draw.arrows} tapArrows=${tap.arrows}`
      );
    } finally {
      ev.close();
      if (p.isValid) test.removeSimulatedPlayer(p);
    }
    test.succeed();
  })
    .structureName(STRUCTURE)
    .maxTicks(600)
    .tag("andrew");
}

function heldDye(p: SimulatedPlayer): string {
  try {
    const item = p.getComponent("minecraft:inventory")?.container?.getItem(SLOT);
    if (item === undefined) return "no item";
    const dye = item.getComponent("minecraft:dyeable");
    return dye === undefined ? `${item.typeId} has no dyeable` : rgb(dye.color);
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

/** Rewrite the held stack with a new dye colour, the only way a script changes a slot's item. */
function writeDye(p: SimulatedPlayer, color: RGB | undefined): string {
  try {
    const c = p.getComponent("minecraft:inventory")?.container;
    const item = c?.getItem(SLOT);
    const dye = item?.getComponent("minecraft:dyeable");
    if (c === undefined || item === undefined || dye === undefined) return "no dyeable item in slot";
    dye.color = color;
    c.setItem(SLOT, item);
    return `wrote ${rgb(color)} -> reads ${heldDye(p)}`;
  } catch (err) {
    return `threw ${errText(err)}`;
  }
}

/** Draw until the session completes on its own (or 40 ticks), then report. */
async function charge(test: Test, p: SimulatedPlayer, s: Session, midWrite?: { at: number; color: RGB }): Promise<string> {
  const tries = await startUse(test, p, s);
  let note = "";
  for (let dt = 1; dt <= 40; dt++) {
    await test.idle(1);
    if (midWrite?.at === dt) note = ` midWrite@+${dt}: ${writeDye(p, midWrite.color)}`;
    if (s.events.some((e) => e.startsWith("complete") || e.startsWith("stop") || e.startsWith("release"))) break;
  }
  const open = p.stopUsingItem() !== undefined;
  await test.idle(3);
  return `startedOnTry=${tries} events=[${s.events.join(" ")}] sessionStillOpen=${open}${note}`;
}

async function tap(test: Test, p: SimulatedPlayer, s: Session): Promise<string> {
  const tries = await startUse(test, p, s);
  await test.idle(1);
  p.stopUsingItem();
  await test.idle(4);
  return `startedOnTry=${tries} arrows=${s.arrows} events=[${s.events.join(" ")}]`;
}

registerAsync("andrew", "probe_look_dye", async (test: Test): Promise<void> => {
  const p = test.spawnSimulatedPlayer({ x: 1, y: 2, z: 3 }, "look_dye", GameMode.Survival);
  const ev = watch(p);
  const unsubscribe: (() => void)[] = [];
  try {
    const fresh = new ItemStack(PROBE, 1);
    let comp = "absent";
    try {
      const d = fresh.getComponent("minecraft:dyeable");
      if (d !== undefined) comp = `present color=${rgb(d.color)} defaultColor=${rgb(d.defaultColor)}`;
    } catch (err) {
      comp = `threw ${errText(err)}`;
    }
    log(`dye component on a fresh ${PROBE}: ${comp}`);
    await arm(test, p, PROBE);
    const m = (): string => {
      const r = readMolang(p);
      return `iic=${num(r.iic)} iicm=${num(r.iicm)} iic0=${num(r.iic0)} isc=${num(r.isc)} gaf=${num(r.gaf)}`;
    };

    // A: control, no write.
    log(`dye A charge: ${await charge(test, p, ev.open())} | ${m()} dye=${heldDye(p)}`);
    log(`dye A tap: ${await tap(test, p, ev.open())}`);

    // B: dye the charged crossbow, then fire.
    log(`dye B charge: ${await charge(test, p, ev.open())} | before write ${m()}`);
    log(`dye B write: ${writeDye(p, WHITE)}`);
    await test.idle(2);
    log(`dye B after write: ${m()} dye=${heldDye(p)}`);
    log(`dye B tap: ${await tap(test, p, ev.open())} | dye=${heldDye(p)}`);

    // C: dye in the middle of the draw.
    log(`dye C charge with a write at +12: ${await charge(test, p, ev.open(), { at: 12, color: CYAN })} | ${m()} dye=${heldDye(p)}`);
    log(`dye C tap: ${await tap(test, p, ev.open())}`);

    // D: clear the colour.
    log(`dye D clear: ${writeDye(p, undefined)}`);

    // F: a new tint on every tick of the draw, the most an icon can follow the pull.
    const f = ev.open();
    const fTries = await startUse(test, p, f);
    const fWrites: string[] = [];
    for (let dt = 1; dt <= 30 && !f.events.some((e) => e.startsWith("complete") || e.startsWith("stop")); dt++) {
      const k = Math.min(dt / 25, 1);
      fWrites.push(writeDye(p, { red: k, green: k, blue: 1 }).startsWith("wrote") ? "w" : "x");
      await test.idle(1);
    }
    p.stopUsingItem();
    await test.idle(3);
    log(`dye F per-tick tint: startedOnTry=${fTries} writes=${fWrites.join("")} events=[${f.events.join(" ")}] dye=${heldDye(p)}`);
    log(`dye F tap: ${await tap(test, p, ev.open())}`);
    log(`dye F clear: ${writeDye(p, undefined)}`);

    // E: the kit's rule: dye on the tick the charge completes, clear on the next press.
    const onComplete = world.afterEvents.itemCompleteUse.subscribe((e) => {
      if (e.source.id === p.id && e.itemStack.typeId === PROBE) system.run(() => log(`dye E rule complete -> ${writeDye(p, WHITE)}`));
    });
    unsubscribe.push(() => world.afterEvents.itemCompleteUse.unsubscribe(onComplete));
    const onStart = world.afterEvents.itemStartUse.subscribe((e) => {
      if (e.source.id !== p.id || e.itemStack.typeId !== PROBE) return;
      if (e.itemStack.getComponent("minecraft:dyeable")?.color === undefined) return;
      system.run(() => log(`dye E rule press -> ${writeDye(p, undefined)}`));
    });
    unsubscribe.push(() => world.afterEvents.itemStartUse.unsubscribe(onStart));
    for (let round = 1; round <= 2; round++) {
      log(`dye E${round} charge: ${await charge(test, p, ev.open())} | ${m()} dye=${heldDye(p)}`);
      log(`dye E${round} tap: ${await tap(test, p, ev.open())} | ${m()} dye=${heldDye(p)}`);
    }
    log(`dye RESULT done`);
  } finally {
    for (const u of unsubscribe) u();
    ev.close();
    if (p.isValid) test.removeSimulatedPlayer(p);
  }
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(1200)
  .tag("andrew");

registerAsync("andrew", "probe_look_items", async (test: Test): Promise<void> => {
  const ids = [
    PROBE,
    "andrew:probe_look_plain",
    "andrew:probe_look_icon_keys",
    "andrew:probe_look_flip",
    "andrew:probe_look_icon_variant",
    "andrew:probe_look_ctl_nodefault",
    "andrew:probe_look_ctl_badtype",
    "andrew:probe_look_ctl_unknown",
  ];
  for (const id of ids) {
    try {
      const s = new ItemStack(id, 1);
      log(`item ${id}: registered, components=[${s.getComponents().map((c) => c.typeId).join(" ")}]`);
    } catch (err) {
      log(`item ${id}: ${errText(err)}`);
    }
  }
  log(`items RESULT done`);
  await test.idle(1);
  test.succeed();
})
  .structureName(STRUCTURE)
  .maxTicks(100)
  .tag("andrew");
