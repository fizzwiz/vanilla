import { Solo } from "@fizzwiz/ensemble";
import { HttpHandler, Res, Path } from "@fizzwiz/awaitility";
import { Each } from "@fizzwiz/fluent";

/**
 * Collects information from each sprites into a unitary whole network state
 */
export class Gaia extends Solo {

    httpServer;

    /** Enpoints for http requests*/
    urls;

    /** Object associating each sprite id to a payload  */
    sprites;

    /** Object associating each sprite id to the ids of the sprites it is connected to */
    vibes;

    constructor(httpServer, urls = {img: "/gaia/img"}, sprites = {}, vibes = {}) {
        super();

        this.httpServer = httpServer;
        this.urls = Object.fromEntries(
            Object.entries(urls).map(([k, v]) => [k, Path.normalize(v)])
          );
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
     * Adds the client info (from the body) to this.img
     * Sends to the client the requested, updated, image
     * 
     * @param {{req, res}} ctx argument
     */
    async resolveImgRequest({req, res}) {

        // Update the Gaia img by using the posted img
        Gaia.update(this.img, req.body?? {});

        // Send the requested image
        const [long, lat, radius, sample] = [req.query.long, req.query.lat, req.query.radius ?? Infinity, req.query.sample ?? Infinity].map(Number);
        const img = this.img([long, lat], radius, sample);
        res.json(img);
    }

    /**
     * Merges the provided img data into the current Gaia img.
     * Existing sprites and vibes are updated or extended in place.
     *
     * @param {{sprites: Record<string, object>, vibes: Record<string, string[]>}} param0 - The new image data.
     */
    static update(img, { sprites = {}, vibes = {} }) {
        // Merge sprites in place
        Object.assign(img.sprites, sprites?? {});

        // Merge vibes in place
        Object.assign(img.vibes, vibes?? {});
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
     *
     * ---
     * @param {number[]} [center] - Optional `[longitude, latitude]` defining the circle’s center.
     * @param {number} [radius=Infinity] - Optional radius (in meters) for geographic filtering.
     * @param {number} [sample=Infinity] - Optional maximum number of sprites to include, randomly sampled.
     * @param {boolean} [requireUrl=false] - Whether to include **only sprites with a defined `payload.url`**.
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
     * // Get a random sample of up to 100 server-only sprites (requireUrl = true)
     * const snapshot = gaia.img(undefined, Infinity, 100, true);
     *
     * @example
     * // Full state dump (all sprites, clients + servers)
     * const snapshot = gaia.img();
     */
    img([long, lat] = [], radius = Infinity, sample = Infinity, requireUrl = false) {
        // Collect candidate sprite entries
        let entries;

        if (Number.isFinite(long) && Number.isFinite(lat) && Number.isFinite(radius)) {
            entries = Object.entries(this.sprites).filter(
                ([, payload]) => Gaia.dist([long, lat], [payload.long, payload.lat]) < radius
            );
        } else {
            entries = Object.entries(this.sprites);
        }

        // Optionally restrict to sprites having a defined URL (servers)
        if (requireUrl) entries = entries.filter(([_, payload]) => payload.url);

        const sprites = Object.fromEntries(Gaia.sample(entries, sample));
        const spriteIds = new Set(Object.keys(sprites));

        // Keep only vibes whose source sprite is selected
        const vibes = Object.fromEntries(
            Object.entries(this.vibes).filter(([id]) => spriteIds.has(id))
        );

        return { sprites, vibes };
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
     * Example: "long=12.34&lat=45.67&radius=1000&sample=50"
     */
    static imgQuery([long, lat], radius, sample) {
        const params = { long, lat, radius, sample };
        return Object.entries(params)
        .filter(([_, v]) => v != null && !Number.isNaN(v))
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    }

}