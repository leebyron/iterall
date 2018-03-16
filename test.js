/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

var assert = require('assert')
var regression = require('regression')

process.on('unhandledRejection', error => {
  console.log('\x1B[31m  \u2718 \x1B[0m unhandledRejection')
  process.exitCode = 1
  process.on('beforeExit', function() {
    console.error('\n\x1B[41m unhandledRejection \x1B[0m')
    console.error((error && error.stack) || error)
  })
})

async function test(name, rule) {
  try {
    var result = await rule()
    if (typeof result === 'boolean') {
      assert(result === true)
    }
    console.log('\x1B[32m  \u2714 \x1B[0m ' + name)
  } catch (error) {
    console.log('\x1B[31m  \u2718 \x1B[0m ' + name)
    process.exitCode = 1
    process.on('beforeExit', function() {
      console.error('\n\x1B[41m ' + name + ' \x1B[0m')
      console.error((error && error.stack) || error)
    })
  }
}

// $$iterator

var $$iterator = require('./').$$iterator

test('$$iterator is always available', () => $$iterator != null)

test('$$iterator is Symbol.iterator when available', () =>
  Symbol.iterator && $$iterator === Symbol.iterator)

test('$$iterator can be used to create new iterables', () => {
  function Counter(to) {
    this.to = to
  }

  Counter.prototype[$$iterator] = function() {
    return {
      to: this.to,
      num: 0,
      next() {
        if (this.num >= this.to) {
          return { value: undefined, done: true }
        }
        return { value: this.num++, done: false }
      },
      [$$iterator]() {
        return this
      }
    }
  }

  var counter = new Counter(3)
  var iterator = counter[$$iterator]()

  assert.deepEqual(iterator.next(), { value: 0, done: false })
  assert.deepEqual(iterator.next(), { value: 1, done: false })
  assert.deepEqual(iterator.next(), { value: 2, done: false })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
  assert.deepEqual(iterator.next(), { value: undefined, done: true })
})

// isIterable

var isIterable = require('./').isIterable

test('isIterable true for Array', () => isIterable([]) === true)

test('isIterable true for TypedArray', () =>
  isIterable(new Int8Array(1)) === true)

test('isIterable true for String', () =>
  isIterable('A') === true &&
  isIterable('0') === true &&
  isIterable(new String('ABC')) === true && // eslint-disable-line no-new-wrappers
  isIterable('') === true)

test('isIterable false for Number', () =>
  isIterable(1) === false &&
  isIterable(0) === false &&
  isIterable(new Number(123)) === false && // eslint-disable-line no-new-wrappers
  isIterable(NaN) === false)

test('isIterable false for Boolean', () =>
  isIterable(true) === false &&
  isIterable(false) === false &&
  isIterable(new Boolean(true)) === false) // eslint-disable-line no-new-wrappers

test('isIterable false for null', () => isIterable(null) === false)

test('isIterable false for undefined', () => isIterable(undefined) === false)

test('isIterable false for non-iterable Object', () =>
  isIterable({}) === false && isIterable({ iterable: true }) === false)

function argumentsObject(...args) {
  return arguments
}

function arrayLike() {
  return {
    length: 3,
    '0': 'Alpha',
    '1': 'Bravo',
    '2': 'Charlie'
  }
}

test('isIterable false for non-iterable Array-like Object', () =>
  isIterable(arrayLike()) === false)

// Flow has trouble tracking Symbol values and computed properties.
function iterSampleFib() /*: Iterable<number> */ {
  const iterable /*: any*/ = {
    [$$iterator]() {
      var x = 0
      var y = 1
      var iter = {
        next() {
          assert.equal(this, iter)
          if (x < 10) {
            x = x + y
            y = x - y
            return { value: x, done: false }
          }
          return { value: undefined, done: true }
        },
        [$$iterator]() {
          return this
        }
      }
      return iter
    }
  }
  return iterable
}

test('isIterable true for iterable Object', () => {
  isIterable(iterSampleFib()) === true
})

function* genSampleFib() /*: Generator<number, void, void> */ {
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

function badIterable() /*: mixed */ {
  return {
    // Note: this is a property instead of a method, therefore not matching
    // the iterable protocol.
    [$$iterator]: {
      next: function() {
        return { value: 'value', done: false }
      }
    }
  }
}

test('isIterable false for incorrect Iterable', () => {
  isIterable(badIterable()) === false
})

// isArrayLike

var isArrayLike = require('./').isArrayLike

test('isArrayLike true for Array', () => isArrayLike([]) === true)

test('isArrayLike true for TypedArray', () =>
  isArrayLike(new Int8Array(1)) === true)

test('isArrayLike true for String', () =>
  isArrayLike('A') === true &&
  isArrayLike('0') === true &&
  isArrayLike('') === true &&
  isArrayLike(new String('ABC')) === true) // eslint-disable-line no-new-wrappers

test('isArrayLike false for Number', () =>
  isArrayLike(1) === false &&
  isArrayLike(0) === false &&
  isArrayLike(new Number(123)) === false && // eslint-disable-line no-new-wrappers
  isArrayLike(NaN) === false)

test('isArrayLike false for Boolean', () =>
  isArrayLike(true) === false &&
  isArrayLike(false) === false &&
  isArrayLike(new Boolean(true)) === false) // eslint-disable-line no-new-wrappers

test('isArrayLike false for null', () => isArrayLike(null) === false)

test('isArrayLike false for undefined', () => isArrayLike(undefined) === false)

test('isArrayLike false for non-iterable Object', () =>
  isArrayLike({}) === false && isArrayLike({ iterable: true }) === false)

test('isArrayLike true for arguments Object', () =>
  isArrayLike(argumentsObject()) === true)

test('isArrayLike true for non-iterable Array-like Object', () =>
  isArrayLike(arrayLike()) === true)

test('isArrayLike false for weird length Object', () =>
  isArrayLike({ length: -1 }) === false &&
  isArrayLike({ length: 0.25 }) === false)

test('isArrayLike false for iterable Object', () => {
  isArrayLike(iterSampleFib()) === false
})

test('isArrayLike false for Generator', () => {
  isArrayLike(genSampleFib()) === false
})

// isCollection

var isCollection = require('./').isCollection

test('isCollection true for Array', () => isCollection([]) === true)

test('isCollection true for TypedArray', () =>
  isCollection(new Int8Array(1)) === true)

test('isCollection false for String literal', () =>
  isCollection('A') === false &&
  isCollection('0') === false &&
  isCollection('') === false)

test('isCollection true for String Object', () =>
  isCollection(new String('ABC')) === true) // eslint-disable-line no-new-wrappers

test('isCollection false for Number', () =>
  isCollection(1) === false &&
  isCollection(0) === false &&
  isCollection(new Number(123)) === false && // eslint-disable-line no-new-wrappers
  isCollection(NaN) === false)

test('isCollection false for Boolean', () =>
  isCollection(true) === false &&
  isCollection(false) === false &&
  isCollection(new Boolean(true)) === false) // eslint-disable-line no-new-wrappers

test('isCollection false for null', () => isCollection(null) === false)

test('isCollection false for undefined', () =>
  isCollection(undefined) === false)

test('isCollection false for non-iterable Object', () =>
  isCollection({}) === false && isCollection({ iterable: true }) === false)

test('isCollection true for arguments Object', () =>
  isCollection(argumentsObject()) === true)

test('isCollection true for non-iterable Array-like Object', () =>
  isCollection(arrayLike()) === true)

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
  var iterator = getIterator(['Alpha', 'Bravo', 'Charlie'])
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
  // Note: Flow correctly accepts a mixed type without complaints.
  // prettier-ignore
  getIterator((1/*: mixed*/)) === undefined &&
  // Flow allows providing any value
  getIterator(1) === undefined &&
  // Flow allows providing any value
  getIterator(0) === undefined &&
  getIterator(new Number(123)) === undefined && // eslint-disable-line no-new-wrappers
  getIterator(NaN) === undefined)

test('getIterator undefined for Boolean', () =>
  // Flow allows providing any value
  getIterator(true) === undefined &&
  // Flow allows providing any value
  getIterator(false) === undefined &&
  getIterator(new Boolean(true)) === undefined) // eslint-disable-line no-new-wrappers

test('getIterator undefined for null', () => getIterator(null) === undefined)

test('getIterator undefined for undefined', () =>
  getIterator(undefined) === undefined)

test('getIterator undefined for non-iterable Object', () =>
  getIterator({}) === undefined &&
  getIterator({ iterable: true }) === undefined &&
  getIterator(arrayLike()) === undefined)

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

function oldStyleIterable() {
  return {
    '@@iterator'() /*: Iterator<number>*/ {
      return {
        next() {
          return { value: Infinity, done: false }
        },
        '@@iterator'() {
          return this
        }
      }
    }
  }
}

test('getIterator provides Iterator for Firefox-style Iterable', () => {
  var iterator = getIterator(oldStyleIterable())
  assert(iterator)
  assert.deepEqual(iterator.next(), { value: Infinity, done: false })
  assert.deepEqual(iterator.next(), { value: Infinity, done: false })
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

test('getIterator undefined for incorrect Iterable', () =>
  getIterator(badIterable()) === undefined)

// getIteratorMethod

var getIteratorMethod = require('./').getIteratorMethod

test('getIteratorMethod provides Array#values for Array', () => {
  if (Array.prototype.values) {
    assert.equal(getIteratorMethod([1, 2, 3]), Array.prototype.values)
  }
})

test('getIteratorMethod provides function for String', () =>
  typeof getIteratorMethod('') === 'function')

test('getIteratorMethod provides function for Iterable', () =>
  typeof getIteratorMethod(iterSampleFib()) === 'function')

test('getIteratorMethod provides function for Generator', () =>
  typeof getIteratorMethod(genSampleFib()) === 'function')

test('getIteratorMethod undefined for incorrect Iterable', () =>
  getIteratorMethod(badIterable()) === undefined)

// forEach

var forEach = require('./').forEach

function createSpy(fn) {
  var calls = []
  function spyFn(...args) {
    calls.push([this, args])
    if (fn) {
      return fn.apply(this, arguments)
    }
  }
  spyFn.calls = calls
  return spyFn
}

test('forEach does not iterate over null', () => {
  var spy = createSpy()
  // $FlowExpectError
  forEach(null, spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forEach does not iterate over undefined', () => {
  var spy = createSpy()
  // $FlowExpectError
  forEach(undefined, spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forEach iterates over string literal', () => {
  var spy = createSpy()
  var myStr = 'ABC'
  forEach(myStr, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['A', 0, myStr]],
    [spy, ['B', 1, myStr]],
    [spy, ['C', 2, myStr]]
  ])
})

test('forEach iterates over Array', () => {
  var spy = createSpy()
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  forEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]],
    [spy, ['Charlie', 2, myArray]]
  ])
})

test('forEach iterates over holey Array', () => {
  var spy = createSpy()
  var myArray = new Array(5)
  myArray[1] = 'One'
  myArray[3] = 'Three'

  forEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['One', 1, myArray]],
    [spy, ['Three', 3, myArray]]
  ])
})

test('forEach iterates over Array with early break', () => {
  var BREAK = {}
  var spy = createSpy(val => {
    if (val === 'Bravo') {
      throw BREAK
    }
  })
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  try {
    forEach(myArray, spy, spy)
  } catch (e) {
    if (e !== BREAK) {
      throw e
    }
  }
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]]
  ])
})

test('forEach over Array propogates thrown error', () => {
  var error = new Error('test')
  var spy = createSpy(val => {
    if (val === 'Bravo') {
      throw error
    }
  })
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  var caughtError
  try {
    forEach(myArray, spy, spy)
  } catch (thrownError) {
    caughtError = thrownError
  }
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]]
  ])
  assert.equal(caughtError, error)
})

test('forEach iterates over Iterator', () => {
  var spy = createSpy()
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  var myIterator = getIterator(myArray)
  forEach(myIterator, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myIterator]],
    [spy, ['Bravo', 1, myIterator]],
    [spy, ['Charlie', 2, myIterator]]
  ])
})

test('forEach iterates over Iterator with early break', () => {
  var BREAK = {}
  var spy = createSpy(val => {
    if (val === 'Bravo') {
      throw BREAK
    }
  })
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  var myIterator = getIterator(myArray)
  try {
    forEach(myIterator, spy, spy)
  } catch (e) {
    if (e !== BREAK) {
      throw e
    }
  }
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myIterator]],
    [spy, ['Bravo', 1, myIterator]]
  ])
})

test('forEach does not iterate over incorrect Iterable', () => {
  var spy = createSpy()
  // $FlowExpectError
  forEach(badIterable(), spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forEach iterates over custom Iterable', () => {
  var spy = createSpy()
  var myIterable = iterSampleFib()
  forEach(myIterable, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, [1, 0, myIterable]],
    [spy, [1, 1, myIterable]],
    [spy, [2, 2, myIterable]],
    [spy, [3, 3, myIterable]],
    [spy, [5, 4, myIterable]],
    [spy, [8, 5, myIterable]],
    [spy, [13, 6, myIterable]]
  ])
})

test('forEach iterates over Generator', () => {
  var spy = createSpy()
  var myIterable = genSampleFib()
  forEach(myIterable, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, [1, 0, myIterable]],
    [spy, [1, 1, myIterable]],
    [spy, [2, 2, myIterable]],
    [spy, [3, 3, myIterable]],
    [spy, [5, 4, myIterable]],
    [spy, [8, 5, myIterable]],
    [spy, [13, 6, myIterable]]
  ])
})

test('forEach iterates over arguments Object', () => {
  var spy = createSpy()
  var myArgsObj = argumentsObject('Alpha', 'Bravo', 'Charlie')
  forEach(myArgsObj, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArgsObj]],
    [spy, ['Bravo', 1, myArgsObj]],
    [spy, ['Charlie', 2, myArgsObj]]
  ])
})

test('forEach iterates over Array-like', () => {
  var spy = createSpy()
  var myArrayLike = arrayLike()
  forEach(myArrayLike, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArrayLike]],
    [spy, ['Bravo', 1, myArrayLike]],
    [spy, ['Charlie', 2, myArrayLike]]
  ])
})

test('forEach iterates over holey Array-like', () => {
  var spy = createSpy()
  var myArrayLike = { length: 5, '1': 'One', '3': 'Three' }
  forEach(myArrayLike, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['One', 1, myArrayLike]],
    [spy, ['Three', 3, myArrayLike]]
  ])
})

test('forEach iterates over Array-like with early break', () => {
  var BREAK = {}
  var spy = createSpy(val => {
    if (val === 'Bravo') {
      throw BREAK
    }
  })
  var myArrayLike = arrayLike()
  try {
    forEach(myArrayLike, spy, spy)
  } catch (e) {
    if (e !== BREAK) {
      throw e
    }
  }
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArrayLike]],
    [spy, ['Bravo', 1, myArrayLike]]
  ])
})

function* infiniteIterator() {
  while (true) {
    yield true
  }
}

test('forEach throws when iterating over infinite iterator', () => {
  var caughtError
  try {
    forEach(infiniteIterator(), () => {})
  } catch (e) {
    caughtError = e
  }
  assert.equal(caughtError && caughtError.message, 'Near-infinite iteration.')
})

// createIterator

var createIterator = require('./').createIterator

test('createIterator returns undefined for null', () =>
  createIterator(null) === undefined)

test('createIterator returns undefined for undefined', () =>
  createIterator(undefined) === undefined)

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
  var iterator = createIterator(['Alpha', 'Bravo', 'Charlie'])
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
  var myIterator = getIterator(['Alpha', 'Bravo', 'Charlie'])
  var iterator = createIterator(myIterator)
  assert(iterator)
  assert.equal(iterator, myIterator)
})

test('createIterator returns undefined for incorrect Iterable', () =>
  createIterator(badIterable()) === undefined)

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
  var iterator = createIterator({ length: 5, '1': 'One', '3': 'Three' })
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

// $$asyncIterator

var $$asyncIterator = require('./').$$asyncIterator

test('$$asyncIterator is always available', () => $$asyncIterator != null)

test('$$asyncIterator is Symbol.asyncIterator when available', () =>
  // $FlowIssue(>=0.68.0) #27054000
  Symbol.asyncIterator && $$asyncIterator === Symbol.asyncIterator)

// Flow has trouble tracking Symbol values and computed properties.
/*:: declare class Chirper implements AsyncIterable<number> {
  constructor(number): void;
  @@asyncIterator(): AsyncIterator<number>
} */

function Chirper(to) {
  this.to = to
}

const ChirperPrototype /*: any */ = Chirper.prototype
ChirperPrototype[$$asyncIterator] = function() {
  return {
    to: this.to,
    num: 0,
    next() {
      return new Promise(resolve => {
        if (this.num >= this.to) {
          resolve({ value: undefined, done: true })
        } else {
          resolve({ value: this.num++, done: false })
        }
      })
    },
    [$$asyncIterator]() {
      return this
    }
  }
}

test('$$asyncIterator can be used to create new iterables', () => {
  // Flow has trouble tracking Symbol values and computed properties.
  var chirper /*: any*/ = new Chirper(3)
  var iterator /*: AsyncIterator<number>*/ = chirper[$$asyncIterator]()

  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 0, done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 1, done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 2, done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true }))
  ])
})

// isAsyncIterable

var isAsyncIterable = require('./').isAsyncIterable

test('isAsyncIterable false for Array', () => isAsyncIterable([]) === false)

test('isAsyncIterable false for String', () =>
  isAsyncIterable('A') === false &&
  isAsyncIterable('0') === false &&
  isAsyncIterable(new String('ABC')) === false && // eslint-disable-line no-new-wrappers
  isAsyncIterable('') === false)

test('isAsyncIterable false for null', () => isAsyncIterable(null) === false)

test('isAsyncIterable false for undefined', () =>
  isAsyncIterable(undefined) === false)

test('isAsyncIterable false for non-iterable Object', () =>
  isAsyncIterable({}) === false &&
  isAsyncIterable({ iterable: true }) === false)

test('isAsyncIterable false for iterable Object', () => {
  isAsyncIterable(iterSampleFib()) === false
})

test('isAsyncIterable false for Generator', () => {
  isAsyncIterable(genSampleFib()) === false
})

test('isAsyncIterable true for Async Iterable', () => {
  isAsyncIterable(new Chirper(3)) === true
})

// getAsyncIterator

var getAsyncIterator = require('./').getAsyncIterator

test('getAsyncIterator provides AsyncIterator for AsyncIterable', () => {
  var iterator = getAsyncIterator(new Chirper(3))
  assert(iterator)
  assert.equal(typeof iterator.next, 'function')
  var step = iterator.next()
  assert(step instanceof Promise)
  return step.then(step => assert.deepEqual(step, { value: 0, done: false }))
})

test('getAsyncIterator provides undefined for Array', () =>
  // Flow allows providing any value
  getAsyncIterator(['Alpha', 'Bravo', 'Charlie']) === undefined &&
  // Flow allows providing any value
  getAsyncIterator([]) === undefined)

test('getAsyncIterator provides undefined for String', () =>
  // Flow accepts mixed input without complaint
  // prettier-ignore
  getAsyncIterator(('A'/*: mixed*/)) === undefined &&
  // Flow allows providing any value
  getAsyncIterator('A') === undefined &&
  // Flow allows providing any value
  getAsyncIterator('0') === undefined &&
  // Flow allows providing any value
  getAsyncIterator('') === undefined &&
  getAsyncIterator(new String('ABC')) === undefined) // eslint-disable-line no-new-wrappers

test('getAsyncIterator undefined for null', () =>
  getAsyncIterator(null) === undefined)

test('getAsyncIterator undefined for undefined', () =>
  getAsyncIterator(undefined) === undefined)

test('getAsyncIterator provides undefined for Iterable and Generator', () =>
  getAsyncIterator(iterSampleFib()) === undefined &&
  getAsyncIterator(genSampleFib()) === undefined)

function nonSymbolAsyncIterable() {
  return {
    '@@asyncIterator'() /*: AsyncIterator<number>*/ {
      return {
        next() {
          return Promise.resolve({ value: Infinity, done: false })
        },
        '@@asyncIterator'() {
          return this
        }
      }
    }
  }
}

test('getAsyncIterator provides AsyncIterator for non-Symbol AsyncIterable', () => {
  var iterator = getAsyncIterator(nonSymbolAsyncIterable())
  assert(iterator)
  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: Infinity, done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: Infinity, done: false }))
  ])
})

// getAsyncIteratorMethod

var getAsyncIteratorMethod = require('./').getAsyncIteratorMethod

test('getAsyncIteratorMethod provides function for AsyncIterable', () => {
  var chirper = new Chirper(3)
  var method = getAsyncIteratorMethod(chirper)
  assert.equal(typeof method, 'function')
  var iterator = method.call(chirper)
  return iterator
    .next()
    .then(step => assert.deepEqual(step, { value: 0, done: false }))
})

test('getAsyncIteratorMethod provides undefined for Generator', () =>
  getAsyncIteratorMethod(genSampleFib()) === undefined)

// createIterator

var createAsyncIterator = require('./').createAsyncIterator

test('createAsyncIterator returns undefined for null', () =>
  createAsyncIterator(null) === undefined)

test('createAsyncIterator returns undefined for undefined', () =>
  createAsyncIterator(undefined) === undefined)

test('createAsyncIterator creates AsyncIterator from AsyncIterable', async () => {
  var iterator = createAsyncIterator(new Chirper(3))
  assert(iterator)
  assert.equal(typeof iterator.next, 'function')
  var step = iterator.next()
  assert(step instanceof Promise)
  assert.deepEqual(await step, { value: 0, done: false })
})

test('createAsyncIterator creates AsyncIterator from another AsyncIterator', () => {
  var iterator1 = createAsyncIterator(arrayLike())
  assert(iterator1)
  var iterator2 = createAsyncIterator(iterator1)
  assert.equal(iterator1, iterator2)
})

test('createAsyncIterator creates AsyncIterator for string literal', () => {
  var iterator = createAsyncIterator('ABC')
  assert(iterator)
  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'A', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'B', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'C', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true }))
  ])
})

test('createAsyncIterator creates Iterator for Array', () => {
  var data /*: Array<string> */ = ['Alpha', 'Bravo', 'Charlie']
  var iterator = createAsyncIterator(data)
  assert(iterator)
  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Alpha', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Bravo', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Charlie', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true }))
  ])
})

test('createAsyncIterator creates Iterator for Iterator', () => {
  var myIterator = getIterator(['Alpha', 'Bravo', 'Charlie'])
  var iterator = createAsyncIterator(myIterator)
  assert(iterator)
  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Alpha', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Bravo', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Charlie', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true }))
  ])
})

test('createAsyncIterator creates Iterator for arguments Object', () => {
  var iterator = createAsyncIterator(
    argumentsObject('Alpha', 'Bravo', 'Charlie')
  )
  assert(iterator)
  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Alpha', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Bravo', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Charlie', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true }))
  ])
})

test('createAsyncIterator creates Iterator for Array-like', () => {
  var iterator = createAsyncIterator(arrayLike())
  assert(iterator)
  return Promise.all([
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Alpha', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Bravo', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: 'Charlie', done: false })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true })),
    iterator
      .next()
      .then(step => assert.deepEqual(step, { value: undefined, done: true }))
  ])
})

// forAwaitEach

var forAwaitEach = require('./').forAwaitEach

test('forAwaitEach does not iterate over null', async () => {
  var spy = createSpy()
  // $FlowExpectError
  await forAwaitEach(null, spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forAwaitEach does not iterate over undefined', async () => {
  var spy = createSpy()
  // $FlowExpectError
  await forAwaitEach(undefined, spy, spy)
  assert.deepEqual(spy.calls, [])
})

test('forAwaitEach iterates over string literal', async () => {
  var spy = createSpy()
  var myStr = 'ABC'
  await forAwaitEach(myStr, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['A', 0, myStr]],
    [spy, ['B', 1, myStr]],
    [spy, ['C', 2, myStr]]
  ])
})

test('forAwaitEach iterates over string literal with an async callback', async () => {
  var spy = createSpy()
  var iterSpy = createSpy(function(value) {
    spy.apply(this, arguments)
    return Promise.resolve().then(() => {
      spy.call(this, 'Waited after ' + String(value))
    })
  })
  var myStr = 'ABC'
  await forAwaitEach(myStr, iterSpy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['A', 0, myStr]],
    [spy, ['Waited after A']],
    [spy, ['B', 1, myStr]],
    [spy, ['Waited after B']],
    [spy, ['C', 2, myStr]],
    [spy, ['Waited after C']]
  ])
})

test('forAwaitEach iterates over Array', async () => {
  var spy = createSpy()
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  await forAwaitEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]],
    [spy, ['Charlie', 2, myArray]]
  ])
})

test('forAwaitEach iterates over Array with early break', async () => {
  var BREAK = {}
  var spy = createSpy(val => {
    if (val === 'Bravo') {
      throw BREAK
    }
  })
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  try {
    await forAwaitEach(myArray, spy, spy)
  } catch (e) {
    if (e !== BREAK) {
      throw e
    }
  }
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]]
  ])
})

test('forAwaitEach iterates over Array of Promises', async () => {
  var spy = createSpy()
  var myArray = [
    Promise.resolve('Alpha'),
    Promise.resolve('Bravo'),
    Promise.resolve('Charlie')
  ]
  await forAwaitEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]],
    [spy, ['Charlie', 2, myArray]]
  ])
})

test('forAwaitEach iterates over Array of mixed Values and Promises', async () => {
  var spy = createSpy()
  var myArray = [Promise.resolve('Alpha'), 'Bravo', Promise.resolve('Charlie')]
  await forAwaitEach(myArray, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArray]],
    [spy, ['Bravo', 1, myArray]],
    [spy, ['Charlie', 2, myArray]]
  ])
})

test('forAwaitEach iterates over Array-like', async () => {
  var spy = createSpy()
  var myArrayLike = arrayLike()
  await forAwaitEach(myArrayLike, spy, spy)
  assert.deepEqual(spy.calls, [
    [spy, ['Alpha', 0, myArrayLike]],
    [spy, ['Bravo', 1, myArrayLike]],
    [spy, ['Charlie', 2, myArrayLike]]
  ])
})

// Note: using regular functions in some of these tests as illustration
test('forAwaitEach iterates over Iterator', () => {
  var spy = createSpy()
  var myArray = ['Alpha', 'Bravo', 'Charlie']
  var myIterator = getIterator(myArray)
  return forAwaitEach(myIterator, spy, spy).then(() =>
    assert.deepEqual(spy.calls, [
      [spy, ['Alpha', 0, myIterator]],
      [spy, ['Bravo', 1, myIterator]],
      [spy, ['Charlie', 2, myIterator]]
    ])
  )
})

test('forAwaitEach iterates over custom Iterable', () => {
  var spy = createSpy()
  var myIterable = iterSampleFib()
  return forAwaitEach(myIterable, spy, spy).then(() =>
    assert.deepEqual(spy.calls, [
      [spy, [1, 0, myIterable]],
      [spy, [1, 1, myIterable]],
      [spy, [2, 2, myIterable]],
      [spy, [3, 3, myIterable]],
      [spy, [5, 4, myIterable]],
      [spy, [8, 5, myIterable]],
      [spy, [13, 6, myIterable]]
    ])
  )
})

test('forAwaitEach iterates over custom AsyncIterable', () => {
  var spy = createSpy()
  var myAsyncIterable = new Chirper(3)
  return forAwaitEach(myAsyncIterable, spy, spy).then(() =>
    assert.deepEqual(spy.calls, [
      [spy, [0, 0, myAsyncIterable]],
      [spy, [1, 1, myAsyncIterable]],
      [spy, [2, 2, myAsyncIterable]]
    ])
  )
})

test('forAwaitEach iterates over custom AsyncIterable with early break', () => {
  var BREAK = {}
  var spy = createSpy(val => {
    if (val === 1) {
      throw BREAK
    }
  })
  var myAsyncIterable = new Chirper(3)
  return forAwaitEach(myAsyncIterable, spy, spy)
    .catch(e => {
      if (e !== BREAK) {
        throw e
      }
    })
    .then(() =>
      assert.deepEqual(spy.calls, [
        [spy, [0, 0, myAsyncIterable]],
        [spy, [1, 1, myAsyncIterable]]
      ])
    )
})

test('forAwaitEach catches callback errors', () => {
  var myIterable = iterSampleFib()
  var error = new Error()
  var callback = () => {
    throw error
  }
  return forAwaitEach(myIterable, callback).catch(e =>
    assert.strictEqual(e, error)
  )
})

function* genError(error, on) /*: Generator<number, void, void> */ {
  var x = 0
  while (true) {
    if (x >= on) {
      throw error
    }
    yield x
    x = x + 1
  }
}

test('forAwaitEach catches Iterable errors', async () => {
  await Promise.all(
    [0, 1, 2].map(async on => {
      var spy = createSpy()
      var error = new Error()
      var myIterable = genError(error, on)
      await forAwaitEach(myIterable, spy, spy).catch(e =>
        assert.strictEqual(e, error)
      )
      assert.equal(spy.calls.length, on)
    })
  )
})

// Flow has trouble tracking Symbol values and computed properties.
/*:: declare class ChirpError implements AsyncIterable<number> {
  constructor(...any): void;
  @@asyncIterator(): AsyncIterator<number>
} */
function ChirpError(error, on, inPromise) {
  this.error = error
  this.on = on
  this.inPromise = inPromise
}

var ChirpErrorPrototype /*: any */ = ChirpError.prototype
ChirpErrorPrototype[$$asyncIterator] = function() {
  return {
    error: this.error,
    on: this.on,
    inPromise: this.inPromise,
    num: 0,
    next() {
      if (!this.inPromise && this.num >= this.on) {
        throw this.error
      }
      return new Promise(resolve => {
        if (this.num >= this.on) {
          throw this.error
        } else {
          resolve({ value: this.num++, done: false })
        }
      })
    },
    [$$asyncIterator]() {
      return this
    }
  }
}

test('forAwaitEach catches AsyncIterable errors', async () => {
  await Promise.all(
    [
      { on: 0, inPromise: false },
      { on: 0, inPromise: true },
      { on: 1, inPromise: false },
      { on: 1, inPromise: true },
      { on: 2, inPromise: false },
      { on: 2, inPromise: true }
    ].map(async ({ on, inPromise }) => {
      var spy = createSpy()
      var error = new Error()
      var myAsyncIterable = new ChirpError(error, on, inPromise)
      await forAwaitEach(myAsyncIterable, spy, spy).catch(e =>
        assert.strictEqual(e, error)
      )
      assert.equal(spy.calls.length, on)
    })
  )
})

test('forAwaitEach does not leak memory', async () => {
  var iterable = new Chirper(100001)
  var mem = []
  await forAwaitEach(iterable, (value, index) => {
    if (index % 10000 === 0) {
      mem.push([value, process.memoryUsage().heapUsed])
    }
  })
  var results = regression.linear(mem)
  assert.ok(
    results.r2 < 0.75 || results.equation[0] < 50,
    'Expected non-linear growth of memory use. Saw: ' +
      mem.map(pt => mb(pt[1])).join('->')
  )
})

function mb(bytes) {
  const megabytes = bytes / Math.pow(2, 20)
  return Math.round(megabytes * 10) / 10 + 'MB'
}
