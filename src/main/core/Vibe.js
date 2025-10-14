import { EmitterSecondo } from "@fizzwiz/ensemble";

/**
 * Wraps a WebSocket connection as a reactive {@link EmitterSecondo} within an Ensemble.
 *
 * A `Vibe` tracks the health and performance of a WebSocket link between Sprites.
 * Its `value` property reflects the most recent measured latency (in milliseconds),
 * making it suitable for *neighborhood convergence* — selecting the best-performing peers.
 *
 * @extends EmitterSecondo
 */
export class Vibe extends EmitterSecondo {

    /**
     * @param {WebSocket} ws - The WebSocket connection to wrap.
     * @param {number} [value=0] - The initial score or value of this connection.
     * @param {number} [lastActive=Date.now()] - Timestamp of the last detected activity.
     * @param {boolean} [muted=false] - Whether this connection is marked for discard.
     */
    constructor(ws, value = 0, lastActive = Date.now(), muted = false) {
        super(ws, ["message", "error", "close"]);
        this.value = value;
        this.lastActive = lastActive;
        this.muted = muted;
        this.lastPing = Infinity;

        this.cue('messageCue', this, 'message', data => {
            const json = Vibe.json(data);            
            
            // last active
            this.lastActive = Date.now();   

            // pong
            if (json.type === 'ping' && !json.payload && json.pingId) this.pong(undefined, json.pingId);
        });
    }

    /** Updates the `lastActive` timestamp to the current time. */
    touch() {
        this.lastActive = Date.now();
    }

    /**
     * Checks if this Vibe is considered active.
     *
     * @param {number} [maxAllowedInactivity=60 * 1000] - Activity timeout window in milliseconds (1 min).
     * @param {number} now - Current timestamp in milliseconds (defaults to Date.now()).
     * @returns {boolean} True if the last activity was within the activity window.
     */
    isActive(maxAllowedInactivity = 60 * 1000, now = Date.now()) {
        return this.lastActive + maxAllowedInactivity >= now;
    }

    /**
     * Mutes this connection.
     *
     * A muted Vibe no longer initiates outgoing messages, but remains
     * open to receive responses (e.g., to complete an in-progress exchange).
     * Once inactivity is detected, the Vibe will close naturally.
     *
     * @returns {void}
     */
    mute() {
        this.muted = true;
    }

    /**
     * Sends a `ping` message through the WebSocket and awaits the corresponding `pong` response.
     *
     * Measures the round-trip latency between this node and a remote peer.
     * Each ping includes a unique `pingId`, which the peer echoes back in its pong response.
     * The resulting latency is inverted and stored in {@link Vibe#value}, where higher values
     * (less negative) represent faster and more responsive peers.
     *
     * If no response is received within the given timeout, the Vibe is considered unresponsive
     * and its value is set to `-Infinity`.
     *
     * @param {*} payload - Optional payload to include with the ping message.
     * @param {number} [timeout=2000] - Maximum time to wait for a pong response, in milliseconds.
     * @returns {Promise<void>} Resolves after the ping–pong exchange completes or times out.
     * @throws {Error} If the response message is not valid JSON or does not match the expected format.
     */
    async ping(payload = undefined, timeout = 2000) {
        const start = performance.now();
        const uniqueId = crypto.randomUUID();

        const sendRequest = AsyncWhat.as(() =>
            this.ws.send(JSON.stringify({ type: "ping", id: uniqueId, payload }))
        );
        const handleResponse = AsyncWhat.as(() => this.eval(start));

        const isResponse = (evt, data) => {
            const json = Vibe.json(data); // may throw
            return json.type === "pong" && json.pingId === uniqueId;
        };

        await sendRequest
            .sthen(handleResponse.when(isResponse, this.ws, "message", timeout))
            .else(() => (this.value = -Infinity))
            .what(); // actually executes the request-response pattern
    }

    /**
     * Evaluates the latency of the latest completed ping and updates this Vibe’s value.
     *
     * The latency is calculated as the elapsed time since the ping was sent.
     * The result is stored as a **negative value**, so that lower latency corresponds
     * to a higher (less negative) score when comparing Vibes.
     *
     * @param {number} start - Timestamp (in milliseconds) when the ping was sent.
     * @returns {void}
     */
    eval(start) {
        const ping = performance.now() - start;
        this.value = -ping;
    }

    /**
     * Sends a `pong` message in response to a received `ping`.
     *
     * Echoes the provided `pingId`.
     * The `json` parameter carries the actual response to the ping’s payload,
     * allowing the sender to measure both round-trip and processing latency accurately.
     *
     * @param {*} payload - The response payload to include in the pong message.
     * @param {string} pingId - The unique identifier of the ping to acknowledge.
     * @returns {void}
     */
    pong(pingId, payload = undefined) {
        this.ws.send(JSON.stringify({ type: "pong", pingId, payload }));
    }

    /**
     * Safely parses an incoming WebSocket message as JSON.
     *
     * @param {string|*} data - Raw message data from a WebSocket event.
     * @returns {object|undefined} Parsed JSON object, or `undefined` if not a string.
     * @throws {Error} If the data is a string but invalid JSON.
     */
    static json(data) {
        if (typeof data !== "string") return undefined;
        return JSON.parse(data);
    }
}
