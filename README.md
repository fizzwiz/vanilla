# 🍦 @fizzwiz/vanilla

**Lightweight semantics for working with plain JSON objects**

`@fizzwiz/vanilla` is a small library that provides **semantic helpers** for working with JSON-compatible objects. It adds meaningful abstractions for storing options, navigating nested data safely, and exploring object hierarchies declaratively.

---

## Features

* **OptionStore:** Store and retrieve options by type, with automatic lookup along a class prototype chain.
* **ObjNavigator:** Navigate and manipulate nested objects by paths in a JSON-like object, with optional creation of intermediate objects, scoped navigation, and declarative exploration via `Search`.

---

## Installation

### NPM

```bash
npm install @fizzwiz/vanilla
```

### Browser (vanilla bundle via jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/@fizzwiz/vanilla/dist/vanilla.bundle.js"></script>
<script>
  const { OptionStore, ObjNavigator } = window.vanilla;

  const navigator = ObjNavigator.from({});
  navigator.set("user.profile.name", "Alice");
  console.log(navigator.get("user.profile.name")); // "Alice"
</script>
```

---

## Quick Start

```javascript
import { OptionStore, ObjNavigator } from '@fizzwiz/vanilla';

// OptionStore example
class Base {}
class Derived extends Base {}

const options = OptionStore.as({});
options.set(Base, 'color', 'blue');
options.set(Derived, 'color', 'red');

console.log(options.get(Derived, 'color')); // 'red'
console.log(options.get(Base, 'color'));    // 'blue'

// ObjNavigator example
const navigator = ObjNavigator.from({});
navigator.set('user.profile.name', 'Alice');
navigator.set('user.profile.age', 30);

// Navigate into a sub-object
const profileNav = navigator.within('user.profile');
console.log(profileNav.get('name')); // 'Alice'
profileNav.set('email', 'alice@example.com');
console.log(navigator.get('user.profile.email')); // 'alice@example.com'

// Navigate back to parent
console.log(profileNav.without() === navigator); // true

// Declarative exploration with Search
const navigators = navigator.search()
  .which(nav => nav.get('age'))     // iterates all the descendant navigators whose root object has an 'age' property
```

---

## Documentation

### OptionStore

* Stores options keyed by type names.
* Retrieves options for instances by walking up the prototype chain.
* Useful for defining default behavior or configuration per class hierarchy.

### ObjNavigator

* Stores and retrieves nested values by paths (dot-separated strings or arrays).
* Automatically creates intermediate objects when using `set()`.
* Supports scoped navigation with `within()` / `with()` and returning to the parent with `without()`.
* Deletes keys with `delete()` and filters entries with `select()`.
* Supports **declarative traversal** of object hierarchies with `search()` returning a `Search<ObjNavigator>` instance.

---

## Blog & GitHub Pages

* Blog: [https://vanilla.blog.fizzwiz.cloud](https://vanilla.blog.fizzwiz.cloud)
* GitHub Pages: [https://fizzwiz.github.io/vanilla](https://fizzwiz.github.io/vanilla)

---

## License

MIT
