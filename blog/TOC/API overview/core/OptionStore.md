# 🎪 OptionStore Class

`OptionStore` provides a type-based key/value storage system for JSON-compatible objects, allowing options to be associated with class constructors (or string identifiers) and retrieved along the inheritance chain.

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

* `type` *(Function)*: The class constructor to associate the option with.
* `key` *(string)*: The option key.
* `value` *(any JSON-serializable type)*: The value to store.

**Returns:**

* `this` for chaining.

**Description:**
Stores an option for the given class. Overwrites any existing value for the same type/key.

#### `get(type, key)`

```javascript
store.get(type, key)
```

**Parameters:**

* `type` *(Function)*: The class constructor to look up.
* `key` *(string)*: The option key to retrieve.

**Returns:**

* The value associated with the first type found along the class inheritance chain, or `undefined` if none found.

**Description:**
Retrieves the value for the given class by walking up its prototype chain to find the first ancestor class with a matching option. Instances are no longer required.

### Example

```javascript
class Base {}
class Derived extends Base {}

const options = OptionStore.as({});
options.set(Base, 'color', 'blue');
options.set(Derived, 'color', 'red');

console.log(options.get(Derived, 'color')); // 'red'
console.log(options.get(Base, 'color'));    // 'blue'
```
