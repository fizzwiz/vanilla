# OptionStore API

`OptionStore` provides a type-based key/value storage system for JSON-compatible objects, allowing options to be associated with class names or string identifiers and retrieved for instances following the prototype chain.

---

## Class: `OptionStore`

### Constructor

```javascript
new OptionStore(data = {})
```

**Parameters:**

* `data` *(Object, optional)*: The underlying JSON object used as storage. Defaults to an empty object.

**Description:**
Creates a new `OptionStore` instance wrapping the given object.

### Static Methods

#### `as(obj)`

```javascript
OptionStore.as(obj)
```

**Parameters:**

* `obj` *(Object)*: A plain object or an existing `OptionStore` instance.

**Returns:**

* `OptionStore`: Either wraps a plain object or returns the original `OptionStore` instance.

**Description:**
Convenience factory to ensure an object is wrapped as `OptionStore`.

### Instance Methods

#### `set(type, key, value)`

```javascript
store.set(type, key, value)
```

**Parameters:**

* `type` *(string)*: The type name (e.g., class name) to associate the option with.
* `key` *(string)*: The option key.
* `value` *(*any JSON-serializable type*)*: The value to store.

**Returns:**

* `this` for chaining.

**Description:**
Stores an option for a given type. Overwrites any existing value for the same type/key.

#### `get(instance, key)`

```javascript
store.get(instance, key)
```

**Parameters:**

* `instance` *(Object)*: An instance whose prototype chain will be checked.
* `key` *(string)*: The option key to retrieve.

**Returns:**

* The value associated with the first type found along the prototype chain, or `undefined` if none found.

**Description:**
Retrieves the value for the given instance, walking up the prototype chain to find the first matching type that has the option.

### Example

```javascript
class Base {}
class Derived extends Base {}

const options = OptionStore.as({});
options.set('Base', 'color', 'blue');
options.set('Derived', 'color', 'red');

console.log(options.get(new Derived(), 'color')); // 'red'
console.log(options.get(new Base(), 'color'));    // 'blue'
```
