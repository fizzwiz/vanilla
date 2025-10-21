# ⛵️ ObjNavigator — Navigating Nested JSON Objects

`ObjNavigator` provides a semantic API for **navigating and manipulating nested JSON-compatible objects**. It emphasizes clarity, safe access, and scoped navigation.

---

## 🔹 Overview

### Class: ObjNavigator

* Wraps a plain object for structured navigation.
* Supports **path-based get/set/delete** operations.
* Provides **scoped navigation** into sub-objects with `within()` / `with()` and returns to the parent with `without()`.
* Includes powerful filtering with `select()`.

---

## ⚡ Constructor

```js
new ObjNavigator(data = {}, parent = null)
```

* `data` — The JSON object to wrap.
* `parent` — Optional parent navigator for scoped navigation.

**Throws:** if `data` is not an object.

```js
const navigator = new ObjNavigator({ user: { profile: {} } });
```

---

## 🔧 Methods

### `get(path)`

Get a value at a specified path.

* `path` — Dot-separated string or array of keys.
* Returns the value at the path, or `undefined` if missing.

```js
navigator.get("user.profile.name"); // "Alice"
```

---

### `set(path, value, createMissing = true)`

Set a value at a path. Optionally auto-create intermediate objects.

* `path` — Dot-separated string or array of keys.
* `value` — Value to assign.
* `createMissing` — Boolean to create missing intermediate objects (default: true).
* Returns `this` for chaining.

```js
navigator.set("user.profile.name", "Alice");
```

**Throws:** if a segment exists but is not an object, or if missing and `createMissing` is false.

---

### `delete(path)`

Delete a property at the specified path.

* `path` — Dot-separated string or array of keys.
* Returns `this` for chaining.

```js
navigator.delete("user.profile.name");
```

Removes the `name` property if it exists.

---

### `within(path)`

Navigate into a sub-object and return a new `ObjNavigator` scoped to it.

* `path` — Path to the sub-object.
* Returns a new `ObjNavigator` scoped to the sub-object.
* **Throws** if the path does not exist or is not an object.

```js
const profileNav = navigator.within("user.profile");
```

---

### `with(path)`

Alias for `within(path)`.

```js
const profileNav = navigator.with("user.profile");
```

---

### `without()`

Return the parent navigator.

* Returns the parent `ObjNavigator` instance, or `null` if none exists.

```js
const parentNav = profileNav.without();
```

---

### `select(entryPredicate)`

Filter the current object's entries in place.

* `entryPredicate` — Function `(key, value) => boolean`. Keeps entries returning `true`.
* Returns `this` for chaining.

```js
navigator.select((key, value) => key.startsWith("user_"));
```

Deletes all entries from `data` that do not satisfy the predicate.

---

## 🔖 Static Methods

### `from(obj)`

Create a new navigator from a plain object.

```js
const nav = ObjNavigator.from({ user: { profile: {} } });
```

Equivalent to `new ObjNavigator(obj)`.

---

### `normalizePath(path)`

Converts a path argument to an array of keys.

* `path` — Dot-separated string or array.
* Returns an array of keys.

```js
ObjNavigator.normalizePath("user.profile.name"); // ["user", "profile", "name"]
```

---

## 🔗 Example Usage

```js
const navigator = new ObjNavigator({ user: { profile: {} } });

// Set values
navigator.set("user.profile.name", "Alice");
navigator.set(["user", "profile", "age"], 30);

// Navigate into sub-object
const profileNav = navigator.within("user.profile");
console.log(profileNav.get("name")); // "Alice"

// Modify sub-object
profileNav.set("email", "alice@example.com");
console.log(navigator.get("user.profile.email")); // "alice@example.com"

// Filter keys
navigator.select((key) => key !== "debug");

// Return to parent
const parentNav = profileNav.without();
console.log(parentNav === navigator); // true
```

---

## ✅ Summary

`ObjNavigator` offers:

* Safe, predictable navigation and manipulation of nested objects.
* Clear APIs for entering (`within()` / `with()`) and leaving (`without()`) scopes.
* Path handling for both strings and arrays.
* Optional automatic creation of missing intermediate objects.
* In-place filtering and deletion helpers.

> Emphasizes clarity over raw power for maintainable JSON object handling.
