module.exports = meter

function meter (src, log = false) {
  // Attempt to merge in a source to pre-populate this meter

  // If src is a string, we will use it only if it is parseable JSON
  const objSrc = (typeof src === 'string') ? parseJson(src) : undefined

  // If the JSON parsed src is an array, we will load it into the Map on construction
  const arraySrc = (objSrc instanceof Array) ? objSrc : (src instanceof Array) ? src : undefined
  const map = new Map(arraySrc)

  // Merge in the source based on its type
  if (!arraySrc && (src || objSrc)) {
    if (objSrc) {
      mergeObject(objSrc)
    } else if (src.isMeter) {
      merge(src)
    } else if (src instanceof Map) {
      mergeMap(src)
    } else {
      mergeObject(src)
    }
  }

  // Simplest way to intentionally deal with linting
  function ignore () {
  }

  // Parse JSON, ignoring errors
  function parseJson (json) {
    try {
      return JSON.parse(json)
    } catch (_ignored) {
      ignore(_ignored)
      return undefined
    }
  }

  // Serialize into a JSON array, directly loadable by (Map on parse).
  function serialize () {
    return JSON.stringify([...map])
  }

  // Adjust the count of a metric in the map
  function add (metric, count = 1) {
    if ((typeof metric === 'string') && (typeof count === 'number')) {
      const oldCount = map.get(metric) || 0
      const newCount = oldCount + count
      map.set(metric, newCount)
      return newCount
    } else {
      return 0
    }
  }

  // Set the metric count to the minimum of the existing or supplied count
  function min (metric, count) {
    if ((typeof metric === 'string') && (typeof count === 'number')) {
      const oldCount = map.get(metric)
      const newCount = (oldCount == null) ? count : (oldCount > count) ? count : oldCount
      map.set(metric, newCount)
      return newCount
    } else {
      return 0
    }
  }

  // Set the metric count to the maximum of the existing or supplied count
  function max (metric, count) {
    if ((typeof metric === 'string') && (typeof count === 'number')) {
      const oldCount = map.get(metric)
      const newCount = (oldCount == null) ? count : (oldCount < count) ? count : oldCount
      map.set(metric, newCount)
      return newCount
    } else {
      return 0
    }
  }

  // Set the count of a metric in the map
  function set (metric, count = 0) {
    if ((typeof metric === 'string') && (typeof count === 'number')) {
      map.set(metric, count)
      return count
    } else {
      return 0
    }
  }

  // Get the count of a metric in the map
  function get (metric) {
    if (typeof metric === 'string') {
      return map.get(metric) || 0
    } else {
      return 0
    }
  }

  // Merge the contents of another meter into this one
  function merge (other) {
    if (other && other.isMeter) {
      other.forEach(({ metric, count }) => add(metric, count))
    }
  }

  // Merge counts from a Map into this meter
  function mergeMap (map) {
    if (map instanceof Map) {
      map.forEach((count, metric) => {
        add(metric, count)
      })
    }
  }

  // Merge counts from an object into this meter
  function mergeObject (obj) {
    if (typeof obj === 'object') {
      Object.entries(obj).forEach(([metric, count]) => {
        add(metric, count)
      })
    }
  }

  // Convert into a JSON object (not the same as serialization)
  function asObject ({ sort = false, desc = false } = {}) {
    const obj = {}

    if (([true, 'k', 'key', 'keys', 'm', 'metric', 'metrics']).includes(sort)) {
      const pairs = []
      map.forEach((count, metric) => pairs.push([metric, count]))
      pairs.sort(([a], [b]) => {
        if (a > b) {
          return desc ? -1 : 1
        } else {
          return desc ? 1 : -1
        }
      })
      pairs.forEach(([metric, count]) => {
        obj[metric] = count
      })
    } else if ((['c', 'count', 'counts', 'v', 'value', 'values']).includes(sort)) {
      const pairs = []
      map.forEach((count, metric) => pairs.push([count, metric]))
      pairs.sort(([a], [b]) => desc ? (b - a) : (a - b))
      pairs.forEach(([count, metric]) => {
        obj[metric] = count
      })
    } else {
      map.forEach((count, metric) => {
        obj[metric] = count
      })
    }

    return obj
  }

  // Supply a view of all the metric names
  function metrics () {
    return map.keys()
  }

  // Supply a view of all entries
  function entries () {
    return map.entries()
  }

  // Supply an array with every metric mapped by the supplied function
  function mapEntries (mapper) {
    const entries = []

    map.forEach((count, metric) => entries.push(mapper({ metric, count })))

    return entries
  }

  return {
    isMeter: true,
    add,
    min,
    max,
    set,
    get,
    clear: () => map.clear(),
    forEach: handler => map.forEach((count, metric) => handler({ metric, count })),
    entries,
    metrics,
    map: mapEntries,
    asObject,
    merge,
    mergeMap,
    mergeObject,
    serialize,
    size: () => map.size
  }
}
