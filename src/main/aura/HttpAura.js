import { Aura } from "../core/Aura.js";
import { Vibe } from "../core/Vibe.js";
import { HttpHandler } from "@fizzwiz/awaitility";

/**
 * 🌐 **HttpAura**
 * ----------------
 * Feeds its target Sprite with WebSocket connections coming from an existing
 * WebSocket server.
 *
 * The HttpAura does **not** create or configure the WebSocket server —
 * it only listens for `"connection"` events and wraps each accepted socket
 * into a `Vibe`, attaching it to the target Sprite if authorized.
 *
 * Token extraction and validation are delegated to `HttpHandler`.
 */
export class HttpAura extends Aura {
  /**
   * Creates a new HttpAura.
   *
   * @param {Object} wsServer - An existing WebSocketServer instance.
   * @param {Function} [filter] - Optional connection filter.
   *   Receives the incoming HTTP request and should return `true` to allow the
   *   connection or `false` to reject it.
   *
   */
  constructor(wsServer, filter = () => true) {
    super();
    this.wsServer = wsServer;
    this.filter = filter;

    // Listen for new WebSocket connections
    this.cue("connectionCue", wsServer, "connection", this.handleConnection.bind(this));
  }

  /**
   * Handles each incoming WebSocket connection.
   *
   * Uses `HttpHandler` to extract and validate the token from the incoming
   * request, before calling `resolveConnection()`.
   *
   * @param {Object} ws - The connected WebSocket instance.
   * @param {Object} req - The HTTP upgrade request associated with this connection.
   */
  async handleConnection(ws, req) {
    await HttpHandler.as(this.resolveConnection.bind(this))
      .preparingToken()
      .else(() => this.notify("warning", "Missing or invalid token in connection request"))
      .what({ req, ws });
  }

  /**
   * Called by `HttpHandler` once the token has been successfully extracted and
   * attached to the request object.
   *
   * - If the connection passes the filter, it becomes a new `Vibe` for the target Sprite.
   * - If the request lacks a valid token or ID, the connection is ignored.
   *
   * @param {Object} ctx - The connection context.
   * @param {Object} ctx.req - The original HTTP request, now containing a `token` property.
   * @param {Object} ctx.ws - The accepted WebSocket connection.
   *
   * @example
   * // Token payload shape expected:
   * // req.token = { id: "sprite-123", ... }
   */
  async resolveConnection({ req, ws }) {
    if (!this.filter(req)) {
      this.notify("info", `Connection filtered out: ${req.url}`);
      return;
    }

    if (!req.token || !req.token.id) {
      this.notify("warning", "Missing Sprite ID in token payload");
      return;
    }

    const vibe = new Vibe(ws);
    this.sprite.vibes.add(req.token.id, vibe);

    this.notify("info", `✨ HttpAura added new Vibe from Sprite ${req.token.id} to Sprite ${this.sprite.id}`);
  }
}
