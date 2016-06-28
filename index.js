/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @ignore
 */

// In ES2015 (or a polyfilled) environment, this will be Symbol.iterator
var REAL_$$ITERATOR = typeof Symbol === 'function' && Symbol.iterator

/**
 * A property name to be used as the name of an Iterable's method responsible
 * for producing an Iterator. Typically represents the value `Symbol.iterator`.
 *
 * `Symbol` is defined in ES2015 environments, however some transitioning
 * JavaScript environments, such as older versions of Node define `Symbol`, but
 * do not define `Symbol.iterator`. Older versions of Mozilla Firefox,
 * which originally introduced the Iterable protocol, used the string
 * value `"@@iterator"`. This string value is used when `Symbol.iterator` is
 * not defined.
 *
 * Use `$$ITERATOR` for defining new Iterables instead of `Symbol.iterator`,
 * but do not use it for accessing existing Iterables, instead use
 * `getIterator()` or `isIterable()`.
 *
 * @example
 *
 * var $$ITERATOR = require('iterall').$$ITERATOR
 *
 * function Counter (to) {
 *   this.to = to
 * }
 *
 * Counter.prototype[$$ITERATOR] = function () {
 *   return {
 *     to: this.to,
 *     num: 0,
 *     next () {
 *       if (this.num >= this.to) {
 *         return { value: undefined, done: true }
 *       }
 *       return { value: this.num++, done: false }
 *     }
 *   }
 * }
 *
 * var counter = new Counter(3)
 * for (var number of counter) {
 *   console.log(number) // 0 ... 1 ... 2
 * }
 *
 * @type {Symbol|string}
 */
var $$ITERATOR = REAL_$$ITERATOR || '@@iterator'
exports.$$ITERATOR = $$ITERATOR

/**
 * Returns true if the provided object implements the Iterator protocol via
 * either implementing a `Symbol.iterator` or `"@@iterator"` method.
 *
 * @example
 *
 * var isIterable = require('iterall').isIterable
 * isIterable([ 1, 2, 3 ]) // true
 * isIterable('ABC') // true
 * isIterable({ key: 'value' }) // false
 *
 * @param obj
 *   A value which might implement the Iterable protocol.
 * @return {boolean} true if Iterable.
 */
function isIterable (obj) {
  return !!getIteratorMethod(obj)
}
exports.isIterable = isIterable

/**
 * Returns true if the provided object is an Object (i.e. not a string literal)
 * and is either Iterable or "Array-like" due to having a numeric
 * `length` property.
 *
 * This may be used in place of [Array.isArray()][isArray] to determine if an
 * object can be iterated-over. It always excludes string literals and includes
 * Arrays (regardless of if it is Iterable). It also includes other Array-like
 * objects such as NodeList, TypedArray, and Buffer.
 *
 * @example
 *
 * var isCollection = require('iterall').isCollection
 * var forEach = require('iterall').forEach
 * if (isCollection(obj)) {
 *   forEach(obj, function (value) {
 *     console.log(value)
 *   })
 * }
 *
 * @param obj
 *   An Object value which might implement the Iterable or Array-like protocols.
 * @return {boolean} true if Iterable or Array-like Object.
 */
function isCollection (obj) {
  return Object(obj) === obj && (typeof obj.length === 'number' || isIterable(obj))
}
exports.isCollection = isCollection

/**
 * If the provided object implements the Iterator protocol, its Iterator object
 * is returned. Otherwise returns undefined.
 *
 * @example
 *
 * var getIterator = require('iterall').getIterator
 * var iterator = getIterator([ 1, 2, 3 ])
 * iterator.next() // { value: 1, done: false }
 * iterator.next() // { value: 2, done: false }
 * iterator.next() // { value: 3, done: false }
 * iterator.next() // { value: undefined, done: true }
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>} iterable
 *   An Iterable object which is the source of an Iterator.
 * @return {Iterator<T>} new Iterator instance.
 */
function getIterator (iterable) {
  var method = getIteratorMethod(iterable)
  if (method) {
    return method.call(iterable)
  }
}
exports.getIterator = getIterator

/**
 * If the provided object implements the Iterator protocol, the method
 * responsible for producing its Iterator object is returned.
 *
 * This is used in rare cases for performance tuning. This method must be called
 * with obj as the contextual this-argument.
 *
 * @example
 *
 * var getIteratorMethod = require('iterall').getIteratorMethod
 * var myArray = [ 1, 2, 3 ]
 * var method = getIteratorMethod(myArray)
 * if (method) {
 *   var iterator = method.call(myArray)
 * }
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>} iterable
 *   An Iterable object which defines an `@@iterator` method.
 * @return {function(): Iterator<T>} `@@iterator` method.
 */
function getIteratorMethod (iterable) {
  if (iterable != null) {
    var method = REAL_$$ITERATOR && iterable[REAL_$$ITERATOR] || iterable['@@iterator']
    if (typeof method === 'function') {
      return method
    }
  }
}
exports.getIteratorMethod = getIteratorMethod

/**
 * Given an object which either implements the Iterable protocol or is
 * "Array-like", iterate over it, calling the `callback` at each iteration.
 *
 * Similar to [Array.prototype.forEach][], the `callback` function accepts three
 * arguments, and is provided with `thisArg` as the calling context.
 *
 * `forEach` adheres to the behavior described in the ECMAScript specification,
 * skipping over "holes" in Arrays and Array-likes.
 *
 * Note: providing an infinite Iterator to forEach will produce an error.
 *
 * [Array.prototype.forEach]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
 *
 * @example
 *
 * var forEach = require('iterall').forEach
 *
 * forEach(myIterable, function (value, index) {
 *   console.log(value, index)
 * })
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>|Array<T>} collection
 *   The Iterable or array to iterate over.
 * @param {function(T, number, object)} callback
 *   Function to execute for each iteration, taking up to three arguments
 * @param [thisArg]
 *   Optional. Value to use as `this` when executing `callback`.
 */
function forEach (collection, callback, thisArg) {
  if (collection != null) {
    if (typeof collection.forEach === 'function') {
      return collection.forEach(callback, thisArg)
    }
    var i = 0
    var iterator = getIterator(collection)
    if (iterator) {
      var step
      while (!(step = iterator.next()).done) {
        callback.call(thisArg, step.value, i++, collection)
        // Infinite Iterators could cause forEach to run forever.
        // After a very large number of iterations, produce an error.
        /* istanbul ignore if */
        if (i > 9999999) {
          throw new TypeError('Near-infinite iteration.')
        }
      }
    } else if (typeof collection.length === 'number') {
      for (; i < collection.length; i++) {
        if (collection.hasOwnProperty(i)) {
          callback.call(thisArg, collection[i], i, collection)
        }
      }
    }
  }
}
exports.forEach = forEach

/**
 * Similar to `getIterator()`, this method returns a new Iterator given an
 * Iterable. However it will also create an Iterator for a non-Iterable
 * Array-like collection, such as Array in a non-ES2015 environment.
 *
 * `createIterator` is complimentary to `forEach`, but allows a "pull"-based
 * iteration as opposed to `forEach`'s "push"-based iteration.
 *
 * `createIterator` produces an Iterator for Array-likes with the same behavior
 * as ArrayIteratorPrototype described in the ECMAScript specification, and
 * does *not* skip over "holes".
 *
 * @example
 *
 * var createIterator = require('iterall').createIterator
 *
 * var myArraylike = { length: 3, 0: 'Alpha', 1: 'Bravo', 2: 'Charlie' }
 * var iterator = createIterator(myArraylike)
 * iterator.next() // { value: 'Alpha', done: false }
 * iterator.next() // { value: 'Bravo', done: false }
 * iterator.next() // { value: 'Charlie', done: false }
 * iterator.next() // { value: undefined, done: true }
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>|Array<T>} collection
 *   An Iterable or Array-like object to produce an Iterator.
 * @return {Iterator<T>} new Iterator instance.
 */
function createIterator (collection) {
  if (collection != null) {
    var iterator = getIterator(collection)
    if (iterator) {
      return iterator
    }
    if (typeof collection.length === 'number') {
      return new ArraylikeIterator(collection)
    }
  }
}
exports.createIterator = createIterator

// When the object provided to `createIterator` is not Iterable but is
// Array-like, this simple Iterator is created.
function ArraylikeIterator (obj) {
  this._o = obj
  this._i = 0
}

// Note: all Iterators are themselves Iterable.
ArraylikeIterator.prototype[$$ITERATOR] = function () {
  return this
}

// A simple state-machine determines the IteratorResult returned, yielding
// each value in the Array-like object in order of their indicies.
ArraylikeIterator.prototype.next = function () {
  if (this._o === void 0 || this._i >= this._o.length) {
    this._o = void 0
    return { value: void 0, done: true }
  }
  return { value: this._o[this._i++], done: false }
}
