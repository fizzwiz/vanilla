# 📣 RoamingCall — Executable Code That Travels

**RoamingCall** is an abstraction for executing JavaScript remotely — dynamically routing and running small code snippets on connected clients (typically browsers), and returning the result to the initiator. It is part of the evolving ecosystem of `@fizzwiz/pattern`, and opens the door to new distributed and browser-assisted architectures.

---

## 🧠 Concept

RoamingCall is designed to distribute small pieces of computation across the internet. A RoamingCall carries a stringified function body and its arguments. The function is sent from a client, routed through a dispatcher, and executed by an idle browser (executor). The result is then returned via the same path.

This is **not** a general RPC system. RoamingCall is limited to self-contained, argument-driven logic with no side effects or external dependencies. Think of it as a **roaming snippet of pure computation**.

---

## 🔁 Roles in the Architecture

The system involves three roles:

- **Client**  
  Initiates the task. It sends a `RoamingCall` and waits for a result.

- **Dispatcher**  
  A server responsible for routing the `RoamingCall` to a connected browser that is currently idle. It maintains WebSocket connections with both clients and executors.

- **Executor (Browser)**  
  Receives and executes the `RoamingCall`. It evaluates the function and returns the result (or an error).

---

## 🔒 Assumptions and Constraints

- The function has **no closure**: it’s dynamically constructed using the `Function` constructor.
- Arguments must be **serializable** (to be sent via WebSocket as JSON).
- The function should return a result — no external side effects.
- Communication happens over **WebSockets**.

---

## 🧪 Example Usage

Here’s what a roaming call might look like from the caller node:

```js
const call = new RoamingCall("return arg0 * arg1;", 6, 7);
// => to be routed to a browser executor via dispatcher
```

On the executor node:

```js
call.call();
console.log(call.result); // 42
```
---

> “Code that moves like a message — simple, focused, and free to roam.”  
> — `@fizzwiz ✨`
