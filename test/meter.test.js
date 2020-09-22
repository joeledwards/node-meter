const tap = require('tap')
const meter = require('../meter')

tap.test('meter() allocates an empty meter', async assert => {
  const m = meter()
  assert.equal(m.size(), 0)

  assert.equal(m.get('foo'), 0)
  assert.equal(m.add('foo'), 1)
  assert.equal(m.get('foo'), 1)

  assert.equal(m.size(), 1)

  assert.equal(m.get('bar'), 0)
  assert.equal(m.add('bar'), 1)
  assert.equal(m.get('bar'), 1)

  assert.equal(m.get('foo'), 1)
  assert.equal(m.size(), 2)
})

tap.test('meter.get() handles invalid keys gracefully', async assert => {
  const m = meter()
  assert.equal(m.add('foo'), 1)
  assert.equal(m.get(500), 0)
  assert.equal(m.get(true), 0)
  assert.equal(m.get({ foo: true }), 0)
  assert.equal(m.get(['foo']), 0)
})

tap.test('meter.add() permits a custom increment', async assert => {
  const m = meter()
  assert.equal(m.add('foo', 2), 2)
  assert.equal(m.add('foo', 3), 5)
  assert.equal(m.size(), 1)
  assert.equal(m.get('foo'), 5)
})

tap.test('meter.min() retains minimum of existing or new value', async assert => {
  const m = meter()
  assert.equal(m.min(), 0)
  assert.equal(m.min('foo', 10), 10)
  assert.equal(m.min('foo', 5), 5)
  assert.equal(m.min('foo', 10), 5)
  assert.equal(m.min('foo', 3), 3)
  assert.equal(m.min('foo', 1), 1)
  assert.equal(m.min('foo', 3), 1)
  assert.equal(m.min('foo', 0), 0)
  assert.equal(m.min('foo', 10), 0)
  assert.equal(m.min('foo', -10), -10)
  assert.equal(m.min('foo', 10), -10)
  assert.equal(m.min(), 0)
})

tap.test('meter.max() retains maximum of existing or new value', async assert => {
  const m = meter()
  assert.equal(m.max(), 0)
  assert.equal(m.max('foo', -10), -10)
  assert.equal(m.max('foo', -5), -5)
  assert.equal(m.max('foo', -10), -5)
  assert.equal(m.max('foo', 0), 0)
  assert.equal(m.max('foo', -5), 0)
  assert.equal(m.max('foo', 3), 3)
  assert.equal(m.max('foo', 0), 3)
  assert.equal(m.max('foo', 10), 10)
  assert.equal(m.max('foo', 0), 10)
  assert.equal(m.max(), 0)
})

tap.test('meter.set() permits a custom count; ignoring invalid inputs', async assert => {
  const m = meter()
  assert.equal(m.add('foo', 5), 5)
  assert.equal(m.set('foo', 3), 3)
  assert.equal(m.size(), 1)
  assert.equal(m.get('foo'), 3)
  assert.equal(m.add('foo'), 4)
  assert.equal(m.get('foo'), 4)
  assert.equal(m.set('foo'), 0)
  assert.equal(m.get('foo'), 0)
  assert.equal(m.set('foo', 3), 3)
  assert.equal(m.get('foo'), 3)

  // Don't zero out on non-numeric input
  assert.equal(m.set('foo', 'a'), 0)
  assert.equal(m.get('foo'), 3)
})

tap.test('meter.metrics() returns an iterable of the collected metric names (keys)', async assert => {
  const m = meter()
  assert.equal(m.add('foo'), 1)
  assert.equal(m.set('goo', 2), 2)
  assert.equal(m.add('@fiz-baz', 13), 13)
  assert.same(m.metrics(), ['foo', 'goo', '@fiz-baz'])
})

tap.test('meter.entries() returns an iterable of the collected metrics', async assert => {
  const m = meter()
  assert.equal(m.add('foo'), 1)
  assert.equal(m.set('goo', 2), 2)
  assert.equal(m.add('@fiz-baz', 13), 13)
  assert.same(m.entries(), [['foo', 1], ['goo', 2], ['@fiz-baz', 13]])
})

tap.test('meter(serialized) loads from a serialized meter', async assert => {
  const m = meter()
  m.add('foo')
  m.add('bar', 2)
  m.add('baz', 3)

  const serialized = m.serialize()

  const m2 = meter(serialized)
  assert.equal(m2.get('foo'), 1)
  assert.equal(m2.get('bar'), 2)
  assert.equal(m2.get('baz'), 3)

  const parsed = JSON.parse(serialized)

  const m3 = meter(parsed)
  assert.equal(m3.get('foo'), 1)
  assert.equal(m3.get('bar'), 2)
  assert.equal(m3.get('baz'), 3)
})

tap.test('meter(json) loads a JSON object representation of a meter', async assert => {
  const m = meter()
  m.add('foo')
  m.add('bar', 2)
  m.add('baz', 3)

  const serialized = JSON.stringify(m.asObject())

  const m2 = meter(serialized)
  assert.equal(m2.get('foo'), 1)
  assert.equal(m2.get('bar'), 2)
  assert.equal(m2.get('baz'), 3)
})

tap.test('meter(non-json-string) creates an empty meter', async assert => {
  const m = meter('{{}}')
  assert.equal(m.size(), 0)
})

tap.test('meter(meter) loads (duplicates) another meter', async assert => {
  const m = meter()
  m.add('foo')
  m.add('bar', 2)

  const m2 = meter(m)
  m2.add('foo')

  assert.equal(m2.get('foo'), 2)
  assert.equal(m2.get('bar'), 2)
})

tap.test('meter(Map) loads from a Map', async assert => {
  const map = new Map()
  map.set('foo', 1)
  map.set('bar', 2)

  const m = meter(map)
  m.add('foo')

  assert.equal(m.get('foo'), 2)
  assert.equal(m.get('bar'), 2)
})

tap.test('meter(object) loads from an object', async assert => {
  const obj = {
    foo: 1,
    bar: 2
  }

  const m = meter(obj)
  m.add('foo')

  assert.equal(m.get('foo'), 2)
  assert.equal(m.get('bar'), 2)
})

tap.test('meter.asObject() returns an object representation', async assert => {
  const m = meter()
  assert.same(m.asObject(), {})

  m.add('foo')
  assert.same(m.asObject(), { foo: 1 })
  assert.equal(JSON.stringify(m.asObject()), '{"foo":1}')

  m.add('bar', 2)
  assert.same(m.asObject(), { foo: 1, bar: 2 })

  m.add('baz', 0)
  assert.same(m.asObject(), { foo: 1, bar: 2, baz: 0 })
  assert.same(m.asObject({ sort: false }), { foo: 1, bar: 2, baz: 0 })

  // Sort by keys
  assert.same(m.asObject({ sort: true }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'k' }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'key' }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'keys' }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'm' }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'metric' }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'metrics' }), { bar: 2, baz: 0, foo: 1 })

  // Sort by values
  assert.same(m.asObject({ sort: 'c' }), { baz: 0, foo: 1, bar: 2 })
  assert.same(m.asObject({ sort: 'count' }), { baz: 0, foo: 1, bar: 2 })
  assert.same(m.asObject({ sort: 'counts' }), { baz: 0, foo: 1, bar: 2 })
  assert.same(m.asObject({ sort: 'v' }), { baz: 0, foo: 1, bar: 2 })
  assert.same(m.asObject({ sort: 'value' }), { baz: 0, foo: 1, bar: 2 })
  assert.same(m.asObject({ sort: 'values' }), { baz: 0, foo: 1, bar: 2 })

  // Sort Order
  assert.same(m.asObject({ sort: 'keys', desc: false }), { bar: 2, baz: 0, foo: 1 })
  assert.same(m.asObject({ sort: 'keys', desc: true }), { foo: 1, baz: 0, bar: 2 })

  assert.same(m.asObject({ sort: 'values', desc: false }), { baz: 0, foo: 1, bar: 2 })
  assert.same(m.asObject({ sort: 'values', desc: true }), { bar: 2, foo: 1, baz: 0 })
})

tap.test('meter.clear() emptries all content', async assert => {
  const m = meter()
  m.add('foo')
  m.add('bar')
  m.clear()

  assert.equal(m.size(), 0)
  assert.equal(m.get('foo'), 0)
  assert.equal(m.get('bar'), 0)
})

tap.test("meter.merge() merges another meter's counts into the method owner", async assert => {
  const m = meter()
  const m2 = meter()

  m.add('foo', 3)
  m.add('bar', 5)
  m.add('baz', 7)
  m2.add('foo', 10)
  m2.add('bar', 10)
  m2.add('baz', 10)

  m.merge(m2)
  assert.equal(m.get('foo'), 13)
  assert.equal(m.get('bar'), 15)
  assert.equal(m.get('baz'), 17)

  m2.merge(m)
  assert.equal(m2.get('foo'), 23)
  assert.equal(m2.get('bar'), 25)
  assert.equal(m2.get('baz'), 27)
})

tap.test("meter.mergeMap() merges a Map's compatible counts into the method owner", async assert => {
  const m = meter()
  m.add('foo')
  m.add('bar', 2)

  const map = new Map()
  map.set('foo', 1)
  map.set('baz', 2)
  map.set('bad', 'count')
  map.set(4, 4)
  map.set(true, 1)

  m.mergeMap(map)

  assert.equal(m.size(), 3)
  assert.equal(m.get('foo'), 2)
  assert.equal(m.get('bar'), 2)
  assert.equal(m.get('baz'), 2)
})

tap.test("meter.mergeObject() merges an object's compatible counts into the method owner", async assert => {
  const m = meter()
  m.add('foo')
  m.add('bar', 2)

  const obj = {
    foo: 1,
    baz: 2,
    bad: 'count'
  }
  obj[Symbol.for(4)] = 4

  m.mergeObject(obj)

  assert.equal(m.size(), 3)
  assert.equal(m.get('foo'), 2)
  assert.equal(m.get('bar'), 2)
  assert.equal(m.get('baz'), 2)
})

tap.test("meter's merge methods should ignore invalid inputs", async assert => {
  const m = meter()
  m.add('foo')

  const m2 = meter()
  m2.add('foo')
  m2.add('bar', 2)

  const map = new Map()
  map.set('foo', 1)
  map.set('bar', 2)

  m.merge(undefined)
  m.merge(true)
  m.merge(1)
  m.merge('foo')
  m.merge([ 'foo' ])
  m.merge({ foo: 1 })
  m.merge(map)

  m.mergeMap(undefined)
  m.mergeMap(true)
  m.mergeMap(1)
  m.mergeMap('foo')
  m.mergeMap([ 'foo' ])
  m.mergeMap({ foo: 1 })
  m.mergeMap(m2)

  m.mergeObject(undefined)
  m.mergeObject(true)
  m.mergeObject(1)
  m.mergeObject('foo')
  m.mergeObject([ 'foo' ])

  assert.equal(m.size(), 1)
  assert.equal(m.get('foo'), 1)
})
