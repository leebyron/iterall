/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var assert = require('assert')

function test (name, rule) {
  try {
    var result = rule()
    if (result !== undefined) {
      assert(result === true)
    }
    console.log('\x1B[32m  \u2714 \x1B[0m ' + name)
  } catch (error) {
    console.log('\x1B[31m  \u2718 \x1B[0m ' + name)
    process.exitCode = 1
    process.on('beforeExit', function () {
      console.error('\n\x1B[41m ' + name + ' \x1B[0m')
      console.error(error && error.stack || error)
    })
  }
}

// $$ITERATOR

var $$ITERATOR = require('./').$$ITERATOR

test('$$ITERATOR is always available', () =>
  $$ITERATOR != null
)

test('$$ITERATOR is Symbol.iterator when available', () =>
  Symbol.iterator && $$ITERATOR === Symbol.iterator
)

// isIterable

var isIterable = require('./').isIterable

test('isIterable true for Array', () =>
  isIterable([]) === true
)

test('isIterable true for TypedArray', () =>
  isIterable(new Int8Array()) === true
)

test('isIterable true for String', () =>
  isIterable('A') === true &&
  isIterable('0') === true &&
  isIterable(new String('ABC')) === true && // eslint-disable-line no-new-wrappers
  isIterable('') === true
)

test('isIterable false for Number', () =>
  isIterable(1) === false &&
  isIterable(0) === false &&
  isIterable(new Number(123)) === false && // eslint-disable-line no-new-wrappers
  isIterable(NaN) === false
)

test('isIterable false for Boolean', () =>
  isIterable(true) === false &&
  isIterable(false) === false &&
  isIterable(new Boolean(true)) === false // eslint-disable-line no-new-wrappers
)

test('isIterable false for null', () =>
  isIterable(null) === false
)

test('isIterable false for undefined', () =>
  isIterable(undefined) === false
)

test('isIterable false for non-iterable Object', () =>
  isIterable({}) === false &&
  isIterable({ iterable: true }) === false
)

function argumentsObject () {
  return arguments
}

function arrayLike () {
  return {
    length: 3,
    0: 'Alpha',
    1: 'Bravo',
    2: 'Charlie'
  }
}

test('isIterable false for non-iterable Array-like Object', () =>
  isIterable(arrayLike()) === false
)

function iterSampleFib () {
  return {
    [$$ITERATOR] () {
      var x = 0
      var y = 1
      var iter = {
        next () {
          assert.equal(this, iter)
          if (x < 10) {
            x = x + y
            y = x - y
            return { value: x, done: false }
          }
          return { value: undefined, done: true }
        }
      }
      return iter
    }
  }
}

test('isIterable true for iterable Object', () => {
  isIterable(iterSampleFib()) === true
})

function * genSampleFib () {
  var x = 0
  var y = 1
  while (x < 10) {
    x = x + y
    y = x - y
    yield x
  }
}

test('isIterable true for Generator', () => {
  isIterable(genSampleFib()) === true
})

function badIterable () {
  return {
    [$$ITERATOR]: {
      next: function () {
        return { value: 'value', done: false }
      }
    }
  }
}

test('isIterable false for incorrect Iterable', () => {
  isIterable(badIterable()) === false
})

// isCollection

var isCollection = require('./').isCollection

test('isCollection true for Array', () =>
  isCollection([]) === true
)

test('isCollection true for TypedArray', () =>
  isCollection(new Int8Array()) === true
)

test('isCollection false for String literal', () =>
  isCollection('A') === false &&
  isCollection('0') === false &&
  isCollection('') === false
)

test('isCollection true for String Object', () =>
  isCollection(new String('ABC')) === true // eslint-disable-line no-new-wrappers
)

test('isCollection false for Number', () =>
  isCollection(1) === false &&
  isCollection(0) === false &&
  isCollection(new Number(123)) === false && // eslint-disable-line no-new-wrappers
  isCollection(NaN) === false
)

test('isCollection false for Boolean', () =>
  isCollection(true) === false &&
  isCollection(false) === false &&
  isCollection(new Boolean(true)) === false // eslint-disable-line no-new-wrappers
)

test('isCollection false for null', () =>
  isCollection(null) === false
)

test('isCollection false for undefined', () =>
  isCollection(undefined) === false
)

test('isCollection false for non-iterable Object', () =>
  isCollection({}) === false &&
  isCollection({ iterable: true }) === false
)

test('isCollection true for arguments Object', () =>
  isCollection(argumentsObject()) === true
)

test('isCollection true for non-iterable Array-like Object', () =>
  isCollection(arrayLike()) === true
)

test('isCollection true for iterable Object', () => {
  isCollection(iterSampleFib()) === true
})

test('isCollection true for Generator', () => {
  isCollection(genSampleFib()) === true
})

test('isCollection false for incorrect Iterable', () => {
  isCollection(badIterable()) === false
})

// getIterator

var getIterator = require('./').getIterator

test('getIterator provides Iterator for Array', () => {
  var iterator = getIterator([ 'Alpha', 'Bravo', 'Charlie' ])
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 'Alpha', done: false })
  assert.deepEqual(iterator.next(), { value: 'Bravo', done: false })
  assert.deepEqual(iterator.next(), { value: 'Charlie', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('getIterator provides Iterator for empty Array', () => {
  var iterator = getIterator([])
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('getIterator provides Iterator for String', () => {
  var iterator = getIterator('ABC')
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 'A', done: false })
  assert.deepEqual(iterator.next(), { value: 'B', done: false })
  assert.deepEqual(iterator.next(), { value: 'C', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('getIterator provides Iterator for empty String', () => {
  var iterator = getIterator('')
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('getIterator undefined for Number', () =>
  getIterator(1) === undefined &&
  getIterator(0) === undefined &&
  getIterator(new Number(123)) === undefined && // eslint-disable-line no-new-wrappers
  getIterator(NaN) === undefined
)

test('getIterator undefined for Boolean', () =>
  getIterator(true) === undefined &&
  getIterator(false) === undefined &&
  getIterator(new Boolean(true)) === undefined // eslint-disable-line no-new-wrappers
)

test('getIterator undefined for null', () =>
  getIterator(null) === undefined
)

test('getIterator undefined for undefined', () =>
  getIterator(undefined) === undefined
)

test('getIterator undefined for non-iterable Object', () =>
  getIterator({}) === undefined &&
  getIterator({ iterable: true }) === undefined &&
  getIterator(arrayLike()) === undefined
)

test('getIterator provides Iterator for iterable Object', () => {
  var iterator = getIterator(iterSampleFib())
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 2, done: false })
  assert.deepEqual(iterator.next(), { value: 3, done: false })
  assert.deepEqual(iterator.next(), { value: 5, done: false })
  assert.deepEqual(iterator.next(), { value: 8, done: false })
  assert.deepEqual(iterator.next(), { value: 13, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('getIterator provides Iterator for Generator', () => {
  var iterator = getIterator(genSampleFib())
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 2, done: false })
  assert.deepEqual(iterator.next(), { value: 3, done: false })
  assert.deepEqual(iterator.next(), { value: 5, done: false })
  assert.deepEqual(iterator.next(), { value: 8, done: false })
  assert.deepEqual(iterator.next(), { value: 13, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('getIteratorMethod undefined for incorrect Iterable', () =>
  getIterator(badIterable()) === undefined
)

// getIteratorMethod

var getIteratorMethod = require('./').getIteratorMethod

test('getIteratorMethod provides Array#values for Array', () => {
  if (Array.prototype.values) {
    assert.equal(getIteratorMethod([ 1, 2, 3 ]), Array.prototype.values)
  }
})

test('getIteratorMethod provides function for String', () =>
  typeof getIteratorMethod('') === 'function'
)

test('getIteratorMethod provides function for Iterable', () =>
  typeof getIteratorMethod(iterSampleFib()) === 'function'
)

test('getIteratorMethod provides function for Generator', () =>
  typeof getIteratorMethod(genSampleFib()) === 'function'
)

test('getIteratorMethod undefined for incorrect Iterable', () =>
  getIteratorMethod(badIterable()) === undefined
)

// forEach

var forEach = require('./').forEach

function createSpy () {
  var calls = []
  function spyFn () {
    calls.push([ this, [ ...arguments ] ])
  }
  spyFn.calls = calls
  return spyFn
}

test('forEach does not iterate over null', () => {
  var spy = createSpy()
  forEach(null, spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forEach does not iterate over undefined', () => {
  var spy = createSpy()
  forEach(undefined, spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forEach iterates over string literal', () => {
  var spy = createSpy()
  var myStr = 'ABC'
  forEach(myStr, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'A', 0, myStr ] ],
    [ spy, [ 'B', 1, myStr ] ],
    [ spy, [ 'C', 2, myStr ] ]
  ])
})

test('forEach iterates over Array', () => {
  var spy = createSpy()
  var myArray = [ 'Alpha', 'Bravo', 'Charlie' ]
  forEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'Alpha', 0, myArray ] ],
    [ spy, [ 'Bravo', 1, myArray ] ],
    [ spy, [ 'Charlie', 2, myArray ] ]
  ])
})

test('forEach iterates over holey Array', () => {
  var spy = createSpy()
  var myArray = new Array(5)
  myArray[1] = 'One'
  myArray[3] = 'Three'

  forEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'One', 1, myArray ] ],
    [ spy, [ 'Three', 3, myArray ] ]
  ])
})

test('forEach iterates over Iterator', () => {
  var spy = createSpy()
  var myArray = [ 'Alpha', 'Bravo', 'Charlie' ]
  var myIterator = getIterator(myArray)
  forEach(myIterator, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'Alpha', 0, myIterator ] ],
    [ spy, [ 'Bravo', 1, myIterator ] ],
    [ spy, [ 'Charlie', 2, myIterator ] ]
  ])
})

test('forEach does not iterate over incorrect Iterable', () => {
  var spy = createSpy()
  forEach(badIterable(), spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forEach iterates over custom Iterable', () => {
  var spy = createSpy()
  var myIterable = iterSampleFib()
  forEach(myIterable, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 1, 0, myIterable ] ],
    [ spy, [ 1, 1, myIterable ] ],
    [ spy, [ 2, 2, myIterable ] ],
    [ spy, [ 3, 3, myIterable ] ],
    [ spy, [ 5, 4, myIterable ] ],
    [ spy, [ 8, 5, myIterable ] ],
    [ spy, [ 13, 6, myIterable ] ]
  ])
})

test('forEach iterates over Generator', () => {
  var spy = createSpy()
  var myIterable = genSampleFib()
  forEach(myIterable, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 1, 0, myIterable ] ],
    [ spy, [ 1, 1, myIterable ] ],
    [ spy, [ 2, 2, myIterable ] ],
    [ spy, [ 3, 3, myIterable ] ],
    [ spy, [ 5, 4, myIterable ] ],
    [ spy, [ 8, 5, myIterable ] ],
    [ spy, [ 13, 6, myIterable ] ]
  ])
})

test('forEach iterates over arguments Object', () => {
  var spy = createSpy()
  var myArgsObj = argumentsObject('Alpha', 'Bravo', 'Charlie')
  forEach(myArgsObj, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'Alpha', 0, myArgsObj ] ],
    [ spy, [ 'Bravo', 1, myArgsObj ] ],
    [ spy, [ 'Charlie', 2, myArgsObj ] ]
  ])
})

test('forEach iterates over Array-like', () => {
  var spy = createSpy()
  var myArrayLike = arrayLike()
  forEach(myArrayLike, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'Alpha', 0, myArrayLike ] ],
    [ spy, [ 'Bravo', 1, myArrayLike ] ],
    [ spy, [ 'Charlie', 2, myArrayLike ] ]
  ])
})

test('forEach iterates over holey Array-like', () => {
  var spy = createSpy()
  var myArrayLike = { length: 5, 1: 'One', 3: 'Three' }
  forEach(myArrayLike, spy, spy)
  assert.deepEqual(spy.calls, [
    [ spy, [ 'One', 1, myArrayLike ] ],
    [ spy, [ 'Three', 3, myArrayLike ] ]
  ])
})

// createIterator

var createIterator = require('./').createIterator

test('createIterator returns undefined for null', () =>
  createIterator(null) === undefined
)

test('createIterator returns undefined for undefined', () =>
  createIterator(undefined) === undefined
)

test('createIterator creates Iterator for string literal', () => {
  var iterator = createIterator('ABC')
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 'A', done: false })
  assert.deepEqual(iterator.next(), { value: 'B', done: false })
  assert.deepEqual(iterator.next(), { value: 'C', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for Array', () => {
  var iterator = createIterator([ 'Alpha', 'Bravo', 'Charlie' ])
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 'Alpha', done: false })
  assert.deepEqual(iterator.next(), { value: 'Bravo', done: false })
  assert.deepEqual(iterator.next(), { value: 'Charlie', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for holey Array', () => {
  var myArray = new Array(5)
  myArray[1] = 'One'
  myArray[3] = 'Three'
  var iterator = createIterator(myArray)
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: undefined, done: false })
  assert.deepEqual(iterator.next(), { value: 'One', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: false })
  assert.deepEqual(iterator.next(), { value: 'Three', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for Iterator', () => {
  var myIterator = getIterator([ 'Alpha', 'Bravo', 'Charlie' ])
  var iterator = createIterator(myIterator)
  assert(iterator)
  assert.equal(iterator, myIterator)
})

test('createIterator returns undefined for incorrect Iterable', () =>
  createIterator(badIterable()) === undefined
)

test('createIterator creates Iterator for custom Iterable', () => {
  var iterator = createIterator(iterSampleFib())
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 2, done: false })
  assert.deepEqual(iterator.next(), { value: 3, done: false })
  assert.deepEqual(iterator.next(), { value: 5, done: false })
  assert.deepEqual(iterator.next(), { value: 8, done: false })
  assert.deepEqual(iterator.next(), { value: 13, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for Generator', () => {
  var iterator = createIterator(genSampleFib())
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 2, done: false })
  assert.deepEqual(iterator.next(), { value: 3, done: false })
  assert.deepEqual(iterator.next(), { value: 5, done: false })
  assert.deepEqual(iterator.next(), { value: 8, done: false })
  assert.deepEqual(iterator.next(), { value: 13, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for arguments Object', () => {
  var iterator = createIterator(argumentsObject('Alpha', 'Bravo', 'Charlie'))
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 'Alpha', done: false })
  assert.deepEqual(iterator.next(), { value: 'Bravo', done: false })
  assert.deepEqual(iterator.next(), { value: 'Charlie', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for Array-like', () => {
  var iterator = createIterator(arrayLike())
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: 'Alpha', done: false })
  assert.deepEqual(iterator.next(), { value: 'Bravo', done: false })
  assert.deepEqual(iterator.next(), { value: 'Charlie', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for holey Array-like', () => {
  var iterator = createIterator({ length: 5, 1: 'One', 3: 'Three' })
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: undefined, done: false })
  assert.deepEqual(iterator.next(), { value: 'One', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: false })
  assert.deepEqual(iterator.next(), { value: 'Three', done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

test('createIterator creates Iterator for Array-like which is Iterable', () => {
  var iterator1 = createIterator(arrayLike())
  assert(iterator1)
  var iterator2 = createIterator(iterator1)
  assert.equal(iterator1, iterator2)
})
