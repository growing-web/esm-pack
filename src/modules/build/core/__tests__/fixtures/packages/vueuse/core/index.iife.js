;var VueDemi = (function (VueDemi, Vue, VueCompositionAPI) {
  if (VueDemi.install) {
    return VueDemi
  }
  if (Vue) {
    if (Vue.version.slice(0, 2) === '2.') {
      if (VueCompositionAPI) {
        for (var key in VueCompositionAPI) {
          VueDemi[key] = VueCompositionAPI[key]
        }
        VueDemi.isVue2 = true
        VueDemi.isVue3 = false
        VueDemi.install = function (){}
        VueDemi.Vue = Vue
        VueDemi.Vue2 = Vue
        VueDemi.version = Vue.version
      } else {
        console.error(
          '[vue-demi] no VueCompositionAPI instance found, please be sure to import `@vue/composition-api` before `vue-demi`.'
        )
      }
    } else if (Vue.version.slice(0, 2) === '3.') {
      for (var key in Vue) {
        VueDemi[key] = Vue[key]
      }
      VueDemi.isVue2 = false
      VueDemi.isVue3 = true
      VueDemi.install = function (){}
      VueDemi.Vue = Vue
      VueDemi.Vue2 = undefined
      VueDemi.version = Vue.version
      VueDemi.set = function(target, key, val) {
        if (Array.isArray(target)) {
          target.length = Math.max(target.length, key)
          target.splice(key, 1, val)
          return val
        }
        target[key] = val
        return val
      }
      VueDemi.del = function(target, key) {
        if (Array.isArray(target)) {
          target.splice(key, 1)
          return
        }
        delete target[key]
      }
    } else {
      console.error('[vue-demi] Vue version ' + Vue.version + ' is unsupported.')
    }
  } else {
    console.error(
      '[vue-demi] no Vue instance found, please be sure to import `vue` before `vue-demi`.'
    )
  }
  return VueDemi
})(
  this.VueDemi = this.VueDemi || (typeof VueDemi !== "undefined" ? VueDemi : {}),
  this.Vue || (typeof Vue !== "undefined" ? Vue : undefined),
  this.VueCompositionAPI || (typeof VueCompositionAPI !== "undefined" ? VueCompositionAPI : undefined)
);
;
;(function (exports, shared, vueDemi, core) {
  'use strict';

  function computedAsync(evaluationCallback, initialState, optionsOrRef) {
    let options;
    if (vueDemi.isRef(optionsOrRef)) {
      options = {
        evaluating: optionsOrRef
      };
    } else {
      options = optionsOrRef || {};
    }
    const {
      lazy = false,
      evaluating = void 0,
      onError = shared.noop
    } = options;
    const started = vueDemi.ref(!lazy);
    const current = vueDemi.ref(initialState);
    let counter = 0;
    vueDemi.watchEffect(async (onInvalidate) => {
      if (!started.value)
        return;
      counter++;
      const counterAtBeginning = counter;
      let hasFinished = false;
      if (evaluating) {
        Promise.resolve().then(() => {
          evaluating.value = true;
        });
      }
      try {
        const result = await evaluationCallback((cancelCallback) => {
          onInvalidate(() => {
            if (evaluating)
              evaluating.value = false;
            if (!hasFinished)
              cancelCallback();
          });
        });
        if (counterAtBeginning === counter)
          current.value = result;
      } catch (e) {
        onError(e);
      } finally {
        if (evaluating)
          evaluating.value = false;
        hasFinished = true;
      }
    });
    if (lazy) {
      return vueDemi.computed(() => {
        started.value = true;
        return current.value;
      });
    } else {
      return current;
    }
  }

  function computedInject(key, options, defaultSource, treatDefaultAsFactory) {
    let source = vueDemi.inject(key);
    if (defaultSource)
      source = vueDemi.inject(key, defaultSource);
    if (treatDefaultAsFactory)
      source = vueDemi.inject(key, defaultSource, treatDefaultAsFactory);
    if (typeof options === "function") {
      return vueDemi.computed((ctx) => options(source, ctx));
    } else {
      return vueDemi.computed({
        get: (ctx) => options.get(source, ctx),
        set: options.set
      });
    }
  }

  const createUnrefFn = (fn) => {
    return function(...args) {
      return fn.apply(this, args.map((i) => vueDemi.unref(i)));
    };
  };

  function unrefElement(elRef) {
    var _a;
    const plain = vueDemi.unref(elRef);
    return (_a = plain == null ? void 0 : plain.$el) != null ? _a : plain;
  }

  const defaultWindow = shared.isClient ? window : void 0;
  const defaultDocument = shared.isClient ? window.document : void 0;
  const defaultNavigator = shared.isClient ? window.navigator : void 0;
  const defaultLocation = shared.isClient ? window.location : void 0;

  function useEventListener(...args) {
    let target;
    let event;
    let listener;
    let options;
    if (shared.isString(args[0])) {
      [event, listener, options] = args;
      target = defaultWindow;
    } else {
      [target, event, listener, options] = args;
    }
    if (!target)
      return shared.noop;
    let cleanup = shared.noop;
    const stopWatch = vueDemi.watch(() => unrefElement(target), (el) => {
      cleanup();
      if (!el)
        return;
      el.addEventListener(event, listener, options);
      cleanup = () => {
        el.removeEventListener(event, listener, options);
        cleanup = shared.noop;
      };
    }, { immediate: true, flush: "post" });
    const stop = () => {
      stopWatch();
      cleanup();
    };
    shared.tryOnScopeDispose(stop);
    return stop;
  }

  function onClickOutside(target, handler, options = {}) {
    const { window = defaultWindow, ignore, capture = true } = options;
    if (!window)
      return;
    const shouldListen = vueDemi.ref(true);
    const listener = (event) => {
      const el = unrefElement(target);
      const composedPath = event.composedPath();
      if (!el || el === event.target || composedPath.includes(el) || !shouldListen.value)
        return;
      if (ignore && ignore.length > 0) {
        if (ignore.some((target2) => {
          const el2 = unrefElement(target2);
          return el2 && (event.target === el2 || composedPath.includes(el2));
        }))
          return;
      }
      handler(event);
    };
    const cleanup = [
      useEventListener(window, "click", listener, { passive: true, capture }),
      useEventListener(window, "pointerdown", (e) => {
        const el = unrefElement(target);
        shouldListen.value = !!el && !e.composedPath().includes(el);
      }, { passive: true })
    ];
    const stop = () => cleanup.forEach((fn) => fn());
    return stop;
  }

  var __defProp$h = Object.defineProperty;
  var __defProps$8 = Object.defineProperties;
  var __getOwnPropDescs$8 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$j = Object.getOwnPropertySymbols;
  var __hasOwnProp$j = Object.prototype.hasOwnProperty;
  var __propIsEnum$j = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$h = (obj, key, value) => key in obj ? __defProp$h(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$h = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$j.call(b, prop))
        __defNormalProp$h(a, prop, b[prop]);
    if (__getOwnPropSymbols$j)
      for (var prop of __getOwnPropSymbols$j(b)) {
        if (__propIsEnum$j.call(b, prop))
          __defNormalProp$h(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$8 = (a, b) => __defProps$8(a, __getOwnPropDescs$8(b));
  const createKeyPredicate = (keyFilter) => {
    if (typeof keyFilter === "function")
      return keyFilter;
    else if (typeof keyFilter === "string")
      return (event) => event.key === keyFilter;
    else if (Array.isArray(keyFilter))
      return (event) => keyFilter.includes(event.key);
    else if (keyFilter)
      return () => true;
    else
      return () => false;
  };
  function onKeyStroke(key, handler, options = {}) {
    const { target = defaultWindow, eventName = "keydown", passive = false } = options;
    const predicate = createKeyPredicate(key);
    const listener = (e) => {
      if (predicate(e))
        handler(e);
    };
    return useEventListener(target, eventName, listener, passive);
  }
  function onKeyDown(key, handler, options = {}) {
    return onKeyStroke(key, handler, __spreadProps$8(__spreadValues$h({}, options), { eventName: "keydown" }));
  }
  function onKeyPressed(key, handler, options = {}) {
    return onKeyStroke(key, handler, __spreadProps$8(__spreadValues$h({}, options), { eventName: "keypress" }));
  }
  function onKeyUp(key, handler, options = {}) {
    return onKeyStroke(key, handler, __spreadProps$8(__spreadValues$h({}, options), { eventName: "keyup" }));
  }

  const DEFAULT_DELAY = 500;
  function onLongPress(target, handler, options) {
    const elementRef = vueDemi.computed(() => core.unrefElement(target));
    let timeout = null;
    function clear() {
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = null;
      }
    }
    function onDown(ev) {
      var _a;
      clear();
      timeout = setTimeout(() => handler(ev), (_a = options == null ? void 0 : options.delay) != null ? _a : DEFAULT_DELAY);
    }
    core.useEventListener(elementRef, "pointerdown", onDown);
    core.useEventListener(elementRef, "pointerup", clear);
    core.useEventListener(elementRef, "pointerleave", clear);
  }

  const isFocusedElementEditable = () => {
    const { activeElement, body } = document;
    if (!activeElement)
      return false;
    if (activeElement === body)
      return false;
    switch (activeElement.tagName) {
      case "INPUT":
      case "TEXTAREA":
        return true;
    }
    return activeElement.hasAttribute("contenteditable");
  };
  const isTypedCharValid = ({
    keyCode,
    metaKey,
    ctrlKey,
    altKey
  }) => {
    if (metaKey || ctrlKey || altKey)
      return false;
    if (keyCode >= 48 && keyCode <= 57 || keyCode >= 96 && keyCode <= 105)
      return true;
    if (keyCode >= 65 && keyCode <= 90)
      return true;
    return false;
  };
  function onStartTyping(callback, options = {}) {
    const { document: document2 = defaultDocument } = options;
    const keydown = (event) => {
      !isFocusedElementEditable() && isTypedCharValid(event) && callback(event);
    };
    if (document2)
      useEventListener(document2, "keydown", keydown, { passive: true });
  }

  function templateRef(key, initialValue = null) {
    const instance = vueDemi.getCurrentInstance();
    let _trigger = () => {
    };
    const element = vueDemi.customRef((track, trigger) => {
      _trigger = trigger;
      return {
        get() {
          var _a, _b;
          track();
          return (_b = (_a = instance == null ? void 0 : instance.proxy) == null ? void 0 : _a.$refs[key]) != null ? _b : initialValue;
        },
        set() {
        }
      };
    });
    shared.tryOnMounted(_trigger);
    vueDemi.onUpdated(_trigger);
    return element;
  }

  function useActiveElement(options = {}) {
    const { window = defaultWindow } = options;
    const counter = vueDemi.ref(0);
    if (window) {
      useEventListener(window, "blur", () => counter.value += 1, true);
      useEventListener(window, "focus", () => counter.value += 1, true);
    }
    return vueDemi.computed(() => {
      counter.value;
      return window == null ? void 0 : window.document.activeElement;
    });
  }

  function useAsyncQueue(tasks, options = {}) {
    const {
      interrupt = true,
      onError = shared.noop,
      onFinished = shared.noop
    } = options;
    const promiseState = {
      pending: "pending",
      rejected: "rejected",
      fulfilled: "fulfilled"
    };
    const initialResult = Array.from(new Array(tasks.length), () => ({ state: promiseState.pending, data: null }));
    const result = vueDemi.reactive(initialResult);
    const activeIndex = vueDemi.ref(-1);
    if (!tasks || tasks.length === 0) {
      onFinished();
      return {
        activeIndex,
        result
      };
    }
    function updateResult(state, res) {
      activeIndex.value++;
      result[activeIndex.value].data = res;
      result[activeIndex.value].state = state;
    }
    tasks.reduce((prev, curr) => {
      return prev.then((prevRes) => {
        var _a;
        if (((_a = result[activeIndex.value]) == null ? void 0 : _a.state) === promiseState.rejected && interrupt) {
          onFinished();
          return;
        }
        return curr(prevRes).then((currentRes) => {
          updateResult(promiseState.fulfilled, currentRes);
          activeIndex.value === tasks.length - 1 && onFinished();
          return currentRes;
        });
      }).catch((e) => {
        updateResult(promiseState.rejected, e);
        onError();
        return e;
      });
    }, Promise.resolve());
    return {
      activeIndex,
      result
    };
  }

  function useAsyncState(promise, initialState, options) {
    const {
      immediate = true,
      delay = 0,
      onError = shared.noop,
      resetOnExecute = true,
      shallow = true
    } = options != null ? options : {};
    const state = shallow ? vueDemi.shallowRef(initialState) : vueDemi.ref(initialState);
    const isReady = vueDemi.ref(false);
    const isLoading = vueDemi.ref(false);
    const error = vueDemi.ref(void 0);
    async function execute(delay2 = 0, ...args) {
      if (resetOnExecute)
        state.value = initialState;
      error.value = void 0;
      isReady.value = false;
      isLoading.value = true;
      if (delay2 > 0)
        await shared.promiseTimeout(delay2);
      const _promise = typeof promise === "function" ? promise(...args) : promise;
      try {
        const data = await _promise;
        state.value = data;
        isReady.value = true;
      } catch (e) {
        error.value = e;
        onError(e);
      }
      isLoading.value = false;
      return state.value;
    }
    if (immediate)
      execute(delay);
    return {
      state,
      isReady,
      isLoading,
      error,
      execute
    };
  }

  function useBase64(target, options) {
    const base64 = vueDemi.ref("");
    const promise = vueDemi.ref();
    function execute() {
      if (!shared.isClient)
        return;
      promise.value = new Promise((resolve, reject) => {
        try {
          const _target = vueDemi.unref(target);
          if (_target === void 0 || _target === null) {
            resolve("");
          } else if (typeof _target === "string") {
            resolve(blobToBase64(new Blob([_target], { type: "text/plain" })));
          } else if (_target instanceof Blob) {
            resolve(blobToBase64(_target));
          } else if (_target instanceof ArrayBuffer) {
            resolve(window.btoa(String.fromCharCode(...new Uint8Array(_target))));
          } else if (_target instanceof HTMLCanvasElement) {
            resolve(_target.toDataURL(options == null ? void 0 : options.type, options == null ? void 0 : options.quality));
          } else if (_target instanceof HTMLImageElement) {
            const img = _target.cloneNode(false);
            img.crossOrigin = "Anonymous";
            imgLoaded(img).then(() => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL(options == null ? void 0 : options.type, options == null ? void 0 : options.quality));
            }).catch(reject);
          } else {
            reject(new Error("target is unsupported types"));
          }
        } catch (error) {
          reject(error);
        }
      });
      promise.value.then((res) => base64.value = res);
      return promise.value;
    }
    vueDemi.watch(target, execute, { immediate: true });
    return {
      base64,
      promise,
      execute
    };
  }
  function imgLoaded(img) {
    return new Promise((resolve, reject) => {
      if (!img.complete) {
        img.onload = () => {
          resolve();
        };
        img.onerror = reject;
      } else {
        resolve();
      }
    });
  }
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = (e) => {
        resolve(e.target.result);
      };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  function useBattery({ navigator = defaultNavigator } = {}) {
    const events = ["chargingchange", "chargingtimechange", "dischargingtimechange", "levelchange"];
    const isSupported = navigator && "getBattery" in navigator;
    const charging = vueDemi.ref(false);
    const chargingTime = vueDemi.ref(0);
    const dischargingTime = vueDemi.ref(0);
    const level = vueDemi.ref(1);
    let battery;
    function updateBatteryInfo() {
      charging.value = this.charging;
      chargingTime.value = this.chargingTime || 0;
      dischargingTime.value = this.dischargingTime || 0;
      level.value = this.level;
    }
    if (isSupported) {
      navigator.getBattery().then((_battery) => {
        battery = _battery;
        updateBatteryInfo.call(battery);
        for (const event of events)
          useEventListener(battery, event, updateBatteryInfo, { passive: true });
      });
    }
    return {
      isSupported,
      charging,
      chargingTime,
      dischargingTime,
      level
    };
  }

  function useMediaQuery(query, options = {}) {
    const { window = defaultWindow } = options;
    let mediaQuery;
    const matches = vueDemi.ref(false);
    const update = () => {
      if (!window)
        return;
      if (!mediaQuery)
        mediaQuery = window.matchMedia(query);
      matches.value = mediaQuery.matches;
    };
    shared.tryOnBeforeMount(() => {
      update();
      if (!mediaQuery)
        return;
      if ("addEventListener" in mediaQuery)
        mediaQuery.addEventListener("change", update);
      else
        mediaQuery.addListener(update);
      shared.tryOnScopeDispose(() => {
        if ("removeEventListener" in mediaQuery)
          mediaQuery.removeEventListener("change", update);
        else
          mediaQuery.removeListener(update);
      });
    });
    return matches;
  }

  const breakpointsTailwind = {
    "sm": 640,
    "md": 768,
    "lg": 1024,
    "xl": 1280,
    "2xl": 1536
  };
  const breakpointsBootstrapV5 = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  };
  const breakpointsVuetify = {
    xs: 600,
    sm: 960,
    md: 1264,
    lg: 1904
  };
  const breakpointsAntDesign = {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600
  };
  const breakpointsQuasar = {
    xs: 600,
    sm: 1024,
    md: 1440,
    lg: 1920
  };
  const breakpointsSematic = {
    mobileS: 320,
    mobileM: 375,
    mobileL: 425,
    tablet: 768,
    laptop: 1024,
    laptopL: 1440,
    desktop4K: 2560
  };

  var __defProp$g = Object.defineProperty;
  var __getOwnPropSymbols$i = Object.getOwnPropertySymbols;
  var __hasOwnProp$i = Object.prototype.hasOwnProperty;
  var __propIsEnum$i = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$g = (obj, key, value) => key in obj ? __defProp$g(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$g = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$i.call(b, prop))
        __defNormalProp$g(a, prop, b[prop]);
    if (__getOwnPropSymbols$i)
      for (var prop of __getOwnPropSymbols$i(b)) {
        if (__propIsEnum$i.call(b, prop))
          __defNormalProp$g(a, prop, b[prop]);
      }
    return a;
  };
  function useBreakpoints(breakpoints, options = {}) {
    function getValue(k, delta) {
      let v = breakpoints[k];
      if (delta != null)
        v = shared.increaseWithUnit(v, delta);
      if (typeof v === "number")
        v = `${v}px`;
      return v;
    }
    const { window = defaultWindow } = options;
    function match(query) {
      if (!window)
        return false;
      return window.matchMedia(query).matches;
    }
    const greater = (k) => {
      return useMediaQuery(`(min-width: ${getValue(k)})`, options);
    };
    const shortcutMethods = Object.keys(breakpoints).reduce((shortcuts, k) => {
      Object.defineProperty(shortcuts, k, {
        get: () => greater(k),
        enumerable: true,
        configurable: true
      });
      return shortcuts;
    }, {});
    return __spreadValues$g({
      greater,
      smaller(k) {
        return useMediaQuery(`(max-width: ${getValue(k, -0.1)})`, options);
      },
      between(a, b) {
        return useMediaQuery(`(min-width: ${getValue(a)}) and (max-width: ${getValue(b, -0.1)})`, options);
      },
      isGreater(k) {
        return match(`(min-width: ${getValue(k)})`);
      },
      isSmaller(k) {
        return match(`(max-width: ${getValue(k, -0.1)})`);
      },
      isInBetween(a, b) {
        return match(`(min-width: ${getValue(a)}) and (max-width: ${getValue(b, -0.1)})`);
      }
    }, shortcutMethods);
  }

  const useBroadcastChannel = (options) => {
    const {
      name,
      window = defaultWindow
    } = options;
    const isSupported = window && "BroadcastChannel" in window;
    const isClosed = vueDemi.ref(false);
    const channel = vueDemi.ref();
    const data = vueDemi.ref();
    const error = vueDemi.ref(null);
    const post = (data2) => {
      if (channel.value)
        channel.value.postMessage(data2);
    };
    const close = () => {
      if (channel.value)
        channel.value.close();
      isClosed.value = true;
    };
    if (isSupported) {
      shared.tryOnMounted(() => {
        error.value = null;
        channel.value = new BroadcastChannel(name);
        channel.value.addEventListener("message", (e) => {
          data.value = e.data;
        }, { passive: true });
        channel.value.addEventListener("messageerror", (e) => {
          error.value = e;
        }, { passive: true });
        channel.value.addEventListener("close", () => {
          isClosed.value = true;
        });
      });
    }
    shared.tryOnScopeDispose(() => {
      close();
    });
    return {
      isSupported,
      channel,
      data,
      post,
      close,
      error,
      isClosed
    };
  };

  function useBrowserLocation({ window = defaultWindow } = {}) {
    const buildState = (trigger) => {
      const { state: state2, length } = (window == null ? void 0 : window.history) || {};
      const { hash, host, hostname, href, origin, pathname, port, protocol, search } = (window == null ? void 0 : window.location) || {};
      return {
        trigger,
        state: state2,
        length,
        hash,
        host,
        hostname,
        href,
        origin,
        pathname,
        port,
        protocol,
        search
      };
    };
    const state = vueDemi.ref(buildState("load"));
    if (window) {
      useEventListener(window, "popstate", () => state.value = buildState("popstate"), { passive: true });
      useEventListener(window, "hashchange", () => state.value = buildState("hashchange"), { passive: true });
    }
    return state;
  }

  function useCached(refValue, comparator = (a, b) => a === b, watchOptions) {
    const cachedValue = vueDemi.ref(refValue.value);
    vueDemi.watch(() => refValue.value, (value) => {
      if (!comparator(value, cachedValue.value))
        cachedValue.value = value;
    }, watchOptions);
    return cachedValue;
  }

  function useClamp(value, min, max) {
    const _value = vueDemi.ref(value);
    return vueDemi.computed({
      get() {
        return _value.value = shared.clamp(_value.value, vueDemi.unref(min), vueDemi.unref(max));
      },
      set(value2) {
        _value.value = shared.clamp(value2, vueDemi.unref(min), vueDemi.unref(max));
      }
    });
  }

  function useClipboard(options = {}) {
    const {
      navigator = defaultNavigator,
      read = false,
      source,
      copiedDuring = 1500
    } = options;
    const events = ["copy", "cut"];
    const isSupported = Boolean(navigator && "clipboard" in navigator);
    const text = vueDemi.ref("");
    const copied = vueDemi.ref(false);
    const timeout = shared.useTimeoutFn(() => copied.value = false, copiedDuring);
    function updateText() {
      navigator.clipboard.readText().then((value) => {
        text.value = value;
      });
    }
    if (isSupported && read) {
      for (const event of events)
        useEventListener(event, updateText);
    }
    async function copy(value = vueDemi.unref(source)) {
      if (isSupported && value != null) {
        await navigator.clipboard.writeText(value);
        text.value = value;
        copied.value = true;
        timeout.start();
      }
    }
    return {
      isSupported,
      text,
      copied,
      copy
    };
  }

  const _global = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  const globalKey = "__vueuse_ssr_handlers__";
  _global[globalKey] = _global[globalKey] || {};
  const handlers = _global[globalKey];
  function getSSRHandler(key, fallback) {
    return handlers[key] || fallback;
  }
  function setSSRHandler(key, fn) {
    handlers[key] = fn;
  }

  function guessSerializerType(rawInit) {
    return rawInit == null ? "any" : rawInit instanceof Set ? "set" : rawInit instanceof Map ? "map" : rawInit instanceof Date ? "date" : typeof rawInit === "boolean" ? "boolean" : typeof rawInit === "string" ? "string" : typeof rawInit === "object" ? "object" : Array.isArray(rawInit) ? "object" : !Number.isNaN(rawInit) ? "number" : "any";
  }

  const StorageSerializers = {
    boolean: {
      read: (v) => v === "true",
      write: (v) => String(v)
    },
    object: {
      read: (v) => JSON.parse(v),
      write: (v) => JSON.stringify(v)
    },
    number: {
      read: (v) => Number.parseFloat(v),
      write: (v) => String(v)
    },
    any: {
      read: (v) => v,
      write: (v) => String(v)
    },
    string: {
      read: (v) => v,
      write: (v) => String(v)
    },
    map: {
      read: (v) => new Map(JSON.parse(v)),
      write: (v) => JSON.stringify(Array.from(v.entries()))
    },
    set: {
      read: (v) => new Set(JSON.parse(v)),
      write: (v) => JSON.stringify(Array.from(v.entries()))
    },
    date: {
      read: (v) => new Date(v),
      write: (v) => v.toISOString()
    }
  };
  function useStorage(key, initialValue, storage, options = {}) {
    var _a;
    const {
      flush = "pre",
      deep = true,
      listenToStorageChanges = true,
      writeDefaults = true,
      shallow,
      window = defaultWindow,
      eventFilter,
      onError = (e) => {
        console.error(e);
      }
    } = options;
    const data = (shallow ? vueDemi.shallowRef : vueDemi.ref)(initialValue);
    if (!storage) {
      try {
        storage = getSSRHandler("getDefaultStorage", () => {
          var _a2;
          return (_a2 = defaultWindow) == null ? void 0 : _a2.localStorage;
        })();
      } catch (e) {
        onError(e);
      }
    }
    if (!storage)
      return data;
    const rawInit = vueDemi.unref(initialValue);
    const type = guessSerializerType(rawInit);
    const serializer = (_a = options.serializer) != null ? _a : StorageSerializers[type];
    const { pause: pauseWatch, resume: resumeWatch } = shared.pausableWatch(data, () => write(data.value), { flush, deep, eventFilter });
    if (window && listenToStorageChanges)
      useEventListener(window, "storage", update);
    update();
    return data;
    function write(v) {
      try {
        if (v == null)
          storage.removeItem(key);
        else
          storage.setItem(key, serializer.write(v));
      } catch (e) {
        onError(e);
      }
    }
    function read(event) {
      if (event && event.key !== key)
        return;
      pauseWatch();
      try {
        const rawValue = event ? event.newValue : storage.getItem(key);
        if (rawValue == null) {
          if (writeDefaults && rawInit !== null)
            storage.setItem(key, serializer.write(rawInit));
          return rawInit;
        } else if (typeof rawValue !== "string") {
          return rawValue;
        } else {
          return serializer.read(rawValue);
        }
      } catch (e) {
        onError(e);
      } finally {
        resumeWatch();
      }
    }
    function update(event) {
      if (event && event.key !== key)
        return;
      data.value = read(event);
    }
  }

  function usePreferredDark(options) {
    return useMediaQuery("(prefers-color-scheme: dark)", options);
  }

  var __defProp$f = Object.defineProperty;
  var __getOwnPropSymbols$h = Object.getOwnPropertySymbols;
  var __hasOwnProp$h = Object.prototype.hasOwnProperty;
  var __propIsEnum$h = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$f = (obj, key, value) => key in obj ? __defProp$f(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$f = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$h.call(b, prop))
        __defNormalProp$f(a, prop, b[prop]);
    if (__getOwnPropSymbols$h)
      for (var prop of __getOwnPropSymbols$h(b)) {
        if (__propIsEnum$h.call(b, prop))
          __defNormalProp$f(a, prop, b[prop]);
      }
    return a;
  };
  function useColorMode(options = {}) {
    const {
      selector = "html",
      attribute = "class",
      window = defaultWindow,
      storage,
      storageKey = "vueuse-color-scheme",
      listenToStorageChanges = true,
      storageRef
    } = options;
    const modes = __spreadValues$f({
      auto: "",
      light: "light",
      dark: "dark"
    }, options.modes || {});
    const preferredDark = usePreferredDark({ window });
    const preferredMode = vueDemi.computed(() => preferredDark.value ? "dark" : "light");
    const store = storageRef || (storageKey == null ? vueDemi.ref("auto") : useStorage(storageKey, "auto", storage, { window, listenToStorageChanges }));
    const state = vueDemi.computed({
      get() {
        return store.value === "auto" ? preferredMode.value : store.value;
      },
      set(v) {
        store.value = v;
      }
    });
    const updateHTMLAttrs = getSSRHandler("updateHTMLAttrs", (selector2, attribute2, value) => {
      const el = window == null ? void 0 : window.document.querySelector(selector2);
      if (!el)
        return;
      if (attribute2 === "class") {
        const current = value.split(/\s/g);
        Object.values(modes).flatMap((i) => (i || "").split(/\s/g)).filter(Boolean).forEach((v) => {
          if (current.includes(v))
            el.classList.add(v);
          else
            el.classList.remove(v);
        });
      } else {
        el.setAttribute(attribute2, value);
      }
    });
    function defaultOnChanged(mode) {
      var _a;
      updateHTMLAttrs(selector, attribute, (_a = modes[mode]) != null ? _a : mode);
    }
    function onChanged(mode) {
      if (options.onChanged)
        options.onChanged(mode, defaultOnChanged);
      else
        defaultOnChanged(mode);
    }
    vueDemi.watch(state, onChanged, { flush: "post", immediate: true });
    shared.tryOnMounted(() => onChanged(state.value));
    return state;
  }

  function useConfirmDialog(revealed = vueDemi.ref(false)) {
    const confirmHook = shared.createEventHook();
    const cancelHook = shared.createEventHook();
    const revealHook = shared.createEventHook();
    let _resolve = shared.noop;
    const reveal = (data) => {
      revealHook.trigger(data);
      revealed.value = true;
      return new Promise((resolve) => {
        _resolve = resolve;
      });
    };
    const confirm = (data) => {
      revealed.value = false;
      confirmHook.trigger(data);
      _resolve({ data, isCanceled: false });
    };
    const cancel = (data) => {
      revealed.value = false;
      cancelHook.trigger(data);
      _resolve({ data, isCanceled: true });
    };
    return {
      isRevealed: vueDemi.computed(() => revealed.value),
      reveal,
      confirm,
      cancel,
      onReveal: revealHook.on,
      onConfirm: confirmHook.on,
      onCancel: cancelHook.on
    };
  }

  function useCssVar(prop, target, { window = defaultWindow } = {}) {
    const variable = vueDemi.ref("");
    const elRef = vueDemi.computed(() => {
      var _a;
      return unrefElement(target) || ((_a = window == null ? void 0 : window.document) == null ? void 0 : _a.documentElement);
    });
    vueDemi.watch([elRef, () => vueDemi.unref(prop)], ([el, prop2]) => {
      if (el && window)
        variable.value = window.getComputedStyle(el).getPropertyValue(prop2);
    }, { immediate: true });
    vueDemi.watch(variable, (val) => {
      var _a;
      if ((_a = elRef.value) == null ? void 0 : _a.style)
        elRef.value.style.setProperty(vueDemi.unref(prop), val);
    });
    return variable;
  }

  function useCycleList(list, options) {
    var _a;
    const state = vueDemi.shallowRef((_a = options == null ? void 0 : options.initialValue) != null ? _a : list[0]);
    const index = vueDemi.computed({
      get() {
        var _a2;
        let index2 = (options == null ? void 0 : options.getIndexOf) ? options.getIndexOf(state.value, list) : list.indexOf(state.value);
        if (index2 < 0)
          index2 = (_a2 = options == null ? void 0 : options.fallbackIndex) != null ? _a2 : 0;
        return index2;
      },
      set(v) {
        set(v);
      }
    });
    function set(i) {
      const length = list.length;
      const index2 = (i % length + length) % length;
      const value = list[index2];
      state.value = value;
      return value;
    }
    function shift(delta = 1) {
      return set(index.value + delta);
    }
    function next(n = 1) {
      return shift(n);
    }
    function prev(n = 1) {
      return shift(-n);
    }
    return {
      state,
      index,
      next,
      prev
    };
  }

  var __defProp$e = Object.defineProperty;
  var __defProps$7 = Object.defineProperties;
  var __getOwnPropDescs$7 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$g = Object.getOwnPropertySymbols;
  var __hasOwnProp$g = Object.prototype.hasOwnProperty;
  var __propIsEnum$g = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$e = (obj, key, value) => key in obj ? __defProp$e(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$e = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$g.call(b, prop))
        __defNormalProp$e(a, prop, b[prop]);
    if (__getOwnPropSymbols$g)
      for (var prop of __getOwnPropSymbols$g(b)) {
        if (__propIsEnum$g.call(b, prop))
          __defNormalProp$e(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$7 = (a, b) => __defProps$7(a, __getOwnPropDescs$7(b));
  function useDark(options = {}) {
    const {
      valueDark = "dark",
      valueLight = "",
      window = defaultWindow
    } = options;
    const mode = useColorMode(__spreadProps$7(__spreadValues$e({}, options), {
      onChanged: (mode2, defaultHandler) => {
        var _a;
        if (options.onChanged)
          (_a = options.onChanged) == null ? void 0 : _a.call(options, mode2 === "dark");
        else
          defaultHandler(mode2);
      },
      modes: {
        dark: valueDark,
        light: valueLight
      }
    }));
    const preferredDark = usePreferredDark({ window });
    const isDark = vueDemi.computed({
      get() {
        return mode.value === "dark";
      },
      set(v) {
        if (v === preferredDark.value)
          mode.value = "auto";
        else
          mode.value = v ? "dark" : "light";
      }
    });
    return isDark;
  }

  const fnClone = (v) => JSON.parse(JSON.stringify(v));
  const fnBypass = (v) => v;
  const fnSetSource = (source, value) => source.value = value;
  function defaultDump(clone) {
    return clone ? shared.isFunction(clone) ? clone : fnClone : fnBypass;
  }
  function defaultParse(clone) {
    return clone ? shared.isFunction(clone) ? clone : fnClone : fnBypass;
  }
  function useManualRefHistory(source, options = {}) {
    const {
      clone = false,
      dump = defaultDump(clone),
      parse = defaultParse(clone),
      setSource = fnSetSource
    } = options;
    function _createHistoryRecord() {
      return vueDemi.markRaw({
        snapshot: dump(source.value),
        timestamp: shared.timestamp()
      });
    }
    const last = vueDemi.ref(_createHistoryRecord());
    const undoStack = vueDemi.ref([]);
    const redoStack = vueDemi.ref([]);
    const _setSource = (record) => {
      setSource(source, parse(record.snapshot));
      last.value = record;
    };
    const commit = () => {
      undoStack.value.unshift(last.value);
      last.value = _createHistoryRecord();
      if (options.capacity && undoStack.value.length > options.capacity)
        undoStack.value.splice(options.capacity, Infinity);
      if (redoStack.value.length)
        redoStack.value.splice(0, redoStack.value.length);
    };
    const clear = () => {
      undoStack.value.splice(0, undoStack.value.length);
      redoStack.value.splice(0, redoStack.value.length);
    };
    const undo = () => {
      const state = undoStack.value.shift();
      if (state) {
        redoStack.value.unshift(last.value);
        _setSource(state);
      }
    };
    const redo = () => {
      const state = redoStack.value.shift();
      if (state) {
        undoStack.value.unshift(last.value);
        _setSource(state);
      }
    };
    const reset = () => {
      _setSource(last.value);
    };
    const history = vueDemi.computed(() => [last.value, ...undoStack.value]);
    const canUndo = vueDemi.computed(() => undoStack.value.length > 0);
    const canRedo = vueDemi.computed(() => redoStack.value.length > 0);
    return {
      source,
      undoStack,
      redoStack,
      last,
      history,
      canUndo,
      canRedo,
      clear,
      commit,
      reset,
      undo,
      redo
    };
  }

  var __defProp$d = Object.defineProperty;
  var __defProps$6 = Object.defineProperties;
  var __getOwnPropDescs$6 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$f = Object.getOwnPropertySymbols;
  var __hasOwnProp$f = Object.prototype.hasOwnProperty;
  var __propIsEnum$f = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$d = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$f.call(b, prop))
        __defNormalProp$d(a, prop, b[prop]);
    if (__getOwnPropSymbols$f)
      for (var prop of __getOwnPropSymbols$f(b)) {
        if (__propIsEnum$f.call(b, prop))
          __defNormalProp$d(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$6 = (a, b) => __defProps$6(a, __getOwnPropDescs$6(b));
  function useRefHistory(source, options = {}) {
    const {
      deep = false,
      flush = "pre",
      eventFilter
    } = options;
    const {
      eventFilter: composedFilter,
      pause,
      resume: resumeTracking,
      isActive: isTracking
    } = shared.pausableFilter(eventFilter);
    const {
      ignoreUpdates,
      ignorePrevAsyncUpdates,
      stop
    } = shared.watchIgnorable(source, commit, { deep, flush, eventFilter: composedFilter });
    function setSource(source2, value) {
      ignorePrevAsyncUpdates();
      ignoreUpdates(() => {
        source2.value = value;
      });
    }
    const manualHistory = useManualRefHistory(source, __spreadProps$6(__spreadValues$d({}, options), { clone: options.clone || deep, setSource }));
    const { clear, commit: manualCommit } = manualHistory;
    function commit() {
      ignorePrevAsyncUpdates();
      manualCommit();
    }
    function resume(commitNow) {
      resumeTracking();
      if (commitNow)
        commit();
    }
    function batch(fn) {
      let canceled = false;
      const cancel = () => canceled = true;
      ignoreUpdates(() => {
        fn(cancel);
      });
      if (!canceled)
        commit();
    }
    function dispose() {
      stop();
      clear();
    }
    return __spreadProps$6(__spreadValues$d({}, manualHistory), {
      isTracking,
      pause,
      resume,
      commit,
      batch,
      dispose
    });
  }

  var __defProp$c = Object.defineProperty;
  var __defProps$5 = Object.defineProperties;
  var __getOwnPropDescs$5 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$e = Object.getOwnPropertySymbols;
  var __hasOwnProp$e = Object.prototype.hasOwnProperty;
  var __propIsEnum$e = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$c = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$e.call(b, prop))
        __defNormalProp$c(a, prop, b[prop]);
    if (__getOwnPropSymbols$e)
      for (var prop of __getOwnPropSymbols$e(b)) {
        if (__propIsEnum$e.call(b, prop))
          __defNormalProp$c(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$5 = (a, b) => __defProps$5(a, __getOwnPropDescs$5(b));
  function useDebouncedRefHistory(source, options = {}) {
    const filter = options.debounce ? shared.debounceFilter(options.debounce) : void 0;
    const history = useRefHistory(source, __spreadProps$5(__spreadValues$c({}, options), { eventFilter: filter }));
    return __spreadValues$c({}, history);
  }

  function useDeviceMotion(options = {}) {
    const {
      window = defaultWindow,
      eventFilter = shared.bypassFilter
    } = options;
    const acceleration = vueDemi.ref({ x: null, y: null, z: null });
    const rotationRate = vueDemi.ref({ alpha: null, beta: null, gamma: null });
    const interval = vueDemi.ref(0);
    const accelerationIncludingGravity = vueDemi.ref({
      x: null,
      y: null,
      z: null
    });
    if (window) {
      const onDeviceMotion = shared.createFilterWrapper(eventFilter, (event) => {
        acceleration.value = event.acceleration;
        accelerationIncludingGravity.value = event.accelerationIncludingGravity;
        rotationRate.value = event.rotationRate;
        interval.value = event.interval;
      });
      useEventListener(window, "devicemotion", onDeviceMotion);
    }
    return {
      acceleration,
      accelerationIncludingGravity,
      rotationRate,
      interval
    };
  }

  function useDeviceOrientation(options = {}) {
    const { window = defaultWindow } = options;
    const isSupported = Boolean(window && "DeviceOrientationEvent" in window);
    const isAbsolute = vueDemi.ref(false);
    const alpha = vueDemi.ref(null);
    const beta = vueDemi.ref(null);
    const gamma = vueDemi.ref(null);
    if (window && isSupported) {
      useEventListener(window, "deviceorientation", (event) => {
        isAbsolute.value = event.absolute;
        alpha.value = event.alpha;
        beta.value = event.beta;
        gamma.value = event.gamma;
      });
    }
    return {
      isSupported,
      isAbsolute,
      alpha,
      beta,
      gamma
    };
  }

  const DEVICE_PIXEL_RATIO_SCALES = [
    1,
    1.325,
    1.4,
    1.5,
    1.8,
    2,
    2.4,
    2.5,
    2.75,
    3,
    3.5,
    4
  ];
  function useDevicePixelRatio({
    window = defaultWindow
  } = {}) {
    if (!window) {
      return {
        pixelRatio: vueDemi.ref(1)
      };
    }
    const pixelRatio = vueDemi.ref(window.devicePixelRatio);
    const handleDevicePixelRatio = () => {
      pixelRatio.value = window.devicePixelRatio;
    };
    useEventListener(window, "resize", handleDevicePixelRatio, { passive: true });
    DEVICE_PIXEL_RATIO_SCALES.forEach((dppx) => {
      const mqlMin = useMediaQuery(`screen and (min-resolution: ${dppx}dppx)`);
      const mqlMax = useMediaQuery(`screen and (max-resolution: ${dppx}dppx)`);
      vueDemi.watch([mqlMin, mqlMax], handleDevicePixelRatio);
    });
    return { pixelRatio };
  }

  function usePermission(permissionDesc, options = {}) {
    const {
      controls = false,
      navigator = defaultNavigator
    } = options;
    const isSupported = Boolean(navigator && "permissions" in navigator);
    let permissionStatus;
    const desc = typeof permissionDesc === "string" ? { name: permissionDesc } : permissionDesc;
    const state = vueDemi.ref();
    const onChange = () => {
      if (permissionStatus)
        state.value = permissionStatus.state;
    };
    const query = shared.createSingletonPromise(async () => {
      if (!isSupported)
        return;
      if (!permissionStatus) {
        try {
          permissionStatus = await navigator.permissions.query(desc);
          useEventListener(permissionStatus, "change", onChange);
          onChange();
        } catch (e) {
          state.value = "prompt";
        }
      }
      return permissionStatus;
    });
    query();
    if (controls) {
      return {
        state,
        isSupported,
        query
      };
    } else {
      return state;
    }
  }

  function useDevicesList(options = {}) {
    const {
      navigator = defaultNavigator,
      requestPermissions = false,
      constraints = { audio: true, video: true },
      onUpdated
    } = options;
    const devices = vueDemi.ref([]);
    const videoInputs = vueDemi.computed(() => devices.value.filter((i) => i.kind === "videoinput"));
    const audioInputs = vueDemi.computed(() => devices.value.filter((i) => i.kind === "audioinput"));
    const audioOutputs = vueDemi.computed(() => devices.value.filter((i) => i.kind === "audiooutput"));
    let isSupported = false;
    const permissionGranted = vueDemi.ref(false);
    async function update() {
      if (!isSupported)
        return;
      devices.value = await navigator.mediaDevices.enumerateDevices();
      onUpdated == null ? void 0 : onUpdated(devices.value);
    }
    async function ensurePermissions() {
      if (!isSupported)
        return false;
      if (permissionGranted.value)
        return true;
      const { state, query } = usePermission("camera", { controls: true });
      await query();
      if (state.value !== "granted") {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((t) => t.stop());
        update();
        permissionGranted.value = true;
      } else {
        permissionGranted.value = true;
      }
      return permissionGranted.value;
    }
    if (navigator) {
      isSupported = Boolean(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
      if (isSupported) {
        if (requestPermissions)
          ensurePermissions();
        useEventListener(navigator.mediaDevices, "devicechange", update);
        update();
      }
    }
    return {
      devices,
      ensurePermissions,
      permissionGranted,
      videoInputs,
      audioInputs,
      audioOutputs,
      isSupported
    };
  }

  function useDisplayMedia(options = {}) {
    var _a, _b;
    const enabled = vueDemi.ref((_a = options.enabled) != null ? _a : false);
    const video = options.video;
    const audio = options.audio;
    const { navigator = defaultNavigator } = options;
    const isSupported = Boolean((_b = navigator == null ? void 0 : navigator.mediaDevices) == null ? void 0 : _b.getDisplayMedia);
    const constraint = { audio, video };
    const stream = vueDemi.shallowRef();
    async function _start() {
      if (!isSupported || stream.value)
        return;
      stream.value = await navigator.mediaDevices.getDisplayMedia(constraint);
      return stream.value;
    }
    async function _stop() {
      var _a2;
      (_a2 = stream.value) == null ? void 0 : _a2.getTracks().forEach((t) => t.stop());
      stream.value = void 0;
    }
    function stop() {
      _stop();
      enabled.value = false;
    }
    async function start() {
      await _start();
      if (stream.value)
        enabled.value = true;
      return stream.value;
    }
    vueDemi.watch(enabled, (v) => {
      if (v)
        _start();
      else
        _stop();
    }, { immediate: true });
    return {
      isSupported,
      stream,
      start,
      stop,
      enabled
    };
  }

  function useDocumentVisibility({ document = defaultDocument } = {}) {
    if (!document)
      return vueDemi.ref("visible");
    const visibility = vueDemi.ref(document.visibilityState);
    useEventListener(document, "visibilitychange", () => {
      visibility.value = document.visibilityState;
    });
    return visibility;
  }

  var __defProp$b = Object.defineProperty;
  var __defProps$4 = Object.defineProperties;
  var __getOwnPropDescs$4 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$d = Object.getOwnPropertySymbols;
  var __hasOwnProp$d = Object.prototype.hasOwnProperty;
  var __propIsEnum$d = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$b = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$d.call(b, prop))
        __defNormalProp$b(a, prop, b[prop]);
    if (__getOwnPropSymbols$d)
      for (var prop of __getOwnPropSymbols$d(b)) {
        if (__propIsEnum$d.call(b, prop))
          __defNormalProp$b(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$4 = (a, b) => __defProps$4(a, __getOwnPropDescs$4(b));
  function useDraggable(target, options = {}) {
    var _a, _b;
    const draggingElement = (_a = options.draggingElement) != null ? _a : defaultWindow;
    const position = vueDemi.ref((_b = options.initialValue) != null ? _b : { x: 0, y: 0 });
    const pressedDelta = vueDemi.ref();
    const filterEvent = (e) => {
      if (options.pointerTypes)
        return options.pointerTypes.includes(e.pointerType);
      return true;
    };
    const handleEvent = (e) => {
      if (vueDemi.unref(options.preventDefault))
        e.preventDefault();
      if (vueDemi.unref(options.stopPropagation))
        e.stopPropagation();
    };
    const start = (e) => {
      var _a2;
      if (!filterEvent(e))
        return;
      if (vueDemi.unref(options.exact) && e.target !== vueDemi.unref(target))
        return;
      const rect = vueDemi.unref(target).getBoundingClientRect();
      const pos = {
        x: e.pageX - rect.left,
        y: e.pageY - rect.top
      };
      if (((_a2 = options.onStart) == null ? void 0 : _a2.call(options, pos, e)) === false)
        return;
      pressedDelta.value = pos;
      handleEvent(e);
    };
    const move = (e) => {
      var _a2;
      if (!filterEvent(e))
        return;
      if (!pressedDelta.value)
        return;
      position.value = {
        x: e.pageX - pressedDelta.value.x,
        y: e.pageY - pressedDelta.value.y
      };
      (_a2 = options.onMove) == null ? void 0 : _a2.call(options, position.value, e);
      handleEvent(e);
    };
    const end = (e) => {
      var _a2;
      if (!filterEvent(e))
        return;
      if (!pressedDelta.value)
        return;
      pressedDelta.value = void 0;
      (_a2 = options.onEnd) == null ? void 0 : _a2.call(options, position.value, e);
      handleEvent(e);
    };
    if (shared.isClient) {
      useEventListener(target, "pointerdown", start, true);
      useEventListener(draggingElement, "pointermove", move, true);
      useEventListener(draggingElement, "pointerup", end, true);
    }
    return __spreadProps$4(__spreadValues$b({}, shared.toRefs(position)), {
      position,
      isDragging: vueDemi.computed(() => !!pressedDelta.value),
      style: vueDemi.computed(() => `left:${position.value.x}px;top:${position.value.y}px;`)
    });
  }

  var __getOwnPropSymbols$c = Object.getOwnPropertySymbols;
  var __hasOwnProp$c = Object.prototype.hasOwnProperty;
  var __propIsEnum$c = Object.prototype.propertyIsEnumerable;
  var __objRest$2 = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp$c.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols$c)
      for (var prop of __getOwnPropSymbols$c(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum$c.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  function useResizeObserver(target, callback, options = {}) {
    const _a = options, { window = defaultWindow } = _a, observerOptions = __objRest$2(_a, ["window"]);
    let observer;
    const isSupported = window && "ResizeObserver" in window;
    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = void 0;
      }
    };
    const stopWatch = vueDemi.watch(() => unrefElement(target), (el) => {
      cleanup();
      if (isSupported && window && el) {
        observer = new ResizeObserver(callback);
        observer.observe(el, observerOptions);
      }
    }, { immediate: true, flush: "post" });
    const stop = () => {
      cleanup();
      stopWatch();
    };
    shared.tryOnScopeDispose(stop);
    return {
      isSupported,
      stop
    };
  }

  function useElementBounding(target) {
    const height = vueDemi.ref(0);
    const bottom = vueDemi.ref(0);
    const left = vueDemi.ref(0);
    const right = vueDemi.ref(0);
    const top = vueDemi.ref(0);
    const width = vueDemi.ref(0);
    const x = vueDemi.ref(0);
    const y = vueDemi.ref(0);
    function update() {
      const el = unrefElement(target);
      if (!el) {
        height.value = 0;
        bottom.value = 0;
        left.value = 0;
        right.value = 0;
        top.value = 0;
        width.value = 0;
        x.value = 0;
        y.value = 0;
        return;
      }
      const rect = el.getBoundingClientRect();
      height.value = rect.height;
      bottom.value = rect.bottom;
      left.value = rect.left;
      right.value = rect.right;
      top.value = rect.top;
      width.value = rect.width;
      x.value = rect.x;
      y.value = rect.y;
    }
    useEventListener("scroll", update, true);
    useResizeObserver(target, update);
    vueDemi.watch(() => unrefElement(target), (ele) => !ele && update());
    return {
      height,
      bottom,
      left,
      right,
      top,
      width,
      x,
      y,
      update
    };
  }

  function useRafFn(fn, options = {}) {
    const {
      immediate = true,
      window = defaultWindow
    } = options;
    const isActive = vueDemi.ref(false);
    function loop() {
      if (!isActive.value || !window)
        return;
      fn();
      window.requestAnimationFrame(loop);
    }
    function resume() {
      if (!isActive.value && window) {
        isActive.value = true;
        loop();
      }
    }
    function pause() {
      isActive.value = false;
    }
    if (immediate)
      resume();
    shared.tryOnScopeDispose(pause);
    return {
      isActive,
      pause,
      resume
    };
  }

  var __defProp$a = Object.defineProperty;
  var __getOwnPropSymbols$b = Object.getOwnPropertySymbols;
  var __hasOwnProp$b = Object.prototype.hasOwnProperty;
  var __propIsEnum$b = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$a = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$b.call(b, prop))
        __defNormalProp$a(a, prop, b[prop]);
    if (__getOwnPropSymbols$b)
      for (var prop of __getOwnPropSymbols$b(b)) {
        if (__propIsEnum$b.call(b, prop))
          __defNormalProp$a(a, prop, b[prop]);
      }
    return a;
  };
  function useElementByPoint(options) {
    const element = vueDemi.ref(null);
    const { x, y } = options;
    const controls = useRafFn(() => {
      element.value = document.elementFromPoint(vueDemi.unref(x), vueDemi.unref(y));
    });
    return __spreadValues$a({
      element
    }, controls);
  }

  function useElementHover(el) {
    const isHovered = vueDemi.ref(false);
    useEventListener(el, "mouseenter", () => isHovered.value = true);
    useEventListener(el, "mouseleave", () => isHovered.value = false);
    return isHovered;
  }

  function useElementSize(target, initialSize = { width: 0, height: 0 }, options = {}) {
    const width = vueDemi.ref(initialSize.width);
    const height = vueDemi.ref(initialSize.height);
    useResizeObserver(target, ([entry]) => {
      width.value = entry.contentRect.width;
      height.value = entry.contentRect.height;
    }, options);
    vueDemi.watch(() => unrefElement(target), (ele) => {
      width.value = ele ? initialSize.width : 0;
      height.value = ele ? initialSize.height : 0;
    });
    return {
      width,
      height
    };
  }

  function useElementVisibility(element, { window = defaultWindow, scrollTarget } = {}) {
    const elementIsVisible = vueDemi.ref(false);
    const testBounding = () => {
      if (!window)
        return;
      const document = window.document;
      if (!vueDemi.unref(element)) {
        elementIsVisible.value = false;
      } else {
        const rect = vueDemi.unref(element).getBoundingClientRect();
        elementIsVisible.value = rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth) && rect.bottom >= 0 && rect.right >= 0;
      }
    };
    shared.tryOnMounted(testBounding);
    if (window)
      shared.tryOnMounted(() => useEventListener(vueDemi.unref(scrollTarget) || window, "scroll", testBounding, { capture: false, passive: true }));
    return elementIsVisible;
  }

  const events = /* @__PURE__ */ new Map();

  function useEventBus(key) {
    const scope = vueDemi.getCurrentScope();
    function on(listener) {
      const listeners = events.get(key) || [];
      listeners.push(listener);
      events.set(key, listeners);
      const _off = () => off(listener);
      scope == null ? void 0 : scope.cleanups.push(_off);
      return _off;
    }
    function once(listener) {
      function _listener(...args) {
        off(_listener);
        listener(...args);
      }
      return on(_listener);
    }
    function off(listener) {
      const listeners = events.get(key);
      if (!listeners)
        return;
      const index = listeners.indexOf(listener);
      if (index > -1)
        listeners.splice(index, 1);
      if (!listeners.length)
        events.delete(key);
    }
    function reset() {
      events.delete(key);
    }
    function emit(event, payload) {
      var _a;
      (_a = events.get(key)) == null ? void 0 : _a.forEach((v) => v(event, payload));
    }
    return { on, once, off, emit, reset };
  }

  function useEventSource(url, events = [], options = {}) {
    const event = vueDemi.ref(null);
    const data = vueDemi.ref(null);
    const status = vueDemi.ref("CONNECTING");
    const eventSource = vueDemi.ref(null);
    const error = vueDemi.ref(null);
    const {
      withCredentials = false
    } = options;
    const close = () => {
      if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
        status.value = "CLOSED";
      }
    };
    const es = new EventSource(url, { withCredentials });
    eventSource.value = es;
    es.onopen = () => {
      status.value = "OPEN";
      error.value = null;
    };
    es.onerror = (e) => {
      status.value = "CLOSED";
      error.value = e;
    };
    es.onmessage = (e) => {
      event.value = null;
      data.value = e.data;
    };
    for (const event_name of events) {
      useEventListener(es, event_name, (e) => {
        event.value = event_name;
        data.value = e.data || null;
      });
    }
    shared.tryOnScopeDispose(() => {
      close();
    });
    return {
      eventSource,
      event,
      data,
      status,
      error,
      close
    };
  }

  function useEyeDropper(options = {}) {
    const { initialValue = "" } = options;
    const isSupported = Boolean(typeof window !== "undefined" && "EyeDropper" in window);
    const sRGBHex = vueDemi.ref(initialValue);
    async function open(openOptions) {
      if (!isSupported)
        return;
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open(openOptions);
      sRGBHex.value = result.sRGBHex;
      return result;
    }
    return { isSupported, sRGBHex, open };
  }

  function useFavicon(newIcon = null, options = {}) {
    const {
      baseUrl = "",
      rel = "icon",
      document = defaultDocument
    } = options;
    const favicon = vueDemi.isRef(newIcon) ? newIcon : vueDemi.ref(newIcon);
    const applyIcon = (icon) => {
      document == null ? void 0 : document.head.querySelectorAll(`link[rel*="${rel}"]`).forEach((el) => el.href = `${baseUrl}${icon}`);
    };
    vueDemi.watch(favicon, (i, o) => {
      if (shared.isString(i) && i !== o)
        applyIcon(i);
    }, { immediate: true });
    return favicon;
  }

  var __defProp$9 = Object.defineProperty;
  var __defProps$3 = Object.defineProperties;
  var __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$a = Object.getOwnPropertySymbols;
  var __hasOwnProp$a = Object.prototype.hasOwnProperty;
  var __propIsEnum$a = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$9 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$a.call(b, prop))
        __defNormalProp$9(a, prop, b[prop]);
    if (__getOwnPropSymbols$a)
      for (var prop of __getOwnPropSymbols$a(b)) {
        if (__propIsEnum$a.call(b, prop))
          __defNormalProp$9(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$3 = (a, b) => __defProps$3(a, __getOwnPropDescs$3(b));
  const payloadMapping = {
    json: "application/json",
    text: "text/plain",
    formData: "multipart/form-data"
  };
  function isFetchOptions(obj) {
    return shared.containsProp(obj, "immediate", "refetch", "initialData", "timeout", "beforeFetch", "afterFetch", "onFetchError");
  }
  function headersToObject(headers) {
    if (headers instanceof Headers)
      return Object.fromEntries([...headers.entries()]);
    return headers;
  }
  function createFetch(config = {}) {
    const _options = config.options || {};
    const _fetchOptions = config.fetchOptions || {};
    function useFactoryFetch(url, ...args) {
      const computedUrl = vueDemi.computed(() => config.baseUrl ? joinPaths(vueDemi.unref(config.baseUrl), vueDemi.unref(url)) : vueDemi.unref(url));
      let options = _options;
      let fetchOptions = _fetchOptions;
      if (args.length > 0) {
        if (isFetchOptions(args[0])) {
          options = __spreadValues$9(__spreadValues$9({}, options), args[0]);
        } else {
          fetchOptions = __spreadProps$3(__spreadValues$9(__spreadValues$9({}, fetchOptions), args[0]), {
            headers: __spreadValues$9(__spreadValues$9({}, headersToObject(fetchOptions.headers) || {}), headersToObject(args[0].headers) || {})
          });
        }
      }
      if (args.length > 1 && isFetchOptions(args[1]))
        options = __spreadValues$9(__spreadValues$9({}, options), args[1]);
      return useFetch(computedUrl, fetchOptions, options);
    }
    return useFactoryFetch;
  }
  function useFetch(url, ...args) {
    var _a;
    const supportsAbort = typeof AbortController === "function";
    let fetchOptions = {};
    let options = { immediate: true, refetch: false, timeout: 0 };
    const config = {
      method: "GET",
      type: "text",
      payload: void 0
    };
    if (args.length > 0) {
      if (isFetchOptions(args[0]))
        options = __spreadValues$9(__spreadValues$9({}, options), args[0]);
      else
        fetchOptions = args[0];
    }
    if (args.length > 1) {
      if (isFetchOptions(args[1]))
        options = __spreadValues$9(__spreadValues$9({}, options), args[1]);
    }
    const {
      fetch = (_a = defaultWindow) == null ? void 0 : _a.fetch,
      initialData,
      timeout
    } = options;
    const responseEvent = shared.createEventHook();
    const errorEvent = shared.createEventHook();
    const finallyEvent = shared.createEventHook();
    const isFinished = vueDemi.ref(false);
    const isFetching = vueDemi.ref(false);
    const aborted = vueDemi.ref(false);
    const statusCode = vueDemi.ref(null);
    const response = vueDemi.shallowRef(null);
    const error = vueDemi.shallowRef(null);
    const data = vueDemi.shallowRef(initialData);
    const canAbort = vueDemi.computed(() => supportsAbort && isFetching.value);
    let controller;
    let timer;
    const abort = () => {
      if (supportsAbort && controller)
        controller.abort();
    };
    const loading = (isLoading) => {
      isFetching.value = isLoading;
      isFinished.value = !isLoading;
    };
    if (timeout)
      timer = shared.useTimeoutFn(abort, timeout, { immediate: false });
    const execute = async (throwOnFailed = false) => {
      var _a2;
      loading(true);
      error.value = null;
      statusCode.value = null;
      aborted.value = false;
      controller = void 0;
      if (supportsAbort) {
        controller = new AbortController();
        controller.signal.onabort = () => aborted.value = true;
        fetchOptions = __spreadProps$3(__spreadValues$9({}, fetchOptions), {
          signal: controller.signal
        });
      }
      const defaultFetchOptions = {
        method: config.method,
        headers: {}
      };
      if (config.payload) {
        const headers = headersToObject(defaultFetchOptions.headers);
        if (config.payloadType)
          headers["Content-Type"] = (_a2 = payloadMapping[config.payloadType]) != null ? _a2 : config.payloadType;
        defaultFetchOptions.body = config.payloadType === "json" ? JSON.stringify(vueDemi.unref(config.payload)) : vueDemi.unref(config.payload);
      }
      let isCanceled = false;
      const context = { url: vueDemi.unref(url), options: fetchOptions, cancel: () => {
        isCanceled = true;
      } };
      if (options.beforeFetch)
        Object.assign(context, await options.beforeFetch(context));
      if (isCanceled || !fetch) {
        loading(false);
        return Promise.resolve(null);
      }
      let responseData = null;
      if (timer)
        timer.start();
      return new Promise((resolve, reject) => {
        var _a3;
        fetch(context.url, __spreadProps$3(__spreadValues$9(__spreadValues$9({}, defaultFetchOptions), context.options), {
          headers: __spreadValues$9(__spreadValues$9({}, headersToObject(defaultFetchOptions.headers)), headersToObject((_a3 = context.options) == null ? void 0 : _a3.headers))
        })).then(async (fetchResponse) => {
          response.value = fetchResponse;
          statusCode.value = fetchResponse.status;
          responseData = await fetchResponse[config.type]();
          if (options.afterFetch && statusCode.value >= 200 && statusCode.value < 300)
            ({ data: responseData } = await options.afterFetch({ data: responseData, response: fetchResponse }));
          data.value = responseData;
          if (!fetchResponse.ok)
            throw new Error(fetchResponse.statusText);
          responseEvent.trigger(fetchResponse);
          return resolve(fetchResponse);
        }).catch(async (fetchError) => {
          let errorData = fetchError.message || fetchError.name;
          if (options.onFetchError)
            ({ data: responseData, error: errorData } = await options.onFetchError({ data: responseData, error: fetchError }));
          data.value = responseData;
          error.value = errorData;
          errorEvent.trigger(fetchError);
          if (throwOnFailed)
            return reject(fetchError);
          return resolve(null);
        }).finally(() => {
          loading(false);
          if (timer)
            timer.stop();
          finallyEvent.trigger(null);
        });
      });
    };
    vueDemi.watch(() => [
      vueDemi.unref(url),
      vueDemi.unref(options.refetch)
    ], () => vueDemi.unref(options.refetch) && execute(), { deep: true });
    const shell = {
      isFinished,
      statusCode,
      response,
      error,
      data,
      isFetching,
      canAbort,
      aborted,
      abort,
      execute,
      onFetchResponse: responseEvent.on,
      onFetchError: errorEvent.on,
      onFetchFinally: finallyEvent.on,
      get: setMethod("GET"),
      put: setMethod("PUT"),
      post: setMethod("POST"),
      delete: setMethod("DELETE"),
      patch: setMethod("PATCH"),
      head: setMethod("HEAD"),
      options: setMethod("OPTIONS"),
      json: setType("json"),
      text: setType("text"),
      blob: setType("blob"),
      arrayBuffer: setType("arrayBuffer"),
      formData: setType("formData")
    };
    function setMethod(method) {
      return (payload, payloadType) => {
        if (!isFetching.value) {
          config.method = method;
          config.payload = payload;
          config.payloadType = payloadType;
          if (vueDemi.isRef(config.payload)) {
            vueDemi.watch(() => [
              vueDemi.unref(config.payload),
              vueDemi.unref(options.refetch)
            ], () => vueDemi.unref(options.refetch) && execute(), { deep: true });
          }
          if (!payloadType && vueDemi.unref(payload) && Object.getPrototypeOf(vueDemi.unref(payload)) === Object.prototype)
            config.payloadType = "json";
          return shell;
        }
        return void 0;
      };
    }
    function waitUntilFinished() {
      return new Promise((resolve, reject) => {
        shared.until(isFinished).toBe(true).then(() => resolve(shell)).catch((error2) => reject(error2));
      });
    }
    function setType(type) {
      return () => {
        if (!isFetching.value) {
          config.type = type;
          return __spreadProps$3(__spreadValues$9({}, shell), {
            then(onFulfilled, onRejected) {
              return waitUntilFinished().then(onFulfilled, onRejected);
            }
          });
        }
        return void 0;
      };
    }
    if (options.immediate)
      setTimeout(execute, 0);
    return __spreadProps$3(__spreadValues$9({}, shell), {
      then(onFulfilled, onRejected) {
        return waitUntilFinished().then(onFulfilled, onRejected);
      }
    });
  }
  function joinPaths(start, end) {
    if (!start.endsWith("/") && !end.startsWith("/"))
      return `${start}/${end}`;
    return `${start}${end}`;
  }

  var __defProp$8 = Object.defineProperty;
  var __getOwnPropSymbols$9 = Object.getOwnPropertySymbols;
  var __hasOwnProp$9 = Object.prototype.hasOwnProperty;
  var __propIsEnum$9 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$8 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$9.call(b, prop))
        __defNormalProp$8(a, prop, b[prop]);
    if (__getOwnPropSymbols$9)
      for (var prop of __getOwnPropSymbols$9(b)) {
        if (__propIsEnum$9.call(b, prop))
          __defNormalProp$8(a, prop, b[prop]);
      }
    return a;
  };
  function useFileSystemAccess(options = {}) {
    const {
      window: _window = defaultWindow,
      dataType = "Text"
    } = vueDemi.unref(options);
    const window = _window;
    const isSupported = Boolean(window && "showSaveFilePicker" in window && "showOpenFilePicker" in window);
    const fileHandle = vueDemi.ref();
    const data = vueDemi.ref();
    const file = vueDemi.ref();
    const fileName = vueDemi.computed(() => {
      var _a, _b;
      return (_b = (_a = file.value) == null ? void 0 : _a.name) != null ? _b : "";
    });
    const fileMIME = vueDemi.computed(() => {
      var _a, _b;
      return (_b = (_a = file.value) == null ? void 0 : _a.type) != null ? _b : "";
    });
    const fileSize = vueDemi.computed(() => {
      var _a, _b;
      return (_b = (_a = file.value) == null ? void 0 : _a.size) != null ? _b : 0;
    });
    const fileLastModified = vueDemi.computed(() => {
      var _a, _b;
      return (_b = (_a = file.value) == null ? void 0 : _a.lastModified) != null ? _b : 0;
    });
    async function open(_options = {}) {
      if (!isSupported)
        return;
      const [handle] = await window.showOpenFilePicker(__spreadValues$8(__spreadValues$8({}, vueDemi.unref(options)), _options));
      fileHandle.value = handle;
      await updateFile();
      await updateData();
    }
    async function create(_options = {}) {
      if (!isSupported)
        return;
      fileHandle.value = await window.showSaveFilePicker(__spreadValues$8(__spreadValues$8({}, vueDemi.unref(options)), _options));
      data.value = void 0;
      await updateFile();
      await updateData();
    }
    async function save(_options = {}) {
      if (!isSupported)
        return;
      if (!fileHandle.value)
        return saveAs(_options);
      if (data.value) {
        const writableStream = await fileHandle.value.createWritable();
        await writableStream.write(data.value);
        await writableStream.close();
      }
      await updateFile();
    }
    async function saveAs(_options = {}) {
      if (!isSupported)
        return;
      fileHandle.value = await window.showSaveFilePicker(__spreadValues$8(__spreadValues$8({}, vueDemi.unref(options)), _options));
      if (data.value) {
        const writableStream = await fileHandle.value.createWritable();
        await writableStream.write(data.value);
        await writableStream.close();
      }
      await updateFile();
    }
    async function updateFile() {
      var _a;
      file.value = await ((_a = fileHandle.value) == null ? void 0 : _a.getFile());
    }
    async function updateData() {
      var _a, _b;
      if (vueDemi.unref(dataType) === "Text")
        data.value = await ((_a = file.value) == null ? void 0 : _a.text());
      if (vueDemi.unref(dataType) === "ArrayBuffer")
        data.value = await ((_b = file.value) == null ? void 0 : _b.arrayBuffer());
      if (vueDemi.unref(dataType) === "Blob")
        data.value = file.value;
    }
    vueDemi.watch(() => vueDemi.unref(dataType), updateData);
    return {
      isSupported,
      data,
      file,
      fileName,
      fileMIME,
      fileSize,
      fileLastModified,
      open,
      create,
      save,
      saveAs,
      updateData
    };
  }

  function useFocus(target, options = {}) {
    const { initialValue = false } = options;
    const activeElement = useActiveElement(options);
    const targetElement = vueDemi.computed(() => unrefElement(target));
    const focused = vueDemi.computed({
      get() {
        return activeElement.value === targetElement.value;
      },
      set(value) {
        var _a, _b;
        if (!value && focused.value)
          (_a = targetElement.value) == null ? void 0 : _a.blur();
        if (value && !focused.value)
          (_b = targetElement.value) == null ? void 0 : _b.focus();
      }
    });
    vueDemi.watch(targetElement, () => {
      focused.value = initialValue;
    }, { immediate: true, flush: "post" });
    return { focused };
  }

  function useFocusWithin(target, options = {}) {
    const activeElement = useActiveElement(options);
    const targetElement = vueDemi.computed(() => unrefElement(target));
    const focused = vueDemi.computed(() => targetElement.value && activeElement.value ? targetElement.value.contains(activeElement.value) : false);
    return { focused };
  }

  function useFps(options) {
    var _a;
    const fps = vueDemi.ref(0);
    if (typeof performance === "undefined")
      return fps;
    const every = (_a = options == null ? void 0 : options.every) != null ? _a : 10;
    let last = performance.now();
    let ticks = 0;
    useRafFn(() => {
      ticks += 1;
      if (ticks >= every) {
        const now = performance.now();
        const diff = now - last;
        fps.value = Math.round(1e3 / (diff / ticks));
        last = now;
        ticks = 0;
      }
    });
    return fps;
  }

  const functionsMap = [
    [
      "requestFullscreen",
      "exitFullscreen",
      "fullscreenElement",
      "fullscreenEnabled",
      "fullscreenchange",
      "fullscreenerror"
    ],
    [
      "webkitRequestFullscreen",
      "webkitExitFullscreen",
      "webkitFullscreenElement",
      "webkitFullscreenEnabled",
      "webkitfullscreenchange",
      "webkitfullscreenerror"
    ],
    [
      "webkitRequestFullScreen",
      "webkitCancelFullScreen",
      "webkitCurrentFullScreenElement",
      "webkitCancelFullScreen",
      "webkitfullscreenchange",
      "webkitfullscreenerror"
    ],
    [
      "mozRequestFullScreen",
      "mozCancelFullScreen",
      "mozFullScreenElement",
      "mozFullScreenEnabled",
      "mozfullscreenchange",
      "mozfullscreenerror"
    ],
    [
      "msRequestFullscreen",
      "msExitFullscreen",
      "msFullscreenElement",
      "msFullscreenEnabled",
      "MSFullscreenChange",
      "MSFullscreenError"
    ]
  ];
  function useFullscreen(target, options = {}) {
    const { document = defaultDocument, autoExit = false } = options;
    const targetRef = target || (document == null ? void 0 : document.querySelector("html"));
    const isFullscreen = vueDemi.ref(false);
    let isSupported = false;
    let map = functionsMap[0];
    if (!document) {
      isSupported = false;
    } else {
      for (const m of functionsMap) {
        if (m[1] in document) {
          map = m;
          isSupported = true;
          break;
        }
      }
    }
    const [REQUEST, EXIT, ELEMENT, , EVENT] = map;
    async function exit() {
      if (!isSupported)
        return;
      if (document == null ? void 0 : document[ELEMENT])
        await document[EXIT]();
      isFullscreen.value = false;
    }
    async function enter() {
      if (!isSupported)
        return;
      await exit();
      const target2 = unrefElement(targetRef);
      if (target2) {
        await target2[REQUEST]();
        isFullscreen.value = true;
      }
    }
    async function toggle() {
      if (isFullscreen.value)
        await exit();
      else
        await enter();
    }
    if (document) {
      useEventListener(document, EVENT, () => {
        isFullscreen.value = !!(document == null ? void 0 : document[ELEMENT]);
      }, false);
    }
    if (autoExit)
      shared.tryOnScopeDispose(exit);
    return {
      isSupported,
      isFullscreen,
      enter,
      exit,
      toggle
    };
  }

  function mapGamepadToXbox360Controller(gamepad) {
    return vueDemi.computed(() => {
      if (gamepad.value) {
        return {
          buttons: {
            a: gamepad.value.buttons[0],
            b: gamepad.value.buttons[1],
            x: gamepad.value.buttons[2],
            y: gamepad.value.buttons[3]
          },
          bumper: {
            left: gamepad.value.buttons[4],
            right: gamepad.value.buttons[5]
          },
          triggers: {
            left: gamepad.value.buttons[6],
            right: gamepad.value.buttons[7]
          },
          stick: {
            left: {
              horizontal: gamepad.value.axes[0],
              vertical: gamepad.value.axes[1],
              button: gamepad.value.buttons[10]
            },
            right: {
              horizontal: gamepad.value.axes[2],
              vertical: gamepad.value.axes[3],
              button: gamepad.value.buttons[11]
            }
          },
          dpad: {
            up: gamepad.value.buttons[12],
            down: gamepad.value.buttons[13],
            left: gamepad.value.buttons[14],
            right: gamepad.value.buttons[15]
          },
          back: gamepad.value.buttons[8],
          start: gamepad.value.buttons[9]
        };
      }
      return null;
    });
  }
  function useGamepad(options = {}) {
    const {
      navigator = defaultNavigator
    } = options;
    const isSupported = navigator && "getGamepads" in navigator;
    const gamepads = vueDemi.ref([]);
    const onConnectedHook = shared.createEventHook();
    const onDisconnectedHook = shared.createEventHook();
    const stateFromGamepad = (gamepad) => {
      const hapticActuators = [];
      const vibrationActuator = "vibrationActuator" in gamepad ? gamepad.vibrationActuator : null;
      if (vibrationActuator)
        hapticActuators.push(vibrationActuator);
      if (gamepad.hapticActuators)
        hapticActuators.push(...gamepad.hapticActuators);
      return {
        id: gamepad.id,
        hapticActuators,
        index: gamepad.index,
        mapping: gamepad.mapping,
        connected: gamepad.connected,
        timestamp: gamepad.timestamp,
        axes: gamepad.axes.map((axes) => axes),
        buttons: gamepad.buttons.map((button) => ({ pressed: button.pressed, touched: button.touched, value: button.value }))
      };
    };
    const updateGamepadState = () => {
      const _gamepads = (navigator == null ? void 0 : navigator.getGamepads()) || [];
      for (let i = 0; i < _gamepads.length; ++i) {
        const gamepad = _gamepads[i];
        if (gamepad) {
          const index = gamepads.value.findIndex(({ index: index2 }) => index2 === gamepad.index);
          if (index > -1)
            gamepads.value[index] = stateFromGamepad(gamepad);
        }
      }
    };
    const { isActive, pause, resume } = core.useRafFn(updateGamepadState);
    const onGamepadConnected = (gamepad) => {
      if (!gamepads.value.some(({ index }) => index === gamepad.index)) {
        gamepads.value.push(stateFromGamepad(gamepad));
        onConnectedHook.trigger(gamepad.index);
      }
      resume();
    };
    const onGamepadDisconnected = (gamepad) => {
      gamepads.value = gamepads.value.filter((x) => x.index !== gamepad.index);
      onDisconnectedHook.trigger(gamepad.index);
    };
    core.useEventListener("gamepadconnected", (e) => onGamepadConnected(e.gamepad));
    core.useEventListener("gamepaddisconnected", (e) => onGamepadDisconnected(e.gamepad));
    shared.tryOnMounted(() => {
      const _gamepads = (navigator == null ? void 0 : navigator.getGamepads()) || [];
      if (_gamepads) {
        for (let i = 0; i < _gamepads.length; ++i) {
          const gamepad = _gamepads[i];
          if (gamepad)
            onGamepadConnected(gamepad);
        }
      }
    });
    pause();
    return {
      isSupported,
      onConnected: onConnectedHook.on,
      onDisconnected: onDisconnectedHook.on,
      gamepads,
      pause,
      resume,
      isActive
    };
  }

  function useGeolocation(options = {}) {
    const {
      enableHighAccuracy = true,
      maximumAge = 3e4,
      timeout = 27e3,
      navigator = defaultNavigator
    } = options;
    const isSupported = navigator && "geolocation" in navigator;
    const locatedAt = vueDemi.ref(null);
    const error = vueDemi.ref(null);
    const coords = vueDemi.ref({
      accuracy: 0,
      latitude: Infinity,
      longitude: Infinity,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    });
    function updatePosition(position) {
      locatedAt.value = position.timestamp;
      coords.value = position.coords;
      error.value = null;
    }
    let watcher;
    if (isSupported) {
      watcher = navigator.geolocation.watchPosition(updatePosition, (err) => error.value = err, {
        enableHighAccuracy,
        maximumAge,
        timeout
      });
    }
    shared.tryOnScopeDispose(() => {
      if (watcher && navigator)
        navigator.geolocation.clearWatch(watcher);
    });
    return {
      isSupported,
      coords,
      locatedAt,
      error
    };
  }

  const defaultEvents$1 = ["mousemove", "mousedown", "resize", "keydown", "touchstart", "wheel"];
  const oneMinute = 6e4;
  function useIdle(timeout = oneMinute, options = {}) {
    const {
      initialState = false,
      listenForVisibilityChange = true,
      events = defaultEvents$1,
      window = defaultWindow,
      eventFilter = shared.throttleFilter(50)
    } = options;
    const idle = vueDemi.ref(initialState);
    const lastActive = vueDemi.ref(shared.timestamp());
    let timer;
    const onEvent = shared.createFilterWrapper(eventFilter, () => {
      idle.value = false;
      lastActive.value = shared.timestamp();
      clearTimeout(timer);
      timer = setTimeout(() => idle.value = true, timeout);
    });
    if (window) {
      const document = window.document;
      for (const event of events)
        useEventListener(window, event, onEvent, { passive: true });
      if (listenForVisibilityChange) {
        useEventListener(document, "visibilitychange", () => {
          if (!document.hidden)
            onEvent();
        });
      }
    }
    timer = setTimeout(() => idle.value = true, timeout);
    return { idle, lastActive };
  }

  function useScroll(element, options = {}) {
    const {
      throttle = 0,
      idle = 200,
      onStop = shared.noop,
      onScroll = shared.noop,
      offset = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      eventListenerOptions = {
        capture: false,
        passive: true
      }
    } = options;
    const x = vueDemi.ref(0);
    const y = vueDemi.ref(0);
    const isScrolling = vueDemi.ref(false);
    const arrivedState = vueDemi.reactive({
      left: true,
      right: false,
      top: true,
      bottom: false
    });
    const directions = vueDemi.reactive({
      left: false,
      right: false,
      top: false,
      bottom: false
    });
    if (element) {
      const onScrollEnd = shared.useDebounceFn((e) => {
        isScrolling.value = false;
        directions.left = false;
        directions.right = false;
        directions.top = false;
        directions.bottom = false;
        onStop(e);
      }, throttle + idle);
      const onScrollHandler = (e) => {
        const eventTarget = e.target === document ? e.target.documentElement : e.target;
        const scrollLeft = eventTarget.scrollLeft;
        directions.left = scrollLeft < x.value;
        directions.right = scrollLeft > x.value;
        arrivedState.left = scrollLeft <= 0 + (offset.left || 0);
        arrivedState.right = scrollLeft + eventTarget.clientWidth >= eventTarget.scrollWidth - (offset.right || 0);
        x.value = scrollLeft;
        const scrollTop = eventTarget.scrollTop;
        directions.top = scrollTop < y.value;
        directions.bottom = scrollTop > y.value;
        arrivedState.top = scrollTop <= 0 + (offset.top || 0);
        arrivedState.bottom = scrollTop + eventTarget.clientHeight >= eventTarget.scrollHeight - (offset.bottom || 0);
        y.value = scrollTop;
        isScrolling.value = true;
        onScrollEnd(e);
        onScroll(e);
      };
      useEventListener(element, "scroll", throttle ? shared.useThrottleFn(onScrollHandler, throttle) : onScrollHandler, eventListenerOptions);
    }
    return {
      x,
      y,
      isScrolling,
      arrivedState,
      directions
    };
  }

  var __defProp$7 = Object.defineProperty;
  var __defProps$2 = Object.defineProperties;
  var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$8 = Object.getOwnPropertySymbols;
  var __hasOwnProp$8 = Object.prototype.hasOwnProperty;
  var __propIsEnum$8 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$7 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$8.call(b, prop))
        __defNormalProp$7(a, prop, b[prop]);
    if (__getOwnPropSymbols$8)
      for (var prop of __getOwnPropSymbols$8(b)) {
        if (__propIsEnum$8.call(b, prop))
          __defNormalProp$7(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
  function useInfiniteScroll(element, onLoadMore, options = {}) {
    var _a;
    const state = vueDemi.reactive(useScroll(element, __spreadProps$2(__spreadValues$7({}, options), {
      offset: __spreadValues$7({
        bottom: (_a = options.distance) != null ? _a : 0
      }, options.offset)
    })));
    vueDemi.watch(() => state.arrivedState.bottom, (v) => {
      if (v)
        onLoadMore(state);
    });
  }

  function useIntersectionObserver(target, callback, options = {}) {
    const {
      root,
      rootMargin = "0px",
      threshold = 0.1,
      window = defaultWindow
    } = options;
    const isSupported = window && "IntersectionObserver" in window;
    let cleanup = shared.noop;
    const stopWatch = isSupported ? vueDemi.watch(() => ({
      el: unrefElement(target),
      root: unrefElement(root)
    }), ({ el, root: root2 }) => {
      cleanup();
      if (!el)
        return;
      const observer = new IntersectionObserver(callback, {
        root: root2,
        rootMargin,
        threshold
      });
      observer.observe(el);
      cleanup = () => {
        observer.disconnect();
        cleanup = shared.noop;
      };
    }, { immediate: true, flush: "post" }) : shared.noop;
    const stop = () => {
      cleanup();
      stopWatch();
    };
    shared.tryOnScopeDispose(stop);
    return {
      isSupported,
      stop
    };
  }

  const defaultEvents = ["mousedown", "mouseup", "keydown", "keyup"];
  function useKeyModifier(modifier, options = {}) {
    const {
      events = defaultEvents,
      document = defaultDocument,
      initial = null
    } = options;
    const state = vueDemi.ref(initial);
    if (document) {
      events.forEach((listenerEvent) => {
        useEventListener(document, listenerEvent, (evt) => {
          if (typeof evt.getModifierState === "function")
            state.value = evt.getModifierState(modifier);
        });
      });
    }
    return state;
  }

  function useLocalStorage(key, initialValue, options = {}) {
    const { window = defaultWindow } = options;
    return useStorage(key, initialValue, window == null ? void 0 : window.localStorage, options);
  }

  const DefaultMagicKeysAliasMap = {
    ctrl: "control",
    command: "meta",
    cmd: "meta",
    option: "alt",
    up: "arrowup",
    down: "arrowdown",
    left: "arrowleft",
    right: "arrowright"
  };

  function useMagicKeys(options = {}) {
    const {
      reactive: useReactive = false,
      target = defaultWindow,
      aliasMap = DefaultMagicKeysAliasMap,
      passive = true,
      onEventFired = shared.noop
    } = options;
    const current = vueDemi.reactive(/* @__PURE__ */ new Set());
    const obj = { toJSON() {
      return {};
    }, current };
    const refs = useReactive ? vueDemi.reactive(obj) : obj;
    const metaDeps = /* @__PURE__ */ new Set();
    function setRefs(key, value) {
      if (key in refs) {
        if (useReactive)
          refs[key] = value;
        else
          refs[key].value = value;
      }
    }
    function updateRefs(e, value) {
      var _a, _b;
      const key = (_a = e.key) == null ? void 0 : _a.toLowerCase();
      const code = (_b = e.code) == null ? void 0 : _b.toLowerCase();
      const values = [code, key].filter(Boolean);
      if (code) {
        if (value)
          current.add(e.code);
        else
          current.delete(e.code);
      }
      for (const key2 of values)
        setRefs(key2, value);
      if (key === "meta" && !value) {
        metaDeps.forEach((key2) => {
          current.delete(key2);
          setRefs(key2, false);
        });
        metaDeps.clear();
      } else if (e.getModifierState("Meta") && value) {
        [...current, ...values].forEach((key2) => metaDeps.add(key2));
      }
    }
    if (target) {
      useEventListener(target, "keydown", (e) => {
        updateRefs(e, true);
        return onEventFired(e);
      }, { passive });
      useEventListener(target, "keyup", (e) => {
        updateRefs(e, false);
        return onEventFired(e);
      }, { passive });
    }
    const proxy = new Proxy(refs, {
      get(target2, prop, rec) {
        if (typeof prop !== "string")
          return Reflect.get(target2, prop, rec);
        prop = prop.toLowerCase();
        if (prop in aliasMap)
          prop = aliasMap[prop];
        if (!(prop in refs)) {
          if (/[+_-]/.test(prop)) {
            const keys = prop.split(/[+_-]/g).map((i) => i.trim());
            refs[prop] = vueDemi.computed(() => keys.every((key) => vueDemi.unref(proxy[key])));
          } else {
            refs[prop] = vueDemi.ref(false);
          }
        }
        const r = Reflect.get(target2, prop, rec);
        return useReactive ? vueDemi.unref(r) : r;
      }
    });
    return proxy;
  }

  var __defProp$6 = Object.defineProperty;
  var __getOwnPropSymbols$7 = Object.getOwnPropertySymbols;
  var __hasOwnProp$7 = Object.prototype.hasOwnProperty;
  var __propIsEnum$7 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$6 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$7.call(b, prop))
        __defNormalProp$6(a, prop, b[prop]);
    if (__getOwnPropSymbols$7)
      for (var prop of __getOwnPropSymbols$7(b)) {
        if (__propIsEnum$7.call(b, prop))
          __defNormalProp$6(a, prop, b[prop]);
      }
    return a;
  };
  function usingElRef(source, cb) {
    if (vueDemi.unref(source))
      cb(vueDemi.unref(source));
  }
  function timeRangeToArray(timeRanges) {
    let ranges = [];
    for (let i = 0; i < timeRanges.length; ++i)
      ranges = [...ranges, [timeRanges.start(i), timeRanges.end(i)]];
    return ranges;
  }
  function tracksToArray(tracks) {
    return Array.from(tracks).map(({ label, kind, language, mode, activeCues, cues, inBandMetadataTrackDispatchType }, id) => ({ id, label, kind, language, mode, activeCues, cues, inBandMetadataTrackDispatchType }));
  }
  const defaultOptions = {
    src: "",
    tracks: []
  };
  function useMediaControls(target, options = {}) {
    options = __spreadValues$6(__spreadValues$6({}, defaultOptions), options);
    const {
      document = defaultDocument
    } = options;
    const currentTime = vueDemi.ref(0);
    const duration = vueDemi.ref(0);
    const seeking = vueDemi.ref(false);
    const volume = vueDemi.ref(1);
    const waiting = vueDemi.ref(false);
    const ended = vueDemi.ref(false);
    const playing = vueDemi.ref(false);
    const rate = vueDemi.ref(1);
    const stalled = vueDemi.ref(false);
    const buffered = vueDemi.ref([]);
    const tracks = vueDemi.ref([]);
    const selectedTrack = vueDemi.ref(-1);
    const isPictureInPicture = vueDemi.ref(false);
    const muted = vueDemi.ref(false);
    const supportsPictureInPicture = document && "pictureInPictureEnabled" in document;
    const sourceErrorEvent = shared.createEventHook();
    const disableTrack = (track) => {
      usingElRef(target, (el) => {
        if (track) {
          const id = shared.isNumber(track) ? track : track.id;
          el.textTracks[id].mode = "disabled";
        } else {
          for (let i = 0; i < el.textTracks.length; ++i)
            el.textTracks[i].mode = "disabled";
        }
        selectedTrack.value = -1;
      });
    };
    const enableTrack = (track, disableTracks = true) => {
      usingElRef(target, (el) => {
        const id = shared.isNumber(track) ? track : track.id;
        if (disableTracks)
          disableTrack();
        el.textTracks[id].mode = "showing";
        selectedTrack.value = id;
      });
    };
    const togglePictureInPicture = () => {
      return new Promise((resolve, reject) => {
        usingElRef(target, async (el) => {
          if (supportsPictureInPicture) {
            if (!isPictureInPicture.value) {
              el.requestPictureInPicture().then(resolve).catch(reject);
            } else {
              document.exitPictureInPicture().then(resolve).catch(reject);
            }
          }
        });
      });
    };
    vueDemi.watchEffect(() => {
      if (!document)
        return;
      const el = vueDemi.unref(target);
      if (!el)
        return;
      const src = vueDemi.unref(options.src);
      let sources = [];
      if (!src)
        return;
      if (shared.isString(src))
        sources = [{ src }];
      else if (Array.isArray(src))
        sources = src;
      else if (shared.isObject(src))
        sources = [src];
      el.querySelectorAll("source").forEach((e) => {
        e.removeEventListener("error", sourceErrorEvent.trigger);
        e.remove();
      });
      sources.forEach(({ src: src2, type }) => {
        const source = document.createElement("source");
        source.setAttribute("src", src2);
        source.setAttribute("type", type || "");
        source.addEventListener("error", sourceErrorEvent.trigger);
        el.appendChild(source);
      });
      el.load();
    });
    shared.tryOnScopeDispose(() => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      el.querySelectorAll("source").forEach((e) => e.removeEventListener("error", sourceErrorEvent.trigger));
    });
    vueDemi.watch(volume, (vol) => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      el.volume = vol;
    });
    vueDemi.watch(muted, (mute) => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      el.muted = mute;
    });
    vueDemi.watch(rate, (rate2) => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      el.playbackRate = rate2;
    });
    vueDemi.watchEffect(() => {
      if (!document)
        return;
      const textTracks = vueDemi.unref(options.tracks);
      const el = vueDemi.unref(target);
      if (!textTracks || !textTracks.length || !el)
        return;
      el.querySelectorAll("track").forEach((e) => e.remove());
      textTracks.forEach(({ default: isDefault, kind, label, src, srcLang }, i) => {
        const track = document.createElement("track");
        track.default = isDefault || false;
        track.kind = kind;
        track.label = label;
        track.src = src;
        track.srclang = srcLang;
        if (track.default)
          selectedTrack.value = i;
        el.appendChild(track);
      });
    });
    const { ignoreUpdates: ignoreCurrentTimeUpdates } = shared.watchIgnorable(currentTime, (time) => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      el.currentTime = time;
    });
    const { ignoreUpdates: ignorePlayingUpdates } = shared.watchIgnorable(playing, (isPlaying) => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      isPlaying ? el.play() : el.pause();
    });
    useEventListener(target, "timeupdate", () => ignoreCurrentTimeUpdates(() => currentTime.value = vueDemi.unref(target).currentTime));
    useEventListener(target, "durationchange", () => duration.value = vueDemi.unref(target).duration);
    useEventListener(target, "progress", () => buffered.value = timeRangeToArray(vueDemi.unref(target).buffered));
    useEventListener(target, "seeking", () => seeking.value = true);
    useEventListener(target, "seeked", () => seeking.value = false);
    useEventListener(target, "waiting", () => waiting.value = true);
    useEventListener(target, "playing", () => waiting.value = false);
    useEventListener(target, "ratechange", () => rate.value = vueDemi.unref(target).playbackRate);
    useEventListener(target, "stalled", () => stalled.value = true);
    useEventListener(target, "ended", () => ended.value = true);
    useEventListener(target, "pause", () => ignorePlayingUpdates(() => playing.value = false));
    useEventListener(target, "play", () => ignorePlayingUpdates(() => playing.value = true));
    useEventListener(target, "enterpictureinpicture", () => isPictureInPicture.value = true);
    useEventListener(target, "leavepictureinpicture", () => isPictureInPicture.value = false);
    useEventListener(target, "volumechange", () => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      volume.value = el.volume;
      muted.value = el.muted;
    });
    const listeners = [];
    const stop = vueDemi.watch([target], () => {
      const el = vueDemi.unref(target);
      if (!el)
        return;
      stop();
      listeners[0] = useEventListener(el.textTracks, "addtrack", () => tracks.value = tracksToArray(el.textTracks));
      listeners[1] = useEventListener(el.textTracks, "removetrack", () => tracks.value = tracksToArray(el.textTracks));
      listeners[2] = useEventListener(el.textTracks, "change", () => tracks.value = tracksToArray(el.textTracks));
    });
    shared.tryOnScopeDispose(() => listeners.forEach((listener) => listener()));
    return {
      currentTime,
      duration,
      waiting,
      seeking,
      ended,
      stalled,
      buffered,
      playing,
      rate,
      volume,
      muted,
      tracks,
      selectedTrack,
      enableTrack,
      disableTrack,
      supportsPictureInPicture,
      togglePictureInPicture,
      isPictureInPicture,
      onSourceError: sourceErrorEvent.on
    };
  }

  const getMapVue2Compat = () => {
    const data = vueDemi.reactive({});
    return {
      get: (key) => data[key],
      set: (key, value) => vueDemi.set(data, key, value),
      has: (key) => Object.prototype.hasOwnProperty.call(data, key),
      delete: (key) => vueDemi.del(data, key),
      clear: () => {
        Object.keys(data).forEach((key) => {
          vueDemi.del(data, key);
        });
      }
    };
  };
  function useMemoize(resolver, options) {
    const initCache = () => {
      if (options == null ? void 0 : options.cache)
        return vueDemi.reactive(options.cache);
      if (vueDemi.isVue2)
        return getMapVue2Compat();
      return vueDemi.reactive(/* @__PURE__ */ new Map());
    };
    const cache = initCache();
    const generateKey = (...args) => (options == null ? void 0 : options.getKey) ? options.getKey(...args) : JSON.stringify(args);
    const _loadData = (key, ...args) => {
      cache.set(key, resolver(...args));
      return cache.get(key);
    };
    const loadData = (...args) => _loadData(generateKey(...args), ...args);
    const deleteData = (...args) => {
      cache.delete(generateKey(...args));
    };
    const clearData = () => {
      cache.clear();
    };
    const memoized = (...args) => {
      const key = generateKey(...args);
      if (cache.has(key))
        return cache.get(key);
      return _loadData(key, ...args);
    };
    memoized.load = loadData;
    memoized.delete = deleteData;
    memoized.clear = clearData;
    memoized.generateKey = generateKey;
    memoized.cache = cache;
    return memoized;
  }

  function useMemory(options = {}) {
    const memory = vueDemi.ref();
    const isSupported = typeof performance !== "undefined" && "memory" in performance;
    if (isSupported) {
      const { interval = 1e3 } = options;
      shared.useIntervalFn(() => {
        memory.value = performance.memory;
      }, interval, { immediate: options.immediate, immediateCallback: options.immediateCallback });
    }
    return { isSupported, memory };
  }

  function useMounted() {
    const isMounted = vueDemi.ref(false);
    vueDemi.onMounted(() => {
      isMounted.value = true;
    });
    return isMounted;
  }

  function useMouse(options = {}) {
    const {
      type = "page",
      touch = true,
      resetOnTouchEnds = false,
      initialValue = { x: 0, y: 0 },
      window = defaultWindow,
      eventFilter
    } = options;
    const x = vueDemi.ref(initialValue.x);
    const y = vueDemi.ref(initialValue.y);
    const sourceType = vueDemi.ref(null);
    const mouseHandler = (event) => {
      if (type === "page") {
        x.value = event.pageX;
        y.value = event.pageY;
      } else if (type === "client") {
        x.value = event.clientX;
        y.value = event.clientY;
      }
      sourceType.value = "mouse";
    };
    const reset = () => {
      x.value = initialValue.x;
      y.value = initialValue.y;
    };
    const touchHandler = (event) => {
      if (event.touches.length > 0) {
        const touch2 = event.touches[0];
        if (type === "page") {
          x.value = touch2.pageX;
          y.value = touch2.pageY;
        } else if (type === "client") {
          x.value = touch2.clientX;
          y.value = touch2.clientY;
        }
        sourceType.value = "touch";
      }
    };
    const mouseHandlerWrapper = (event) => {
      return eventFilter === void 0 ? mouseHandler(event) : eventFilter(() => mouseHandler(event), {});
    };
    const touchHandlerWrapper = (event) => {
      return eventFilter === void 0 ? touchHandler(event) : eventFilter(() => touchHandler(event), {});
    };
    if (window) {
      useEventListener(window, "mousemove", mouseHandlerWrapper, { passive: true });
      useEventListener(window, "dragover", mouseHandlerWrapper, { passive: true });
      if (touch) {
        useEventListener(window, "touchstart", touchHandlerWrapper, { passive: true });
        useEventListener(window, "touchmove", touchHandlerWrapper, { passive: true });
        if (resetOnTouchEnds)
          useEventListener(window, "touchend", reset, { passive: true });
      }
    }
    return {
      x,
      y,
      sourceType
    };
  }

  function useMouseInElement(target, options = {}) {
    const {
      handleOutside = true,
      window = defaultWindow
    } = options;
    const { x, y, sourceType } = useMouse(options);
    const targetRef = vueDemi.ref(target != null ? target : window == null ? void 0 : window.document.body);
    const elementX = vueDemi.ref(0);
    const elementY = vueDemi.ref(0);
    const elementPositionX = vueDemi.ref(0);
    const elementPositionY = vueDemi.ref(0);
    const elementHeight = vueDemi.ref(0);
    const elementWidth = vueDemi.ref(0);
    const isOutside = vueDemi.ref(false);
    let stop = () => {
    };
    if (window) {
      stop = vueDemi.watch([targetRef, x, y], () => {
        const el = unrefElement(targetRef);
        if (!el)
          return;
        const {
          left,
          top,
          width,
          height
        } = el.getBoundingClientRect();
        elementPositionX.value = left + window.pageXOffset;
        elementPositionY.value = top + window.pageYOffset;
        elementHeight.value = height;
        elementWidth.value = width;
        const elX = x.value - elementPositionX.value;
        const elY = y.value - elementPositionY.value;
        isOutside.value = elX < 0 || elY < 0 || elX > elementWidth.value || elY > elementHeight.value;
        if (handleOutside || !isOutside.value) {
          elementX.value = elX;
          elementY.value = elY;
        }
      }, { immediate: true });
    }
    return {
      x,
      y,
      sourceType,
      elementX,
      elementY,
      elementPositionX,
      elementPositionY,
      elementHeight,
      elementWidth,
      isOutside,
      stop
    };
  }

  function useMousePressed(options = {}) {
    const {
      touch = true,
      drag = true,
      initialValue = false,
      window = defaultWindow
    } = options;
    const pressed = vueDemi.ref(initialValue);
    const sourceType = vueDemi.ref(null);
    if (!window) {
      return {
        pressed,
        sourceType
      };
    }
    const onPressed = (srcType) => () => {
      pressed.value = true;
      sourceType.value = srcType;
    };
    const onReleased = () => {
      pressed.value = false;
      sourceType.value = null;
    };
    const target = vueDemi.computed(() => unrefElement(options.target) || window);
    useEventListener(target, "mousedown", onPressed("mouse"), { passive: true });
    useEventListener(window, "mouseleave", onReleased, { passive: true });
    useEventListener(window, "mouseup", onReleased, { passive: true });
    if (drag) {
      useEventListener(target, "dragstart", onPressed("mouse"), { passive: true });
      useEventListener(window, "drop", onReleased, { passive: true });
      useEventListener(window, "dragend", onReleased, { passive: true });
    }
    if (touch) {
      useEventListener(target, "touchstart", onPressed("touch"), { passive: true });
      useEventListener(window, "touchend", onReleased, { passive: true });
      useEventListener(window, "touchcancel", onReleased, { passive: true });
    }
    return {
      pressed,
      sourceType
    };
  }

  var __getOwnPropSymbols$6 = Object.getOwnPropertySymbols;
  var __hasOwnProp$6 = Object.prototype.hasOwnProperty;
  var __propIsEnum$6 = Object.prototype.propertyIsEnumerable;
  var __objRest$1 = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp$6.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols$6)
      for (var prop of __getOwnPropSymbols$6(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum$6.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  function useMutationObserver(target, callback, options = {}) {
    const _a = options, { window = defaultWindow } = _a, mutationOptions = __objRest$1(_a, ["window"]);
    let observer;
    const isSupported = window && "IntersectionObserver" in window;
    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = void 0;
      }
    };
    const stopWatch = vueDemi.watch(() => unrefElement(target), (el) => {
      cleanup();
      if (isSupported && window && el) {
        observer = new MutationObserver(callback);
        observer.observe(el, mutationOptions);
      }
    }, { immediate: true });
    const stop = () => {
      cleanup();
      stopWatch();
    };
    shared.tryOnScopeDispose(stop);
    return {
      isSupported,
      stop
    };
  }

  const useNavigatorLanguage = (options = {}) => {
    const { window = defaultWindow } = options;
    const navigator = window == null ? void 0 : window.navigator;
    const isSupported = Boolean(navigator && "language" in navigator);
    const language = vueDemi.ref(navigator == null ? void 0 : navigator.language);
    useEventListener(window, "languagechange", () => {
      if (navigator)
        language.value = navigator.language;
    });
    return {
      isSupported,
      language
    };
  };

  function useNetwork(options = {}) {
    const { window = defaultWindow } = options;
    const navigator = window == null ? void 0 : window.navigator;
    const isSupported = Boolean(navigator && "connection" in navigator);
    const isOnline = vueDemi.ref(true);
    const saveData = vueDemi.ref(false);
    const offlineAt = vueDemi.ref(void 0);
    const downlink = vueDemi.ref(void 0);
    const downlinkMax = vueDemi.ref(void 0);
    const rtt = vueDemi.ref(void 0);
    const effectiveType = vueDemi.ref(void 0);
    const type = vueDemi.ref("unknown");
    const connection = isSupported && navigator.connection;
    function updateNetworkInformation() {
      if (!navigator)
        return;
      isOnline.value = navigator.onLine;
      offlineAt.value = isOnline.value ? void 0 : Date.now();
      if (connection) {
        downlink.value = connection.downlink;
        downlinkMax.value = connection.downlinkMax;
        effectiveType.value = connection.effectiveType;
        rtt.value = connection.rtt;
        saveData.value = connection.saveData;
        type.value = connection.type;
      }
    }
    if (window) {
      useEventListener(window, "offline", () => {
        isOnline.value = false;
        offlineAt.value = Date.now();
      });
      useEventListener(window, "online", () => {
        isOnline.value = true;
      });
    }
    if (connection)
      useEventListener(connection, "change", updateNetworkInformation, false);
    updateNetworkInformation();
    return {
      isSupported,
      isOnline,
      saveData,
      offlineAt,
      downlink,
      downlinkMax,
      effectiveType,
      rtt,
      type
    };
  }

  var __defProp$5 = Object.defineProperty;
  var __getOwnPropSymbols$5 = Object.getOwnPropertySymbols;
  var __hasOwnProp$5 = Object.prototype.hasOwnProperty;
  var __propIsEnum$5 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$5 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$5.call(b, prop))
        __defNormalProp$5(a, prop, b[prop]);
    if (__getOwnPropSymbols$5)
      for (var prop of __getOwnPropSymbols$5(b)) {
        if (__propIsEnum$5.call(b, prop))
          __defNormalProp$5(a, prop, b[prop]);
      }
    return a;
  };
  function useNow(options = {}) {
    const {
      controls: exposeControls = false,
      interval = "requestAnimationFrame"
    } = options;
    const now = vueDemi.ref(new Date());
    const update = () => now.value = new Date();
    const controls = interval === "requestAnimationFrame" ? useRafFn(update, { immediate: true }) : shared.useIntervalFn(update, interval, { immediate: true });
    if (exposeControls) {
      return __spreadValues$5({
        now
      }, controls);
    } else {
      return now;
    }
  }

  function useOffsetPagination(options) {
    const {
      total = Infinity,
      pageSize = 10,
      page = 1,
      onPageChange = shared.noop,
      onPageSizeChange = shared.noop,
      onPageCountChange = shared.noop
    } = options;
    const currentPageSize = useClamp(pageSize, 1, Infinity);
    const pageCount = vueDemi.computed(() => Math.ceil(vueDemi.unref(total) / vueDemi.unref(currentPageSize)));
    const currentPage = useClamp(page, 1, pageCount);
    const isFirstPage = vueDemi.computed(() => currentPage.value === 1);
    const isLastPage = vueDemi.computed(() => currentPage.value === pageCount.value);
    if (vueDemi.isRef(page))
      shared.syncRef(page, currentPage);
    if (vueDemi.isRef(pageSize))
      shared.syncRef(pageSize, currentPageSize);
    function prev() {
      currentPage.value--;
    }
    function next() {
      currentPage.value++;
    }
    const returnValue = {
      currentPage,
      currentPageSize,
      pageCount,
      isFirstPage,
      isLastPage,
      prev,
      next
    };
    vueDemi.watch(currentPage, () => {
      onPageChange(vueDemi.reactive(returnValue));
    });
    vueDemi.watch(currentPageSize, () => {
      onPageSizeChange(vueDemi.reactive(returnValue));
    });
    vueDemi.watch(pageCount, () => {
      onPageCountChange(vueDemi.reactive(returnValue));
    });
    return returnValue;
  }

  function useOnline(options = {}) {
    const { isOnline } = useNetwork(options);
    return isOnline;
  }

  function usePageLeave(options = {}) {
    const { window = defaultWindow } = options;
    const isLeft = vueDemi.ref(false);
    const handler = (event) => {
      if (!window)
        return;
      event = event || window.event;
      const from = event.relatedTarget || event.toElement;
      isLeft.value = !from;
    };
    if (window) {
      useEventListener(window, "mouseout", handler, { passive: true });
      useEventListener(window.document, "mouseleave", handler, { passive: true });
      useEventListener(window.document, "mouseenter", handler, { passive: true });
    }
    return isLeft;
  }

  function useParallax(target, options = {}) {
    const {
      deviceOrientationTiltAdjust = (i) => i,
      deviceOrientationRollAdjust = (i) => i,
      mouseTiltAdjust = (i) => i,
      mouseRollAdjust = (i) => i,
      window = defaultWindow
    } = options;
    const orientation = vueDemi.reactive(useDeviceOrientation({ window }));
    const {
      elementX: x,
      elementY: y,
      elementWidth: width,
      elementHeight: height
    } = useMouseInElement(target, { handleOutside: false, window });
    const source = vueDemi.computed(() => {
      if (orientation.isSupported && (orientation.alpha != null && orientation.alpha !== 0 || orientation.gamma != null && orientation.gamma !== 0))
        return "deviceOrientation";
      return "mouse";
    });
    const roll = vueDemi.computed(() => {
      if (source.value === "deviceOrientation") {
        const value = -orientation.beta / 90;
        return deviceOrientationRollAdjust(value);
      } else {
        const value = -(y.value - height.value / 2) / height.value;
        return mouseRollAdjust(value);
      }
    });
    const tilt = vueDemi.computed(() => {
      if (source.value === "deviceOrientation") {
        const value = orientation.gamma / 90;
        return deviceOrientationTiltAdjust(value);
      } else {
        const value = (x.value - width.value / 2) / width.value;
        return mouseTiltAdjust(value);
      }
    });
    return { roll, tilt, source };
  }

  var __defProp$4 = Object.defineProperty;
  var __defProps$1 = Object.defineProperties;
  var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$4 = Object.getOwnPropertySymbols;
  var __hasOwnProp$4 = Object.prototype.hasOwnProperty;
  var __propIsEnum$4 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$4 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$4.call(b, prop))
        __defNormalProp$4(a, prop, b[prop]);
    if (__getOwnPropSymbols$4)
      for (var prop of __getOwnPropSymbols$4(b)) {
        if (__propIsEnum$4.call(b, prop))
          __defNormalProp$4(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
  const defaultState = {
    x: 0,
    y: 0,
    pointerId: 0,
    pressure: 0,
    tiltX: 0,
    tiltY: 0,
    width: 0,
    height: 0,
    twist: 0,
    pointerType: null
  };
  const keys = /* @__PURE__ */ Object.keys(defaultState);
  function usePointer(options = {}) {
    const {
      target = defaultWindow
    } = options;
    const isInside = vueDemi.ref(false);
    const state = vueDemi.ref(options.initialValue || {});
    Object.assign(state.value, defaultState, state.value);
    const handler = (event) => {
      isInside.value = true;
      if (options.pointerTypes && !options.pointerTypes.includes(event.pointerType))
        return;
      state.value = shared.objectPick(event, keys, false);
    };
    if (target) {
      useEventListener(target, "pointerdown", handler, { passive: true });
      useEventListener(target, "pointermove", handler, { passive: true });
      useEventListener(target, "pointerleave", () => isInside.value = false, { passive: true });
    }
    return __spreadProps$1(__spreadValues$4({}, shared.toRefs(state)), {
      isInside
    });
  }

  var SwipeDirection = /* @__PURE__ */ ((SwipeDirection2) => {
    SwipeDirection2["UP"] = "UP";
    SwipeDirection2["RIGHT"] = "RIGHT";
    SwipeDirection2["DOWN"] = "DOWN";
    SwipeDirection2["LEFT"] = "LEFT";
    SwipeDirection2["NONE"] = "NONE";
    return SwipeDirection2;
  })(SwipeDirection || {});
  function useSwipe(target, options = {}) {
    const {
      threshold = 50,
      onSwipe,
      onSwipeEnd,
      onSwipeStart,
      passive = true,
      window = defaultWindow
    } = options;
    const coordsStart = vueDemi.reactive({ x: 0, y: 0 });
    const coordsEnd = vueDemi.reactive({ x: 0, y: 0 });
    const diffX = vueDemi.computed(() => coordsStart.x - coordsEnd.x);
    const diffY = vueDemi.computed(() => coordsStart.y - coordsEnd.y);
    const { max, abs } = Math;
    const isThresholdExceeded = vueDemi.computed(() => max(abs(diffX.value), abs(diffY.value)) >= threshold);
    const isSwiping = vueDemi.ref(false);
    const direction = vueDemi.computed(() => {
      if (!isThresholdExceeded.value)
        return "NONE" /* NONE */;
      if (abs(diffX.value) > abs(diffY.value)) {
        return diffX.value > 0 ? "LEFT" /* LEFT */ : "RIGHT" /* RIGHT */;
      } else {
        return diffY.value > 0 ? "UP" /* UP */ : "DOWN" /* DOWN */;
      }
    });
    const getTouchEventCoords = (e) => [e.touches[0].clientX, e.touches[0].clientY];
    const updateCoordsStart = (x, y) => {
      coordsStart.x = x;
      coordsStart.y = y;
    };
    const updateCoordsEnd = (x, y) => {
      coordsEnd.x = x;
      coordsEnd.y = y;
    };
    let listenerOptions;
    const isPassiveEventSupported = checkPassiveEventSupport(window == null ? void 0 : window.document);
    if (!passive)
      listenerOptions = isPassiveEventSupported ? { passive: false, capture: true } : { capture: true };
    else
      listenerOptions = isPassiveEventSupported ? { passive: true } : { capture: false };
    const onTouchEnd = (e) => {
      if (isSwiping.value)
        onSwipeEnd == null ? void 0 : onSwipeEnd(e, direction.value);
      isSwiping.value = false;
    };
    const stops = [
      useEventListener(target, "touchstart", (e) => {
        if (listenerOptions.capture && !listenerOptions.passive)
          e.preventDefault();
        const [x, y] = getTouchEventCoords(e);
        updateCoordsStart(x, y);
        updateCoordsEnd(x, y);
        onSwipeStart == null ? void 0 : onSwipeStart(e);
      }, listenerOptions),
      useEventListener(target, "touchmove", (e) => {
        const [x, y] = getTouchEventCoords(e);
        updateCoordsEnd(x, y);
        if (!isSwiping.value && isThresholdExceeded.value)
          isSwiping.value = true;
        if (isSwiping.value)
          onSwipe == null ? void 0 : onSwipe(e);
      }, listenerOptions),
      useEventListener(target, "touchend", onTouchEnd, listenerOptions),
      useEventListener(target, "touchcancel", onTouchEnd, listenerOptions)
    ];
    const stop = () => stops.forEach((s) => s());
    return {
      isPassiveEventSupported,
      isSwiping,
      direction,
      coordsStart,
      coordsEnd,
      lengthX: diffX,
      lengthY: diffY,
      stop
    };
  }
  function checkPassiveEventSupport(document) {
    if (!document)
      return false;
    let supportsPassive = false;
    const optionsBlock = {
      get passive() {
        supportsPassive = true;
        return false;
      }
    };
    document.addEventListener("x", shared.noop, optionsBlock);
    document.removeEventListener("x", shared.noop);
    return supportsPassive;
  }

  function usePointerSwipe(target, options = {}) {
    const targetRef = vueDemi.ref(target);
    const {
      threshold = 50,
      onSwipe,
      onSwipeEnd,
      onSwipeStart
    } = options;
    const posStart = vueDemi.reactive({ x: 0, y: 0 });
    const updatePosStart = (x, y) => {
      posStart.x = x;
      posStart.y = y;
    };
    const posEnd = vueDemi.reactive({ x: 0, y: 0 });
    const updatePosEnd = (x, y) => {
      posEnd.x = x;
      posEnd.y = y;
    };
    const distanceX = vueDemi.computed(() => posStart.x - posEnd.x);
    const distanceY = vueDemi.computed(() => posStart.y - posEnd.y);
    const { max, abs } = Math;
    const isThresholdExceeded = vueDemi.computed(() => max(abs(distanceX.value), abs(distanceY.value)) >= threshold);
    const isSwiping = vueDemi.ref(false);
    const isPointerDown = vueDemi.ref(false);
    const direction = vueDemi.computed(() => {
      if (!isThresholdExceeded.value)
        return SwipeDirection.NONE;
      if (abs(distanceX.value) > abs(distanceY.value)) {
        return distanceX.value > 0 ? SwipeDirection.LEFT : SwipeDirection.RIGHT;
      } else {
        return distanceY.value > 0 ? SwipeDirection.UP : SwipeDirection.DOWN;
      }
    });
    const filterEvent = (e) => {
      if (options.pointerTypes)
        return options.pointerTypes.includes(e.pointerType);
      return true;
    };
    const stops = [
      useEventListener(target, "pointerdown", (e) => {
        var _a, _b;
        if (!filterEvent(e))
          return;
        isPointerDown.value = true;
        (_b = (_a = targetRef.value) == null ? void 0 : _a.style) == null ? void 0 : _b.setProperty("touch-action", "none");
        const eventTarget = e.target;
        eventTarget == null ? void 0 : eventTarget.setPointerCapture(e.pointerId);
        const { clientX: x, clientY: y } = e;
        updatePosStart(x, y);
        updatePosEnd(x, y);
        onSwipeStart == null ? void 0 : onSwipeStart(e);
      }),
      useEventListener(target, "pointermove", (e) => {
        if (!filterEvent(e))
          return;
        if (!isPointerDown.value)
          return;
        const { clientX: x, clientY: y } = e;
        updatePosEnd(x, y);
        if (!isSwiping.value && isThresholdExceeded.value)
          isSwiping.value = true;
        if (isSwiping.value)
          onSwipe == null ? void 0 : onSwipe(e);
      }),
      useEventListener(target, "pointerup", (e) => {
        var _a, _b;
        if (!filterEvent(e))
          return;
        if (isSwiping.value)
          onSwipeEnd == null ? void 0 : onSwipeEnd(e, direction.value);
        isPointerDown.value = false;
        isSwiping.value = false;
        (_b = (_a = targetRef.value) == null ? void 0 : _a.style) == null ? void 0 : _b.setProperty("touch-action", "initial");
      })
    ];
    const stop = () => stops.forEach((s) => s());
    return {
      isSwiping: vueDemi.readonly(isSwiping),
      direction: vueDemi.readonly(direction),
      posStart: vueDemi.readonly(posStart),
      posEnd: vueDemi.readonly(posEnd),
      distanceX,
      distanceY,
      stop
    };
  }

  function usePreferredColorScheme(options) {
    const isLight = useMediaQuery("(prefers-color-scheme: light)", options);
    const isDark = useMediaQuery("(prefers-color-scheme: dark)", options);
    return vueDemi.computed(() => {
      if (isDark.value)
        return "dark";
      if (isLight.value)
        return "light";
      return "no-preference";
    });
  }

  function usePreferredLanguages(options = {}) {
    const { window = defaultWindow } = options;
    if (!window)
      return vueDemi.ref(["en"]);
    const navigator = window.navigator;
    const value = vueDemi.ref(navigator.languages);
    useEventListener(window, "languagechange", () => {
      value.value = navigator.languages;
    });
    return value;
  }

  const topVarName = "--vueuse-safe-area-top";
  const rightVarName = "--vueuse-safe-area-right";
  const bottomVarName = "--vueuse-safe-area-bottom";
  const leftVarName = "--vueuse-safe-area-left";
  function useScreenSafeArea() {
    const top = vueDemi.ref("");
    const right = vueDemi.ref("");
    const bottom = vueDemi.ref("");
    const left = vueDemi.ref("");
    if (shared.isClient) {
      const topCssVar = useCssVar(topVarName);
      const rightCssVar = useCssVar(rightVarName);
      const bottomCssVar = useCssVar(bottomVarName);
      const leftCssVar = useCssVar(leftVarName);
      topCssVar.value = "env(safe-area-inset-top, 0px)";
      rightCssVar.value = "env(safe-area-inset-right, 0px)";
      bottomCssVar.value = "env(safe-area-inset-bottom, 0px)";
      leftCssVar.value = "env(safe-area-inset-left, 0px)";
      update();
      useEventListener("resize", shared.useDebounceFn(update));
    }
    function update() {
      top.value = getValue(topVarName);
      right.value = getValue(rightVarName);
      bottom.value = getValue(bottomVarName);
      left.value = getValue(leftVarName);
    }
    return {
      top,
      right,
      bottom,
      left,
      update
    };
  }
  function getValue(position) {
    return getComputedStyle(document.documentElement).getPropertyValue(position);
  }

  function useScriptTag(src, onLoaded = shared.noop, options = {}) {
    const {
      immediate = true,
      manual = false,
      type = "text/javascript",
      async = true,
      crossOrigin,
      referrerPolicy,
      noModule,
      defer,
      document = defaultDocument,
      attrs = {}
    } = options;
    const scriptTag = vueDemi.ref(null);
    let _promise = null;
    const loadScript = (waitForScriptLoad) => new Promise((resolve, reject) => {
      const resolveWithElement = (el2) => {
        scriptTag.value = el2;
        resolve(el2);
        return el2;
      };
      if (!document) {
        resolve(false);
        return;
      }
      let shouldAppend = false;
      let el = document.querySelector(`script[src="${src}"]`);
      if (!el) {
        el = document.createElement("script");
        el.type = type;
        el.async = async;
        el.src = vueDemi.unref(src);
        if (defer)
          el.defer = defer;
        if (crossOrigin)
          el.crossOrigin = crossOrigin;
        if (noModule)
          el.noModule = noModule;
        if (referrerPolicy)
          el.referrerPolicy = referrerPolicy;
        for (const attr in attrs)
          el[attr] = attrs[attr];
        shouldAppend = true;
      } else if (el.hasAttribute("data-loaded")) {
        resolveWithElement(el);
      }
      el.addEventListener("error", (event) => reject(event));
      el.addEventListener("abort", (event) => reject(event));
      el.addEventListener("load", () => {
        el.setAttribute("data-loaded", "true");
        onLoaded(el);
        resolveWithElement(el);
      });
      if (shouldAppend)
        el = document.head.appendChild(el);
      if (!waitForScriptLoad)
        resolveWithElement(el);
    });
    const load = (waitForScriptLoad = true) => {
      if (!_promise)
        _promise = loadScript(waitForScriptLoad);
      return _promise;
    };
    const unload = () => {
      if (!document)
        return;
      _promise = null;
      if (scriptTag.value)
        scriptTag.value = null;
      const el = document.querySelector(`script[src="${src}"]`);
      if (el)
        document.head.removeChild(el);
    };
    if (immediate && !manual)
      shared.tryOnMounted(load);
    if (!manual)
      shared.tryOnUnmounted(unload);
    return { scriptTag, load, unload };
  }

  var _a, _b;
  function preventDefault(rawEvent) {
    const e = rawEvent || window.event;
    if (e.touches.length > 1)
      return true;
    if (e.preventDefault)
      e.preventDefault();
    return false;
  }
  const isIOS = shared.isClient && (window == null ? void 0 : window.navigator) && ((_a = window == null ? void 0 : window.navigator) == null ? void 0 : _a.platform) && /iP(ad|hone|od)/.test((_b = window == null ? void 0 : window.navigator) == null ? void 0 : _b.platform);
  function useScrollLock(element, initialState = false) {
    const isLocked = vueDemi.ref(initialState);
    let touchMoveListener = null;
    let initialOverflow;
    vueDemi.watch(() => vueDemi.unref(element), (el) => {
      if (el) {
        const ele = el;
        initialOverflow = ele.style.overflow;
        if (isLocked.value)
          ele.style.overflow = "hidden";
      }
    }, {
      immediate: true
    });
    const lock = () => {
      const ele = vueDemi.unref(element);
      if (!ele || isLocked.value)
        return;
      if (isIOS) {
        touchMoveListener = useEventListener(document, "touchmove", preventDefault, { passive: false });
      }
      ele.style.overflow = "hidden";
      isLocked.value = true;
    };
    const unlock = () => {
      const ele = vueDemi.unref(element);
      if (!ele || !isLocked.value)
        return;
      isIOS && (touchMoveListener == null ? void 0 : touchMoveListener());
      ele.style.overflow = initialOverflow;
      isLocked.value = false;
    };
    return vueDemi.computed({
      get() {
        return isLocked.value;
      },
      set(v) {
        if (v)
          lock();
        else
          unlock();
      }
    });
  }

  function useSessionStorage(key, initialValue, options = {}) {
    const { window = defaultWindow } = options;
    return useStorage(key, initialValue, window == null ? void 0 : window.sessionStorage, options);
  }

  var __defProp$3 = Object.defineProperty;
  var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
  var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
  var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$3 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$3.call(b, prop))
        __defNormalProp$3(a, prop, b[prop]);
    if (__getOwnPropSymbols$3)
      for (var prop of __getOwnPropSymbols$3(b)) {
        if (__propIsEnum$3.call(b, prop))
          __defNormalProp$3(a, prop, b[prop]);
      }
    return a;
  };
  function useShare(shareOptions = {}, options = {}) {
    const { navigator = defaultNavigator } = options;
    const _navigator = navigator;
    const isSupported = _navigator && "canShare" in _navigator;
    const share = async (overrideOptions = {}) => {
      if (isSupported) {
        const data = __spreadValues$3(__spreadValues$3({}, vueDemi.unref(shareOptions)), vueDemi.unref(overrideOptions));
        let granted = true;
        if (data.files && _navigator.canShare)
          granted = _navigator.canShare({ files: data.files });
        if (granted)
          return _navigator.share(data);
      }
    };
    return {
      isSupported,
      share
    };
  }

  function useSpeechRecognition(options = {}) {
    const {
      interimResults = true,
      continuous = true,
      window = defaultWindow
    } = options;
    const lang = vueDemi.ref(options.lang || "en-US");
    const isListening = vueDemi.ref(false);
    const isFinal = vueDemi.ref(false);
    const result = vueDemi.ref("");
    const error = vueDemi.shallowRef(void 0);
    const toggle = (value = !isListening.value) => {
      isListening.value = value;
    };
    const start = () => {
      isListening.value = true;
    };
    const stop = () => {
      isListening.value = false;
    };
    const SpeechRecognition = window && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const isSupported = Boolean(SpeechRecognition);
    let recognition;
    if (isSupported) {
      recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = vueDemi.unref(lang);
      recognition.onstart = () => {
        isFinal.value = false;
      };
      vueDemi.watch(lang, (lang2) => {
        if (recognition && !isListening.value)
          recognition.lang = lang2;
      });
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map((result2) => {
          isFinal.value = result2.isFinal;
          return result2[0];
        }).map((result2) => result2.transcript).join("");
        result.value = transcript;
        error.value = void 0;
      };
      recognition.onerror = (event) => {
        error.value = event;
      };
      recognition.onend = () => {
        isListening.value = false;
        recognition.lang = vueDemi.unref(lang);
      };
      vueDemi.watch(isListening, () => {
        if (isListening.value)
          recognition.start();
        else
          recognition.stop();
      });
    }
    shared.tryOnScopeDispose(() => {
      isListening.value = false;
    });
    return {
      isSupported,
      isListening,
      isFinal,
      recognition,
      result,
      error,
      toggle,
      start,
      stop
    };
  }

  function useSpeechSynthesis(text, options = {}) {
    var _a, _b;
    const {
      pitch = 1,
      rate = 1,
      volume = 1,
      window = defaultWindow
    } = options;
    const synth = window && window.speechSynthesis;
    const isSupported = Boolean(synth);
    const isPlaying = vueDemi.ref(false);
    const status = vueDemi.ref("init");
    const voiceInfo = {
      lang: ((_a = options.voice) == null ? void 0 : _a.lang) || "default",
      name: ((_b = options.voice) == null ? void 0 : _b.name) || ""
    };
    const spokenText = vueDemi.ref(text || "");
    const lang = vueDemi.ref(options.lang || "en-US");
    const error = vueDemi.shallowRef(void 0);
    const toggle = (value = !isPlaying.value) => {
      isPlaying.value = value;
    };
    const bindEventsForUtterance = (utterance2) => {
      utterance2.lang = vueDemi.unref(lang);
      options.voice && (utterance2.voice = options.voice);
      utterance2.pitch = pitch;
      utterance2.rate = rate;
      utterance2.volume = volume;
      utterance2.onstart = () => {
        isPlaying.value = true;
        status.value = "play";
      };
      utterance2.onpause = () => {
        isPlaying.value = false;
        status.value = "pause";
      };
      utterance2.onresume = () => {
        isPlaying.value = true;
        status.value = "play";
      };
      utterance2.onend = () => {
        isPlaying.value = false;
        status.value = "end";
      };
      utterance2.onerror = (event) => {
        error.value = event;
      };
      utterance2.onend = () => {
        isPlaying.value = false;
        utterance2.lang = vueDemi.unref(lang);
      };
    };
    const utterance = vueDemi.computed(() => {
      isPlaying.value = false;
      status.value = "init";
      const newUtterance = new SpeechSynthesisUtterance(spokenText.value);
      bindEventsForUtterance(newUtterance);
      return newUtterance;
    });
    const speak = () => {
      synth.cancel();
      utterance && synth.speak(utterance.value);
    };
    if (isSupported) {
      bindEventsForUtterance(utterance.value);
      vueDemi.watch(lang, (lang2) => {
        if (utterance.value && !isPlaying.value)
          utterance.value.lang = lang2;
      });
      vueDemi.watch(isPlaying, () => {
        if (isPlaying.value)
          synth.resume();
        else
          synth.pause();
      });
    }
    shared.tryOnScopeDispose(() => {
      isPlaying.value = false;
    });
    return {
      isSupported,
      isPlaying,
      status,
      voiceInfo,
      utterance,
      error,
      toggle,
      speak
    };
  }

  function useStorageAsync(key, initialValue, storage, options = {}) {
    var _a;
    const {
      flush = "pre",
      deep = true,
      listenToStorageChanges = true,
      writeDefaults = true,
      shallow,
      window = defaultWindow,
      eventFilter,
      onError = (e) => {
        console.error(e);
      }
    } = options;
    const rawInit = vueDemi.unref(initialValue);
    const type = guessSerializerType(rawInit);
    const data = (shallow ? vueDemi.shallowRef : vueDemi.ref)(initialValue);
    const serializer = (_a = options.serializer) != null ? _a : StorageSerializers[type];
    if (!storage) {
      try {
        storage = getSSRHandler("getDefaultStorage", () => {
          var _a2;
          return (_a2 = defaultWindow) == null ? void 0 : _a2.localStorage;
        })();
      } catch (e) {
        onError(e);
      }
    }
    async function read(event) {
      if (!storage || event && event.key !== key)
        return;
      try {
        const rawValue = event ? event.newValue : await storage.getItem(key);
        if (rawValue == null) {
          data.value = rawInit;
          if (writeDefaults && rawInit !== null)
            await storage.setItem(key, await serializer.write(rawInit));
        } else {
          data.value = await serializer.read(rawValue);
        }
      } catch (e) {
        onError(e);
      }
    }
    read();
    if (window && listenToStorageChanges)
      useEventListener(window, "storage", (e) => setTimeout(() => read(e), 0));
    if (storage) {
      shared.watchWithFilter(data, async () => {
        try {
          if (data.value == null)
            await storage.removeItem(key);
          else
            await storage.setItem(key, await serializer.write(data.value));
        } catch (e) {
          onError(e);
        }
      }, {
        flush,
        deep,
        eventFilter
      });
    }
    return data;
  }

  let _id = 0;
  function useStyleTag(css, options = {}) {
    const isLoaded = vueDemi.ref(false);
    const {
      document = defaultDocument,
      immediate = true,
      manual = false,
      id = `vueuse_styletag_${++_id}`
    } = options;
    const cssRef = vueDemi.ref(css);
    let stop = () => {
    };
    const load = () => {
      if (!document)
        return;
      const el = document.getElementById(id) || document.createElement("style");
      el.type = "text/css";
      el.id = id;
      if (options.media)
        el.media = options.media;
      document.head.appendChild(el);
      if (isLoaded.value)
        return;
      stop = vueDemi.watch(cssRef, (value) => {
        el.innerText = value;
      }, { immediate: true });
      isLoaded.value = true;
    };
    const unload = () => {
      if (!document || !isLoaded.value)
        return;
      stop();
      document.head.removeChild(document.getElementById(id));
      isLoaded.value = false;
    };
    if (immediate && !manual)
      load();
    if (!manual)
      shared.tryOnScopeDispose(unload);
    return {
      id,
      css: cssRef,
      unload,
      load,
      isLoaded: vueDemi.readonly(isLoaded)
    };
  }

  function useTemplateRefsList() {
    const refs = vueDemi.ref([]);
    refs.value.set = (el) => {
      if (el)
        refs.value.push(el);
    };
    vueDemi.onBeforeUpdate(() => {
      refs.value.length = 0;
    });
    return refs;
  }

  function getRangesFromSelection(selection) {
    var _a;
    const rangeCount = (_a = selection.rangeCount) != null ? _a : 0;
    const ranges = new Array(rangeCount);
    for (let i = 0; i < rangeCount; i++) {
      const range = selection.getRangeAt(i);
      ranges[i] = range;
    }
    return ranges;
  }
  function useTextSelection(options = {}) {
    const {
      window = defaultWindow
    } = options;
    const selection = vueDemi.ref(null);
    const text = vueDemi.computed(() => {
      var _a, _b;
      return (_b = (_a = selection.value) == null ? void 0 : _a.toString()) != null ? _b : "";
    });
    const ranges = vueDemi.computed(() => selection.value ? getRangesFromSelection(selection.value) : []);
    const rects = vueDemi.computed(() => ranges.value.map((range) => range.getBoundingClientRect()));
    function onSelectionChange() {
      selection.value = null;
      if (window)
        selection.value = window.getSelection();
    }
    if (window)
      useEventListener(window.document, "selectionchange", onSelectionChange);
    return {
      text,
      rects,
      ranges,
      selection
    };
  }

  var __defProp$2 = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
  var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
  var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$2 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$2.call(b, prop))
        __defNormalProp$2(a, prop, b[prop]);
    if (__getOwnPropSymbols$2)
      for (var prop of __getOwnPropSymbols$2(b)) {
        if (__propIsEnum$2.call(b, prop))
          __defNormalProp$2(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  function useThrottledRefHistory(source, options = {}) {
    const { throttle = 200, trailing = true } = options;
    const filter = shared.throttleFilter(throttle, trailing);
    const history = useRefHistory(source, __spreadProps(__spreadValues$2({}, options), { eventFilter: filter }));
    return __spreadValues$2({}, history);
  }

  var __defProp$1 = Object.defineProperty;
  var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
  var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
  var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$1 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    if (__getOwnPropSymbols$1)
      for (var prop of __getOwnPropSymbols$1(b)) {
        if (__propIsEnum$1.call(b, prop))
          __defNormalProp$1(a, prop, b[prop]);
      }
    return a;
  };
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp$1.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols$1)
      for (var prop of __getOwnPropSymbols$1(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum$1.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  const UNITS = [
    { max: 6e4, value: 1e3, name: "second" },
    { max: 276e4, value: 6e4, name: "minute" },
    { max: 72e6, value: 36e5, name: "hour" },
    { max: 5184e5, value: 864e5, name: "day" },
    { max: 24192e5, value: 6048e5, name: "week" },
    { max: 28512e6, value: 2592e6, name: "month" },
    { max: Infinity, value: 31536e6, name: "year" }
  ];
  const DEFAULT_MESSAGES = {
    justNow: "just now",
    past: (n) => n.match(/\d/) ? `${n} ago` : n,
    future: (n) => n.match(/\d/) ? `in ${n}` : n,
    month: (n, past) => n === 1 ? past ? "last month" : "next month" : `${n} month${n > 1 ? "s" : ""}`,
    year: (n, past) => n === 1 ? past ? "last year" : "next year" : `${n} year${n > 1 ? "s" : ""}`,
    day: (n, past) => n === 1 ? past ? "yesterday" : "tomorrow" : `${n} day${n > 1 ? "s" : ""}`,
    week: (n, past) => n === 1 ? past ? "last week" : "next week" : `${n} week${n > 1 ? "s" : ""}`,
    hour: (n) => `${n} hour${n > 1 ? "s" : ""}`,
    minute: (n) => `${n} minute${n > 1 ? "s" : ""}`,
    second: (n) => `${n} second${n > 1 ? "s" : ""}`
  };
  const DEFAULT_FORMATTER = (date) => date.toISOString().slice(0, 10);
  function useTimeAgo(time, options = {}) {
    const {
      controls: exposeControls = false,
      max,
      updateInterval = 3e4,
      messages = DEFAULT_MESSAGES,
      fullDateFormatter = DEFAULT_FORMATTER
    } = options;
    const { abs, round } = Math;
    const _a = useNow({ interval: updateInterval, controls: true }), { now } = _a, controls = __objRest(_a, ["now"]);
    function getTimeago(from, now2) {
      var _a2;
      const diff = +now2 - +from;
      const absDiff = abs(diff);
      if (absDiff < 6e4)
        return messages.justNow;
      if (typeof max === "number" && absDiff > max)
        return fullDateFormatter(new Date(from));
      if (typeof max === "string") {
        const unitMax = (_a2 = UNITS.find((i) => i.name === max)) == null ? void 0 : _a2.max;
        if (unitMax && absDiff > unitMax)
          return fullDateFormatter(new Date(from));
      }
      for (const unit of UNITS) {
        if (absDiff < unit.max)
          return format(diff, unit);
      }
    }
    function applyFormat(name, val, isPast) {
      const formatter = messages[name];
      if (typeof formatter === "function")
        return formatter(val, isPast);
      return formatter.replace("{0}", val.toString());
    }
    function format(diff, unit) {
      const val = round(abs(diff) / unit.value);
      const past = diff > 0;
      const str = applyFormat(unit.name, val, past);
      return applyFormat(past ? "past" : "future", str, past);
    }
    const timeAgo = vueDemi.computed(() => getTimeago(new Date(vueDemi.unref(time)), vueDemi.unref(now.value)));
    if (exposeControls) {
      return __spreadValues$1({
        timeAgo
      }, controls);
    } else {
      return timeAgo;
    }
  }

  function useTimeoutPoll(fn, interval, timeoutPollOptions) {
    const { start } = shared.useTimeoutFn(loop, interval);
    const isActive = vueDemi.ref(false);
    async function loop() {
      if (!isActive.value)
        return;
      await fn();
      start();
    }
    function resume() {
      if (!isActive.value) {
        isActive.value = true;
        loop();
      }
    }
    function pause() {
      isActive.value = false;
    }
    if (timeoutPollOptions == null ? void 0 : timeoutPollOptions.immediate)
      resume();
    shared.tryOnScopeDispose(pause);
    return {
      isActive,
      pause,
      resume
    };
  }

  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  function useTimestamp(options = {}) {
    const {
      controls: exposeControls = false,
      offset = 0,
      immediate = true,
      interval = "requestAnimationFrame"
    } = options;
    const ts = vueDemi.ref(shared.timestamp() + offset);
    const update = () => ts.value = shared.timestamp() + offset;
    const controls = interval === "requestAnimationFrame" ? useRafFn(update, { immediate }) : shared.useIntervalFn(update, interval, { immediate });
    if (exposeControls) {
      return __spreadValues({
        timestamp: ts
      }, controls);
    } else {
      return ts;
    }
  }

  function useTitle(newTitle = null, options = {}) {
    var _a, _b;
    const {
      document = defaultDocument,
      observe = false,
      titleTemplate = "%s"
    } = options;
    const title = vueDemi.ref((_a = newTitle != null ? newTitle : document == null ? void 0 : document.title) != null ? _a : null);
    vueDemi.watch(title, (t, o) => {
      if (shared.isString(t) && t !== o && document)
        document.title = titleTemplate.replace("%s", t);
    }, { immediate: true });
    if (observe && document) {
      useMutationObserver((_b = document.head) == null ? void 0 : _b.querySelector("title"), () => {
        if (document && document.title !== title.value)
          title.value = titleTemplate.replace("%s", document.title);
      }, { childList: true });
    }
    return title;
  }

  const TransitionPresets = {
    linear: shared.identity,
    easeInSine: [0.12, 0, 0.39, 0],
    easeOutSine: [0.61, 1, 0.88, 1],
    easeInOutSine: [0.37, 0, 0.63, 1],
    easeInQuad: [0.11, 0, 0.5, 0],
    easeOutQuad: [0.5, 1, 0.89, 1],
    easeInOutQuad: [0.45, 0, 0.55, 1],
    easeInCubic: [0.32, 0, 0.67, 0],
    easeOutCubic: [0.33, 1, 0.68, 1],
    easeInOutCubic: [0.65, 0, 0.35, 1],
    easeInQuart: [0.5, 0, 0.75, 0],
    easeOutQuart: [0.25, 1, 0.5, 1],
    easeInOutQuart: [0.76, 0, 0.24, 1],
    easeInQuint: [0.64, 0, 0.78, 0],
    easeOutQuint: [0.22, 1, 0.36, 1],
    easeInOutQuint: [0.83, 0, 0.17, 1],
    easeInExpo: [0.7, 0, 0.84, 0],
    easeOutExpo: [0.16, 1, 0.3, 1],
    easeInOutExpo: [0.87, 0, 0.13, 1],
    easeInCirc: [0.55, 0, 1, 0.45],
    easeOutCirc: [0, 0.55, 0.45, 1],
    easeInOutCirc: [0.85, 0, 0.15, 1],
    easeInBack: [0.36, 0, 0.66, -0.56],
    easeOutBack: [0.34, 1.56, 0.64, 1],
    easeInOutBack: [0.68, -0.6, 0.32, 1.6]
  };
  function createEasingFunction([p0, p1, p2, p3]) {
    const a = (a1, a2) => 1 - 3 * a2 + 3 * a1;
    const b = (a1, a2) => 3 * a2 - 6 * a1;
    const c = (a1) => 3 * a1;
    const calcBezier = (t, a1, a2) => ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
    const getSlope = (t, a1, a2) => 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);
    const getTforX = (x) => {
      let aGuessT = x;
      for (let i = 0; i < 4; ++i) {
        const currentSlope = getSlope(aGuessT, p0, p2);
        if (currentSlope === 0)
          return aGuessT;
        const currentX = calcBezier(aGuessT, p0, p2) - x;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    };
    return (x) => p0 === p1 && p2 === p3 ? x : calcBezier(getTforX(x), p1, p3);
  }
  function useTransition(source, options = {}) {
    const {
      delay = 0,
      disabled = false,
      duration = 1e3,
      onFinished = shared.noop,
      onStarted = shared.noop,
      transition = shared.identity
    } = options;
    const currentTransition = vueDemi.computed(() => {
      const t = vueDemi.unref(transition);
      return shared.isFunction(t) ? t : createEasingFunction(t);
    });
    const sourceValue = vueDemi.computed(() => {
      const s = vueDemi.unref(source);
      return shared.isNumber(s) ? s : s.map(vueDemi.unref);
    });
    const sourceVector = vueDemi.computed(() => shared.isNumber(sourceValue.value) ? [sourceValue.value] : sourceValue.value);
    const outputVector = vueDemi.ref(sourceVector.value.slice(0));
    let currentDuration;
    let diffVector;
    let endAt;
    let startAt;
    let startVector;
    const { resume, pause } = useRafFn(() => {
      const now = Date.now();
      const progress = shared.clamp(1 - (endAt - now) / currentDuration, 0, 1);
      outputVector.value = startVector.map((val, i) => {
        var _a;
        return val + ((_a = diffVector[i]) != null ? _a : 0) * currentTransition.value(progress);
      });
      if (progress >= 1) {
        pause();
        onFinished();
      }
    }, { immediate: false });
    const start = () => {
      pause();
      currentDuration = vueDemi.unref(duration);
      diffVector = outputVector.value.map((n, i) => {
        var _a, _b;
        return ((_a = sourceVector.value[i]) != null ? _a : 0) - ((_b = outputVector.value[i]) != null ? _b : 0);
      });
      startVector = outputVector.value.slice(0);
      startAt = Date.now();
      endAt = startAt + currentDuration;
      resume();
      onStarted();
    };
    const timeout = shared.useTimeoutFn(start, delay, { immediate: false });
    vueDemi.watch(sourceVector, () => {
      if (vueDemi.unref(disabled)) {
        outputVector.value = sourceVector.value.slice(0);
      } else {
        if (vueDemi.unref(delay) <= 0)
          start();
        else
          timeout.start();
      }
    }, { deep: true });
    return vueDemi.computed(() => {
      const targetVector = vueDemi.unref(disabled) ? sourceVector : outputVector;
      return shared.isNumber(sourceValue.value) ? targetVector.value[0] : targetVector.value;
    });
  }

  function useUrlSearchParams(mode = "history", options = {}) {
    const {
      initialValue = {},
      removeNullishValues = true,
      removeFalsyValues = false,
      window = defaultWindow
    } = options;
    if (!window)
      return vueDemi.reactive(initialValue);
    const state = vueDemi.reactive(initialValue);
    function getRawParams() {
      if (mode === "history") {
        return window.location.search || "";
      } else if (mode === "hash") {
        const hash = window.location.hash || "";
        const index = hash.indexOf("?");
        return index > 0 ? hash.slice(index) : "";
      } else {
        return (window.location.hash || "").replace(/^#/, "");
      }
    }
    function constructQuery(params) {
      const stringified = params.toString();
      if (mode === "history")
        return `${stringified ? `?${stringified}` : ""}${location.hash || ""}`;
      if (mode === "hash-params")
        return `${location.search || ""}${stringified ? `#${stringified}` : ""}`;
      const hash = window.location.hash || "#";
      const index = hash.indexOf("?");
      if (index > 0)
        return `${hash.slice(0, index)}${stringified ? `?${stringified}` : ""}`;
      return `${hash}${stringified ? `?${stringified}` : ""}`;
    }
    function read() {
      return new URLSearchParams(getRawParams());
    }
    function updateState(params) {
      const unusedKeys = new Set(Object.keys(state));
      for (const key of params.keys()) {
        const paramsForKey = params.getAll(key);
        state[key] = paramsForKey.length > 1 ? paramsForKey : params.get(key) || "";
        unusedKeys.delete(key);
      }
      Array.from(unusedKeys).forEach((key) => delete state[key]);
    }
    const { pause, resume } = shared.pausableWatch(state, () => {
      const params = new URLSearchParams("");
      Object.keys(state).forEach((key) => {
        const mapEntry = state[key];
        if (Array.isArray(mapEntry))
          mapEntry.forEach((value) => params.append(key, value));
        else if (removeNullishValues && mapEntry == null)
          params.delete(key);
        else if (removeFalsyValues && !mapEntry)
          params.delete(key);
        else
          params.set(key, mapEntry);
      });
      write(params);
    }, { deep: true });
    function write(params, shouldUpdate) {
      pause();
      if (shouldUpdate)
        updateState(params);
      window.history.replaceState({}, "", window.location.pathname + constructQuery(params));
      resume();
    }
    function onChanged() {
      write(read(), true);
    }
    useEventListener(window, "popstate", onChanged, false);
    if (mode !== "history")
      useEventListener(window, "hashchange", onChanged, false);
    updateState(read());
    return state;
  }

  function useUserMedia(options = {}) {
    var _a, _b, _c;
    const enabled = vueDemi.ref((_a = options.enabled) != null ? _a : false);
    const autoSwitch = vueDemi.ref((_b = options.autoSwitch) != null ? _b : true);
    const videoDeviceId = vueDemi.ref(options.videoDeviceId);
    const audioDeviceId = vueDemi.ref(options.audioDeviceId);
    const { navigator = defaultNavigator } = options;
    const isSupported = Boolean((_c = navigator == null ? void 0 : navigator.mediaDevices) == null ? void 0 : _c.getUserMedia);
    const stream = vueDemi.shallowRef();
    function getDeviceOptions(device) {
      if (device.value === "none" || device.value === false)
        return false;
      if (device.value == null)
        return true;
      return {
        deviceId: device.value
      };
    }
    async function _start() {
      if (!isSupported || stream.value)
        return;
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: getDeviceOptions(videoDeviceId),
        audio: getDeviceOptions(audioDeviceId)
      });
      return stream.value;
    }
    async function _stop() {
      var _a2;
      (_a2 = stream.value) == null ? void 0 : _a2.getTracks().forEach((t) => t.stop());
      stream.value = void 0;
    }
    function stop() {
      _stop();
      enabled.value = false;
    }
    async function start() {
      await _start();
      if (stream.value)
        enabled.value = true;
      return stream.value;
    }
    async function restart() {
      _stop();
      return await start();
    }
    vueDemi.watch(enabled, (v) => {
      if (v)
        _start();
      else
        _stop();
    }, { immediate: true });
    vueDemi.watch([videoDeviceId, audioDeviceId], () => {
      if (autoSwitch.value && stream.value)
        restart();
    }, { immediate: true });
    return {
      isSupported,
      stream,
      start,
      stop,
      restart,
      videoDeviceId,
      audioDeviceId,
      enabled,
      autoSwitch
    };
  }

  function useVModel(props, key, emit, options = {}) {
    var _a, _b, _c;
    const {
      passive = false,
      eventName,
      deep = false
    } = options;
    const vm = vueDemi.getCurrentInstance();
    const _emit = emit || (vm == null ? void 0 : vm.emit) || ((_a = vm == null ? void 0 : vm.$emit) == null ? void 0 : _a.bind(vm));
    let event = eventName;
    if (!key) {
      if (vueDemi.isVue2) {
        const modelOptions = (_c = (_b = vm == null ? void 0 : vm.proxy) == null ? void 0 : _b.$options) == null ? void 0 : _c.model;
        key = (modelOptions == null ? void 0 : modelOptions.value) || "value";
        if (!eventName)
          event = (modelOptions == null ? void 0 : modelOptions.event) || "input";
      } else {
        key = "modelValue";
      }
    }
    event = eventName || event || `update:${key}`;
    if (passive) {
      const proxy = vueDemi.ref(props[key]);
      vueDemi.watch(() => props[key], (v) => proxy.value = v);
      vueDemi.watch(proxy, (v) => {
        if (v !== props[key] || deep)
          _emit(event, v);
      }, {
        deep
      });
      return proxy;
    } else {
      return vueDemi.computed({
        get() {
          return props[key];
        },
        set(value) {
          _emit(event, value);
        }
      });
    }
  }

  function useVModels(props, emit, options = {}) {
    const ret = {};
    for (const key in props)
      ret[key] = useVModel(props, key, emit, options);
    return ret;
  }

  function useVibrate(options) {
    const {
      pattern = [],
      interval = 0,
      navigator = defaultNavigator
    } = options || {};
    const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;
    const patternRef = vueDemi.ref(pattern);
    let intervalControls;
    const vibrate = (pattern2 = patternRef.value) => {
      if (isSupported)
        navigator.vibrate(pattern2);
    };
    const stop = () => {
      if (isSupported)
        navigator.vibrate(0);
      intervalControls == null ? void 0 : intervalControls.pause();
    };
    if (interval > 0) {
      intervalControls = shared.useIntervalFn(vibrate, interval, {
        immediate: false,
        immediateCallback: false
      });
    }
    return {
      isSupported,
      pattern,
      intervalControls,
      vibrate,
      stop
    };
  }

  function useVirtualList(list, options) {
    const containerRef = vueDemi.ref();
    const size = useElementSize(containerRef);
    const currentList = vueDemi.ref([]);
    const source = vueDemi.shallowRef(list);
    const state = vueDemi.ref({ start: 0, end: 10 });
    const { itemHeight, overscan = 5 } = options;
    const getViewCapacity = (containerHeight) => {
      if (typeof itemHeight === "number")
        return Math.ceil(containerHeight / itemHeight);
      const { start = 0 } = state.value;
      let sum = 0;
      let capacity = 0;
      for (let i = start; i < source.value.length; i++) {
        const height = itemHeight(i);
        sum += height;
        if (sum >= containerHeight) {
          capacity = i;
          break;
        }
      }
      return capacity - start;
    };
    const getOffset = (scrollTop) => {
      if (typeof itemHeight === "number")
        return Math.floor(scrollTop / itemHeight) + 1;
      let sum = 0;
      let offset = 0;
      for (let i = 0; i < source.value.length; i++) {
        const height = itemHeight(i);
        sum += height;
        if (sum >= scrollTop) {
          offset = i;
          break;
        }
      }
      return offset + 1;
    };
    const calculateRange = () => {
      const element = containerRef.value;
      if (element) {
        const offset = getOffset(element.scrollTop);
        const viewCapacity = getViewCapacity(element.clientHeight);
        const from = offset - overscan;
        const to = offset + viewCapacity + overscan;
        state.value = {
          start: from < 0 ? 0 : from,
          end: to > source.value.length ? source.value.length : to
        };
        currentList.value = source.value.slice(state.value.start, state.value.end).map((ele, index) => ({
          data: ele,
          index: index + state.value.start
        }));
      }
    };
    vueDemi.watch([size.width, size.height, list], () => {
      calculateRange();
    });
    const totalHeight = vueDemi.computed(() => {
      if (typeof itemHeight === "number")
        return source.value.length * itemHeight;
      return source.value.reduce((sum, _, index) => sum + itemHeight(index), 0);
    });
    const getDistanceTop = (index) => {
      if (typeof itemHeight === "number") {
        const height2 = index * itemHeight;
        return height2;
      }
      const height = source.value.slice(0, index).reduce((sum, _, i) => sum + itemHeight(i), 0);
      return height;
    };
    const scrollTo = (index) => {
      if (containerRef.value) {
        containerRef.value.scrollTop = getDistanceTop(index);
        calculateRange();
      }
    };
    const offsetTop = vueDemi.computed(() => getDistanceTop(state.value.start));
    const wrapperProps = vueDemi.computed(() => {
      return {
        style: {
          width: "100%",
          height: `${totalHeight.value - offsetTop.value}px`,
          marginTop: `${offsetTop.value}px`
        }
      };
    });
    const containerStyle = { overflowY: "auto" };
    return {
      list: currentList,
      scrollTo,
      containerProps: {
        ref: containerRef,
        onScroll: () => {
          calculateRange();
        },
        style: containerStyle
      },
      wrapperProps
    };
  }

  const useWakeLock = (options = {}) => {
    const {
      navigator = defaultNavigator,
      document = defaultDocument
    } = options;
    let wakeLock;
    const isSupported = navigator && "wakeLock" in navigator;
    const isActive = vueDemi.ref(false);
    async function onVisibilityChange() {
      if (!isSupported || !wakeLock)
        return;
      if (document && document.visibilityState === "visible")
        wakeLock = await navigator.wakeLock.request("screen");
      isActive.value = !wakeLock.released;
    }
    if (document)
      useEventListener(document, "visibilitychange", onVisibilityChange, { passive: true });
    async function request(type) {
      if (!isSupported)
        return;
      wakeLock = await navigator.wakeLock.request(type);
      isActive.value = !wakeLock.released;
    }
    async function release() {
      if (!isSupported || !wakeLock)
        return;
      await wakeLock.release();
      isActive.value = !wakeLock.released;
      wakeLock = null;
    }
    return {
      isSupported,
      isActive,
      request,
      release
    };
  };

  const useWebNotification = (defaultOptions = {}) => {
    const {
      window = defaultWindow
    } = defaultOptions;
    const isSupported = !!window && "Notification" in window;
    const notification = vueDemi.ref(null);
    const requestPermission = async () => {
      if (!isSupported)
        return;
      if ("permission" in Notification && Notification.permission !== "denied")
        await Notification.requestPermission();
    };
    const onClick = shared.createEventHook();
    const onShow = shared.createEventHook();
    const onError = shared.createEventHook();
    const onClose = shared.createEventHook();
    const show = async (overrides) => {
      if (!isSupported)
        return;
      await requestPermission();
      const options = Object.assign({}, defaultOptions, overrides);
      notification.value = new Notification(options.title || "", options);
      notification.value.onclick = (event) => onClick.trigger(event);
      notification.value.onshow = (event) => onShow.trigger(event);
      notification.value.onerror = (event) => onError.trigger(event);
      notification.value.onclose = (event) => onClose.trigger(event);
      return notification.value;
    };
    const close = () => {
      if (notification.value)
        notification.value.close();
      notification.value = null;
    };
    shared.tryOnMounted(async () => {
      if (isSupported)
        await requestPermission();
    });
    shared.tryOnScopeDispose(close);
    if (isSupported && window) {
      const document = window.document;
      useEventListener(document, "visibilitychange", (e) => {
        e.preventDefault();
        if (document.visibilityState === "visible") {
          close();
        }
      });
    }
    return {
      isSupported,
      notification,
      show,
      close,
      onClick,
      onShow,
      onError,
      onClose
    };
  };

  function resolveNestedOptions(options) {
    if (options === true)
      return {};
    return options;
  }
  function useWebSocket(url, options = {}) {
    const {
      onConnected,
      onDisconnected,
      onError,
      onMessage,
      immediate = true,
      autoClose = true,
      protocols = []
    } = options;
    const data = vueDemi.ref(null);
    const status = vueDemi.ref("CONNECTING");
    const wsRef = vueDemi.ref();
    let heartbeatPause;
    let heartbeatResume;
    let explicitlyClosed = false;
    let retried = 0;
    let bufferedData = [];
    const close = (code = 1e3, reason) => {
      if (!wsRef.value)
        return;
      explicitlyClosed = true;
      heartbeatPause == null ? void 0 : heartbeatPause();
      wsRef.value.close(code, reason);
    };
    const _sendBuffer = () => {
      if (bufferedData.length && wsRef.value && status.value === "OPEN") {
        for (const buffer of bufferedData)
          wsRef.value.send(buffer);
        bufferedData = [];
      }
    };
    const send = (data2, useBuffer = true) => {
      if (!wsRef.value || status.value !== "OPEN") {
        if (useBuffer)
          bufferedData.push(data2);
        return false;
      }
      _sendBuffer();
      wsRef.value.send(data2);
      return true;
    };
    const _init = () => {
      const ws = new WebSocket(url, protocols);
      wsRef.value = ws;
      status.value = "CONNECTING";
      explicitlyClosed = false;
      ws.onopen = () => {
        status.value = "OPEN";
        onConnected == null ? void 0 : onConnected(ws);
        heartbeatResume == null ? void 0 : heartbeatResume();
        _sendBuffer();
      };
      ws.onclose = (ev) => {
        status.value = "CLOSED";
        wsRef.value = void 0;
        onDisconnected == null ? void 0 : onDisconnected(ws, ev);
        if (!explicitlyClosed && options.autoReconnect) {
          const {
            retries = -1,
            delay = 1e3,
            onFailed
          } = resolveNestedOptions(options.autoReconnect);
          retried += 1;
          if (typeof retries === "number" && (retries < 0 || retried < retries))
            setTimeout(_init, delay);
          else if (typeof retries === "function" && retries())
            setTimeout(_init, delay);
          else
            onFailed == null ? void 0 : onFailed();
        }
      };
      ws.onerror = (e) => {
        onError == null ? void 0 : onError(ws, e);
      };
      ws.onmessage = (e) => {
        data.value = e.data;
        onMessage == null ? void 0 : onMessage(ws, e);
      };
    };
    if (options.heartbeat) {
      const {
        message = "ping",
        interval = 1e3
      } = resolveNestedOptions(options.heartbeat);
      const { pause, resume } = shared.useIntervalFn(() => send(message, false), interval, { immediate: false });
      heartbeatPause = pause;
      heartbeatResume = resume;
    }
    if (immediate)
      _init();
    if (autoClose) {
      useEventListener(window, "beforeunload", () => close());
      shared.tryOnScopeDispose(close);
    }
    const open = () => {
      close();
      retried = 0;
      _init();
    };
    return {
      data,
      status,
      close,
      send,
      open,
      ws: wsRef
    };
  }

  function useWebWorker(url, workerOptions, options = {}) {
    const {
      window = defaultWindow
    } = options;
    const data = vueDemi.ref(null);
    const worker = vueDemi.shallowRef();
    const post = function post2(val) {
      if (!worker.value)
        return;
      worker.value.postMessage(val);
    };
    const terminate = function terminate2() {
      if (!worker.value)
        return;
      worker.value.terminate();
    };
    if (window) {
      worker.value = new Worker(url, workerOptions);
      worker.value.onmessage = (e) => {
        data.value = e.data;
      };
      shared.tryOnScopeDispose(() => {
        if (worker.value)
          worker.value.terminate();
      });
    }
    return {
      data,
      post,
      terminate,
      worker
    };
  }

  const jobRunner = (userFunc) => (e) => {
    const userFuncArgs = e.data[0];
    return Promise.resolve(userFunc.apply(void 0, userFuncArgs)).then((result) => {
      postMessage(["SUCCESS", result]);
    }).catch((error) => {
      postMessage(["ERROR", error]);
    });
  };

  const depsParser = (deps) => {
    if (deps.length === 0)
      return "";
    const depsString = deps.map((dep) => `'${dep}'`).toString();
    return `importScripts(${depsString})`;
  };

  const createWorkerBlobUrl = (fn, deps) => {
    const blobCode = `${depsParser(deps)}; onmessage=(${jobRunner})(${fn})`;
    const blob = new Blob([blobCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    return url;
  };

  const useWebWorkerFn = (fn, options = {}) => {
    const {
      dependencies = [],
      timeout,
      window = defaultWindow
    } = options;
    const worker = vueDemi.ref();
    const workerStatus = vueDemi.ref("PENDING");
    const promise = vueDemi.ref({});
    const timeoutId = vueDemi.ref();
    const workerTerminate = (status = "PENDING") => {
      if (worker.value && worker.value._url && window) {
        worker.value.terminate();
        URL.revokeObjectURL(worker.value._url);
        promise.value = {};
        worker.value = void 0;
        window.clearTimeout(timeoutId.value);
        workerStatus.value = status;
      }
    };
    workerTerminate();
    shared.tryOnScopeDispose(workerTerminate);
    const generateWorker = () => {
      const blobUrl = createWorkerBlobUrl(fn, dependencies);
      const newWorker = new Worker(blobUrl);
      newWorker._url = blobUrl;
      newWorker.onmessage = (e) => {
        const { resolve = () => {
        }, reject = () => {
        } } = promise.value;
        const [status, result] = e.data;
        switch (status) {
          case "SUCCESS":
            resolve(result);
            workerTerminate(status);
            break;
          default:
            reject(result);
            workerTerminate("ERROR");
            break;
        }
      };
      newWorker.onerror = (e) => {
        const { reject = () => {
        } } = promise.value;
        reject(e);
        workerTerminate("ERROR");
      };
      if (timeout) {
        timeoutId.value = setTimeout(() => workerTerminate("TIMEOUT_EXPIRED"), timeout);
      }
      return newWorker;
    };
    const callWorker = (...fnArgs) => new Promise((resolve, reject) => {
      promise.value = {
        resolve,
        reject
      };
      worker.value && worker.value.postMessage([[...fnArgs]]);
      workerStatus.value = "RUNNING";
    });
    const workerFn = (...fnArgs) => {
      if (workerStatus.value === "RUNNING") {
        console.error("[useWebWorkerFn] You can only run one instance of the worker at a time.");
        return Promise.reject();
      }
      worker.value = generateWorker();
      return callWorker(...fnArgs);
    };
    return {
      workerFn,
      workerStatus,
      workerTerminate
    };
  };

  function useWindowFocus({ window = defaultWindow } = {}) {
    if (!window)
      return vueDemi.ref(false);
    const focused = vueDemi.ref(window.document.hasFocus());
    useEventListener(window, "blur", () => {
      focused.value = false;
    });
    useEventListener(window, "focus", () => {
      focused.value = true;
    });
    return focused;
  }

  function useWindowScroll({ window = defaultWindow } = {}) {
    if (!window) {
      return {
        x: vueDemi.ref(0),
        y: vueDemi.ref(0)
      };
    }
    const x = vueDemi.ref(window.pageXOffset);
    const y = vueDemi.ref(window.pageYOffset);
    useEventListener("scroll", () => {
      x.value = window.pageXOffset;
      y.value = window.pageYOffset;
    }, {
      capture: false,
      passive: true
    });
    return { x, y };
  }

  function useWindowSize({ window = defaultWindow, initialWidth = Infinity, initialHeight = Infinity } = {}) {
    const width = vueDemi.ref(initialWidth);
    const height = vueDemi.ref(initialHeight);
    const update = () => {
      if (window) {
        width.value = window.innerWidth;
        height.value = window.innerHeight;
      }
    };
    update();
    shared.tryOnMounted(update);
    useEventListener("resize", update, { passive: true });
    return { width, height };
  }

  exports.DefaultMagicKeysAliasMap = DefaultMagicKeysAliasMap;
  exports.StorageSerializers = StorageSerializers;
  exports.SwipeDirection = SwipeDirection;
  exports.TransitionPresets = TransitionPresets;
  exports.asyncComputed = computedAsync;
  exports.breakpointsAntDesign = breakpointsAntDesign;
  exports.breakpointsBootstrapV5 = breakpointsBootstrapV5;
  exports.breakpointsQuasar = breakpointsQuasar;
  exports.breakpointsSematic = breakpointsSematic;
  exports.breakpointsTailwind = breakpointsTailwind;
  exports.breakpointsVuetify = breakpointsVuetify;
  exports.computedAsync = computedAsync;
  exports.computedInject = computedInject;
  exports.createFetch = createFetch;
  exports.createUnrefFn = createUnrefFn;
  exports.defaultDocument = defaultDocument;
  exports.defaultLocation = defaultLocation;
  exports.defaultNavigator = defaultNavigator;
  exports.defaultWindow = defaultWindow;
  exports.getSSRHandler = getSSRHandler;
  exports.mapGamepadToXbox360Controller = mapGamepadToXbox360Controller;
  exports.onClickOutside = onClickOutside;
  exports.onKeyDown = onKeyDown;
  exports.onKeyPressed = onKeyPressed;
  exports.onKeyStroke = onKeyStroke;
  exports.onKeyUp = onKeyUp;
  exports.onLongPress = onLongPress;
  exports.onStartTyping = onStartTyping;
  exports.setSSRHandler = setSSRHandler;
  exports.templateRef = templateRef;
  exports.unrefElement = unrefElement;
  exports.useActiveElement = useActiveElement;
  exports.useAsyncQueue = useAsyncQueue;
  exports.useAsyncState = useAsyncState;
  exports.useBase64 = useBase64;
  exports.useBattery = useBattery;
  exports.useBreakpoints = useBreakpoints;
  exports.useBroadcastChannel = useBroadcastChannel;
  exports.useBrowserLocation = useBrowserLocation;
  exports.useCached = useCached;
  exports.useClamp = useClamp;
  exports.useClipboard = useClipboard;
  exports.useColorMode = useColorMode;
  exports.useConfirmDialog = useConfirmDialog;
  exports.useCssVar = useCssVar;
  exports.useCycleList = useCycleList;
  exports.useDark = useDark;
  exports.useDebouncedRefHistory = useDebouncedRefHistory;
  exports.useDeviceMotion = useDeviceMotion;
  exports.useDeviceOrientation = useDeviceOrientation;
  exports.useDevicePixelRatio = useDevicePixelRatio;
  exports.useDevicesList = useDevicesList;
  exports.useDisplayMedia = useDisplayMedia;
  exports.useDocumentVisibility = useDocumentVisibility;
  exports.useDraggable = useDraggable;
  exports.useElementBounding = useElementBounding;
  exports.useElementByPoint = useElementByPoint;
  exports.useElementHover = useElementHover;
  exports.useElementSize = useElementSize;
  exports.useElementVisibility = useElementVisibility;
  exports.useEventBus = useEventBus;
  exports.useEventListener = useEventListener;
  exports.useEventSource = useEventSource;
  exports.useEyeDropper = useEyeDropper;
  exports.useFavicon = useFavicon;
  exports.useFetch = useFetch;
  exports.useFileSystemAccess = useFileSystemAccess;
  exports.useFocus = useFocus;
  exports.useFocusWithin = useFocusWithin;
  exports.useFps = useFps;
  exports.useFullscreen = useFullscreen;
  exports.useGamepad = useGamepad;
  exports.useGeolocation = useGeolocation;
  exports.useIdle = useIdle;
  exports.useInfiniteScroll = useInfiniteScroll;
  exports.useIntersectionObserver = useIntersectionObserver;
  exports.useKeyModifier = useKeyModifier;
  exports.useLocalStorage = useLocalStorage;
  exports.useMagicKeys = useMagicKeys;
  exports.useManualRefHistory = useManualRefHistory;
  exports.useMediaControls = useMediaControls;
  exports.useMediaQuery = useMediaQuery;
  exports.useMemoize = useMemoize;
  exports.useMemory = useMemory;
  exports.useMounted = useMounted;
  exports.useMouse = useMouse;
  exports.useMouseInElement = useMouseInElement;
  exports.useMousePressed = useMousePressed;
  exports.useMutationObserver = useMutationObserver;
  exports.useNavigatorLanguage = useNavigatorLanguage;
  exports.useNetwork = useNetwork;
  exports.useNow = useNow;
  exports.useOffsetPagination = useOffsetPagination;
  exports.useOnline = useOnline;
  exports.usePageLeave = usePageLeave;
  exports.useParallax = useParallax;
  exports.usePermission = usePermission;
  exports.usePointer = usePointer;
  exports.usePointerSwipe = usePointerSwipe;
  exports.usePreferredColorScheme = usePreferredColorScheme;
  exports.usePreferredDark = usePreferredDark;
  exports.usePreferredLanguages = usePreferredLanguages;
  exports.useRafFn = useRafFn;
  exports.useRefHistory = useRefHistory;
  exports.useResizeObserver = useResizeObserver;
  exports.useScreenSafeArea = useScreenSafeArea;
  exports.useScriptTag = useScriptTag;
  exports.useScroll = useScroll;
  exports.useScrollLock = useScrollLock;
  exports.useSessionStorage = useSessionStorage;
  exports.useShare = useShare;
  exports.useSpeechRecognition = useSpeechRecognition;
  exports.useSpeechSynthesis = useSpeechSynthesis;
  exports.useStorage = useStorage;
  exports.useStorageAsync = useStorageAsync;
  exports.useStyleTag = useStyleTag;
  exports.useSwipe = useSwipe;
  exports.useTemplateRefsList = useTemplateRefsList;
  exports.useTextSelection = useTextSelection;
  exports.useThrottledRefHistory = useThrottledRefHistory;
  exports.useTimeAgo = useTimeAgo;
  exports.useTimeoutPoll = useTimeoutPoll;
  exports.useTimestamp = useTimestamp;
  exports.useTitle = useTitle;
  exports.useTransition = useTransition;
  exports.useUrlSearchParams = useUrlSearchParams;
  exports.useUserMedia = useUserMedia;
  exports.useVModel = useVModel;
  exports.useVModels = useVModels;
  exports.useVibrate = useVibrate;
  exports.useVirtualList = useVirtualList;
  exports.useWakeLock = useWakeLock;
  exports.useWebNotification = useWebNotification;
  exports.useWebSocket = useWebSocket;
  exports.useWebWorker = useWebWorker;
  exports.useWebWorkerFn = useWebWorkerFn;
  exports.useWindowFocus = useWindowFocus;
  exports.useWindowScroll = useWindowScroll;
  exports.useWindowSize = useWindowSize;
  Object.keys(shared).forEach(function (k) {
    if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
      enumerable: true,
      get: function () { return shared[k]; }
    });
  });

  Object.defineProperty(exports, '__esModule', { value: true });

})(this.VueUse = this.VueUse || {}, VueUse, VueDemi, VueUse);
