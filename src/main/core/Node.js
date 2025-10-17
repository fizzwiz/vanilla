import { Ensemble, Solo } from "@fizzwiz/ensemble";

/**
 * 🧠 **Node**
 * ------------
 * Represents a participant in the distributed computation network.
 *
 * A Node can **request**, **transport**, or **execute** computations.
 * These roles are realized through one or more attached {@link Sprite} instances.
 *
 * Internally, a Node is a {@link Solo} containing an {@link Ensemble} of Sprites,
 * allowing it to manage multiple specialized Sprites that cooperate in distributed workflows.
 *
 * ---
 * 🧩 **Structure**
 * - `this.sprites` — An Ensemble containing all Sprites managed by this Node.
 * - `this.opts` — The configuration object. It may define token and self-refresh policies.
 *
 * ---
 * ⚙️ **Dynamic Behavior**
 * - Periodically refreshes an authentication token (if `opts.token` provides `{ url, beat }`).
 *   This token can then be used by Sprites and their Auras for authenticated operations
 *   (e.g., Gaia topology discovery).
 * - Periodically refreshes its configuration (`opts.self` with `{ url, beat }`),
 *   then invokes its subclass-defined {@link sync} method to reconfigure internal structure.
 *
 * Subclasses implement their own `sync()` method to reconcile the Node’s state
 * with the latest configuration (`this.opts`), which may include updates
 * to its Sprites, Auras, or network topology.
 *
 * ---
 * @example
 * // Create a Node that periodically refreshes its token and configuration
 * const node = new Node({
 *   token: { url: "https://auth.local/token", beat: 30_000 },
 *   self: { url: "https://config.local/node.json", beat: 60_000 },
 * });
 *
 * node.sprites.add("main", new Sprite("alice:main"));
 * node.sprites.add("worker", new Sprite("alice:worker"));
 *
 * console.log(node.sprites.keys()); // → ["main", "worker"]
 */
export class Node extends Solo {
  /**
   * 
   * Synchronizes this Node’s structure with the current configuration (`this.opts`).
   * Must be implemented by subclasses.
   *
   * @returns {Promise<void>}
   * @abstract
   */
  async sync() {
    throw new Error("Node.sync() must be implemented by subclasses");
  }

  /**
   * Constructs a new Node instance.
   * Initializes its internal Ensemble of Sprites and sets up
   * periodic refresh tasks (token and/or configuration).
   *
   * @param {object} [opts={}] - Node configuration.
   * @param {{ url: string, beat: number }} [opts.token] - Token refresh settings.
   * @param {{ url: string, beat: number }} [opts.self] - Self-configuration refresh settings.
   */
  constructor(user, opts = {}) {
    super();
    this.user = user;
    this.opts = opts;
    this.add("sprites", new Ensemble());

    // Periodic token refresh
    if (this.opts.token?.url && this.opts.token?.beat) {
      const tokenRefresher = AsyncWhat.as(this.refreshToken.bind(this))
        .self(2000)
        .else(err => this.notify("error", err));

      this.ostinato("refreshToken", tokenRefresher, Infinity, this.opts.token.beat, 1);
    }

    // Periodic configuration refresh
    if (this.opts.self?.url && this.opts.self?.beat) {
      const refresher = AsyncWhat.as(this.refresh.bind(this))
        .self(2000)
        .else(err => this.notify("error", err));

      this.ostinato("refresh", refresher, Infinity, this.opts.self.beat, 1);
    }
  }

  /**
   * Returns the Ensemble of Sprites managed by this Node.
   * @returns {Ensemble}
   */
  get sprites() {
    return this.get("sprites");
  }

  // ────────────────────────────────────────────────
  // 🔑 Token Handling
  // ────────────────────────────────────────────────

  /**
   * Periodically refreshes the authentication token from the configured endpoint.
   * @returns {Promise<void>}
   */
  async refreshToken() {
    const token = await this.fetchToken();
    this.token = token;
  }

  /**
   * Fetches a new authentication token.
   * @returns {Promise<string>}
   * @throws {Error} If the HTTP request fails.
   */
  async fetchToken() {
    const res = await fetch(this.opts.token.url);
    if (!res.ok)
      throw new Error(`Token fetch failed: HTTP ${res.status} ${res.statusText}`);
    return res.text();
  }

  // ────────────────────────────────────────────────
  // ⚙️ Configuration Refresh
  // ────────────────────────────────────────────────

  /**
   * Refreshes the Node’s configuration (`this.opts`) and triggers re-synchronization.
   * @returns {Promise<void>}
   */
  async refresh() {
    await this.refreshOpts();
    await this.sync();
  }

  /**
   * Retrieves the latest configuration from `this.opts.self.url`.
   * @returns {Promise<void>}
   */
  async refreshOpts() {
    const opts = await this.fetchOpts();
    this.opts = opts;
  }

  /**
   * Fetches the Node’s configuration JSON from the self URL.
   * @returns {Promise<object>}
   * @throws {Error} If the HTTP request fails.
   */
  async fetchOpts() {
    const res = await fetch(this.opts.self.url);
    if (!res.ok)
      throw new Error(`Opts fetch failed: HTTP ${res.status} ${res.statusText}`);
    return res.json();
  }
}
