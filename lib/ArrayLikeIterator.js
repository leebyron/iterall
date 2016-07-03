// When the object provided to `createIterator` is not Iterable but is
// Array-like, this simple Iterator is created.
var $$iterator = require('./$$iterator')

function ArrayLikeIterator (obj) {
  this._o = obj
  this._i = 0
}

// Note: all Iterators are themselves Iterable.
ArrayLikeIterator.prototype[$$iterator] = function () {
  return this
}

// A simple state-machine determines the IteratorResult returned, yielding
// each value in the Array-like object in order of their indicies.
ArrayLikeIterator.prototype.next = function () {
  if (this._o === void 0 || this._i >= this._o.length) {
    this._o = void 0
    return { value: void 0, done: true }
  }
  return { value: this._o[this._i++], done: false }
}

module.exports = ArrayLikeIterator
