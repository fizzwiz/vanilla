# ⚙️ `ArrayQueue` Class — Sorting by order of insertion in `@fizzwiz/sorted`

The `ArrayQueue` class provides a minimal, array-backed implementation of the abstract [`Queue`](https://sorted-js.blogspot.com/p/queue-interface.html). It supports basic FIFO or LIFO ordering, making it suitable for general-purpose queue and stack operations.

---

## 📚 Overview

Internally, `ArrayQueue` stores items in a plain JavaScript array. Its behavior is controlled by a `fifo` flag:

- `fifo: true` → **FIFO** (queue)
- `fifo: false` → **LIFO** (stack)

All items are treated as **distinct** — no identity or value-based equality checks are performed. This means:

- `has(item)` always returns `false`
- `remove(item)` always returns `false`

---

## 🧩 Constructor

```ts
new ArrayQueue(fifo = true, items = [])
```

- `fifo`: Boolean flag to toggle between FIFO and LIFO behavior.
- `items`: Optional array to seed the queue.

---

## 🧪 Public API

### `get fifo(): boolean`

Returns whether the queue uses FIFO ordering.

---

### `get items(): Array<any>`

Exposes the internal storage array (use with caution).

---

### `n(): number`

Returns the current number of elements in the queue.

---

### `has(item): boolean`

Always returns `false`.  
In `ArrayQueue`, **no item is considered equivalent to any other** — not even itself.  

---

### `add(item): boolean`

Adds an item to the **end** of the queue. Always returns `true`.

---

### `remove(item): boolean`

Always returns `false`. Value-based removal is unsupported.

---

### `peek(first = true): any`

Returns the item at the head or tail:

- `first = true`: returns the first item (according to `fifo`).
- `first = false`: returns the last item.

---

### `poll(first = true): any`

Removes and returns the item at the head or tail:

- `first = true`: removes from front.
- `first = false`: removes from end.

---

### `clear(): void`

Removes all items from the queue.

---

### `[Symbol.iterator](): Iterator<any>`

Returns a forward iterator over the queue’s items.

---

### `reverse(): Each<any>`

Returns an iterable (`Each`) yielding items in reverse order.  
This is a view — not a reversed copy or a new queue.

---

## 🧠 Design Notes

- `ArrayQueue` is optimized for **simplicity**, **speed**, and **minimal assumptions**.
- Items are added fast, removed fast, and iterated efficiently.
- Use it when you need a lightweight **FIFO or LIFO** queue with no equivalence checking.
- **All items are treated as distinct** — even identical ones. No value is considered equal to any other.

---

## ✍️ Example

```js
const q = new ArrayQueue(true);
q.add("🍎");
q.add("🍌");
q.add("🍓");

q.peek();   // → "🍎"
q.poll();   // → "🍎"
q.reverse(); // → Iterable over ["🍓", "🍌"]
```
---

<br>

> *“In `ArrayQueue`, nothing is equal — not even to itself.”*  
> — `@fizzwiz ✨`

