# 🌐 Plain JavaScript Objects — the True Language of Distributed Systems

When designing distributed or asynchronous systems — systems that exchange data between independent nodes, peers, or services — we discover one powerful truth:

> **The most universal data structure in JavaScript is the plain object.**

Whether you call it a *map*, *record*, or *JSON structure*, the plain object (`{}`) is the simplest, most portable form of state. It is naturally serializable, easy to merge, and readable across all programming environments.

And yet, many developers instinctively reach for **classes and types** when defining system state — especially configuration or metadata. But in asynchronous workflows, this introduces unnecessary coupling and complexity.

Let’s unpack why **plain, vanilla objects** are more valuable than class-based structures in distributed environments — and how a lightweight library like `@fizzwiz/vanilla` makes this philosophy practical.

---

🚧 The Limits of Classes in a Distributed World

Object-oriented design works well for local applications: you can define clear behaviors, encapsulate logic, and rely on methods tied to class instances.

However, once you send a class instance over the network, all class semantics are lost.

Methods, prototypes, and internal behaviors cannot be serialized. Patterns like fromJSON() create extra friction — every class must implement its own conversion logic, which adds boilerplate and potential for errors.

Even worse, the receiving peer may not have the same class definitions or versions. This mismatch can easily lead to desynchronization, inconsistent state, or runtime errors.

---

🧩 Plain Objects: The Universal Medium

In a distributed network, data must flow freely.
A plain JavaScript object — the very structure used by JSON — is the perfect medium for sharing state across nodes.

It offers:

- Portability: Works across network boundaries, languages, and storage layers.

- Inspectability: Easy to log, diff, patch, or visualize.

- Mutability: Incremental configuration changes can be applied directly.

- Statelessness: No methods, no hidden state — just pure data.

In short, the object itself becomes the source of truth.

This simplicity is especially valuable in asynchronous systems, where nodes communicate via messages rather than direct method calls.

---

⚙️ Real Example: Dynamic Configuration in a Distributed Node

I’m developing a distributed computation network, where each node instantiates several cooperating classes — for example, VirtualMachine, Sprite, Vibe, and Aura — to implement computation and discover each other.

Each class relies on a configuration object defining its resources, workload, and behavior.
These settings are dynamic: they can change while the node is running. Moreover, they are user-specific and stored in the user database.

Instead of having each class maintain its own configuration object, each class dynamically retrieves values from a shared user configuration object held by the node. Because the configuration may change during runtime, the object is refreshed asynchronously and continuously.

Representing this configuration as a plain JavaScript object is the most natural approach:

```js

const user = {
  VirtualMachine: {
    coreP: 0.01,
    timeout: 1000
  },
  Sprite: {
    beat: 5000,
    connectivity: Infinity
  }
};

```

This object can be pulled from the user database and sent directly across the network — no serialization logic, no versioned class structures, and no fromJSON() boilerplate.

---

## 🧠 Adding Semantics Without Classes

Of course, working with raw objects has a downside: **you lose semantics** — the rules, meaning, and patterns.

That’s where the `@fizzwiz/vanilla` library comes in.

It provides **semantic helpers** for working with plain JSON-like data, so you get structure without enforcing rigid class hierarchies.

### ⚙️ `OptionStore`: Manage options per class type or hierarchy

```js
import { OptionStore } from '@fizzwiz/vanilla';

class Sprite {}
class VirtualMachine extends Sprite {}

const opts = OptionStore.as({});
opts.set(Sprite, 'beat', 5000);
opts.set(VirtualMachine, 'coreP', 0.01);

console.log(opts.get(VirtualMachine, 'beat')); // 5000
console.log(opts.get(Sprite, 'coreP')); // undefined
```

Instead of defining option lookup logic in each class, you can **externalize configuration semantics** — and keep data portable and consistent.

### 🦯 `ObjNavigator`: Navigate and modify nested objects

```js
import { ObjNavigator } from '@fizzwiz/vanilla';

// Starting with a configuration object
const config = {
    server: {
    port: 8080,
    ssl: false
    }
};

const navigator = ObjNavigator.from(config);

// Update existing nested values
navigator.set('server.port', 9090);
console.log(config.server.port); // 9090

// Navigate into a sub-object and set additional properties
const serverNav = navigator.within('server');
serverNav.set('timeout', 5000);
console.log(config.server.timeout); // 5000

// Navigate back to the parent
const rootNav = serverNav.without();
console.log(rootNav === navigator); // true
```

You can traverse deep configurations safely, create nested structures automatically, and even scope navigation contextually using `with()` and return to the parent using `without()`.

---

## 🚀 A Semantic Layer for Plain Objects

The philosophy behind `@fizzwiz/vanilla` is simple:

> *You don’t need classes to define semantics. You can build semantics around plain data.*

This approach lets you:

* Keep your distributed system JSON-native.
* Preserve compatibility across nodes.
* Add meaning through lightweight, functional helpers instead of rigid class hierarchies.

---

## 📦 Try It Now

You can use the library via npm:

```bash
npm install @fizzwiz/vanilla
```

Or directly in the browser via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@fizzwiz/vanilla/dist/vanilla.bundle.js"></script>
```

---

## ✨ Final Thoughts

Plain JavaScript objects are the **lingua franca of distributed computation**.
They embody simplicity, transparency, and universality — the core qualities you want in any system that crosses boundaries.

`@fizzwiz/vanilla` doesn’t replace OOP — it complements it, giving you the ability to reason about, share, and evolve data **without losing meaning**.

> *“When data travels, **keep it vanilla**”*  
> — `@fizzwiz`

