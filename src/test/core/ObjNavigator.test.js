import assert from "assert";
import { ObjNavigator } from "../../main/core/ObjNavigator.js";

describe("ObjNavigator", function () {
let navigator;

beforeEach(function () {
navigator = ObjNavigator.from({});
});

it("should get and set nested values using dot notation", function () {
navigator.set("user.profile.name", "Alice");
assert.strictEqual(navigator.get("user.profile.name"), "Alice");
});

it("should get and set nested values using array paths", function () {
navigator.set(["user", "profile", "age"], 30);
assert.strictEqual(navigator.get(["user", "profile", "age"]), 30);
});

it("should auto-create intermediate objects when using set()", function () {
navigator.set("settings.theme.color", "dark"); // auto-create by default
assert.strictEqual(navigator.get("settings.theme.color"), "dark");
});

it("should throw if intermediate path is missing and createMissing=false", function () {
assert.throws(
() => navigator.set("missing.path.key", "value", false),
/Path segment 'missing' does not exist/
);
});

it("should throw when using within() on a missing path", function () {
navigator.set("user.profile", {});
assert.throws(
() => navigator.within("user.settings"),
/Path 'user.settings' does not exist or is not an object/
);
});

it("should navigate using within() and without()", function () {
navigator.set("user.profile", { name: "Alice" });
const profileNavigator = navigator.within("user.profile");
assert.strictEqual(profileNavigator.get("name"), "Alice");
assert.strictEqual(profileNavigator.without(), navigator);
});

it("should support alias method with()", function () {
navigator.set("user.profile", { name: "Alice" });
const profileNavigator = navigator.with("user.profile");
assert.strictEqual(profileNavigator.get("name"), "Alice");
});

it("should delete nested properties with delete()", function () {
navigator.set("user.profile.name", "Alice");
navigator.delete("user.profile.name");
assert.strictEqual(navigator.get("user.profile.name"), undefined);
});

it("should filter entries with select()", function () {
navigator.set("a", 1).set("b", 2).set("keep", 3);
navigator.select((key) => key === "keep");
assert.deepStrictEqual(Object.keys(navigator.data), ["keep"]);
});

it("should return undefined for non-existing paths with get()", function () {
assert.strictEqual(navigator.get("non.existing.path"), undefined);
});

it("should allow chaining of set() calls", function () {
navigator.set("a.b", 1).set("a.c", 2);
assert.strictEqual(navigator.get("a.b"), 1);
assert.strictEqual(navigator.get("a.c"), 2);
});

it("should throw if a path segment is not an object", function () {
navigator.set("x", 123);
assert.throws(() => navigator.set("x.y", "value"), /is not an object/);
});

it("should normalize path correctly", function () {
assert.deepStrictEqual(ObjNavigator.normalizePath("a.b.c"), ["a", "b", "c"]);
assert.deepStrictEqual(ObjNavigator.normalizePath(["a", "b"]), ["a", "b"]);
});
});
