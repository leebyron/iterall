# JavaScript [Iterators][] for all!

[![Build Status](https://travis-ci.org/leebyron/iterall.svg?branch=master)](https://travis-ci.org/leebyron/iterall) [![Coverage Status](https://coveralls.io/repos/github/leebyron/iterall/badge.svg?branch=master)](https://coveralls.io/github/leebyron/iterall?branch=master) ![568 bytes minified and gzipped](https://img.shields.io/badge/min%20gzip%20size-568%20B-blue.svg)

`iterall` provides a few crucial utilities for implementing and working with
[Iterables][iterators] and [Array-likes][array-like] in all JavaScript
environments, even old versions of Internet Explorer, in a tiny library weighing
well under 1KB when minified and gzipped.

This is a library for libraries. If your library takes Arrays as input, accept
Iterables instead. If your library implements a new data-structure, make
it Iterable.

When installed via `npm`, `iterall` comes complete with [flow][] and
[TypeScript][] definition files. Don't want to take the dependency? Feel free to
copy code directly from this repository.

```js
// Limited to only Arrays 😥
if (Array.isArray(thing)) {
  thing.forEach(function (item, i) {
    console.log('Index: ' + i, item)
  })
}

// Accepts all Iterables and Array-likes, in any JavaScript environment! 🎉
var isCollection = require('iterall').isCollection
var forEach = require('iterall').forEach

if (isCollection(thing)) {
  forEach(thing, function (item, i) {
    console.log('Index: ' + i, item)
  })
}
```

## Why use Iterators?

For most of JavaScript's history it has provided two collection data-structures:
the `Object` and the `Array`. These collections can conceptually describe nearly
all data and so it's no suprise that libraries expecting lists of
things standardized on expecting and checking for an Array. This pattern even
resulted in the addition of a new method in ES5: [`Array.isArray()`][isarray].

As JavaScript applications grew in complexity, moved to the [server][nodejs]
where CPU is a constrained resource, faced new problems and implemented new
algorithms, new data-structures are often required. With options from
[linked lists][linked list] to [HAMTs][hamt] developers can use what is most
efficient and provides the right properties for their program.

However none of these new data-structures can be used in libraries where an
`Array` is expected, which means developers are often stuck between abandoning
their favorite libraries or limiting their data-structure choices at the cost of
efficiency or usefulness.

To enable many related data-structures to be used interchangably we need a
_[protocol][]_, and luckily for us ES2015 introduced the
[Iteration Protocols][iterators] to describe all list-like data-structures which
can be iterated. That includes not just the new-to-ES2015 [Map][] and [Set][]
collections but also existing ones like [arguments][], [NodeList][] and the
various [TypedArray][], all of which return `false` for [`Array.isArray()`][isarray]
and in ES2015 implement the [Iterator protocol][iterators].

While Iterators are defined in ES2015, they _do not require_ ES2015 to work
correctly. In fact, Iterators were first introduced in 2012 in [Firefox v17](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#Iterator_property_and_iterator_symbol). Rather than using [`Symbol.iterator`][symbol.iterator], they used the property name `"@@iterator"` (in fact, the ECMAScript
spec still refers to well-known `Symbols` using this `@@` shorthand). By falling
back to use `"@@iterator"` when `Symbol.iterator` is not defined, Iterators can
be both safely defined and used by _any version of JavaScript_.

Not only were Iterables defined in ES2015, they were also implemented by the
built-in data-structures including [Array][array#@@iterator]. Older JavaScript
environments do not implement `Array.prototype[@@iterator]()`, however this is
only a minor problem. JavaScript has another related and much older protocol:
[Array-like]. An value is "Array-like" if it has a numeric `length` property and
indexed access, but does not necessarily have methods like `.push()` or `.forEach()`.
Much like [`Array.from`][array.from], `iterall`'s `forEach()` and
`createIterator()` methods also accept collections which are not Iterable but
are Array-like. This means that `iterall` can be used with [Array][],
[arguments][], [NodeList][], [TypedArray][] and other Array-like collections
regardless of the JavaScript environment.

When libraries only accept Arrays as input, they stick developers with a tough
choice: limit which data-structures can be used or limit the ability to use that
library. Accepting Iterables removes this false dichotomy, and allows libraries
to be more generally useful. There's no need to limit to ES2015 environments and
bleeding-edge browsers to accept `Iterable`.

Only using Arrays can limit the efficiency and usefulness of your application
code, but custom data-structures can often feel like a fish out of water in
JavaScript programs, only working with code written specifically for it.
Protocols like `Iterable` helps these new data-structures work with more
libraries and built-in JavaScript behavior. There's no need to limit to ES2015
environments and bleeding-edge browsers to implement `Iterable`.

<!--

NOTE TO CONTRIBUTORS

The API section below is AUTOMATICALLY GENERATED via `npm run docs`. Any direct
edits to this section will cause Travis CI to report a failure. The source of
this documentation is index.js. Edit that file then run `npm run docs` to
automatically update README.md

-->

## API

### $$ITERATOR

A property name to be used as the name of an Iterable's method responsible
for producing an Iterator. Typically represents the value `Symbol.iterator`.

`Symbol` is defined in ES2015 environments, however some transitioning
JavaScript environments, such as older versions of Node define `Symbol`, but
do not define `Symbol.iterator`. Older versions of Mozilla Firefox,
which originally introduced the Iterable protocol, used the string
value `"@@iterator"`. This string value is used when `Symbol.iterator` is
not defined.

Use `$$ITERATOR` for defining new Iterables instead of `Symbol.iterator`,
but do not use it for accessing existing Iterables, instead use
`getIterator()` or `isIterable()`.

**Examples**

```javascript
var $$ITERATOR = require('iterall').$$ITERATOR

function Counter (to) {
  this.to = to
}

Counter.prototype[$$ITERATOR] = function () {
  return {
    to: this.to,
    num: 0,
    next () {
      if (this.num >= this.to) {
        return { value: undefined, done: true }
      }
      return { value: this.num++, done: false }
    }
  }
}

var counter = new Counter(3)
for (var number of counter) {
  console.log(number) // 0 ... 1 ... 2
}
```

### isIterable

Returns true if the provided object implements the Iterator protocol via
either implementing a `Symbol.iterator` or `"@@iterator"` method.

**Parameters**

-   `obj`  A value which might implement the Iterable protocol.

**Examples**

```javascript
var isIterable = require('iterall').isIterable
isIterable([ 1, 2, 3 ]) // true
isIterable('ABC') // true
isIterable({ key: 'value' }) // false
```

Returns **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if Iterable.

### isCollection

Returns true if the provided object is an Object (i.e. not a string literal)
and is either Iterable or "Array-like" due to having a numeric
`length` property.

This may be used in place of [Array.isArray()][isarray] to determine if an
object can be iterated-over. It always excludes string literals and includes
Arrays (regardless of if it is Iterable). It also includes other Array-like
objects such as NodeList, TypedArray, and Buffer.

**Parameters**

-   `obj`  An Object value which might implement the Iterable or Array-like protocols.

**Examples**

```javascript
var isCollection = require('iterall').isCollection
var forEach = require('iterall').forEach
if (isCollection(obj)) {
  forEach(obj, function (value) {
    console.log(value)
  })
}
```

Returns **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** true if Iterable or Array-like Object.

### getIterator

If the provided object implements the Iterator protocol, its Iterator object
is returned. Otherwise returns undefined.

**Parameters**

-   `iterable` **Iterable&lt;T>** An Iterable object which is the source of an Iterator.

**Examples**

```javascript
var getIterator = require('iterall').getIterator
var iterator = getIterator([ 1, 2, 3 ])
iterator.next() // { value: 1, done: false }
iterator.next() // { value: 2, done: false }
iterator.next() // { value: 3, done: false }
iterator.next() // { value: undefined, done: true }
```

Returns **Iterator&lt;T>** new Iterator instance.

### getIteratorMethod

If the provided object implements the Iterator protocol, the method
responsible for producing its Iterator object is returned.

This is used in rare cases for performance tuning. This method must be called
with obj as the contextual this-argument.

**Parameters**

-   `iterable` **Iterable&lt;T>** An Iterable object which defines an `@@iterator` method.

**Examples**

```javascript
var getIteratorMethod = require('iterall').getIteratorMethod
var myArray = [ 1, 2, 3 ]
var method = getIteratorMethod(myArray)
if (method) {
  var iterator = method.call(myArray)
}
```

Returns **function (): Iterator&lt;T>** `@@iterator` method.

### forEach

Given an object which either implements the Iterable protocol or is
"Array-like", iterate over it, calling the `callback` at each iteration.

Similar to [Array.prototype.forEach][], the `callback` function accepts three
arguments, and is provided with `thisArg` as the calling context.

`forEach` adheres to the behavior described in the ECMAScript specification,
skipping over "holes" in Arrays and Array-likes.

Note: providing an infinite Iterator to forEach will produce an error.

[array.prototype.foreach]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach

**Parameters**

-   `collection` **(Iterable&lt;T> | [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;T>)** The Iterable or array to iterate over.
-   `callback` **function (T, [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number), [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** Function to execute for each iteration, taking up to three arguments
-   `thisArg`  Optional. Value to use as `this` when executing `callback`.

**Examples**

```javascript
var forEach = require('iterall').forEach

forEach(myIterable, function (value, index) {
  console.log(value, index)
})
```

### createIterator

Similar to `getIterator()`, this method returns a new Iterator given an
Iterable. However it will also create an Iterator for a non-Iterable
Array-like collection, such as Array in a non-ES2015 environment.

`createIterator` is complimentary to `forEach`, but allows a "pull"-based
iteration as opposed to `forEach`'s "push"-based iteration.

`createIterator` produces an Iterator for Array-likes with the same behavior
as ArrayIteratorPrototype described in the ECMAScript specification, and
does _not_ skip over "holes".

**Parameters**

-   `collection` **(Iterable&lt;T> | [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;T>)** An Iterable or Array-like object to produce an Iterator.

**Examples**

```javascript
var createIterator = require('iterall').createIterator

var myArraylike = { length: 3, 0: 'Alpha', 1: 'Bravo', 2: 'Charlie' }
var iterator = createIterator(myArraylike)
iterator.next() // { value: 'Alpha', done: false }
iterator.next() // { value: 'Bravo', done: false }
iterator.next() // { value: 'Charlie', done: false }
iterator.next() // { value: undefined, done: true }
```

Returns **Iterator&lt;T>** new Iterator instance.

## Contributing

Contributions are welcome and encouraged!

Remember that this library is designed to be small, straight-forward, and
well-tested. The value of new additional features will be weighed against their
size. This library also seeks to leverage and mirror the
[ECMAScript specification][] in its behavior as much as possible and reasonable.

This repository has far more documentation and explanation than code, and it is
expected that the majority of contributions will come in the form of improving
these.

<!-- Appendix -->

[arguments]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments

[array#@@iterator]: (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/@@iterator)

[array-like]: http://www.2ality.com/2013/05/quirk-array-like-objects.html

[array.from]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array

[ecmascript specification]: http://www.ecma-international.org/ecma-262/6.0/

[flow]: https://flowtype.org/

[hamt]: https://en.wikipedia.org/wiki/Hash_array_mapped_trie

[isarray]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray

[iterators]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols

[linked list]: https://en.wikipedia.org/wiki/Linked_list

[map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

[nodejs]: https://nodejs.org/

[nodelist]: https://developer.mozilla.org/en-US/docs/Web/API/NodeList

[protocol]: https://en.wikipedia.org/wiki/Protocol_(object-oriented_programming)

[set]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

[symbol.iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator

[typedarray]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray

[typescript]: http://www.typescriptlang.org/
