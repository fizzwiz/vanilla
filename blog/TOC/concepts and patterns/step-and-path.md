# 🧭 Introducing `step` and `path()` in `ObjNavigator`

The `@fizzwiz/vanilla` library provides **semantic navigation** for plain JavaScript objects. One of its core abstractions, `ObjNavigator`, allows safe and expressive traversal of nested structures.

With the introduction of the `step` property and the `path()` method, `ObjNavigator` now offers **richer introspection** — allowing navigators to track their relation to ancestors and compute both logical and property-based depth.

---

## 🔹 The `step` Property

Each `ObjNavigator` represents a position within an object hierarchy. The `step` property describes **how this navigator was reached from its parent**.

```js
const ancestor = ObjNavigator.from({ user: { profile: {} } });
const profileNav = ancestor.with('user.profile');

console.log(profileNav.step); // 'user.profile'
```

* The **top-level ancestor** has no parent, so `step` is `undefined`.
* Nested navigators record the **path segment** (simple or compound) used to reach them.

`step` serves as a semantic link between a navigator and its parent, enabling hierarchical reasoning.

---

## 🔸 The `path(byProperty = false)` Method

The `path()` method computes the full path from the top-level ancestor navigator to the current navigator.

* **Logical path** (`byProperty = false`): counts one step per `.within()` or `.with()` call.
* **Property-based path** (`byProperty = true`): expands each compound step into individual property segments.

```js
const ancestor = ObjNavigator.from({});
ancestor.set('a.b', {}).set('a.b.c', 123);

const bNav = ancestor.with('a.b');
const cNav = bNav.with('c');

console.log(bNav.path().length);      // 1 (logical depth)
console.log(bNav.path(true).length);  // 2 (property-based depth)
console.log(cNav.path().length);      // 2
console.log(cNav.path(true).length);  // 3
console.log(cNav.path(true).last);    // 'c'
```

### Benefits

* Compute **logical depth** for navigator-based operations.
* Compute **structural depth** for analyzing object layouts.
* Easily retrieve the **full path** of an object in a hierarchical structure. This path, converted to a string, can provide a unique, serializable identifier for the object in most asynchronous scenarios.

---

## ✨ Summary

| Perspective          | Method       | Meaning                                   |
| -------------------- | ------------ | ----------------------------------------- |
| Logical hierarchy    | `path()`     | Number of navigator steps from ancestor   |
| Structural hierarchy | `path(true)` | Number of property segments from ancestor |

By combining `step` and `path()`, `ObjNavigator` now provides clear, flexible, and semantic insight into both **navigation logic** and **data structure depth**, making nested object handling more expressive and robust.
