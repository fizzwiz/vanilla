# 🏠 Introduction to `@fizzwiz/vanilla`

`@fizzwiz/vanilla` is a lightweight library that provides semantic helpers for working with **plain JSON objects**.

A vanilla object is **simple, serializable, and flexible**. This library allows you to manage nested data structures and type-based options safely and consistently, without introducing complex classes or frameworks.

## Core Concepts

### OptionStore

* Stores options keyed by type names (e.g., class names or string identifiers).
* Retrieves options for instances by walking up the prototype chain.
* Ideal for defining default configurations or behaviors per type hierarchy.

### ObjNavigator

* Navigate, get, and set nested values in JSON-like objects using dot-separated paths or arrays.
* Automatically creates missing intermediate objects when needed.
* Supports scoped navigation with `within()` and returning to parent objects with `without()`.

## Philosophy

* **Simplicity:** Work with plain objects without introducing complex classes.
* **Safety:** Avoid runtime errors when navigating nested structures.
* **Flexibility:** Easily integrate with existing JSON data or API payloads.

By providing these two core helpers, `@fizzwiz/vanilla` brings structure and semantic meaning to vanilla objects while keeping your data fully JSON-compatible.
