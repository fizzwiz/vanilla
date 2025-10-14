import { Solo } from "@fizzwiz/ensemble";
import { HttpHandler, Req, Res, Path } from "@fizzwiz/awaitility";
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
     * Returns a snapshot (img) of the current Gaia state.
     *
     * - If both a center `[long, lat]` and a finite radius are provided, only geolocated sprites
     *   within the circular region are included.
     * - The result can optionally be randomly sampled to limit the number of returned sprites.
     *   If the sample size is smaller than the number of candidates, some duplicates may occur,
     *   so the actual number of returned sprites may be slightly smaller than the requested sample.
     * - Vibe targets are not restricted to the selected sprites; only sources are filtered.
     * - by passing `clients = false`, only sprites with a url associated in their payload are returned
     *
     * @param {Array<number>} [center] - Optional array `[longitude, latitude]` of the circle’s center.
     * @param {number} [radius=Infinity] - Radius in meters.
     * @param {number} [sample=Infinity] - Maximum number of sprites to include, randomly sampled.
     * @returns {{ sprites: Record<string, object>, vibes: Record<string, Array<string>> }} 
     *          Object containing filtered `sprites` and `vibes`.
     */
    img([long, lat] = [], radius = Infinity, sample = Infinity, clients = true) {

        // Collect candidate entries
        let entries;
        if (Number.isFinite(long) && Number.isFinite(lat) && Number.isFinite(radius)) {
            entries = Object.entries(this.sprites).filter(
                ([, payload]) => Gaia.dist([long, lat], [payload.long, payload.lat]) < radius
            );
        } else {
            entries = Object.entries(this.sprites);
        }

        if (!clients) entries = entries.filter(([_, payload]) => payload.url);

        const sprites = Object.fromEntries(Gaia.sample(entries, sample));
        const spriteIds = new Set(Object.keys(sprites));

        // Keep only vibes whose source sprite is selected
        const vibes = Object.fromEntries(
            Object.entries(this.vibes)
                .filter(([id]) => spriteIds.has(id))
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