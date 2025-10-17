import { Solo } from "@fizzwiz/ensemble";
import { HttpHandler, Res, Path } from "@fizzwiz/awaitility";
import { Each } from "@fizzwiz/fluent";
import { Sprite } from "./Sprite.js";

/**
 * Collects information from each sprites into a unitary whole network state composed by:
 * - users (Record<string, obj>) mapping user ids with payload (e.g. machines list) 
 * - sprites (Record<string, obj>) mapping spriteId with payload (e.g. long, lat coordinates)
 * - vibes (Record<string, Array<string>>) mapping spriteId with target sprite ids
 * 
 * Each sprite id is composed by userId:spriteName
 */
export class Gaia extends Solo {

    httpServer;

    /** Enpoints for http requests*/
    urls;

    /** Object associating each user id to a payload  */
    users;

    /** Object associating each sprite id to a payload  */
    sprites;

    /** Object associating each sprite id to the ids of the sprites it is connected to */
    vibes;

    constructor(httpServer, urls = {img: "/gaia/img"}, users = {}, sprites = {}, vibes = {}) {
        super();

        this.httpServer = httpServer;
        this.urls = Object.fromEntries(
            Object.entries(urls).map(([k, v]) => [k, Path.normalize(v)])
          );

        this.users = users;
        this.sprites = sprites;
        this.vibes = vibes;

        this.cue(httpServer, 'request', this.handleRequest.bind(this));
    }

    /** 
     * Dispatches the request to its own handler, depending on the req.url
     */
    async handleRequest(req, res) {
        if (Path.normalize(req.url).startsWith(this.urls.img)) {
            await this.handleImgRequest(req, res);
        }
    }

    /** 
     * Handles the request of a Gaia image  
     */
    async handleImgRequest(req, res) {

        await HttpHandler.as(this.resolveImgRequest.bind(this))
            .checkingMethod('POST')
            .checkingAccept('application/json')
            .preparingBody()
            .preparingQuery()
            .else(({_, res}, error) => Res.json(res, 400, { error: error?.message ?? "Bad request" }))
            .what({req, res});
    }

 /**
 * Adds client info (from the request body) to Gaia’s current image
 * and responds with an updated, filtered snapshot.
 *
 * @param {{ req: object, res: object}} ctx - Request context
 */
async resolveImgRequest({ req, res }) {
    try {
      // Merge posted image data into the current Gaia state
      Gaia.update(this.img, req.body ?? {});
  
      // Parse query parameters
      const [long, lat, radius, sample] = [
        req.query.long,
        req.query.lat,
        req.query.radius ?? Infinity,
        req.query.sample ?? Infinity,
      ].map(Number);
  
      // Extract target filter — from query or body
      const targets = req.query.targets?.split(/[\s,]+/);
      const requireUrl = req.query.requireUrl && req.query.requireUrl.trim() !== 'false';

      // Generate filtered snapshot
      const img = this.img([long, lat], radius, sample, requireUrl, targets);
  
      // Respond with JSON
      res.json(img);
    } catch (err) {
      this.notify("error", err);
      res.statusCode = 500;
      res.json({ error: err.message || "Internal server error" });
    }
  }
  

/**
 * Merges the provided image data into the current Gaia image.
 *
 * Existing users, sprites, and vibes are updated or extended **in place**.
 * Shallow merging ensures that existing objects retain their references,
 * allowing live views of Gaia’s state to stay consistent.
 *
 * @param {{
*   users: Record<string, object>,
*   sprites: Record<string, object>,
*   vibes: Record<string, string[]>
* }} data - The new image data to merge.
*/
static update(img, { users = {}, sprites = {}, vibes = {} } = {}) {
 if (!img || typeof img !== "object") {
   throw new TypeError("Gaia.update() requires a valid image object as first argument");
 }

 // Merge users (e.g., user metadata or machine lists)
 if (users && typeof users === "object") {
   Object.assign(img.users, users);
 }

 // Merge sprite payloads (e.g., positions or attributes)
 if (sprites && typeof sprites === "object") {
   Object.assign(img.sprites, sprites);
 }

 // Merge vibe mappings (sprite → targets)
 if (vibes && typeof vibes === "object") {
   Object.assign(img.vibes, vibes);
 }

 return img;
}


/**
 * 📸 **Takes a snapshot (img) of the current Gaia state.**
 *
 * Produces a filtered and optionally sampled view of the current network,
 * returning only the sprites and vibes that meet the provided conditions.
 *
 * ---
 * ### Behavior
 * - If both a geographic `center` (`[longitude, latitude]`) and a finite `radius` are provided,
 *   only **sprites within that circular region** are included.
 * - The result can be **randomly sampled** using `sample` to limit the number of sprites returned.
 *   When the sample size is smaller than the total candidates, duplicates may occur,
 *   so the actual number of unique sprites may be slightly smaller than requested.
 * - **Vibe targets** are not restricted to the selected sprites — only **source sprites** are filtered.
 * - By default, all sprites are included (both servers and clients).
 *   Set `requireUrl = true` to restrict the snapshot to only **server-type sprites**
 *   (those exposing a `payload.url` property).
 * - You can further restrict the result by providing an array of `targets`
 *   (either Sprite IDs or user IDs).  
 *   Only sprites having at least one outgoing vibe toward those targets are included.
 *
 * ---
 * @param {number[]} [center] - Optional `[longitude, latitude]` defining the circle’s center.
 * @param {number} [radius=Infinity] - Optional radius (in meters) for geographic filtering.
 * @param {number} [sample=Infinity] - Optional maximum number of sprites to include, randomly sampled.
 * @param {boolean} [requireUrl=false] - Whether to include **only sprites with a defined `payload.url`**.
 * @param {string[]} [targets] - Optional list of target Sprite IDs or user IDs to restrict the selection.
 *
 * @returns {{ sprites: Record<string, object>, vibes: Record<string, string[]> }}
 *          An object containing:
 *          - `sprites`: Filtered or sampled sprite records.
 *          - `vibes`: Outgoing vibes whose **source** sprites are among the selected ones.
 *
 * @example
 * // Get all sprites within 5km of a given location
 * const snapshot = gaia.img([12.4924, 41.8902], 5000);
 *
 * @example
 * // Get up to 100 server-only sprites
 * const snapshot = gaia.img(undefined, Infinity, 100, true);
 *
 * @example
 * // Only sprites connected to alice
 * const snapshot = gaia.img(undefined, Infinity, Infinity, false, ["alice"]);
 */
img([long, lat] = [], radius = Infinity, sample = Infinity, requireUrl = false, targets = undefined) {
    // Collect candidate sprite entries
    let entries;
  
    if (Number.isFinite(long) && Number.isFinite(lat) && Number.isFinite(radius)) {
      entries = Object.entries(this.sprites).filter(
        ([, payload]) =>
          Gaia.dist([long, lat], [payload.long, payload.lat]) < radius
      );
    } else {
      entries = Object.entries(this.sprites);
    }
  
    // Restrict to sprites having a defined URL (servers)
    if (requireUrl) entries = entries.filter(([_, payload]) => payload.url);
  
    // Restrict to sprites connected to given targets (by sprite ID or user)
    if (Array.isArray(targets) && targets.length > 0) {
      entries = entries.filter(([id, _]) => {
        const vibes = this.vibes[id] || [];
        return vibes.some((targetId) => {
          const { user } = Sprite.parseId(targetId);
          return targets.includes(targetId) || targets.includes(user);
        });
      });
    }
  
    // Sample if needed
    const sprites = Object.fromEntries(Gaia.sample(entries, sample));
    const spriteIds = new Set(Object.keys(sprites));
  
    // Keep only vibes whose source sprite is selected
    const vibes = Object.fromEntries(
      Object.entries(this.vibes).filter(([id]) => spriteIds.has(id))
    );

    // Collect owners of all sprites appearing in the snapshot — both sources and targets
    const userIds = new Set([
        // Owners of selected sprites (sources)
        ...Object.keys(sprites).map(id => Sprite.parseId(id).user),
    
        // Owners of target sprites in vibes
        ...Object.values(vibes)
        .flat()
        .map(id => {
            const { user } = Sprite.parseId(id);
            return user;
        })
    ]);
  
  // Collect only known users
  const users = Object.fromEntries(
    [...userIds]
      .filter(uid => this.users[uid])
      .map(uid => [uid, this.users[uid]])
  );
  
  
    return { users, sprites, vibes };
  }
  

    /**
     * Randomly selects up to `n` entries from the provided array.
     * Duplicates may occur because sampling is done with replacement.
     * The result is returned as an {@link Each} iterable of `[id, payload]` pairs.
     *
     * @param {Array<Array<*>>} entries - Array of `[id, payload]` pairs.
     * @param {number} n - Number of items to sample.
     * @returns {Each<Array<*>>} An `Each` iterable yielding sampled `[id, payload]` pairs.
     */
    static sample(entries, n) {
        if (entries.length <= n) return Each.as(entries);
        
        const got = new Each();
        got[Symbol.iterator] = function*() {
            for (let i = 0; i < n; i++) {
                const index = Math.floor(Math.random() * entries.length);
                yield entries[index];
            }
        };
        
        return got;
    }


    /**
     * Computes the great-circle distance (in meters) between two terrestrial points.
     * Each point is represented as an array `[longitude, latitude]` in degrees.
     *
     * Uses the Haversine formula for accurate results on Earth’s curvature.
     *
     * @param {Array<number>} a - First point `[longitude, latitude]`
     * @param {Array<number>} b - Second point `[longitude, latitude]`
     * @returns {number} Distance in meters or NaN if some coordinate is undefined
     */
    static dist([aLong, aLat], [bLong, bLat]) {
        const R = 6371e3; // Earth's mean radius in meters

        const φ1 = aLat * Math.PI / 180;
        const φ2 = bLat * Math.PI / 180;
        const Δφ = (bLat - aLat) * Math.PI / 180;
        const Δλ = (bLong - aLong) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) ** 2 +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // distance in meters
    }

    /**
     * Returns an `Each` iterator over the IDs of all sprites that define a `url` property.
     *
     * @param {{ sprites: Record<string, object> }} img - The Gaia image containing sprites.
     * @returns {Each<string>} An `Each` iterator of sprite IDs that have a URL.
     */
    static servers(img) {
        return Each.as(Object.keys(img.sprites)).which(id => img.sprites[id].url);
    }

/**
 * Returns the query string for a Gaia image request.
 *
 * Example: "long=12.34&lat=45.67&radius=1000&sample=50&requireUrl=true&targets=alice,main"
 *
 * @param {number[]} coords - [longitude, latitude]
 * @param {number} radius - Optional radius in meters
 * @param {number} sample - Optional sample size
 * @param {boolean} requireUrl - Optional filter for server-only sprites
 * @param {...string} targets - Optional list of target IDs
 * @returns {string} Encoded query string
 */
static imgQuery([long, lat], radius, sample, requireUrl, ...targets) {
    const params = { long, lat, radius, sample, requireUrl };
    
    if (targets.length > 0) {
        // filter out empty strings and join with comma
        params.targets = targets.filter(Boolean).join(',');
    }

    return Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
}


}