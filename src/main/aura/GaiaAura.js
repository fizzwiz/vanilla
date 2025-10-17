import { Aura } from "../core/Aura.js";
import { Vibe } from "../core/Vibe.js";

/**
 * 🌍 **GaiaAura**
 * ---------------
 * Surrounds a Sprite with a dynamic awareness of Gaia — the distributed network map.
 *
 * Periodically:
 * - Queries Gaia for updated network topology (`refreshGaiaImg`).
 * - Samples nearby Sprites offering WebSocket endpoints (`feedVibes`).
 * - Feeds the target Sprite with live {@link Vibe} connections.
 *
 * This class serves as the **environmental intelligence** of a Sprite,
 * keeping it aware of its surrounding peers in the distributed topology.
 *
 */
export class GaiaAura extends Aura {
  /**
   * @param {object} opts - Configuration options for Gaia and Vibe discovery.
   * @param {Function} wsConstructor - WebSocket constructor (or compatible).
   * @param {function(string): boolean} [serverFilter=() => true] - Optional filter for Gaia servers.
   */
  constructor(opts, wsConstructor, serverFilter = () => true) {
    super();

    this.opts = opts;
    this.wsConstructor = wsConstructor;
    this.serverFilter = serverFilter;
    this.gaiaImg = undefined;

    const gaiaImgRefresher = AsyncWhat.as(this.refreshGaiaImg.bind(this))
      .self(5000)
      .else(err => this.notify("error", err));

    const vibeFeeder = AsyncWhat.as(this.feedVibes.bind(this))
      .self(2000)
      .else(err => this.notify("error", err));

    this
      .ostinato("refreshGaiaImg", gaiaImgRefresher, Infinity, this.opts.gaia.beat, 1)
      .ostinato("feedVibes", vibeFeeder, Infinity, this.opts.vibe.beat, 1);
  }

  /**
   * Retrieves the current authentication token from the owning Node (if any).
   * @returns {string|undefined}
   */
  get token() {
    return this.sprite?.node?.token;
  }

  /**
   * Returns this Sprite’s payload within the current Gaia image.
   * @returns {object|undefined}
   */
  get payload() {
    return this.gaiaImg?.sprites?.[this.target.id];
  }

  /**
   * Returns the minimal Gaia image representing only this Sprite and its vibes.
   * Useful for posting self-descriptions to Gaia.
   *
   * @returns {{users: Record<string, object>, sprites: Record<string, object>, vibes: Record<string, string[]>}}
   */
  get img() {

    const users = Object.fromEntries([this.sprite.node.user.id, this.sprite.node.user]);
    const sprites = Object.fromEntries([[this.target.id, this.payload]]);
    const vibes = Object.fromEntries([
      [this.target.id, Array.from(Object.keys(this.target.vibes))]
    ]);
    return { users, sprites, vibes };
  }

  /**
   * Fetches the latest Gaia image describing the Sprite’s surroundings.
   * The image is stored internally as `this.gaiaImg`.
   *
   * @returns {Promise<void>}
   */
  async refreshGaiaImg() {
    if (!this.token) {
      this.notify("warning", "No token available from owning Node");
      return;
    }

    const gaiaImg = await this.fetchGaiaImg([], Infinity, Infinity);
    this.gaiaImg = gaiaImg;
  }

  /**
   * Requests a Gaia image from the configured Gaia service.
   *
   * @param {number[]} [center] - [longitude, latitude]
   * @param {number} [radius] - Sampling radius in meters
   * @param {number} [sample=this.opts.gaia.sample] - Number of Sprites to sample
   * @returns {Promise<object>} The Gaia image (sprites + vibes)
   */
  async fetchGaiaImg([long, lat], radius, sample = this.opts.gaia.sample, requireUrl = this.opts.gaia.requireUrl, targets = this.opts.gaia.targets) {
    const token = this.token;
    if (!token) throw new Error("Missing authentication token");

    const res = await fetch(
      `${this.opts.gaia.url}?${Gaia.imgQuery([long, lat], radius, sample, requireUrl, ...targets)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.img),
      }
    );

    if (!res.ok)
      throw new Error(`Gaia fetch failed: HTTP ${res.status} ${res.statusText}`);

    return res.json();
  }

  /**
   * Samples Gaia for nearby Sprites exposing WebSocket endpoints
   * and feeds the target Sprite with live {@link Vibe} connections.
   *
   * Each connection is immediately validated with a `ping()`.
   * 
   * @returns {Promise<void>}
   */
  async feedVibes() {
    if (this.opts.gaia.sample <= 0) return;
    if (!this.token) {
      this.notify("warning", "Cannot feed vibes — missing token from Node");
      return;
    }

    const { long, lat } = {long: this.payload.long, lat: this.payload.lat};
    const gaiaImg = await this.fetchGaiaImg(
      [long, lat],
      this.opts.gaia.radius?? Infinity,
      this.opts.gaia.sample,
      this.opts.gaia.requireUrl,
      this.opts.gaia.targets
    );

    const servers = Object.keys(gaiaImg.sprites).filter(this.serverFilter);
    const promises = [];

    for (const id of Gaia.sample(servers, this.opts.gaia.sample)) {
      const { url } = gaiaImg.sprites[id];
      if (!url) continue;

      const ws = new this.wsConstructor(url);
      const vibe = new Vibe(ws);
      this.target.vibes.add(id, vibe);
      promises.push(vibe.ping());
    }

    await Promise.all(promises);
  }
}
