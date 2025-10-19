# ⛵ ObjNavigator — Navigating Nested JSON Objects

`ObjNavigator` provides a semantic API for **navigating and manipulating nested JSON-compatible objects**. It emphasizes clarity, safe access, and scoped navigation.

---

## 🔹 Overview

### Class: ObjNavigator

* Wraps a plain object for structured navigation.
* Supports **path-based get/set** operations.
* Provides **scoped navigation** into sub-objects with `within()` and returns to the parent with `without()`.

---

## ⚡ Constructor

```js
new ObjNavigator(data, parent = null)
```

* `data` — The JSON object to wrap.
* `parent` — Optional parent navigator for scoped navigation.

**Throws:** if `data` is not an object.

```js
const navigator = new ObjNavigator({ user: { profile: {} } });
```

---

## 🛠️ Methods

### `get(path)`

Get a value at a specified path.

* `path` — Dot-separated string or array of keys.
* Returns the value at the path, or `undefined` if missing.

```js
navigator.get("user.profile.name"); // "Alice"
```

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

### `within(path)`

Navigate into a sub-object and return a new `ObjNavigator` child.

* `path` — Path to the sub-object.
* Returns a new `ObjNavigator` scoped to the sub-object.
* **Throws** if the path does not exist or is not an object.

```js
const profileNav = navigator.within("user.profile");
```

### `without()`

Return the parent navigator.

* Returns the parent `ObjNavigator` instance, or `null` if none exists.

```js
const parentNav = profileNav.without();
```

---

## 📌 Static Methods

### `normalizePath(path)`

Converts a path argument to an array of keys.

* `path` — Dot-separated string or array.
* Returns an array of keys.

```js
ObjNavigator.normalizePath("user.profile.name"); // ["user","profile","name"]
```

---

## 🔗 Example Usage

```js
const navigator = new ObjNavigator({ user: { profile: {} } });

// Set values
navigator.set("user.profile.name", "Alice");
navigator.set(["user","profile","age"], 30);

// Navigate into sub-object
const profileNav = navigator.within("user.profile");
console.log(profileNav.get("name")); // "Alice"

// Modify sub-object
profileNav.set("email", "alice@example.com");
console.log(navigator.get("user.profile.email")); // "alice@example.com"

// Return to parent
const parentNav = profileNav.without();
console.log(parentNav === navigator); // true
```

---

## ✅ Summary

`ObjNavigator` offers:

* Safe, predictable navigation and manipulation of nested objects.
* Clear APIs for entering (`within()`) and leaving (`without()`) scopes.
* Flexible path handling for both strings and arrays.
* Optional automatic creation of missing intermediate objects.

> Emphasizes clarity over raw power for maintainable JSON object handling.
