/**
 * A type-based option store that manages configuration data in a JSON-compatible object.
 *
 * Each option is stored by the class name (constructor name)
 * and can be retrieved for a given class or its ancestors.
 *
 * @example
 * class Base {}
 * class Derived extends Base {}
 *
 * const store = OptionStore.as({});
 * store.set(Base, 'color', 'blue');
 * store.set(Derived, 'color', 'red');
 *
 * store.get(Derived, 'color'); // → 'red'
 * store.get(Base, 'color');    // → 'blue'
 */
export class OptionStore {
  constructor(data = {}) {
    this.data = data;
  }

  static as(obj) {
    return obj instanceof OptionStore ? obj : new OptionStore(obj);
  }

  /**
   * Sets an option for a given class.
   * @param {Function} type - The class (constructor) for which to store the option.
   * @param {string} key - The option key.
   * @param {*} value - The option value.
   * @returns {this}
   */
  set(type, key, value) {
    const typeName = type.name;
    if (!typeName) throw new Error("Type must have a name");
    if (!this.data[typeName]) this.data[typeName] = {};
    this.data[typeName][key] = value;
    return this;
  }

  /**
   * Retrieves an option value for a given class and key.
   * Walks up the inheritance chain to find the first ancestor
   * with a matching option.
   *
   * @param {Function} type - The class (constructor) to inspect.
   * @param {string} key - The option key to look up.
   * @returns {*} The found option value, or undefined if not found.
   */
  get(type, key) {
    let current = type;
    while (current) {
      const typeName = current.name;
      const value = this.data[typeName]?.[key];
      if (value !== undefined) return value;
      current = Object.getPrototypeOf(current);
    }
    return undefined;
  }
}
