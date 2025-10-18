# 🧬 Core Package — `@fizzwiz/vanilla/core`

The `core` module defines foundational utilities for working with JSON-compatible objects in a structured and semantically meaningful way.

These abstractions provide safe and consistent ways to store options by type and navigate nested objects with paths.

---

## 🔹 Overview

### Classes

* [🛠️ OptionStore](#optionstore)
  Store and retrieve options by type. Automatically looks up options along an instance's prototype chain.

* [🧭 ObjNavigator](#objnavigator)
  Navigate and manipulate nested objects safely using paths. Supports scoped navigation with `within()` and returning to parent objects with `without()`.

---

## 📦 Usage

Import the core utilities like this:

```js
import { OptionStore, ObjNavigator } from '@fizzwiz/vanilla';

// OptionStore example
class Base {}
class Derived extends Base {}

const options = OptionStore.as({});
options.set('Base', 'color', 'blue');
options.set('Derived', 'color', 'red');
console.log(options.get(new Derived(), 'color')); // 'red'

// ObjNavigator example
const navigator = new ObjNavigator({});
navigator.set('user.profile.name', 'Alice');
const profileNavigator = navigator.within('user.profile');
console.log(profileNavigator.get('name')); // 'Alice'
```
