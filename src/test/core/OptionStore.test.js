import assert from "assert";
import { OptionStore } from "../../main/core/OptionStore.js";

describe("OptionStore", function () {
  let store;

  beforeEach(function () {
    store = OptionStore.as({});
  });

  it("should store and retrieve an option by class", function () {
    class Base {}
    store.set(Base, "color", "blue");
    assert.strictEqual(store.get(Base, "color"), "blue");
  });

  it("should retrieve option from derived class, overriding base", function () {
    class Base {}
    class Derived extends Base {}

    store.set(Base, "color", "blue");
    store.set(Derived, "color", "red");

    assert.strictEqual(store.get(Derived, "color"), "red");
    assert.strictEqual(store.get(Base, "color"), "blue");
  });

  it("should inherit options from base class if not overridden", function () {
    class Base {}
    class Derived extends Base {}

    store.set(Base, "size", "large");

    // Derived inherits from Base
    assert.strictEqual(store.get(Derived, "size"), "large");
  });

  it("should return undefined if option is not found in any ancestor", function () {
    class A {}
    assert.strictEqual(store.get(A, "missingKey"), undefined);
  });

  it("should allow chaining of set() calls", function () {
    class Base {}
    store.set(Base, "color", "blue").set(Base, "size", "large");

    assert.strictEqual(store.get(Base, "color"), "blue");
    assert.strictEqual(store.get(Base, "size"), "large");
  });

  it("should throw an error when setting an unnamed class", function () {
    const Anonymous = function() {};
    Object.defineProperty(Anonymous, "name", { value: "" });

    assert.throws(() => store.set(Anonymous, "key", "value"), /Type must have a name/);
  });
});
