let cachedSetTimeout
let cachedClearTimeout

function defaultSetTimeout() {
  throw new Error('setTimeout has not been defined')
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined')
}

function noop() {}

;(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout
    } else {
      cachedSetTimeout = defaultSetTimeout
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimeout
  }
  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout
    } else {
      cachedClearTimeout = defaultClearTimeout
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout
  }
})()

function runTimeout(fn) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fn, 0)
  }
  // if setTimeout wasn't available but was latter defined
  if (
    (cachedSetTimeout === defaultSetTimeout || !cachedSetTimeout) &&
    setTimeout
  ) {
    cachedSetTimeout = setTimeout
    return setTimeout(fn, 0)
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fn, 0)
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fn, 0)
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fn, 0)
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    return clearTimeout(marker)
  }
  if (
    (cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) &&
    clearTimeout
  ) {
    cachedClearTimeout = clearTimeout
    return clearTimeout(marker)
  }
  try {
    return cachedClearTimeout(marker)
  } catch (e) {
    try {
      return cachedClearTimeout.call(null, marker)
    } catch (e) {
      return cachedClearTimeout.call(this, marker)
    }
  }
}

let queue = []
let queueIndex = -1
let currentQueue
let draining = false

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return
  }
  draining = false
  if (currentQueue.length) {
    queue = currentQueue.concat(queue)
  } else {
    queueIndex = -1
  }
  if (queue.length) {
    drainQueue()
  }
}

function drainQueue() {
  if (draining) {
    return
  }
  let timeout = runTimeout(cleanUpNextTick)
  draining = true

  let len = queue.length
  while (len) {
    currentQueue = queue
    queue = []
    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run()
      }
    }
    queueIndex = -1
    len = queue.length
  }
  currentQueue = null
  draining = false
  runClearTimeout(timeout)
}

class Item {
  constructor(fn, array) {
    this.fn = fn
    this.array = array
  }
  run() {
    this.fn.apply(null, this.array)
  }
}

const deno = typeof Deno !== 'undefined'

export default {
  title: 'browser',
  browser: true,
  env: deno
    ? new Proxy(
        {},
        {
          get(_target, prop) {
            return Deno.env.get(String(prop))
          },
          ownKeys: () => Reflect.ownKeys(Deno.env.toObject()),
          getOwnPropertyDescriptor: (_target, name) => {
            const e = Deno.env.toObject()
            if (name in Deno.env.toObject()) {
              const o = { enumerable: true, configurable: true }
              if (typeof name === 'string') {
                o.value = e[name]
              }
              return o
            }
          },
          set(_target, prop, value) {
            Deno.env.set(String(prop), String(value))
            return value
          },
        },
      )
    : {},
  argv: deno ? Deno.args ?? [] : [],
  pid: deno ? Deno.pid ?? 0 : 0,
  version: 'v16.14.0',
  versions: {
    node: '16.14.0',
    v8: '9.4.146.24-node.20',
    uv: '1.43.0',
    zlib: '1.2.11',
    brotli: '1.0.9',
    ares: '1.18.1',
    modules: '93',
    nghttp2: '1.45.1',
    napi: '8',
    llhttp: '6.0.4',
    openssl: '1.1.1m+quic',
    cldr: '40.0',
    icu: '70.1',
    tz: '2021a3',
    unicode: '14.0',
  },
  on: noop,
  addListener: noop,
  once: noop,
  off: noop,
  removeListener: noop,
  removeAllListeners: noop,
  emit: noop,
  prependListener: noop,
  prependOnceListener: noop,
  emitWarning: noop,
  listeners: () => [],
  binding: () => {
    throw new Error('process.binding is not supported')
  },
  cwd: () => (deno ? Deno.cwd?.() ?? '/' : '/'),
  chdir: (path) => {
    if (deno) {
      Deno.chdir(path)
    } else {
      throw new Error('process.chdir is not supported')
    }
  },
  umask: () => (deno ? Deno.umask ?? 0 : 0),
  nextTick: (fn) => {
    let args = new Array(arguments.length - 1)
    if (arguments.length > 1) {
      for (let i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i]
      }
    }
    queue.push(new Item(fn, args))
    if (queue.length === 1 && !draining) {
      runTimeout(drainQueue)
    }
  },
}
