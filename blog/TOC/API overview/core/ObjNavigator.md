# ⛵ ObjNavigator — Navigating Nested JSON Objects

`ObjNavigator` provides semantic helpers for **navigating and manipulating nested JSON-compatible objects** using dot-notation paths. It emphasizes **clarity**, **safe access**, and **declarative exploration** of object hierarchies.

---

## 🔹 Overview

### Class: ObjNavigator

* Wraps a plain object for structured navigation.
* Supports **path-based get/set/delete** operations.
* Enables **scoped navigation** into sub-objects with `within()` / `with()` and returns to the parent with `without()`.
* Integrates with `@fizzwiz/prism`’s {@link Search} for **declarative traversal** of JSON structures.

---

## ⚡ Constructor

```js
new ObjNavigator(root = {}, parent = undefined, path = undefined)
```

* `root` — The underlying JSON object to wrap.
* `parent` — Optional parent navigator for scoped navigation.
* `path` — Optional path from the parent navigator.

```js
const nav = new ObjNavigator({ user: { profile: {} } });
```

---

## 🛠️ Methods

### `get(path)`

Retrieve a value at the specified path.

* `path` — Dot-separated string or array of keys.
* Returns the value at the path, or `undefined` if not found.

```js
nav.get("user.profile.name"); // "Alice"
```

---

### `set(path, value, createMissing = true)`

Set a value at a path, optionally auto-creating intermediate objects.

* `path` — Dot-separated string or array of keys.
* `value` — Value to assign.
* `createMissing` — Boolean to create missing intermediate objects (default: true).
* Returns `this` for chaining.

**Throws:** if a path segment exists but is not an object.

```js
nav.set("user.profile.name", "Alice");
```

---

### `delete(path)`

Delete a nested property at the given path.

* `path` — Dot-separated string or array of keys.
* Returns `this` for chaining.

```js
nav.delete("user.profile.name");
```

---

### `within(path)`

Navigate into a sub-object and return a new child navigator.

* `path` — Path to the sub-object.
* Returns a new `ObjNavigator` scoped to the sub-object.
* **Throws** if the path does not exist or is not an object.

```js
const profileNav = nav.within("user.profile");
```

---

### `with(path)`

Alias for `within(path)`.

```js
const profileNav = nav.with("user.profile");
```

---

### `without()`

Return the parent navigator, or `null` if none exists.

```js
const parentNav = profileNav.without();
```

---

### `select(predicate)`

Filter the current object’s entries in place.

* `predicate` — Function `(key, value) => boolean`. Keeps entries returning `true`.
* Returns `this` for chaining.

```js
nav.select((key) => key.startsWith("user_"));
```

Deletes all entries from `root` that do not satisfy the predicate.

---

### `search()`

Create a {@link Search} instance that declaratively explores the structure of the object tree starting from this navigator.

Each step maps the current navigator to a list of child navigators—one for each property of the underlying object.

```js
nav => Object.entries(nav.root)
  .map(([key, value]) => new ObjNavigator(value, nav, key))
```

This enables **breadth-first traversal** or other custom exploration strategies via `.via(queue)`, and filtering or transformation via fluent methods such as `.which()`, `.sthen()`, and `.what()`.

```js
const result = ObjNavigator.from(obj)
  .search()
  .which(nav => nav.get('a.b'))
  .sthen(map)
  .what();
```

Returns a `Search<ObjNavigator>` instance.

---

## 📌 Static Methods

### `from(obj)`

Create a new navigator from a plain object.

```js
const nav = ObjNavigator.from({ user: { profile: {} } });
```

Equivalent to `new ObjNavigator(obj)`.

---

### `normalizePath(path)`

Convert a path argument to an array of string keys.

```js
ObjNavigator.normalizePath("user.profile.name"); // ["user", "profile", "name"]
```

---

## 🔗 Example Usage

```js
import { ObjNavigator } from "@fizzwiz/vanilla";

const nav = new ObjNavigator({ user: { profile: { name: "Alice" } } });

// Access and modify
console.log(nav.get("user.profile.name")); // "Alice"
nav.set("user.profile.age", 30);

// Navigate into sub-object
const profileNav = nav.within("user.profile");
profileNav.set("email", "alice@example.com");

// Filter keys
profileNav.select((key) => key !== "debug");

// Return to parent
console.log(profileNav.without() === nav); // true

// Explore structure declaratively
const result = nav.search()
  .which(n => n.get('user.profile'))
  .what();
```

---

## ✅ Summary

`ObjNavigator` offers:

* Safe, predictable navigation and manipulation of nested objects.
* Scoped entry and exit (`within()` / `without()`).
* Integration with `@fizzwiz/prism` `Search` for declarative exploration.
* Path normalization and flexible string/array path support.
* Optional auto-creation of missing intermediates.
* In-place filtering and deletion helpers.

> Designed for clarity, composability, and semantic traversal of JSON-like data.
