/**
 * ObjNavigator provides semantic helpers for navigating and manipulating
 * nested JSON-compatible objects using paths. Supports scoped navigation
 * with `within()` and returning to parent objects with `without()`.
 */
export class ObjNavigator {
  /**
   * Creates a new ObjNavigator instance.
   *
   * @param {Object} [data={}] - The underlying JSON object to wrap.
   * @param {ObjNavigator|null} [parent=null] - Optional parent navigator.
   * @throws {Error} If `data` is not an object.
   */
  constructor(data = {}, parent = null) {
    if (typeof data !== "object" || data === null) {
      throw new Error("ObjNavigator can only wrap an object");
    }
    /** @type {Object} */
    this.data = data;

    /** @type {ObjNavigator|null} */
    this.parent = parent;
  }

  /**
   * Create a new ObjNavigator from a plain object.
   *
   * @param {Object} obj - The object to wrap.
   * @returns {ObjNavigator} A new navigator instance.
   *
   * @example
   * const navigator = ObjNavigator.from({ user: { profile: {} } });
   */
  static from(obj) {
    return new ObjNavigator(obj);
  }

  /**
   * Navigate into a sub-object and return a new ObjNavigator child.
   * Throws if any intermediate object is missing or not an object.
   *
   * @param {string|string[]} path - Path to the sub-object.
   * @returns {ObjNavigator} Child navigator scoped to the sub-object.
   * @throws {Error} If any path segment does not exist or is not an object.
   *
   * @example
   * const navigator = ObjNavigator.from({ user: { profile: {} } });
   * const profileNavigator = navigator.within("user.profile");
   */
  within(path) {
    const keys = ObjNavigator.normalizePath(path);
    let current = this.data;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
        throw new Error(`Path '${path}' does not exist or is not an object`);
      }
      current = current[key];
    }

    return new ObjNavigator(current, this);
  }

  /**
   * Returns the parent ObjNavigator, or null if none exists.
   *
   * @returns {ObjNavigator|null}
   *
   * @example
   * const parentNavigator = profileNavigator.without();
   */
  without() {
    return this.parent;
  }

  /**
   * Get a value at a path relative to this navigator (read-only).
   *
   * @param {string|string[]} path - Path to retrieve.
   * @returns {*} The value at the path, or undefined if not found.
   *
   * @example
   * const name = navigator.get("user.profile.name"); // "Alice"
   */
  get(path) {
    const keys = ObjNavigator.normalizePath(path);
    let current = this.data;

    for (const key of keys) {
      if (!(key in current)) return undefined;
      current = current[key];
    }

    return current;
  }

  /**
   * Set a value at a path relative to this navigator.
   * Missing intermediate objects are auto-created if `createMissing` is true.
   *
   * @param {string|string[]} path - Path to set.
   * @param {*} value - Value to assign.
   * @param {boolean} [createMissing=true] - Auto-create missing intermediate objects.
   * @returns {this} The current ObjNavigator instance.
   * @throws {Error} If a path segment exists but is not an object, or missing and `createMissing` is false.
   *
   * @example
   * navigator.set("user.profile.name", "Alice");
   */
  set(path, value, createMissing = true) {
    const keys = ObjNavigator.normalizePath(path);
    let current = this.data;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || current[key] == null) {
        if (!createMissing) throw new Error(`Path segment '${key}' does not exist`);
        current[key] = {};
      } else if (typeof current[key] !== "object") {
        throw new Error(`Path segment '${key}' is not an object`);
      }
      current = current[key];
    }

    current[keys.at(-1)] = value;
    return this;
  }

  /**
   * Normalize a path argument into an array of string keys.
   *
   * @param {string|string[]} path - Dot-separated string or array of keys.
   * @returns {string[]} Array of keys.
   *
   * @example
   * ObjNavigator.normalizePath("user.profile.name"); // ["user","profile","name"]
   */
  static normalizePath(path) {
    return Array.isArray(path) ? path : path.split(".").filter(Boolean);
  }
}
