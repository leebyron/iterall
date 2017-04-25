/**
 * Copyright (c) 2016, Lee Byron
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Note: TypeScript already has built-in definitions for
// Iterable<TValue> and Iterator<TValue> so they are not defined here.

export var $$iterator: symbol | string

export function isIterable(obj: any): boolean

export function isArrayLike(obj: any): boolean

export function isCollection(obj: any): boolean

export function getIterator<TValue>(
  iterable: Iterable<TValue>
): Iterator<TValue>
export function getIterator(iterable: any): void | Iterator<any>

export function getIteratorMethod<TValue>(
  iterable: Iterable<TValue>
): () => Iterator<TValue>
export function getIteratorMethod(iterable: any): void | (() => Iterator<any>)

export function forEach<TValue, TCollection extends Iterable<TValue>>(
  collection: TCollection,
  callbackFn: (value: TValue, index: number, collection: TCollection) => any,
  thisArg?: any
): void
export function forEach<TCollection extends { length: number }>(
  collection: TCollection,
  callbackFn: (value: any, index: number, collection: TCollection) => any,
  thisArg?: any
): void

export function createIterator<TValue>(
  collection: Iterable<TValue>
): Iterator<TValue>
export function createIterator(collection: { length: number }): Iterator<any>
export function createIterator(collection: any): void | Iterator<any>

export var $$asyncIterator: symbol | string

export function isAsyncIterable(obj: any): boolean

export function getAsyncIterator(
  asyncIterable: any
): void | AsyncIterator<mixed>

export function getAsyncIteratorMethod<TValue>(
  asyncIterable: AsyncIterable<TValue>
): () => AsyncIterator<TValue>
export function getAsyncIteratorMethod(
  asyncIterable: any
): void | (() => AsyncIterator<mixed>)

export function createAsyncIterator<TValue>(
  collection: AsyncIterable<TValue> | Iterable<Promise<TValue>> | Iterable<TValue>
): AsyncIterator<TValue>
export function createAsyncIterator(
  collection: {length: number}
): AsyncIterator<mixed>
export function createAsyncIterator(
  collection: any
): void | AsyncIterator<mixed>

export function forAwaitEach<TValue, TCollection extends AsyncIterable<TValue> | Iterable<Promise<TValue>> | Iterable<TValue>>(
  collection: TCollection,
  callbackFn: (value: TValue, index: number, collection: TCollection) => any,
  thisArg?: any
): Promise<void>
export function forAwaitEach<TCollection extends { length: number }>(
  collection: TCollection,
  callbackFn: (
    value: mixed,
    index: number,
    collection: TCollection
  ) => Promise<any>,
  thisArg?: any
): Promise<void>
