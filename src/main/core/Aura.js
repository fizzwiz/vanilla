import { Solo } from "@fizzwiz/ensemble";

/**
 * 🌌 Aura
 * --------
 * Abstract base class for discovering and attaching `Vibe` connections to a `Sprite`.
 *
 * In Gaia’s distributed ecosystem, an **Aura** represents a *field of discovery*
 * that surrounds a `Sprite`. It defines how the Sprite perceives and establishes
 * new connections (`Vibes`) within its environment.
 *
 * Subclasses implement specific discovery mechanisms:
 * - `GaiaAura` — Periodically queries the Gaia network for nearby Sprites.
 * - `HttpAura` — Listens for incoming WebSocket or HTTP requests to form new Vibes.
 *
 * An Aura does not *own* its Sprite; rather, it *enriches* it by managing its
 * connectivity field. It can operate independently, even without being added
 * to `sprite.auras`.
 *
 * @abstract
 */
export class Aura extends Solo {
  /**
   * The Sprite this Aura surrounds.
   * @type {Sprite}
   */
  target;

  /**
   * @param {Sprite} target - The Sprite this Aura surrounds.
   */
  constructor(target) {
    super();
    this.target = target;
  }

  /**
   * Adds this Aura to the `sprite.auras` 
   * This is useful for:
   * - event propagation - it allows the Sprite to receive all events emitted by the Aura.
   * - life cycle coordination - play()/pause() the sprite automatically play()/pause() the Aura
   * 
   * @param {string} name 
   */
  connect(name) {
    this.target.auras.add(name, this);
    return this;
  }
  
}

  
  