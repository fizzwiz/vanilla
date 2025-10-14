import { Aura } from "../core/Aura.js";
import { Vibe } from "../core/Vibe.js";

/**
 * 🌍 GaiaAura
 * ------------
 * Surrounds a Sprite with a dynamic awareness of Gaia.
 *
 * Periodically:
 * - Refreshes authentication tokens.
 * - Queries Gaia for updated network topology.
 * - Samples nearby Sprites offering WebSocket endpoints.
 * - Feeds the target Sprite with live `Vibe` connections.
 *
 * Designed as the “environmental intelligence” of a Sprite.
 */

export class GaiaAura extends Aura {

  constructor(target, opts, wsConstructor, serverFilter = () => true) {
    super(target);

    this.opts = opts;
    this.wsConstructor = wsConstructor;
    this.serverFilter = serverFilter;
    this.gaiaImg = undefined;
    this.token = undefined;

    const tokenRefresher =
      AsyncWhat.as(this.refreshToken.bind(this))
        .self(2000)
        .else(err => this.notify('error', err));

    const gaiaImgRefresher =
      AsyncWhat.as(this.refreshGaiaImg.bind(this))
        .self(5000)
        .else(err => this.notify('error', err));

    const vibeFeeder =
      AsyncWhat.as(this.feedVibes.bind(this))
        .self(2000)
        .else(err => this.notify('error', err));

    this
      .ostinato("refreshToken", tokenRefresher, Infinity, this.opts.web.beat, 1)
      .ostinato("refreshGaiaImg", gaiaImgRefresher, Infinity, this.opts.gaia.beat, 1)
      .ostinato("feedVibes", vibeFeeder, Infinity, this.opts.vibe.beat, 1);
  }

  get payload() {
    return this.gaiaImg?.sprites[this.target.id];
  }

  get img() {
    const sprites = Object.fromEntries([[this.target.id, this.payload]]);
    const vibes = Object.fromEntries([[this.target.id, Array.from(Object.keys(this.target.vibes))]]);
    return { sprites, vibes };
  }

  async refreshToken() {
    const token = await this.fetchToken();
    this.token = token;
  }

  async fetchToken() {
    const res = await fetch(this.opts.web.url);
    if (!res.ok) throw new Error(`Token fetch failed: HTTP ${res.status} ${res.statusText}`);
    return res.text();
  }

  async refreshGaiaImg() {
    if (!this.token) await this.refreshToken();
    const gaiaImg = await this.fetchGaiaImg([this.payload?.long, this.payload?.lat], this.opts.gaia.radius, Infinity);
    this.gaiaImg = gaiaImg;
  }

  async fetchGaiaImg([long, lat], radius, sample = this.opts.gaia.sample) {
    const res = await fetch(
      `${this.opts.gaia.url}?${Gaia.imgQuery([long, lat], radius, sample)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.img)
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  }

    /**
     * Samples Gaia for nearby Sprites exposing WebSocket endpoints
     * and feeds the target Sprite with live `Vibe` connections.
     *
     * Each new connection is immediately evaluated with a ping.
     */
    async feedVibes() { 

    if (this.opts.gaia.sample <= 0) return;

    const gaiaImg = await this.fetchGaiaImg([this.payload?.long, this.payload?.lat], this.opts.gaia.radius, this.opts.gaia.sample, false);

    const servers = Object.keys(gaiaImg.sprites).filter(this.serverFilter);
    const promises = [];

    for (const id of Gaia.sample(servers, this.opts.gaia.sample)) {
      const ws = new this.wsConstructor(gaiaImg.sprites[id].url);
      const vibe = new Vibe(ws);
      this.target.vibes.add(id, vibe);
      promises.push(vibe.ping());
    }

    await Promise.all(promises);
  }

}
