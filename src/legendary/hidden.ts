// "Hidden from targeting" — the state the Shadow Blade's ability will set
// [src: decision-scythe-hidden-target]. The Shadow Blade replaces only the
// body of isHiddenFromTargeting(); every targeting ability reads it through
// here. Vanilla invisibility is deliberately not hiding.
//
// `/andrew:hide <seconds> [target]` sets the same state by hand, for the
// operator's check of Scythe acceptance test 3.

import {
  CommandPermissionLevel,
  type CustomCommandOrigin,
  CustomCommandParamType,
  type CustomCommandResult,
  CustomCommandStatus,
  Player,
  system,
} from "@minecraft/server";
import { isHiddenAt } from "../scythe/targeting-rules";

/** Player property: epoch-ms deadline of the hidden state. */
export const HIDDEN_UNTIL_KEY = "andrew:hidden_until";

const HIDE_COMMAND = "andrew:hide";

/**
 * Dynamic properties are private to the pack that writes them: a player hidden
 * by the release pack reads as not hidden in the GameTest pack and vice versa.
 */
export function isHiddenFromTargeting(player: Player): boolean {
  return isHiddenAt(Date.now(), player.getDynamicProperty(HIDDEN_UNTIL_KEY));
}

/** Hides `player` for `seconds` from now; zero or less clears the state. */
export function hideFromTargeting(player: Player, seconds: number): void {
  player.setDynamicProperty(HIDDEN_UNTIL_KEY, seconds > 0 ? Date.now() + seconds * 1000 : undefined);
}

export function registerHideCommand(): void {
  system.beforeEvents.startup.subscribe((event) => {
    event.customCommandRegistry.registerCommand(
      {
        name: HIDE_COMMAND,
        description: "Hide a player from legendary targeting for N seconds (0 clears) — a stand-in for the Shadow Blade.",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [{ name: "seconds", type: CustomCommandParamType.Integer }],
        optionalParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }],
      },
      (origin, seconds: number, target?: unknown) => runHide(origin, seconds, target)
    );
    console.warn(`[andrew] registered /${HIDE_COMMAND} <seconds> [target]`);
  });
}

/** The callback is read-only; the write is deferred to the next tick. */
function runHide(origin: CustomCommandOrigin, seconds: number, target?: unknown): CustomCommandResult {
  const caller = origin.sourceEntity instanceof Player ? origin.sourceEntity : undefined;
  const targets = Array.isArray(target)
    ? target.filter((entry): entry is Player => entry instanceof Player)
    : target instanceof Player
      ? [target]
      : caller === undefined
        ? []
        : [caller];
  if (targets.length === 0) {
    return { status: CustomCommandStatus.Failure, message: `${HIDE_COMMAND}: no target — run it as a player, or name one` };
  }

  system.run(() => {
    for (const player of targets) {
      hideFromTargeting(player, seconds);
      console.warn(`[andrew] ${player.name} hidden from targeting for ${Math.max(0, seconds)} s`);
    }
  });
  return {
    status: CustomCommandStatus.Success,
    message: `${targets.map((p) => p.name).join(", ")} hidden from targeting for ${Math.max(0, seconds)} s`,
  };
}
