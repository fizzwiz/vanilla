# Quick Start with 🍦 `@fizzwiz/vanilla`

`@fizzwiz/vanilla` provides simple, semantic helpers for working with plain JSON objects. Below are some examples to get you started quickly.

---

## Installation

```bash
npm install @fizzwiz/vanilla
```

---

## OptionStore Example

Store and retrieve options by type, automatically looking up along an instance's prototype chain.

```javascript
import { OptionStore } from '@fizzwiz/vanilla';

class Base {}
class Derived extends Base {}

const options = OptionStore.as({});
options.set('Base', 'color', 'blue');
options.set('Derived', 'color', 'red');

console.log(options.get(Derived, 'color')); // 'red'
console.log(options.get(Base, 'color'));    // 'blue'
```

---

## ObjNavigator Example

Navigate and manipulate nested objects using paths.

```javascript
import { ObjNavigator } from '@fizzwiz/vanilla';

const navigator = new ObjNavigator({});
navigator.set('user.profile.name', 'Alice');
navigator.set('user.profile.age', 30);

// Navigate into a sub-object
const profileNav = navigator.within('user.profile');
console.log(profileNav.get('name')); // 'Alice'
profileNav.set('email', 'alice@example.com');
console.log(navigator.get('user.profile.email')); // 'alice@example.com'

// Navigate back to parent
const parentNav = profileNav.without();
console.log(parentNav === navigator); // true
```

---

## Notes

* `OptionStore` is useful for per-type configuration.
* `ObjNavigator` simplifies working with deeply nested objects without manually checking intermediate paths.
* Both classes work with plain JSON objects, keeping your data serializable and simple.
