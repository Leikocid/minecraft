// The Orbital Cannon module. Deviations from the spec: README.md (C-16).

import { registerOrbitalInput } from "./activation";
import { DEFAULT_SCOPE, registerFlight } from "./flight";
import { registerStubEffect } from "./stub-effect";

export { type Column, type Effect, type Mode, registerEffect } from "./charge";

/** `scope` prefixes this runtime's attack ids; a second script runtime in the same world needs its own (README.md, deviation 7). */
export function registerOrbitalCannon(scope: string = DEFAULT_SCOPE): void {
  registerStubEffect();
  registerOrbitalInput();
  registerFlight(scope);
  console.warn(`[andrew] orbital cannon armed (itemUse + itemStartUseOn + entityHitBlock + playerSwingStart), scope ${scope}`);
}
