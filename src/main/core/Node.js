import { Ensemble, Solo } from "@fizzwiz/ensemble";

/**
 * 🧠 **Node**
 * ------------
 * Represents a participant in the distributed computation network.
 *
 * Each Node belongs to a **user**, whose state (`this.user`) includes
 * the Node’s configuration (`user.node.opts`).
 *
 * A Node must be bootstrapped with enough information to:
 * - periodically refresh its authentication token, and
 * - periodically refresh its full user record.
 *
 * Without these, the Node cannot self-organize and will throw on construction.
 */
export class Node extends Solo {
  /**
   * Subclasses must implement this to synchronize the Node’s structure
   * with the current user configuration (`this.user`).
   * @abstract
   */
  async sync() {
    throw new Error("Node.sync() must be implemented by subclasses");
  }

  /**
   * Constructs a new Node instance.
   *
   * The Node starts with a minimal bootstrap `user` object, containing
   * only the endpoints required to refresh its token and full configuration.
   *
   * The Node does **not** immediately call `sync()` — it waits until
   * the first successful `refresh()` cycle, when complete user data becomes available.
   *
   * @param {object} user - Minimal bootstrap information for this Node.
   * @throws {Error} If minimal configuration is missing.
   */
  constructor(user = {}) {
    super();
    this.user = user;
    this.add("sprites", new Ensemble());

    const opts = this.opts;
    this.#validateBootstrap(opts);

    // ───────────────────────────
    // 🔑 Token refresher
    // ───────────────────────────
    const tokenRefresher = AsyncWhat.as(this.refreshToken.bind(this))
      .self(2000)
      .else(err => this.notify("error", err));

    this.ostinato("refreshToken", tokenRefresher, Infinity, opts.token.beat, 1);

    // ───────────────────────────
    // ⚙️ Self refresher
    // ───────────────────────────
    const selfRefresher = AsyncWhat.as(this.refresh.bind(this))
      .self(2000)
      .else(err => this.notify("error", err));

    this.ostinato("refresh", selfRefresher, Infinity, opts.self.beat, 1);

  }

  /** Shortcut to the Node’s configuration options. */
  get opts() {
    return this.user?.node?.opts ?? {};
  }

  /** Returns the Ensemble of Sprites managed by this Node. */
  get sprites() {
    return this.get("sprites");
  }

  // ───────────────────────────
  // 🔑 Token Handling
  // ───────────────────────────

  async refreshToken() {
    const token = await this.fetchToken();
    this.token = token;
  }

  async fetchToken() {
    const res = await fetch(this.opts.token.url);
    if (!res.ok)
      throw new Error(`Token fetch failed: HTTP ${res.status} ${res.statusText}`);
    return res.text();
  }

  // ───────────────────────────
  // ⚙️ Configuration Refresh
  // ───────────────────────────

  async refresh() {
    await this.refreshUser();
    await this.sync();
  }

  async refreshUser() {
    const newUser = await this.fetchUser();
    this.user = newUser; // replace with latest user info
  }

  async fetchUser() {
    const res = await fetch(this.opts.self.url);
    if (!res.ok)
      throw new Error(`User fetch failed: HTTP ${res.status} ${res.statusText}`);
    return res.json();
  }

  // ───────────────────────────
  // 🔍 Validation Helpers
  // ───────────────────────────

  /**
   * Ensures the node has the minimal configuration required to operate.
   * Throws a clear error if any required property is missing.
   * @private
   */
  #validateBootstrap(opts) {
    const missing = [];

    if (!opts?.token?.url) missing.push("opts.token.url");
    if (!opts?.token?.beat) missing.push("opts.token.beat");
    if (!opts?.self?.url) missing.push("opts.self.url");
    if (!opts?.self?.beat) missing.push("opts.self.beat");

    if (missing.length > 0) {
      throw new Error(
        `Invalid Node bootstrap: missing ${missing.join(", ")}.\n` +
        `A Node must include at least:\n` +
        `  user.node.opts.token = { url, beat }\n` +
        `  user.node.opts.self  = { url, beat }`
      );
    }
  }
}
