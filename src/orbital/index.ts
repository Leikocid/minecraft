// The Orbital Cannon module. Deviations from the spec: README.md (C-16).

import { registerOrbitalInput } from "./activation";
import { registerStubEffect } from "./stub-effect";

export { type Column, type Effect, type Mode, registerEffect } from "./charge";

export function registerOrbitalCannon(): void {
  registerStubEffect();
  registerOrbitalInput();
  console.warn("[andrew] orbital cannon armed (itemUse + itemStartUseOn + entityHitBlock + playerSwingStart)");
}
