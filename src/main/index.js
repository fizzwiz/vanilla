import { OptionStore } from "./core/OptionStore.js";
import { ObjNavigator } from "./core/ObjNavigator.js";

export { OptionStore, ObjNavigator };

/**
 * Core utilities for structured object management and type-based options.
 *
 * Provides:
 * - {@link OptionStore} — type-based option storage and retrieval.
 * - {@link ObjNavigator} — nested object navigation and manipulation.
 *
 * @example
 * import { OptionStore, ObjNavigator } from '@fizzwiz/vanilla';
 *
 * // OptionStore example
 * class Base {}
 * class Derived extends Base {}
 * const options = OptionStore.as({});
 * options.set("Base", "color", "blue");
 * options.set("Derived", "color", "red");
 * console.log(options.get(new Derived(), "color")); // "red"
 *
 * // ObjNavigator example
 * const navigator = ObjNavigator.as({});
 * navigator.set("user.profile.name", "Alice");
 * const profileNavigator = store.with("user.profile");
 * profileNavigator.set("age", 30);
 * console.log(navigator.get("user.profile.age")); // 30
 *
 * @see {@link OptionStore}
 * @see {@link ObjNavigator}
 * @module core
 */
