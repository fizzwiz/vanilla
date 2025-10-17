import { Ensemble, Solo } from "@fizzwiz/ensemble";
import { SortedArray, ORDER } from "@fizzwiz/sorted";

/**
 * Represents a distributed network unit that autonomously maintains
 * its connectivity and state.
 *
 * Sprites are fed by one or more `Aura` instances that manage discovery
 * and the creation of `Vibe` connections.
 * 
 * The Sprite is usually added to the sprites ensemble of some Node. The property 'node' retrieves the node
 * this sprite belongs to.
 *
 * ---
 * 🧩 **Ensemble Structure**
 *
 * - `this.vibes` stores all active WebSocket connections (Vibes).
 * - `this.auras` stores all feeding Auras responsible for discovering Vibes.
 *
 * ---
 * 🌀 **Ostinato (Periodic Tasks)**
 *
 * - Refresh Vibes: periodically selects the top `this.opts.connectivity` Vibes
 *   and mutes the rest.
 *
 * ---
 * 🎧 **Cues (Event-Driven Listeners)**
 *
 * - `on error`: Logs errors to the console.
 * - `on close`: Removes closed connections from the ensemble.
 *
 * ---
 * 🌐 **Neighborhood Convergence**
 *
 * Each Vibe has a value. The periodic Vibe refresh ensures that the Sprite
 * maintains the most valuable neighborhood.
 *
 * ---
 * 🧠 **Design Rationale**
 *
 * The `Sprite` class embodies an autonomous agent within a distributed
 * computation network. Its awareness of the environment is delegated
 * to its feeding Auras, and it converges to the most valuable network topology.
 */
export class Sprite extends Solo {

  /** @type {string} */
  id;

  /** @type {{connectivity: number, beat: number}} */
  opts;

  constructor(id, opts = {connectivity: 20, beat: 20*1000}) {
    super();
    this.id = id;
    this.opts = opts;

    // Ensembles for auras and active vibes
    this.add('auras', new Ensemble());
    this.add('vibes', new Ensemble());

    // Ostinato: periodically refresh the most valuable vibes
    const vibeRefresher = AsyncWhat.as(this.refreshVibes.bind(this))
      .self(2000)
      .else(err => this.notify(err));

    this
      .ostinato("refreshVibes", vibeRefresher, Infinity, this.opts.beat, 1)
      .cue("closeCue", this, "close", this.onClose.bind(this));
  }

  /**
   * The node owning this sprite
   */
  get node() {
    return this.ensemble?. // node.sprites
      ensemble;
  }

  /** @returns {Ensemble} */
  get auras() {
    return this.get("auras");
  }

  /** @returns {Ensemble} */
  get vibes() {
    return this.get("vibes");
  }
  
  /**
   * Refreshes the Sprite’s Vibes.
   *
   * - Closes inactive Vibes.
   * - Sorts active Vibes by their `value`.
   * - Retains the top `this.opts.connectivity` Vibes.
   * - Mutes the rest, allowing them to finish pending messages.
   *
   * @returns {Promise<void>}
   */
  async refreshVibes() {
    const now = Date.now();

    // Close inactive Vibes
    for (const vibe of Each.as(this.vibes).which(vibe => !vibe.isActive(this.opts.beat, now))) {
      vibe.primo.close(1000, "inactive socket"); // Close the underlying WebSocket
    }

    // Mute excess Vibes if above connectivity limit
    if (this.opts.connectivity < this.vibes.players.size) {
      const sorted = new SortedArray(ORDER.DESCENDING).letAll(this.vibes);
      const discarded = sorted.select(this.opts.connectivity);

      for (const vibe of discarded) {
        vibe.mute();
      }
    }
  }

  /**
   * Emits an error and logs it.
   * @param {Error} error
   */
  notify(error) {
    this.emit("error", error, this);
    console.error(error);
  }

  /**
   * Handles closing of a Vibe.
   * @param {...any} args
   */
  onClose(...args) {
    const vibe = args.at(-1);
    if (vibe) this.vibes.remove(vibe.name);
  }

  /**
   * Sends a message using the next available Vibe in round-robin order.
   *
   * This method:
   * - Rotates the Vibe ensemble,
   * - Throws if the selected Vibe is muted or fails the provided predicate,
   * - Otherwise sends the message immediately through the Vibe’s WebSocket (`vibe.primo.send()`).
   *
   * Because this method throws on failure, it integrates seamlessly with
   * `AsyncWhat.self()` or similar retry logic — allowing predictable retries
   * across all available Vibes.
   *
   * Returning `true` signals a successful send, preventing further retries.
   *
   * @param {*} msg - The message to send. Must be compatible with `WebSocket.send()`.
   * @param {function(Vibe): boolean} [predicate=() => true] -
   *        Optional filter function applied to the chosen Vibe before sending.
   *        The Vibe must satisfy this predicate to be used.
   * @param {Error} [error=new Error("Selected Vibe does not satisfy predicate")] -
   *        The error to throw if the predicate check fails.
   *
   * @returns {true} Indicates the message was successfully sent.
   * @throws {Error} If the selected Vibe is muted or fails the predicate.
   *
   * @example
   * // Simple send to the next available Vibe
   * sprite.send("Hello!");
   *
   * @example
   * // Retry automatically across all Vibes
   * await AsyncWhat.as(() => sprite.send("Hello!"))
   *   .self(sprite.vibes.players.size, 0)();
   */
  send(msg, predicate = () => true, error = new Error("Selected Vibe does not satisfy predicate")) {
    const vibe = this.vibes.rotate();
    if (vibe.muted) throw new Error("Selected Vibe is muted");
    if (!predicate(vibe)) throw error;
    vibe.primo.send(msg);
    return true; // Needed so AsyncWhat.self() recognizes success and stops retrying
  }

  /**
   * 🆔 **Generates a unique Sprite identifier.**
   *
   * Each Sprite belongs to a user. The Sprite’s identifier encodes both the
   * user and its local name using the format:
   *
   * ```text
   * <user>:<name>
   * ```
   *
   * This ensures Sprite IDs are globally unique within the distributed network.
   * Sprite configuration and metadata are typically stored in the user’s database.
   *
   * @param {*} user - The owner or user ID of the Sprite.
   * @param {*} name - The Sprite’s local name or role under the user.
   * @returns {string} The encoded Sprite ID, e.g. `"alice:chatbot"`.
   *
   * @example
   * const id = Sprite.id("alice", "chatbot");
   * console.log(id); // "alice:chatbot"
   */
  static id(user, name) {
    return `${user}:${name}`;
  }

  /**
   * 🧩 **Parses a Sprite ID into its components.**
   *
   * Given a Sprite identifier in the `<user>:<name>` format,
   * returns an object with separate `user` and `name` fields.
   *
   * @param {string} id - The Sprite identifier to parse.
   * @returns {{ user: string, name: (string|undefined) }}
   *          An object containing the parsed `user` and `name`.
   *
   * @example
   * const parsed = Sprite.parseId("alice:chatbot");
   * console.log(parsed); // { user: "alice", name: "chatbot" }
   */
  static parseId(id) {
    const [user, name] = id.split(":");
    return { user, name };
  }

  /**
   * 🔗 **Checks if this Sprite is connected to a given target.**
   *
   * The target ID (`trgId`) may represent either:
   * - a full Sprite ID (`"user:name"`)
   * - or just a user ID (`"user"`)
   *
   * The method iterates over all active Vibes and returns `true` if:
   * - any connected Vibe belongs to the same user as `trgId`, and
   * - either:
   *   - `trgId` has no name part (user-level connection), or
   *   - the Vibe’s Sprite name matches `trgName`.
   *
   * @param {string} trgId - The target Sprite or user identifier.
   * @returns {boolean} Whether this Sprite is connected to the given target.
   *
   * @example
   * sprite.isConnectedTo("alice");        // true if any vibe belongs to Alice
   * sprite.isConnectedTo("alice:worker"); // true if connected specifically to Alice's worker Sprite
   */
  static isConnectedTo(srcId, trgId) {
    const { user: trgUser, name: trgName } = Sprite.parseId(trgId);

    for (const vibe of this.vibes.players) {
      const { user, name } = Sprite.parseId(vibe.name);
      if (trgUser !== user) continue;
      if (!trgName || trgName === name) return true;
    }

    return false;
  }




  
}
