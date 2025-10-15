import { Solo } from "@fizzwiz/ensemble";

/**
 * 🌌 **Aura**
 * ------------
 * Abstract base class for discovering and attaching `Vibe` connections to a `Sprite`.
 *
 * In Gaia’s distributed ecosystem, an **Aura** represents a *field of discovery*
 * that surrounds a `Sprite`. It defines how the Sprite perceives and establishes
 * new connections (`Vibes`) within its environment.
 *
 * ---
 * 🧩 **Subclassing**
 * - `GaiaAura` — Periodically queries the Gaia network for nearby Sprites.
 * - `HttpAura` — Listens for incoming WebSocket or HTTP requests to form new Vibes.
 *
 * ---
 * 💫 **Attachment Model**
 * Auras are not bound to a Sprite at construction time.  
 * Instead, they are explicitly attached by adding them to the Sprite’s `auras` ensemble:
 *
 * ```js
 * const aura = new GaiaAura();
 * sprite.auras.add("gaia", aura);
 * console.log(aura.sprite === sprite); // true
 * ```
 *
 * ---
 * @abstract
 */
export class Aura extends Solo {

  constructor() {
    super();
  }

  /**
   * Returns the Sprite that owns this Aura.
   *
   * Relationship chain:
   * ```
   * this (Aura)
   *   → this.ensemble (sprite.auras)
   *       → this.ensemble.ensemble (sprite)
   * ```
   *
   * @returns {Sprite|undefined} The owning Sprite, or `undefined` if not attached.
   */
  get sprite() {
    return this.ensemble?.ensemble;
  }
}
