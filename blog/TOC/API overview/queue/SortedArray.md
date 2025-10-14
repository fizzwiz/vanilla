# ⚖️ `SortedArray`: Sorting by Comparator in `@fizzwiz/sorted`

The `SortedArray` class is a queue that maintains **sorted order** at all times, using a custom or predefined comparator.

It extends [`ArrayQueue`](https://sorted-js.blogspot.com/p/arrayqueue-class.html), but introduces **equivalence**, **ordering**, and **deduplication logic** — making it suitable for **priority queues**, **symbolic sets**, or **ordered workflows**.

---

## 🧪 API: `SortedArray`

### Constructor

```js
new SortedArray(comparator?, items?)
```

| Parameter     | Type                      | Description                                |
|---------------|---------------------------|--------------------------------------------|
| `comparator`  | `(a, b) => -1 \| 0 \| 1`     | Comparison function; defaults to `ORDER.ASCENDING`. |
| `items`       | `Array<any>`              | Initial items to add (will be sorted).     |

---

### Properties

- **`items: Array<any>`**  
  Returns the internal sorted array.

- **`comparator: function`**  
  The function used to maintain sort order and define equivalence.

---

### Methods

#### `has(item): boolean`

Returns `true` if an equivalent item exists in the queue (according to the comparator).

#### `add(item): boolean`

Adds the item **in sorted position** if no equivalent already exists.  
Returns `true` if the item was inserted.

#### `remove(item): boolean`

Removes the **equivalent item**, if found.  
Returns `true` if removal occurred.

---

## 🧬 Internal Logic

The class uses a fast **binary search** algorithm to locate insert/remove positions in logarithmic time:

```js
SortedArray.logSearch(item, array, comparator) // → [index, itemOrUndefined]
```


## 🧠 Design Notes

SortedArray is perfect for priority queues, bounded sets, and sorted collections.

It defines equivalence by comparing items.

Any further advanced notion of equivalence wouldn't be possible without this basic equivalence by comparison.


---

<br>

“Order decides what counts as equal.”  
— @fizzwiz ✨
