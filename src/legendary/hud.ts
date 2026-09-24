// Action Bar state of every held legendary: the cooldown countdown, or "Ready"
// continuously while the item is in either hand
// [src: decision-legendary-ready-hud].

import { type Player, type RawMessage, system, world } from "@minecraft/server";
import { remainingMs } from "./cooldown";
import { heldLegendaries } from "./hands";

const HUD_INTERVAL_TICKS = 10;

export function registerLegendaryHud(): void {
  system.runInterval(() => {
    for (const entry of world.getAllPlayers()) {
      // Typed non-nullable, but a SimulatedPlayer arrives as undefined in a
      // pack that does not load the beta gametest module.
      const player: Player | undefined = entry;
      if (player === undefined) {
        continue;
      }
      try {
        renderFor(player);
      } catch (err) {
        const why = err instanceof Error ? err.message : String(err);
        console.warn(`[andrew] legendary hud failed for ${player.name}: ${why}`);
      }
    }
  }, HUD_INTERVAL_TICKS);

  console.warn("[andrew] legendary hud armed");
}

/** The Action Bar message for `player`, or undefined when no legendary is held. */
export function hudMessage(player: Player): RawMessage | undefined {
  const parts: RawMessage[] = [];
  const seen = new Set<string>();
  for (const { def } of heldLegendaries(player)) {
    if (seen.has(def.abilityKey)) {
      continue;
    }
    seen.add(def.abilityKey);

    const name: RawMessage = { translate: `${def.nameKey}.name` };
    const remaining = remainingMs(player, def.abilityKey);
    if (parts.length > 0) {
      parts.push({ text: "   " });
    }
    parts.push(
      remaining > 0
        ? {
            translate: "andrew.legendary.cooldown",
            with: { rawtext: [name, { text: String(Math.ceil(remaining / 1000)) }] },
          }
        : { translate: "andrew.legendary.ready", with: { rawtext: [name] } }
    );
  }
  return parts.length === 0 ? undefined : { rawtext: parts };
}

function renderFor(player: Player): void {
  const message = hudMessage(player);
  // Nothing at all without a legendary in hand — a cleared bar would fight
  // anything else writing to it.
  if (message !== undefined) {
    player.onScreenDisplay.setActionBar(message);
  }
}
