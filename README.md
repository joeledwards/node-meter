# @buzuli/meter

Simple metrics collection utility with support for serialization and deserialization.

## Usage

The package exports a function which creates a new `Meter`. It can also be used to collect results from multiple meters or other objects.

`meter(src)`
- `src`: `string | Meter | object | Array` | The source from which the new Meter should attempt to initialize.

`Meter` properties:
- `isMeter`: `true`
- `add`: `(metric: string, value: number = 1) -> number` | Increments a metric, initializing it if absent. Returns the updated metric's value.
- `min`: `(metric: string, value: number) -> number` | Update a metric of the supplied value is smaller or the metric is not set. Returns the updated metric's value.
- `max`: `(metric: string, value: number) -> number` | Update a metric of the supplied value is larger or the metric is not set. Returns the updated metric's value.
- `set`: `(metric: string, value: number = 0) -> number` | Set the value of a metric. Returns the new value.
- `get`: `(metric: string) -> number` | Get the value associated with a metric. Will be `0` if the metric was missing.
- `clear`: `() -> nil` | Removes all metrics from the Meter.
- `forEach`: `({ metric, count }) -> nil -> nil` | Applies the supplied function to every metric in the Meter.
- `entries`: `Iterator[[string, number]]` | Supplies an iterator supplying each metric/count pair as an array of the form `[metric, count]`.
- `metrics`: `Iterator[string]` | Supplies an iterator supplying all of the metric names.
- `map`: `({ metric, count }) -> T -> Array[T] | Maps all entries into a new array via the supplied mapper function
- `asObject`: `({ sort = false, desc = false }) -> object` | Converts this meter into a simple object. With each metric key as a field name mapping to its count.
   - Unsorted by default, but may be sorted by keys (`sort` is `true`, `keys`, or `metics`), or sorted by values (`sort` is `values` or `counts`).
   - Defaults to ascending order, but order may be switched by setting `desc` to `true`.
- `merge`: `(Meter) -> nil` | Merges all of the metrics from another Meter into this Meter.
- `mergeMap`: `(Map) -> nil` | Merges all of a Map's valid fields (strings mapping to numbers) into this Meter.
- `mergeObject`: `(object) -> nil` | Merges all of an object's valid fields (strings mapping to numbers) into this Meter.
- `serialize`: `() -> string` | Returns a JSON structure which can be imported directly into a new Meter.
- `size`: `() -> number` | Returns the size of the meter (the number of distinct metric keys with associated counts).

## Example

```
const meter = require('@buzuli/meter')
const metrics = meter()
metrics.add('calls')
metrics.set('age', 275)
metrics.add('calls')
metrics.add('age', 25)
metrics.forEach(({ metric, count }) => console.info(`${metric} => ${count}`))
// Outputs:
//calls => 2
//age => 300
```
