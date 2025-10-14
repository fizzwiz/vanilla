# 🧑‍🤝‍🧑👫👭👬 Queue Package: Ordered Collections in `@fizzwiz/sorted`

The `queue` package provides **concrete implementations** of queues — data structures that manage elements with different **ordering strategies**.

---

## 📚 Overview

This module exports two main classes:

- [`ArrayQueue`](https://sorted-js.blogspot.com/p/arrayqueue-class.html) – an insertion-ordered queue (FIFO or LIFO).
- [`SortedArray`](https://sorted-js.blogspot.com/p/sortedarray-class.html) – a queue that keeps items **sorted** based on a comparator.

Both implement the [`Queue`](https://sorted-js.blogspot.com/p/queue-interface.html) interface from the `core` module.

---

## ⚙️ Usage Patterns

These structures are useful for a variety of real-world cases:

- **FIFO/LIFO stacks**
- **Priority queues**
- **Symbolic iteration or search space exploration**

---

## 🧠 Design Insight

Queue-based structures are essential in *search space exploration*, *combinatoric calculi*, and *selection-based patterns* — all of which are supported fluently and declaratively in the `@fizzwiz` ecosystem.

---

<br>

> *When you choose a queue, you're choosing a strategy.*  
> — `@fizzwiz ✨`



