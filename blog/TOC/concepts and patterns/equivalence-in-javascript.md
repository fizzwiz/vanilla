# 🧠 Equivalence in JavaScript: Contemplating a True Set

In JavaScript, **equivalence** behaves differently depending on whether you're working with primitive or non-primitive types.

For **primitives**—such as numbers, booleans, strings, and symbols—equivalence is determined by comparing actual values. If two variables hold the same value, they are considered equivalent.

However, for **objects and arrays**, equivalence is **by reference**. Two arrays `[0]` and `[0]` are not considered equal because they are separate instances, even though they contain identical content.

---

## 🔬 Snippet 1: Equivalence by Value and by Reference

```js
new Set([0, 0]);       // => Set { 0 }
new Set([[0], [0]]);   // => Set { [0], [0] }
```

JavaScript’s `Set` treats the two `0` values as equivalent but considers `[0]` and `[0]` as distinct because they are different object instances.

This reveals JavaScript’s minimalist view of equivalence: only primitives benefit from value-based equivalence.

But that's not the full story.

---

## 🧩 Contemplating a True Set

> Even if Set implemented value-based equivalence for arrays or objects by deeply inspecting all their properties, it still wouldn’t capture the true essence of a Set.

Equivalence can go beyond mere value: it can be based on **length**, **structure**, **content**, or other contextually relevant attributes.

A "true set" should support any meaningful notion of equivalence.

---

## 🔠 Snippet 2: Equivalence by Length

```js
import { TrueSet } from "@fizzwiz/sorted";

const byLength = new TrueSet(equivalenceByLength);
byLength.add("what");
byLength.add("that");   // Considered duplicate: same length as "what"
```

In this example, `"that"` is considered equivalent to `"what"` because both have length 4.

But how is this equivalence logic passed to the set?

---

## 🛠️ Defining Equivalence

Let’s explore three ways to define equivalence in code:

### ❌ Boolean Equality Function

A general approach is to define a boolean function:

```js
function equals(a, b) { return ...; }
```

However, this requires comparing each item with every other—inefficient for large collections.

This approach is often paired with:

```js
function hashCode(x) { return ...; }
```

The `hashCode()` function narrows comparisons by assigning each item to an integer that **represents an equivalence class** larger than the intended equivalence `equals(a, b)`. Such broader equivalence is often further enlarged by the modulo operation `hashCode(x) % n`. While this method is efficient, it’s conceptually disputable. Why not define the **intended equivalence directly**, using its natural representation function?

---

### ✅ Representation Function

A clean and conceptually elegant solution uses a `repr(item)` function directly to map an item to a **representative** of its equivalence class.

```js
function repr(word) {
  return word.length;
}
```

Here, words of the same length are considered equivalent.

However, we still need to define how to compare two representations.

---

### ✅ Comparator Function

A numeric `compare(a, b)` function defines equivalence by returning `0` for equivalent values:

```js
function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
```

This enables efficient `O(log n)` comparisons, removing the need for auxiliary hashing. Comparators are composable, making them powerful for sorting and equivalence alike.

---

## 🛠️ Multivariate Representation

Since the value returned by the representation function is not relevant as long as it is the same for all equivalent items, we can assume — without loss of generality — the representation function returns **arrays** of values. This makes it ideal for expressing **compound equivalences**.

---

## 📦 Snippet 3: Equivalence by Length and First Character

```js
import { TrueSet } from "@fizzwiz/sorted";

const repr = item => [item.length, item[0]];
const byLengthAndFirstCharacter = new TrueSet(repr);
byLengthAndFirstCharacter.add("what");
byLengthAndFirstCharacter.add("that");   // -> true
```

---

## 🛠️ TrueSet as a Sorted Collection of Arrays

From this perspective, a `TrueSet` appears to be a collection of arrays in the form:

```js
[...repr(item), item]
```

The constructor accepts:

- A `repr` function
- A series of `comparator` functions for sorting and deduplication.

The last comparator determines whether two items with the **same representation** are allowed to coexist.

---

## 📦 Snippet 4: A Common Set (No Duplicates)

```js
import { TrueSet, ORDER } from "@fizzwiz/sorted";
const repr = item => item.length;

const byLength = new TrueSet(repr, ORDER.ASCENDING, ORDER.SINGULAR);
byLength.add("what");
byLength.add("that");   // -> false
```

Here, equivalent items are **not** stored twice.

---

## 📦 Snippet 5: A Rich Set (Multiple Equivalent Items)

```js
import { TrueSet } from "@fizzwiz/sorted";

const repr = item => item.length;
const byLength = new TrueSet(repr); // Uses ASCENDING_ORDER by default
byLength.add("what");
byLength.add("that");   // -> true
```

Here, equivalent items **can** coexist and be enumerated.

---

## 🛠️ Classifier: A Generalization of TrueSet

Therefore, the `TrueSet` is a specialized case of a more general data structure: the **Classifier**. The Classifier stores **arrays of items** — supporting arrays of varying lengths — and enables enumeration of classes based on specified keys.

```js
import { Classifier } from "@fizzwiz/sorted";

const classifier = new Classifier();
classifier.add([4]);
classifier.add([4, "w", "what"]);
classifier.add([4, "t", "that"]);
classifier.add([4, "w", "who"]);

classifier.class(4);                      // -> [[4], [4, "w", "what"], [4, "t", "that"], [4, "w", "who"]]
classifier.class(undefined, "w");         // -> [[4, "w", "what"], [4, "w", "who"]]
```

---

## 🧵 Consequences of This Approach

- 💡 Representation-based equivalence reduces to simple comparators.
- ✨ Collections are **intrinsically sorted**.
- ✅ Any array is storable as long as a comparator exists for its components.

---

## 🧭 What’s Next

In future posts, we’ll explore the internal mechanics of `TrueSet` and `Classifier`, as well as advanced applications like multi-valued maps.

But remember: at its core, this system is simple:

> Every collection is a **Sorted Collection of Arrays**, a **Classifier**, powered by a **representation function**.

*Happy classifying!*  
— `@fizzwiz ✨`

