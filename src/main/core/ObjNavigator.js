import { Search } from "@fizzwiz/prism";

/**
 * Provides semantic helpers for navigating and manipulating
 * nested JSON-compatible objects using dot-notation paths.
 *
 * `ObjNavigator` supports:
 * - Scoped navigation via {@link within}
 * - Returning to parent objects via {@link without}
 * - Declarative exploration of object hierarchies via {@link search}
 */
export class ObjNavigator {
  /**
   * Creates a new ObjNavigator instance.
   *
   * @param {Object} [root={}] - The underlying JSON object to wrap.
   * @param {ObjNavigator|undefined} [parent=undefined] - Optional parent navigator.
   * @param {string|undefined} [path=undefined] - Path from parent to this object.
   */
  constructor(root = {}, parent = undefined, path = undefined) {

    /** @type {Object} */
    this.root = root;

    /** @type {ObjNavigator|undefined} */
    this.parent = parent;

    /** @type {string|undefined} */
    this.path = path;
  }

  /**
   * Create a new ObjNavigator from a plain object.
   *
   * @param {Object} obj - The object to wrap.
   * @returns {ObjNavigator} A new navigator instance.
   *
   * @example
   * const nav = ObjNavigator.from({ user: { profile: {} } });
   */
  static from(obj) {
    return new ObjNavigator(obj);
  }

  /** Alias for {@link within}. */
  with(path) {
    return this.within(path);
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
   * const nav = ObjNavigator.from({ user: { profile: {} } });
   * const profileNav = nav.within("user.profile");
   */
  within(path) {
    const keys = ObjNavigator.normalizePath(path);
    let current = this.root;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
        throw new Error(`Path '${path}' does not exist or is not an object`);
      }
      current = current[key];
    }

    return new ObjNavigator(current, this, keys.join("."));
  }

  /**
   * Returns the parent ObjNavigator, or `null` if none exists.
   *
   * @returns {ObjNavigator|null}
   *
   * @example
   * const parentNav = profileNav.without();
   */
  without() {
    return this.parent || null;
  }

  /**
   * Retrieves a value at a path relative to this navigator (read-only).
   *
   * @param {string|string[]} path - Path to retrieve.
   * @returns {*} The value at the path, or undefined if not found.
   *
   * @example
   * const name = nav.get("user.profile.name");
   */
  get(path) {
    const keys = ObjNavigator.normalizePath(path);
    let current = this.root;

    for (const key of keys) {
      if (!(key in current)) return undefined;
      current = current[key];
    }

    return current;
  }

  /**
   * Sets a value at a path relative to this navigator.
   * Missing intermediate objects are auto-created if `createMissing` is true.
   *
   * @param {string|string[]} path - Path to set.
   * @param {*} value - Value to assign.
   * @param {boolean} [createMissing=true] - Auto-create missing objects.
   * @returns {this}
   * @throws {Error} If a path segment exists but is not an object.
   */
  set(path, value, createMissing = true) {
    const keys = ObjNavigator.normalizePath(path);
    let current = this.root;

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
   * Deletes a nested property from the object given a path.
   *
   * @param {string | Array<string|number>} path - Path to delete.
   * @returns {this}
   */
  delete(path) {
    const keys = ObjNavigator.normalizePath(path);
    const target = this.get(keys.slice(0, -1));
    if (target) delete target[keys.at(-1)];
    return this;
  }

  /**
   * Removes entries from `this.root` for which the given predicate returns false.
   *
   * @param {function(key:string, value:any, index:number, entries:Array<Array<string,any>>): boolean} predicate
   * @returns {this}
   */
  select(predicate) {
    for (const [k, v] of Object.entries(this.root)) {
      if (!predicate(k, v)) delete this.root[k];
    }
    return this;
  }

  /**
   * Creates a {@link Search} instance that declaratively explores
   * the structure of the object tree starting from this navigator.
   *
   * Each expansion step maps the current navigator to a list of
   * child navigators — one for each property of the underlying object.
   * 
   * This enables **structural traversal** across both nested objects and
   * leaf primitives, as every property value is represented as its own
   * {@link ObjNavigator}.
   * 
   * By default, the `Search` is driven by a FIFO queue. However, a custom
   * exploration strategy can be provided by chaining `.via(queue)`.  
   * Subsequent fluent calls such as `.which()`, `.sthen()`, and `.what()`
   * can further restrict, transform, or resolve the search.
   *
   * Internally, each expansion applies:
   * ```js
   * nav => Object.entries(nav.root)
   *     .map(([key, value]) => new ObjNavigator(value, nav, key))
   * ```
   *
   * @returns {Search<ObjNavigator>} 
   *   A {@link Search} instance yielding {@link ObjNavigator} objects.
   *
   * @example
   * // Declarative exploration of nested objects
   * const result = ObjNavigator.from(obj)
   *   .search()
   *   .which(nav => nav.get('a.b'))  // only navigators whose root object has an 'a.b' path
   *   .sthen(map)                    // transforms matching navigators
   *   .what();                       // resolves the first satisfying object
   */
  search() {
    return new Search()
      .from(this)
      .through(nav =>
        Object.entries(nav.root)
          .map(([key, value]) => new ObjNavigator(value, nav, key))
      );
  }

  /**
   * Normalize a path argument into an array of string keys.
   *
   * @param {string|string[]} path - Dot-separated string or array of keys.
   * @returns {string[]} Array of keys.
   *
   * @example
   * ObjNavigator.normalizePath("user.profile.name"); // ["user", "profile", "name"]
   */
  static normalizePath(path) {
    return Array.isArray(path) ? path : path.split(".").filter(Boolean);
  }
}
