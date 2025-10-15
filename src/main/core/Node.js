import { Ensemble, Solo } from "@fizzwiz/ensemble";

/**
 * 🧠 **Node**
 * ------------
 * Represents a participant in the distributed computation network.
 *
 * A Node can **request**, **transport**, or **execute** computations.
 * These roles are realized through one or more attached {@link Sprite} instances.
 *
 * Internally, the Node is a {@link Solo} containing an {@link Ensemble} of Sprites.
 * This allows it to manage multiple specialized Sprites that cooperate
 * in distributed workflows.
 *
 * ---
 * 🧩 **Structure**
 * - `this.sprites` — An Ensemble containing all Sprites managed by this Node.
 * - `this.opts` — Optional configuration object, may include a token refresh policy.
 *
 * ---
 * 🌐 **Behavior**
 * - A Node may host multiple Sprites, each acting as an autonomous agent or worker.
 * - If `opts.token` is provided (with `{ url, beat }`), the Node periodically
 *   refreshes an authentication token from the given URL.
 * - Sprites and their Auras may then use this token to authenticate with
 *   network services (e.g., GaiaAura) for topology discovery or coordination.
 *
 * ---
 * @example
 * // Create a Node with multiple Sprites
 * const node = new Node({ token: { url: "https://auth.local/token", beat: 30000 } });
 * node.sprites.add("main", new Sprite("alice:main"));
 * node.sprites.add("worker", new Sprite("alice:worker"));
 *
 * console.log(node.sprites.keys()); // → ["main", "worker"]
 */
export class Node extends Solo {
  /**
   * Constructs a new Node instance.
   * Initializes its internal Ensemble of Sprites and, if configured,
   * starts periodic token refresh.
   *
   * @param {object} [opts] - Optional configuration.
   * @param {{ url: string, beat: number }} [opts.token] - Token refresh configuration.
   */
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.add("sprites", new Ensemble());

    // Periodic token refresh
    if (this.opts.token?.url && this.opts.token?.beat) {
      const tokenRefresher = AsyncWhat.as(this.refreshToken.bind(this))
        .self(2000)
        .else(err => this.notify("error", err));

      this.ostinato("refreshToken", tokenRefresher, Infinity, this.opts.token.beat, 1);
    }
  }

  /**
   * Returns the Ensemble of Sprites managed by this Node.
   *
   * @returns {Ensemble} The Ensemble containing this Node’s Sprites.
   */
  get sprites() {
    return this.get("sprites");
  }

  /**
   * Periodically refreshes the authentication token from the configured URL.
   * The token is stored as `this.token`.
   *
   * @returns {Promise<void>}
   */
  async refreshToken() {
    const token = await this.fetchToken();
    this.token = token;
  }

  /**
   * Fetches a fresh token from the configured endpoint.
   *
   * @returns {Promise<string>} The retrieved token string.
   * @throws {Error} If the HTTP request fails.
   */
  async fetchToken() {

    const res = await fetch(this.opts.token.url);
    if (!res.ok)
      throw new Error(`Token fetch failed: HTTP ${res.status} ${res.statusText}`);

    return res.text();
  }
}
