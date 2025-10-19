# 🍦 @fizzwiz/vanilla

**Lightweight semantics for working with plain JSON objects**

`@fizzwiz/vanilla` is a small library that provides **semantic helpers** for working with JSON-compatible objects. A vanilla object is plain and serializable — no special class is required. The library adds meaningful abstractions for storing options and navigating/manipulating nested data safely and consistently.

---

## Features

* **OptionStore:** Store and retrieve options by type, with automatic lookup along a class prototype chain.
* **ObjNavigator:** Navigate and manipulate nested objects by paths in a JSON-like object, with optional creation of intermediate objects.

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
  const { OptionStore, ObjNavigator } = window.fizzwizvanilla;

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
options.set('Base', 'color', 'blue');
options.set('Derived', 'color', 'red');

console.log(options.get(new Derived(), 'color')); // 'red'
console.log(options.get(new Base(), 'color'));    // 'blue'

// ObjNavigator example
const navigator = ObjNavigator.from({});
navigator.set('user.profile.name', 'Alice');
navigator.set('user.profile.age', 30);

// Navigate into a sub-object
const profileNavigator = navigator.within('user.profile');
console.log(profileNavigator.get('name')); // 'Alice'
profileNavigator.set('email', 'alice@example.com');
console.log(navigator.get('user.profile.email')); // 'alice@example.com'

// Navigate back to parent
const parentNavigator = profileNavigator.without();
console.log(parentNavigator === navigator); // true
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
* Supports scoped navigation with `within()` and returning to the parent with `without()`.

---

## Blog & GitHub Pages

* Blog: [https://fizzwiz-vanilla.blogspot.com](https://fizzwiz-vanilla.blogspot.com)
* GitHub Pages: [https://fizzwiz.github.io/vanilla](https://fizzwiz.github.io/vanilla)

---

## License

MIT
