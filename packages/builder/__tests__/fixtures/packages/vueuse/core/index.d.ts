import * as _vueuse_shared from '@vueuse/shared';
import { Fn, MaybeRef, Awaitable, ConfigurableEventFilter, ConfigurableFlush, RemovableRef, EventHookOn, IntervalFnOptions, Pausable, TimeoutFnOptions, EventHook } from '@vueuse/shared';
export * from '@vueuse/shared';
import * as vue_demi from 'vue-demi';
import { Ref, InjectionKey, ComputedRef, ComponentPublicInstance, UnwrapRef, WatchOptions, UnwrapNestedRefs, ToRefs } from 'vue-demi';
import { MaybeElementRef as MaybeElementRef$1, MaybeRef as MaybeRef$1 } from '@vueuse/core';
import * as vue from 'vue-demi';

/**
 * Handle overlapping async evaluations.
 *
 * @param cancelCallback The provided callback is invoked when a re-evaluation of the computed value is triggered before the previous one finished
 */
declare type AsyncComputedOnCancel = (cancelCallback: Fn) => void;
interface AsyncComputedOptions {
    /**
     * Should value be evaluated lazily
     *
     * @default false
     */
    lazy?: Boolean;
    /**
     * Ref passed to receive the updated of async evaluation
     */
    evaluating?: Ref<boolean>;
    /**
     * Callback when error is caught.
     */
    onError?: (e: unknown) => void;
}
/**
 * Create an asynchronous computed dependency.
 *
 * @see https://vueuse.org/computedAsync
 * @param evaluationCallback     The promise-returning callback which generates the computed value
 * @param initialState           The initial state, used until the first evaluation finishes
 * @param optionsOrRef           Additional options or a ref passed to receive the updates of the async evaluation
 */
declare function computedAsync<T>(evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>, initialState?: T, optionsOrRef?: Ref<boolean> | AsyncComputedOptions): Ref<T>;

declare type ComputedInjectGetter<T, K> = (source: T | undefined, ctx?: any) => K;
declare type ComputedInjectGetterWithDefault<T, K> = (source: T, ctx?: any) => K;
declare type ComputedInjectSetter<T> = (v: T) => void;
interface WritableComputedInjectOptions<T, K> {
    get: ComputedInjectGetter<T, K>;
    set: ComputedInjectSetter<K>;
}
interface WritableComputedInjectOptionsWithDefault<T, K> {
    get: ComputedInjectGetterWithDefault<T, K>;
    set: ComputedInjectSetter<K>;
}
declare function computedInject<T, K = any>(key: InjectionKey<T> | string, getter: ComputedInjectGetter<T, K>): ComputedRef<K | undefined>;
declare function computedInject<T, K = any>(key: InjectionKey<T> | string, options: WritableComputedInjectOptions<T, K>): ComputedRef<K | undefined>;
declare function computedInject<T, K = any>(key: InjectionKey<T> | string, getter: ComputedInjectGetterWithDefault<T, K>, defaultSource: T, treatDefaultAsFactory?: false): ComputedRef<K>;
declare function computedInject<T, K = any>(key: InjectionKey<T> | string, options: WritableComputedInjectOptionsWithDefault<T, K>, defaultSource: T | (() => T), treatDefaultAsFactory: true): ComputedRef<K>;

declare type UnrefFn<T> = T extends (...args: infer A) => infer R ? (...args: {
    [K in keyof A]: MaybeRef<A[K]>;
}) => R : never;
/**
 * Make a plain function accepting ref and raw values as arguments.
 * Returns the same value the unconverted function returns, with proper typing.
 */
declare const createUnrefFn: <T extends Function>(fn: T) => UnrefFn<T>;

declare type VueInstance = ComponentPublicInstance;
declare type MaybeElementRef<T extends MaybeElement = MaybeElement> = MaybeRef<T>;
declare type MaybeElement = HTMLElement | SVGElement | VueInstance | undefined | null;
declare type UnRefElementReturn<T extends MaybeElement = MaybeElement> = T extends VueInstance ? Exclude<MaybeElement, VueInstance> : T | undefined;
/**
 * Get the dom element of a ref of element or Vue component instance
 *
 * @param elRef
 */
declare function unrefElement<T extends MaybeElement>(elRef: MaybeElementRef<T>): UnRefElementReturn<T>;

interface ConfigurableWindow {
    window?: Window;
}
interface ConfigurableDocument {
    document?: Document;
}
interface ConfigurableNavigator {
    navigator?: Navigator;
}
interface ConfigurableLocation {
    location?: Location;
}
declare const defaultWindow: (Window & typeof globalThis) | undefined;
declare const defaultDocument: Document | undefined;
declare const defaultNavigator: Navigator | undefined;
declare const defaultLocation: Location | undefined;

interface OnClickOutsideOptions extends ConfigurableWindow {
    /**
     * List of elements that should not trigger the event.
     */
    ignore?: MaybeElementRef[];
    /**
     * Use capturing phase for internal event listener.
     * @default true
     */
    capture?: boolean;
}
/**
 * Listen for clicks outside of an element.
 *
 * @see https://vueuse.org/onClickOutside
 * @param target
 * @param handler
 * @param options
 */
declare function onClickOutside(target: MaybeElementRef, handler: (evt: PointerEvent) => void, options?: OnClickOutsideOptions): (() => void) | undefined;

declare type KeyPredicate = (event: KeyboardEvent) => boolean;
declare type KeyFilter = null | undefined | string | string[] | KeyPredicate;
declare type KeyStrokeEventName = 'keydown' | 'keypress' | 'keyup';
interface KeyStrokeOptions {
    eventName?: KeyStrokeEventName;
    target?: MaybeRef<EventTarget>;
    passive?: boolean;
}
/**
 * Listen for keyboard keys being stroked.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
declare function onKeyStroke(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: KeyStrokeOptions): _vueuse_shared.Fn;
/**
 * Listen to the keydown event of the given key.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
declare function onKeyDown(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: Omit<KeyStrokeOptions, 'eventName'>): _vueuse_shared.Fn;
/**
 * Listen to the keypress event of the given key.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
declare function onKeyPressed(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: Omit<KeyStrokeOptions, 'eventName'>): _vueuse_shared.Fn;
/**
 * Listen to the keyup event of the given key.
 *
 * @see https://vueuse.org/onKeyStroke
 * @param key
 * @param handler
 * @param options
 */
declare function onKeyUp(key: KeyFilter, handler: (event: KeyboardEvent) => void, options?: Omit<KeyStrokeOptions, 'eventName'>): _vueuse_shared.Fn;

interface OnLongPressOptions {
    /**
     * Time in ms till `longpress` gets called
     *
     * @default 500
     */
    delay?: number;
}
declare function onLongPress(target: MaybeElementRef$1, handler: (evt: PointerEvent) => void, options?: OnLongPressOptions): void;

/**
 * Fires when users start typing on non-editable elements.
 *
 * @see https://vueuse.org/onStartTyping
 * @param callback
 * @param options
 */
declare function onStartTyping(callback: (event: KeyboardEvent) => void, options?: ConfigurableDocument): void;

/**
 * Shorthand for binding ref to template element.
 *
 * @see https://vueuse.org/templateRef
 * @param key
 * @param initialValue
 */
declare function templateRef<T extends HTMLElement | SVGElement | null>(key: string, initialValue?: T | null): Readonly<Ref<T>>;

/**
 * Reactive `document.activeElement`
 *
 * @see https://vueuse.org/useActiveElement
 * @param options
 */
declare function useActiveElement<T extends HTMLElement>(options?: ConfigurableWindow): vue_demi.ComputedRef<T | null | undefined>;

declare type UseAsyncQueueTask<T> = (...args: any[]) => T | Promise<T>;
interface UseAsyncQueueResult<T> {
    state: 'pending' | 'fulfilled' | 'rejected';
    data: T | null;
}
interface UseAsyncQueueReturn<T> {
    activeIndex: Ref<number>;
    result: T;
}
interface UseAsyncQueueOptions {
    /**
     * Interrupt tasks when current task fails.
     *
     * @default true
     */
    interrupt?: boolean;
    /**
     * Trigger it when the tasks fails.
     *
     */
    onError?: () => void;
    /**
     * Trigger it when the tasks ends.
     *
     */
    onFinished?: () => void;
}
/**
 * Asynchronous queue task controller.
 *
 * @see https://vueuse.org/useAsyncQueue
 * @param tasks
 * @param options
 */
declare function useAsyncQueue<T1>(tasks: [UseAsyncQueueTask<T1>], options?: UseAsyncQueueOptions): UseAsyncQueueReturn<[UseAsyncQueueResult<T1>]>;
declare function useAsyncQueue<T1, T2>(tasks: [UseAsyncQueueTask<T1>, UseAsyncQueueTask<T2>], options?: UseAsyncQueueOptions): UseAsyncQueueReturn<[UseAsyncQueueResult<T1>, UseAsyncQueueResult<T2>]>;
declare function useAsyncQueue<T1, T2, T3>(tasks: [UseAsyncQueueTask<T1>, UseAsyncQueueTask<T2>, UseAsyncQueueTask<T3>], options?: UseAsyncQueueOptions): UseAsyncQueueReturn<[UseAsyncQueueResult<T1>, UseAsyncQueueResult<T2>, UseAsyncQueueResult<T3>]>;
declare function useAsyncQueue<T1, T2, T3, T4>(tasks: [UseAsyncQueueTask<T1>, UseAsyncQueueTask<T2>, UseAsyncQueueTask<T3>, UseAsyncQueueTask<T4>], options?: UseAsyncQueueOptions): UseAsyncQueueReturn<[UseAsyncQueueResult<T1>, UseAsyncQueueResult<T2>, UseAsyncQueueResult<T3>, UseAsyncQueueResult<T4>]>;
declare function useAsyncQueue<T1, T2, T3, T4, T5>(tasks: [UseAsyncQueueTask<T1>, UseAsyncQueueTask<T2>, UseAsyncQueueTask<T3>, UseAsyncQueueTask<T4>, UseAsyncQueueTask<T5>], options?: UseAsyncQueueOptions): UseAsyncQueueReturn<[UseAsyncQueueResult<T1>, UseAsyncQueueResult<T2>, UseAsyncQueueResult<T3>, UseAsyncQueueResult<T4>, UseAsyncQueueResult<T5>]>;
declare function useAsyncQueue<T>(tasks: UseAsyncQueueTask<T>[], options?: UseAsyncQueueOptions): UseAsyncQueueReturn<UseAsyncQueueResult<T>[]>;

interface UseAsyncStateReturn<Data, Shallow extends boolean> {
    state: Shallow extends true ? Ref<Data> : Ref<UnwrapRef<Data>>;
    isReady: Ref<boolean>;
    isLoading: Ref<boolean>;
    error: Ref<unknown>;
    execute: (delay?: number, ...args: any[]) => Promise<Data>;
}
interface AsyncStateOptions<Shallow extends boolean> {
    /**
     * Delay for executing the promise. In milliseconds.
     *
     * @default 0
     */
    delay?: number;
    /**
     * Execute the promise right after the function is invoked.
     * Will apply the delay if any.
     *
     * When set to false, you will need to execute it manually.
     *
     * @default true
     */
    immediate?: boolean;
    /**
     * Callback when error is caught.
     */
    onError?: (e: unknown) => void;
    /**
     * Sets the state to initialState before executing the promise.
     *
     * This can be useful when calling the execute function more than once (for
     * example, to refresh data). When set to false, the current state remains
     * unchanged until the promise resolves.
     *
     * @default true
     */
    resetOnExecute?: boolean;
    /**
     * Use shallowRef.
     *
     * @default true
     */
    shallow?: Shallow;
}
/**
 * Reactive async state. Will not block your setup function and will trigger changes once
 * the promise is ready.
 *
 * @see https://vueuse.org/useAsyncState
 * @param promise         The promise / async function to be resolved
 * @param initialState    The initial state, used until the first evaluation finishes
 * @param options
 */
declare function useAsyncState<Data, Shallow extends boolean = true>(promise: Promise<Data> | ((...args: any[]) => Promise<Data>), initialState: Data, options?: AsyncStateOptions<Shallow>): UseAsyncStateReturn<Data, Shallow>;

interface ToDataURLOptions {
    /**
     * MIME type
     */
    type?: string | undefined;
    /**
     * Image quality of jpeg or webp
     */
    quality?: any;
}
interface UseBase64Return {
    base64: Ref<string>;
    promise: Ref<Promise<string>>;
    execute: () => Promise<string>;
}
declare function useBase64(target: MaybeRef<string>): UseBase64Return;
declare function useBase64(target: MaybeRef<Blob>): UseBase64Return;
declare function useBase64(target: MaybeRef<ArrayBuffer>): UseBase64Return;
declare function useBase64(target: MaybeRef<HTMLCanvasElement>, options?: ToDataURLOptions): UseBase64Return;
declare function useBase64(target: MaybeRef<HTMLImageElement>, options?: ToDataURLOptions): UseBase64Return;

interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
}
/**
 * Reactive Battery Status API.
 *
 * @see https://vueuse.org/useBattery
 * @param options
 */
declare function useBattery({ navigator }?: ConfigurableNavigator): {
    isSupported: boolean | undefined;
    charging: vue_demi.Ref<boolean>;
    chargingTime: vue_demi.Ref<number>;
    dischargingTime: vue_demi.Ref<number>;
    level: vue_demi.Ref<number>;
};
declare type UseBatteryReturn = ReturnType<typeof useBattery>;

/**
 * Breakpoints from Tailwind V2
 *
 * @see https://tailwindcss.com/docs/breakpoints
 */
declare const breakpointsTailwind: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
};
/**
 * Breakpoints from Bootstrap V5
 *
 * @see https://getbootstrap.com/docs/5.0/layout/breakpoints
 */
declare const breakpointsBootstrapV5: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
};
/**
 * Breakpoints from Vuetify V2
 *
 * @see https://vuetifyjs.com/en/features/breakpoints
 */
declare const breakpointsVuetify: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
};
/**
 * Breakpoints from Ant Design
 *
 * @see https://ant.design/components/layout/#breakpoint-width
 */
declare const breakpointsAntDesign: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
};
/**
 * Breakpoints from Quasar V2
 *
 * @see https://quasar.dev/style/breakpoints
 */
declare const breakpointsQuasar: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
};
/**
 * Sematic Breakpoints
 */
declare const breakpointsSematic: {
    mobileS: number;
    mobileM: number;
    mobileL: number;
    tablet: number;
    laptop: number;
    laptopL: number;
    desktop4K: number;
};

declare type Breakpoints<K extends string = string> = Record<K, number | string>;
/**
 * Reactively viewport breakpoints
 *
 * @see https://vueuse.org/useBreakpoints
 * @param options
 */
declare function useBreakpoints<K extends string>(breakpoints: Breakpoints<K>, options?: ConfigurableWindow): {
    greater: (k: K) => Ref<boolean>;
    smaller(k: K): Ref<boolean>;
    between(a: K, b: K): Ref<boolean>;
    isGreater(k: K): boolean;
    isSmaller(k: K): boolean;
    isInBetween(a: K, b: K): boolean;
} & Record<K, Ref<boolean>>;
declare type UseBreakpointsReturn<K extends string = string> = {
    greater: (k: K) => Ref<boolean>;
    smaller(k: K): Ref<boolean>;
    between(a: K, b: K): Ref<boolean>;
    isGreater(k: K): boolean;
    isSmaller(k: K): boolean;
    isInBetween(a: K, b: K): boolean;
} & Record<K, Ref<boolean>>;

interface UseBroadcastChannelOptions extends ConfigurableWindow {
    /**
     * The name of the channel.
     */
    name: string;
}
/**
 * Reactive BroadcastChannel
 *
 * @see https://vueuse.org/useBroadcastChannel
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
 * @param options
 *
 */
declare const useBroadcastChannel: (options: UseBroadcastChannelOptions) => {
    isSupported: boolean | undefined;
    channel: vue_demi.Ref<BroadcastChannel | undefined>;
    data: vue_demi.Ref<any>;
    post: (data: unknown) => void;
    close: () => void;
    error: vue_demi.Ref<{
        readonly bubbles: boolean;
        cancelBubble: boolean;
        readonly cancelable: boolean;
        readonly composed: boolean;
        readonly currentTarget: {
            addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined) => void;
            dispatchEvent: (event: Event) => boolean;
            removeEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined) => void;
        } | null;
        readonly defaultPrevented: boolean;
        readonly eventPhase: number;
        readonly isTrusted: boolean;
        returnValue: boolean;
        readonly srcElement: {
            addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined) => void;
            dispatchEvent: (event: Event) => boolean;
            removeEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined) => void;
        } | null;
        readonly target: {
            addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined) => void;
            dispatchEvent: (event: Event) => boolean;
            removeEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined) => void;
        } | null;
        readonly timeStamp: number;
        readonly type: string;
        composedPath: () => EventTarget[];
        initEvent: (type: string, bubbles?: boolean | undefined, cancelable?: boolean | undefined) => void;
        preventDefault: () => void;
        stopImmediatePropagation: () => void;
        stopPropagation: () => void;
        readonly AT_TARGET: number;
        readonly BUBBLING_PHASE: number;
        readonly CAPTURING_PHASE: number;
        readonly NONE: number;
    } | null>;
    isClosed: vue_demi.Ref<boolean>;
};
declare type UseBroadcastChannelReturn = ReturnType<typeof useBroadcastChannel>;

interface BrowserLocationState {
    trigger: string;
    state?: any;
    length?: number;
    hash?: string;
    host?: string;
    hostname?: string;
    href?: string;
    origin?: string;
    pathname?: string;
    port?: string;
    protocol?: string;
    search?: string;
}
/**
 * Reactive browser location.
 *
 * @see https://vueuse.org/useBrowserLocation
 * @param options
 */
declare function useBrowserLocation({ window }?: ConfigurableWindow): vue_demi.Ref<{
    trigger: string;
    state?: any;
    length?: number | undefined;
    hash?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    href?: string | undefined;
    origin?: string | undefined;
    pathname?: string | undefined;
    port?: string | undefined;
    protocol?: string | undefined;
    search?: string | undefined;
}>;
declare type UseBrowserLocationReturn = ReturnType<typeof useBrowserLocation>;

declare function useCached<T>(refValue: Ref<T>, comparator?: (a: T, b: T) => boolean, watchOptions?: WatchOptions): Ref<T>;

/**
 * Reactively clamp a value between two other values.
 *
 * @see https://vueuse.org/useClamp
 * @param value number
 * @param min
 * @param max
 */
declare function useClamp(value: MaybeRef<number>, min: MaybeRef<number>, max: MaybeRef<number>): Ref<number>;

interface ClipboardOptions<Source> extends ConfigurableNavigator {
    /**
     * Enabled reading for clipboard
     *
     * @default false
     */
    read?: boolean;
    /**
     * Copy source
     */
    source?: Source;
    /**
     * Milliseconds to reset state of `copied` ref
     *
     * @default 1500
     */
    copiedDuring?: number;
}
interface ClipboardReturn<Optional> {
    isSupported: boolean;
    text: ComputedRef<string>;
    copied: ComputedRef<boolean>;
    copy: Optional extends true ? (text?: string) => Promise<void> : (text: string) => Promise<void>;
}
/**
 * Reactive Clipboard API.
 *
 * @see https://vueuse.org/useClipboard
 * @param options
 */
declare function useClipboard(options?: ClipboardOptions<undefined>): ClipboardReturn<false>;
declare function useClipboard(options: ClipboardOptions<MaybeRef<string>>): ClipboardReturn<true>;

interface StorageLikeAsync {
    getItem(key: string): Awaitable<string | null>;
    setItem(key: string, value: string): Awaitable<void>;
    removeItem(key: string): Awaitable<void>;
}
interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/**
 * @expiremental The API is not finalized yet. It might not follow semver.
 */
interface SSRHandlersMap {
    getDefaultStorage: () => StorageLike | undefined;
    getDefaultStorageAsync: () => StorageLikeAsync | undefined;
    updateHTMLAttrs: (selector: string, attribute: string, value: string) => void;
}
declare function getSSRHandler<T extends keyof SSRHandlersMap>(key: T, fallback: SSRHandlersMap[T]): SSRHandlersMap[T];
declare function getSSRHandler<T extends keyof SSRHandlersMap>(key: T, fallback: SSRHandlersMap[T] | undefined): SSRHandlersMap[T] | undefined;
declare function setSSRHandler<T extends keyof SSRHandlersMap>(key: T, fn: SSRHandlersMap[T]): void;

interface Serializer<T> {
    read(raw: string): T;
    write(value: T): string;
}
interface SerializerAsync<T> {
    read(raw: string): Awaitable<T>;
    write(value: T): Awaitable<string>;
}
declare const StorageSerializers: Record<'boolean' | 'object' | 'number' | 'any' | 'string' | 'map' | 'set' | 'date', Serializer<any>>;
interface StorageOptions<T> extends ConfigurableEventFilter, ConfigurableWindow, ConfigurableFlush {
    /**
     * Watch for deep changes
     *
     * @default true
     */
    deep?: boolean;
    /**
     * Listen to storage changes, useful for multiple tabs application
     *
     * @default true
     */
    listenToStorageChanges?: boolean;
    /**
     * Write the default value to the storage when it does not exist
     *
     * @default true
     */
    writeDefaults?: boolean;
    /**
     * Custom data serialization
     */
    serializer?: Serializer<T>;
    /**
     * On error callback
     *
     * Default log error to `console.error`
     */
    onError?: (error: unknown) => void;
    /**
     * Use shallow ref as reference
     *
     * @default false
     */
    shallow?: boolean;
}
declare function useStorage(key: string, initialValue: MaybeRef<string>, storage?: StorageLike, options?: StorageOptions<string>): RemovableRef<string>;
declare function useStorage(key: string, initialValue: MaybeRef<boolean>, storage?: StorageLike, options?: StorageOptions<boolean>): RemovableRef<boolean>;
declare function useStorage(key: string, initialValue: MaybeRef<number>, storage?: StorageLike, options?: StorageOptions<number>): RemovableRef<number>;
declare function useStorage<T>(key: string, initialValue: MaybeRef<T>, storage?: StorageLike, options?: StorageOptions<T>): RemovableRef<T>;
declare function useStorage<T = unknown>(key: string, initialValue: MaybeRef<null>, storage?: StorageLike, options?: StorageOptions<T>): RemovableRef<T>;

declare type BasicColorSchema = 'light' | 'dark' | 'auto';
interface UseColorModeOptions<T extends string = BasicColorSchema> extends StorageOptions<T | BasicColorSchema> {
    /**
     * CSS Selector for the target element applying to
     *
     * @default 'html'
     */
    selector?: string;
    /**
     * HTML attribute applying the target element
     *
     * @default 'class'
     */
    attribute?: string;
    /**
     * Prefix when adding value to the attribute
     */
    modes?: Partial<Record<T | BasicColorSchema, string>>;
    /**
     * A custom handler for handle the updates.
     * When specified, the default behavior will be overridded.
     *
     * @default undefined
     */
    onChanged?: (mode: T | BasicColorSchema, defaultHandler: ((mode: T | BasicColorSchema) => void)) => void;
    /**
     * Custom storage ref
     *
     * When provided, `useStorage` will be skipped
     */
    storageRef?: Ref<T | BasicColorSchema>;
    /**
     * Key to persist the data into localStorage/sessionStorage.
     *
     * Pass `null` to disable persistence
     *
     * @default 'vueuse-color-scheme'
     */
    storageKey?: string | null;
    /**
     * Storage object, can be localStorage or sessionStorage
     *
     * @default localStorage
     */
    storage?: StorageLike;
}
/**
 * Reactive color mode with auto data persistence.
 *
 * @see https://vueuse.org/useColorMode
 * @param options
 */
declare function useColorMode<T extends string = BasicColorSchema>(options?: UseColorModeOptions<T>): vue_demi.WritableComputedRef<BasicColorSchema | T>;

declare type UseConfirmDialogRevealResult<C, D> = {
    data?: C;
    isCanceled: false;
} | {
    data?: D;
    isCanceled: true;
};
interface UseConfirmDialogReturn<RevealData, ConfirmData, CancelData> {
    /**
     * Revealing state
     */
    isRevealed: ComputedRef<boolean>;
    /**
     * Opens the dialog.
     * Create promise and return it. Triggers `onReveal` hook.
     */
    reveal: (data?: RevealData) => Promise<UseConfirmDialogRevealResult<ConfirmData, CancelData>>;
    /**
     * Confirms and closes the dialog. Triggers a callback inside `onConfirm` hook.
     * Resolves promise from `reveal()` with `data` and `isCanceled` ref with `false` value.
     * Can accept any data and to pass it to `onConfirm` hook.
     */
    confirm: (data?: ConfirmData) => void;
    /**
     * Cancels and closes the dialog. Triggers a callback inside `onCancel` hook.
     * Resolves promise from `reveal()` with `data` and `isCanceled` ref with `true` value.
     * Can accept any data and to pass it to `onCancel` hook.
     */
    cancel: (data?: CancelData) => void;
    /**
     * Event Hook to be triggered right before dialog creating.
     */
    onReveal: EventHookOn<RevealData>;
    /**
     * Event Hook to be called on `confirm()`.
     * Gets data object from `confirm` function.
     */
    onConfirm: EventHookOn<ConfirmData>;
    /**
     * Event Hook to be called on `cancel()`.
     * Gets data object from `cancel` function.
     */
    onCancel: EventHookOn<CancelData>;
}
/**
 * Hooks for creating confirm dialogs. Useful for modal windows, popups and logins.
 *
 * @see https://vueuse.org/useConfirmDialog/
 * @param revealed `boolean` `ref` that handles a modal window
 */
declare function useConfirmDialog<RevealData = any, ConfirmData = any, CancelData = any>(revealed?: Ref<boolean>): UseConfirmDialogReturn<RevealData, ConfirmData, CancelData>;

/**
 * Manipulate CSS variables.
 *
 * @see https://vueuse.org/useCssVar
 * @param prop
 * @param el
 * @param options
 */
declare function useCssVar(prop: MaybeRef<string>, target?: MaybeElementRef, { window }?: ConfigurableWindow): vue_demi.Ref<string>;

interface UseCycleListOptions<T> {
    /**
     * The initial value of the state.
     * A ref can be provided to reuse.
     */
    initialValue?: MaybeRef<T>;
    /**
     * The default index when
     */
    fallbackIndex?: number;
    /**
     * Custom function to get the index of the current value.
     */
    getIndexOf?: (value: T, list: T[]) => number;
}
/**
 * Cycle through a list of items
 *
 * @see https://vueuse.org/useCycleList
 */
declare function useCycleList<T>(list: T[], options?: UseCycleListOptions<T>): {
    state: Ref<T>;
    index: vue_demi.WritableComputedRef<number>;
    next: (n?: number) => T;
    prev: (n?: number) => T;
};

interface UseDarkOptions extends Omit<UseColorModeOptions<BasicColorSchema>, 'modes' | 'onChanged'> {
    /**
     * Value applying to the target element when isDark=true
     *
     * @default 'dark'
     */
    valueDark?: string;
    /**
     * Value applying to the target element when isDark=false
     *
     * @default ''
     */
    valueLight?: string;
    /**
     * A custom handler for handle the updates.
     * When specified, the default behavior will be overridded.
     *
     * @default undefined
     */
    onChanged?: (isDark: boolean) => void;
}
/**
 * Reactive dark mode with auto data persistence.
 *
 * @see https://vueuse.org/useDark
 * @param options
 */
declare function useDark(options?: UseDarkOptions): vue_demi.WritableComputedRef<boolean>;

interface UseRefHistoryRecord<T> {
    snapshot: T;
    timestamp: number;
}
declare type CloneFn<F, T = F> = (x: F) => T;
interface UseManualRefHistoryOptions<Raw, Serialized = Raw> {
    /**
     * Maximum number of history to be kept. Default to unlimited.
     */
    capacity?: number;
    /**
     * Clone when taking a snapshot, shortcut for dump: JSON.parse(JSON.stringify(value)).
     * Default to false
     *
     * @default false
     */
    clone?: boolean | CloneFn<Raw>;
    /**
     * Serialize data into the history
     */
    dump?: (v: Raw) => Serialized;
    /**
     * Deserialize data from the history
     */
    parse?: (v: Serialized) => Raw;
    /**
     * Deserialize data from the history
     */
    setSource?: (source: Ref<Raw>, v: Raw) => void;
}
interface UseManualRefHistoryReturn<Raw, Serialized> {
    /**
     * Bypassed tracking ref from the argument
     */
    source: Ref<Raw>;
    /**
     * An array of history records for undo, newest comes to first
     */
    history: Ref<UseRefHistoryRecord<Serialized>[]>;
    /**
    * Last history point, source can be different if paused
    */
    last: Ref<UseRefHistoryRecord<Serialized>>;
    /**
     * Same as 'history'
     */
    undoStack: Ref<UseRefHistoryRecord<Serialized>[]>;
    /**
     * Records array for redo
     */
    redoStack: Ref<UseRefHistoryRecord<Serialized>[]>;
    /**
     * A ref representing if undo is possible (non empty undoStack)
     */
    canUndo: Ref<boolean>;
    /**
     * A ref representing if redo is possible (non empty redoStack)
     */
    canRedo: Ref<boolean>;
    /**
     * Undo changes
     */
    undo(): void;
    /**
     * Redo changes
     */
    redo(): void;
    /**
     * Clear all the history
     */
    clear(): void;
    /**
     * Create new a new history record
     */
    commit(): void;
    /**
     * Reset ref's value with lastest history
     */
    reset(): void;
}
/**
 * Track the change history of a ref, also provides undo and redo functionality.
 *
 * @see https://vueuse.org/useManualRefHistory
 * @param source
 * @param options
 */
declare function useManualRefHistory<Raw, Serialized = Raw>(source: Ref<Raw>, options?: UseManualRefHistoryOptions<Raw, Serialized>): UseManualRefHistoryReturn<Raw, Serialized>;

interface UseRefHistoryOptions<Raw, Serialized = Raw> extends ConfigurableEventFilter {
    /**
     * Watch for deep changes, default to false
     *
     * When set to true, it will also create clones for values store in the history
     *
     * @default false
     */
    deep?: boolean;
    /**
     * The flush option allows for greater control over the timing of a history point, default to 'pre'
     *
     * Possible values: 'pre', 'post', 'sync'
     * It works in the same way as the flush option in watch and watch effect in vue reactivity
     *
     * @default 'pre'
     */
    flush?: 'pre' | 'post' | 'sync';
    /**
     * Maximum number of history to be kept. Default to unlimited.
     */
    capacity?: number;
    /**
     * Clone when taking a snapshot, shortcut for dump: JSON.parse(JSON.stringify(value)).
     * Default to false
     *
     * @default false
     */
    clone?: boolean | CloneFn<Raw>;
    /**
     * Serialize data into the history
     */
    dump?: (v: Raw) => Serialized;
    /**
     * Deserialize data from the history
     */
    parse?: (v: Serialized) => Raw;
}
interface UseRefHistoryReturn<Raw, Serialized> {
    /**
     * Bypassed tracking ref from the argument
     */
    source: Ref<Raw>;
    /**
     * An array of history records for undo, newest comes to first
     */
    history: Ref<UseRefHistoryRecord<Serialized>[]>;
    /**
    * Last history point, source can be different if paused
    */
    last: Ref<UseRefHistoryRecord<Serialized>>;
    /**
     * Same as 'history'
     */
    undoStack: Ref<UseRefHistoryRecord<Serialized>[]>;
    /**
     * Records array for redo
     */
    redoStack: Ref<UseRefHistoryRecord<Serialized>[]>;
    /**
     * A ref representing if the tracking is enabled
     */
    isTracking: Ref<boolean>;
    /**
     * A ref representing if undo is possible (non empty undoStack)
     */
    canUndo: Ref<boolean>;
    /**
     * A ref representing if redo is possible (non empty redoStack)
     */
    canRedo: Ref<boolean>;
    /**
     * Undo changes
     */
    undo(): void;
    /**
     * Redo changes
     */
    redo(): void;
    /**
     * Clear all the history
     */
    clear(): void;
    /**
     * Pause change tracking
     */
    pause(): void;
    /**
     * Resume change tracking
     *
     * @param [commit] if true, a history record will be create after resuming
     */
    resume(commit?: boolean): void;
    /**
     * Create new a new history record
     */
    commit(): void;
    /**
     * Reset ref's value with lastest history
     */
    reset(): void;
    /**
     * A sugar for auto pause and auto resuming within a function scope
     *
     * @param fn
     */
    batch(fn: (cancel: Fn) => void): void;
    /**
     * Clear the data and stop the watch
     */
    dispose(): void;
}
/**
 * Track the change history of a ref, also provides undo and redo functionality.
 *
 * @see https://vueuse.org/useRefHistory
 * @param source
 * @param options
 */
declare function useRefHistory<Raw, Serialized = Raw>(source: Ref<Raw>, options?: UseRefHistoryOptions<Raw, Serialized>): UseRefHistoryReturn<Raw, Serialized>;

/**
 * Shorthand for [useRefHistory](https://vueuse.org/useRefHistory) with debounce filter.
 *
 * @see https://vueuse.org/useDebouncedRefHistory
 * @param source
 * @param options
 */
declare function useDebouncedRefHistory<Raw, Serialized = Raw>(source: Ref<Raw>, options?: Omit<UseRefHistoryOptions<Raw, Serialized>, 'eventFilter'> & {
    debounce?: MaybeRef<number>;
}): UseRefHistoryReturn<Raw, Serialized>;

interface DeviceMotionOptions extends ConfigurableWindow, ConfigurableEventFilter {
}
/**
 * Reactive DeviceMotionEvent.
 *
 * @see https://vueuse.org/useDeviceMotion
 * @param options
 */
declare function useDeviceMotion(options?: DeviceMotionOptions): {
    acceleration: Ref<DeviceMotionEventAcceleration | null>;
    accelerationIncludingGravity: Ref<DeviceMotionEventAcceleration | null>;
    rotationRate: Ref<DeviceMotionEventRotationRate | null>;
    interval: Ref<number>;
};
declare type UseDeviceMotionReturn = ReturnType<typeof useDeviceMotion>;

/**
 * Reactive DeviceOrientationEvent.
 *
 * @see https://vueuse.org/useDeviceOrientation
 * @param options
 */
declare function useDeviceOrientation(options?: ConfigurableWindow): {
    isSupported: boolean;
    isAbsolute: Ref<boolean>;
    alpha: Ref<number | null>;
    beta: Ref<number | null>;
    gamma: Ref<number | null>;
};
declare type UseDeviceOrientationReturn = ReturnType<typeof useDeviceOrientation>;

/**
 * Reactively track `window.devicePixelRatio`.
 *
 * @see https://vueuse.org/useDevicePixelRatio
 * @param options
 */
declare function useDevicePixelRatio({ window, }?: ConfigurableWindow): {
    pixelRatio: vue_demi.Ref<number>;
};
declare type UseDevicePixelRatioReturn = ReturnType<typeof useDevicePixelRatio>;

interface UseDevicesListOptions extends ConfigurableNavigator {
    onUpdated?: (devices: MediaDeviceInfo[]) => void;
    /**
     * Request for permissions immediately if it's not granted,
     * otherwise label and deviceIds could be empty
     *
     * @default false
     */
    requestPermissions?: boolean;
    /**
     * Request for types of media permissions
     *
     * @default { audio: true, video: true }
     */
    constraints?: MediaStreamConstraints;
}
interface UseDevicesListReturn {
    /**
     * All devices
     */
    devices: Ref<MediaDeviceInfo[]>;
    videoInputs: ComputedRef<MediaDeviceInfo[]>;
    audioInputs: ComputedRef<MediaDeviceInfo[]>;
    audioOutputs: ComputedRef<MediaDeviceInfo[]>;
    permissionGranted: Ref<boolean>;
    ensurePermissions: () => Promise<boolean>;
    isSupported: boolean;
}
/**
 * Reactive `enumerateDevices` listing avaliable input/output devices
 *
 * @see https://vueuse.org/useDevicesList
 * @param options
 */
declare function useDevicesList(options?: UseDevicesListOptions): UseDevicesListReturn;

interface UseDisplayMediaOptions extends ConfigurableNavigator {
    /**
     * If the stream is enabled
     * @default false
     */
    enabled?: MaybeRef<boolean>;
    /**
     * If the stream video media constraints
     */
    video?: boolean | MediaTrackConstraints | undefined;
    /**
     * If the stream audio media constraints
     */
    audio?: boolean | MediaTrackConstraints | undefined;
}
/**
 * Reactive `mediaDevices.getDisplayMedia` streaming
 *
 * @see https://vueuse.org/useDisplayMedia
 * @param options
 */
declare function useDisplayMedia(options?: UseDisplayMediaOptions): {
    isSupported: boolean;
    stream: Ref<MediaStream | undefined>;
    start: () => Promise<MediaStream | undefined>;
    stop: () => void;
    enabled: Ref<boolean>;
};
declare type UseDisplayMediaReturn = ReturnType<typeof useDisplayMedia>;

/**
 * Reactively track `document.visibilityState`.
 *
 * @see https://vueuse.org/useDocumentVisibility
 * @param options
 */
declare function useDocumentVisibility({ document }?: ConfigurableDocument): Ref<Document['visibilityState']>;

interface Position {
    x: number;
    y: number;
}
interface RenderableComponent {
    /**
     * The element that the component should be rendered as
     *
     * @default 'div'
     */
    as?: Object | string;
}
declare type PointerType = 'mouse' | 'touch' | 'pen';

interface UseDraggableOptions {
    /**
     * Only start the dragging when click on the element directly
     *
     * @default false
     */
    exact?: MaybeRef<boolean>;
    /**
     * Prevent events defaults
     *
     * @default false
     */
    preventDefault?: MaybeRef<boolean>;
    /**
     * Prevent events propagation
     *
     * @default false
     */
    stopPropagation?: MaybeRef<boolean>;
    /**
     * Element to attach `pointermove` and `pointerup` events to.
     *
     * @default window
     */
    draggingElement?: MaybeRef<HTMLElement | SVGElement | Window | Document | null>;
    /**
     * Pointer types that listen to.
     *
     * @default ['mouse', 'touch', 'pen']
     */
    pointerTypes?: PointerType[];
    /**
     * Initial position of the element.
     *
     * @default { x: 0, y: 0}
     */
    initialValue?: MaybeRef<Position>;
    /**
     * Callback when the dragging starts. Return `false` to prevent dragging.
     */
    onStart?: (position: Position, event: PointerEvent) => void | false;
    /**
     * Callback during dragging.
     */
    onMove?: (position: Position, event: PointerEvent) => void;
    /**
     * Callback when dragging end.
     */
    onEnd?: (position: Position, event: PointerEvent) => void;
}
/**
 * Make elements draggable.
 *
 * @see https://vueuse.org/useDraggable
 * @param target
 * @param options
 */
declare function useDraggable(target: MaybeRef<HTMLElement | SVGElement | null>, options?: UseDraggableOptions): {
    position: Ref<Position>;
    isDragging: vue_demi.ComputedRef<boolean>;
    style: vue_demi.ComputedRef<string>;
    x: Ref<number>;
    y: Ref<number>;
};

/**
 * Reactive bounding box of an HTML element.
 *
 * @see https://vueuse.org/useElementBounding
 * @param target
 */
declare function useElementBounding(target: MaybeElementRef): {
    height: vue_demi.Ref<number>;
    bottom: vue_demi.Ref<number>;
    left: vue_demi.Ref<number>;
    right: vue_demi.Ref<number>;
    top: vue_demi.Ref<number>;
    width: vue_demi.Ref<number>;
    x: vue_demi.Ref<number>;
    y: vue_demi.Ref<number>;
    update: () => void;
};
declare type UseElementBoundingReturn = ReturnType<typeof useElementBounding>;

interface UseElementByPointOptions {
    x: MaybeRef<number>;
    y: MaybeRef<number>;
}
/**
 * Reactive element by point.
 *
 * @see https://vueuse.org/useElementByPoint
 * @param options - UseElementByPointOptions
 */
declare function useElementByPoint(options: UseElementByPointOptions): {
    isActive: vue_demi.Ref<boolean>;
    pause: _vueuse_shared.Fn;
    resume: _vueuse_shared.Fn;
    element: vue_demi.Ref<HTMLElement | null>;
};
declare type UseElementByPointReturn = ReturnType<typeof useElementByPoint>;

declare function useElementHover(el: MaybeRef<EventTarget>): Ref<boolean>;

interface ResizeObserverSize {
    readonly inlineSize: number;
    readonly blockSize: number;
}
interface ResizeObserverEntry {
    readonly target: Element;
    readonly contentRect: DOMRectReadOnly;
    readonly borderBoxSize?: ReadonlyArray<ResizeObserverSize>;
    readonly contentBoxSize?: ReadonlyArray<ResizeObserverSize>;
    readonly devicePixelContentBoxSize?: ReadonlyArray<ResizeObserverSize>;
}
declare type ResizeObserverCallback = (entries: ReadonlyArray<ResizeObserverEntry>, observer: ResizeObserver) => void;
interface ResizeObserverOptions extends ConfigurableWindow {
    /**
     * Sets which box model the observer will observe changes to. Possible values
     * are `content-box` (the default), and `border-box`.
     *
     * @default 'content-box'
     */
    box?: 'content-box' | 'border-box';
}
declare class ResizeObserver {
    constructor(callback: ResizeObserverCallback);
    disconnect(): void;
    observe(target: Element, options?: ResizeObserverOptions): void;
    unobserve(target: Element): void;
}
/**
 * Reports changes to the dimensions of an Element's content or the border-box
 *
 * @see https://vueuse.org/useResizeObserver
 * @param target
 * @param callback
 * @param options
 */
declare function useResizeObserver(target: MaybeElementRef, callback: ResizeObserverCallback, options?: ResizeObserverOptions): {
    isSupported: boolean | undefined;
    stop: () => void;
};
declare type UseResizeObserverReturn = ReturnType<typeof useResizeObserver>;

interface ElementSize {
    width: number;
    height: number;
}
/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 * @param target
 * @param callback
 * @param options
 */
declare function useElementSize(target: MaybeElementRef, initialSize?: ElementSize, options?: ResizeObserverOptions): {
    width: vue_demi.Ref<number>;
    height: vue_demi.Ref<number>;
};
declare type UseElementSizeReturn = ReturnType<typeof useElementSize>;

interface VisibilityScrollTargetOptions extends ConfigurableWindow {
    scrollTarget?: MaybeRef<Element | null | undefined>;
}
/**
 * Tracks the visibility of an element within the viewport.
 *
 * @see https://vueuse.org/useElementVisibility
 * @param element
 * @param options
 */
declare function useElementVisibility(element: MaybeRef<Element | null | undefined>, { window, scrollTarget }?: VisibilityScrollTargetOptions): vue_demi.Ref<boolean>;

declare type EventBusListener<T = unknown, P = any> = (event: T, payload?: P) => void;
declare type EventBusEvents<T, P = any> = EventBusListener<T, P>[];
interface EventBusKey<T> extends Symbol {
}
declare type EventBusIdentifier<T = unknown> = EventBusKey<T> | string | number;
interface UseEventBusReturn<T, P> {
    /**
     * Subscribe to an event. When calling emit, the listeners will execute.
     * @param listener watch listener.
     * @returns a stop function to remove the current callback.
     */
    on: (listener: EventBusListener<T, P>) => Fn;
    /**
     * Similar to `on`, but only fires once
     * @param listener watch listener.
     * @returns a stop function to remove the current callback.
     */
    once: (listener: EventBusListener<T, P>) => Fn;
    /**
     * Emit an event, the corresponding event listeners will execute.
     * @param event data sent.
     */
    emit: (event?: T, payload?: P) => void;
    /**
     * Remove the corresponding listener.
     * @param listener watch listener.
     */
    off: (listener: EventBusListener<T>) => void;
    /**
     * Clear all events
     */
    reset: () => void;
}
declare function useEventBus<T = unknown, P = any>(key: EventBusIdentifier<T>): UseEventBusReturn<T, P>;

interface InferEventTarget<Events> {
    addEventListener(event: Events, fn?: any, options?: any): any;
    removeEventListener(event: Events, fn?: any, options?: any): any;
}
declare type WindowEventName = keyof WindowEventMap;
declare type DocumentEventName = keyof DocumentEventMap;
interface GeneralEventListener<E = Event> {
    (evt: E): void;
}
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 1: Omitted Window target
 *
 * @see https://vueuse.org/useEventListener
 * @param event
 * @param listener
 * @param options
 */
declare function useEventListener<E extends keyof WindowEventMap>(event: E, listener: (this: Window, ev: WindowEventMap[E]) => any, options?: boolean | AddEventListenerOptions): Fn;
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 2: Explicitly Window target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
declare function useEventListener<E extends keyof WindowEventMap>(target: Window, event: E, listener: (this: Window, ev: WindowEventMap[E]) => any, options?: boolean | AddEventListenerOptions): Fn;
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 3: Explicitly Document target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
declare function useEventListener<E extends keyof DocumentEventMap>(target: Document, event: E, listener: (this: Document, ev: DocumentEventMap[E]) => any, options?: boolean | AddEventListenerOptions): Fn;
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 4: Custom event target with event type infer
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
declare function useEventListener<Names extends string, EventType = Event>(target: InferEventTarget<Names>, event: Names, listener: GeneralEventListener<EventType>, options?: boolean | AddEventListenerOptions): Fn;
/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 5: Custom event target fallback
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
declare function useEventListener<EventType = Event>(target: MaybeRef<EventTarget | null | undefined>, event: string, listener: GeneralEventListener<EventType>, options?: boolean | AddEventListenerOptions): Fn;

declare type UseEventSourceOptions = EventSourceInit;
/**
 * Reactive wrapper for EventSource.
 *
 * @see https://vueuse.org/useEventSource
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource EventSource
 * @param url
 * @param events
 * @param options
 */
declare function useEventSource(url: string, events?: Array<string>, options?: UseEventSourceOptions): {
    eventSource: Ref<EventSource | null>;
    event: Ref<string | null>;
    data: Ref<string | null>;
    status: Ref<"OPEN" | "CONNECTING" | "CLOSED">;
    error: Ref<Event | null>;
    close: () => void;
};
declare type UseEventListenerReturn = ReturnType<typeof useEventListener>;

interface EyeDropperOpenOptions {
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
     */
    signal?: AbortSignal;
}
interface EyeDropper {
    new (): EyeDropper;
    open: (options?: EyeDropperOpenOptions) => Promise<{
        sRGBHex: string;
    }>;
    [Symbol.toStringTag]: 'EyeDropper';
}
interface UseEyeDropperOptions {
    /**
     * Initial sRGBHex.
     *
     * @default ''
     */
    initialValue?: string;
}
/**
 * Reactive [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API)
 *
 * @see https://vueuse.org/useEyeDropper
 * @param initialValue string
 */
declare function useEyeDropper(options?: UseEyeDropperOptions): {
    isSupported: boolean;
    sRGBHex: vue_demi.Ref<string>;
    open: (openOptions?: EyeDropperOpenOptions | undefined) => Promise<{
        sRGBHex: string;
    } | undefined>;
};

interface FaviconOptions extends ConfigurableDocument {
    baseUrl?: string;
    rel?: string;
}
/**
 * Reactive favicon.
 *
 * @see https://vueuse.org/useFavicon
 * @param newIcon
 * @param options
 */
declare function useFavicon(newIcon?: MaybeRef<string | null | undefined>, options?: FaviconOptions): vue_demi.Ref<string | null | undefined>;

interface UseFetchReturn<T> {
    /**
     * Indicates if the fetch request has finished
     */
    isFinished: Ref<boolean>;
    /**
     * The statusCode of the HTTP fetch response
     */
    statusCode: Ref<number | null>;
    /**
     * The raw response of the fetch response
     */
    response: Ref<Response | null>;
    /**
     * Any fetch errors that may have occurred
     */
    error: Ref<any>;
    /**
     * The fetch response body, may either be JSON or text
     */
    data: Ref<T | null>;
    /**
     * Indicates if the request is currently being fetched.
     */
    isFetching: Ref<boolean>;
    /**
     * Indicates if the fetch request is able to be aborted
     */
    canAbort: ComputedRef<boolean>;
    /**
     * Indicates if the fetch request was aborted
     */
    aborted: Ref<boolean>;
    /**
     * Abort the fetch request
     */
    abort: Fn;
    /**
     * Manually call the fetch
     * (default not throwing error)
     */
    execute: (throwOnFailed?: boolean) => Promise<any>;
    /**
     * Fires after the fetch request has finished
     */
    onFetchResponse: EventHookOn<Response>;
    /**
     * Fires after a fetch request error
     */
    onFetchError: EventHookOn;
    /**
     * Fires after a fetch has completed
     */
    onFetchFinally: EventHookOn;
    get(): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    post(payload?: MaybeRef<unknown>, type?: string): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    put(payload?: MaybeRef<unknown>, type?: string): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    delete(payload?: MaybeRef<unknown>, type?: string): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    patch(payload?: MaybeRef<unknown>, type?: string): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    head(payload?: MaybeRef<unknown>, type?: string): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    options(payload?: MaybeRef<unknown>, type?: string): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
    json<JSON = any>(): UseFetchReturn<JSON> & PromiseLike<UseFetchReturn<JSON>>;
    text(): UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
    blob(): UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
    arrayBuffer(): UseFetchReturn<ArrayBuffer> & PromiseLike<UseFetchReturn<ArrayBuffer>>;
    formData(): UseFetchReturn<FormData> & PromiseLike<UseFetchReturn<FormData>>;
}
interface BeforeFetchContext {
    /**
     * The computed url of the current request
     */
    url: string;
    /**
     * The request options of the current request
     */
    options: RequestInit;
    /**
     * Cancels the current request
     */
    cancel: Fn;
}
interface AfterFetchContext<T = any> {
    response: Response;
    data: T | null;
}
interface OnFetchErrorContext<T = any, E = any> {
    error: E;
    data: T | null;
}
interface UseFetchOptions {
    /**
     * Fetch function
     */
    fetch?: typeof window.fetch;
    /**
     * Will automatically run fetch when `useFetch` is used
     *
     * @default true
     */
    immediate?: boolean;
    /**
     * Will automatically refetch when:
     * - the URL is changed if the URL is a ref
     * - the payload is changed if the payload is a ref
     *
     * @default false
     */
    refetch?: MaybeRef<boolean>;
    /**
     * Initial data before the request finished
     *
     * @default null
     */
    initialData?: any;
    /**
     * Timeout for abort request after number of millisecond
     * `0` means use browser default
     *
     * @default 0
     */
    timeout?: number;
    /**
     * Will run immediately before the fetch request is dispatched
     */
    beforeFetch?: (ctx: BeforeFetchContext) => Promise<Partial<BeforeFetchContext> | void> | Partial<BeforeFetchContext> | void;
    /**
     * Will run immediately after the fetch request is returned.
     * Runs after any 2xx response
     */
    afterFetch?: (ctx: AfterFetchContext) => Promise<Partial<AfterFetchContext>> | Partial<AfterFetchContext>;
    /**
     * Will run immediately after the fetch request is returned.
     * Runs after any 4xx and 5xx response
     */
    onFetchError?: (ctx: OnFetchErrorContext) => Promise<Partial<OnFetchErrorContext>> | Partial<OnFetchErrorContext>;
}
interface CreateFetchOptions {
    /**
     * The base URL that will be prefixed to all urls
     */
    baseUrl?: MaybeRef<string>;
    /**
     * Default Options for the useFetch function
     */
    options?: UseFetchOptions;
    /**
     * Options for the fetch request
     */
    fetchOptions?: RequestInit;
}
declare function createFetch(config?: CreateFetchOptions): typeof useFetch;
declare function useFetch<T>(url: MaybeRef<string>): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
declare function useFetch<T>(url: MaybeRef<string>, useFetchOptions: UseFetchOptions): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
declare function useFetch<T>(url: MaybeRef<string>, options: RequestInit, useFetchOptions?: UseFetchOptions): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;

/**
 * window.showOpenFilePicker parameters
 * @see https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker#parameters
 */
interface FileSystemAccessShowOpenFileOptions {
    multiple?: boolean;
    types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
    }>;
    excludeAcceptAllOption?: boolean;
}
/**
 * window.showSaveFilePicker parameters
 * @see https://developer.mozilla.org/en-US/docs/Web/API/window/showSaveFilePicker#parameters
 */
interface FileSystemAccessShowSaveFileOptions {
    suggestedName?: string;
    types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
    }>;
    excludeAcceptAllOption?: boolean;
}
/**
 * FileHandle
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
 */
interface FileSystemFileHandle {
    getFile: () => Promise<File>;
    createWritable: () => FileSystemWritableFileStream;
}
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream
 */
interface FileSystemWritableFileStream extends WritableStream {
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write
     */
    write: FileSystemWritableFileStreamWrite;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/seek
     */
    seek: (position: number) => Promise<void>;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/truncate
     */
    truncate: (size: number) => Promise<void>;
}
/**
 * FileStream.write
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write
 */
interface FileSystemWritableFileStreamWrite {
    (data: string | BufferSource | Blob): Promise<void>;
    (options: {
        type: 'write';
        position: number;
        data: string | BufferSource | Blob;
    }): Promise<void>;
    (options: {
        type: 'seek';
        position: number;
    }): Promise<void>;
    (options: {
        type: 'truncate';
        size: number;
    }): Promise<void>;
}
/**
 * FileStream.write
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write
 */
declare type FileSystemAccessWindow = Window & {
    showSaveFilePicker: (options: FileSystemAccessShowSaveFileOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker: (options: FileSystemAccessShowOpenFileOptions) => Promise<FileSystemFileHandle[]>;
};
declare type UseFileSystemAccessCommonOptions = Pick<FileSystemAccessShowOpenFileOptions, 'types' | 'excludeAcceptAllOption'>;
declare type UseFileSystemAccessShowSaveFileOptions = Pick<FileSystemAccessShowSaveFileOptions, 'suggestedName'>;
declare type UseFileSystemAccessOptions = ConfigurableWindow & UseFileSystemAccessCommonOptions & {
    /**
     * file data type
     */
    dataType?: MaybeRef<'Text' | 'ArrayBuffer' | 'Blob'>;
};
/**
 * Create and read and write local files.
 * @see https://vueuse.org/useElementByPoint
 * @param options
 */
declare function useFileSystemAccess(options: UseFileSystemAccessOptions & {
    dataType: 'Text';
}): UseFileSystemAccessReturn<string>;
declare function useFileSystemAccess(options: UseFileSystemAccessOptions & {
    dataType: 'ArrayBuffer';
}): UseFileSystemAccessReturn<ArrayBuffer>;
declare function useFileSystemAccess(options: UseFileSystemAccessOptions & {
    dataType: 'Blob';
}): UseFileSystemAccessReturn<Blob>;
declare function useFileSystemAccess(options: UseFileSystemAccessOptions): UseFileSystemAccessReturn<string | ArrayBuffer | Blob>;
interface UseFileSystemAccessReturn<T = string> {
    isSupported: boolean;
    data: Ref<T | undefined>;
    file: Ref<File | undefined>;
    fileName: Ref<string>;
    fileMIME: Ref<string>;
    fileSize: Ref<number>;
    fileLastModified: Ref<number>;
    open: (_options?: UseFileSystemAccessCommonOptions) => Awaitable<void>;
    create: (_options?: UseFileSystemAccessShowSaveFileOptions) => Awaitable<void>;
    save: (_options?: UseFileSystemAccessShowSaveFileOptions) => Awaitable<void>;
    saveAs: (_options?: UseFileSystemAccessShowSaveFileOptions) => Awaitable<void>;
    updateData: () => Awaitable<void>;
}

interface UseFocusOptions extends ConfigurableWindow {
    /**
     * Initial value. If set true, then focus will be set on the target
     *
     * @default false
     */
    initialValue?: boolean;
}
interface UseFocusReturn {
    /**
     * If read as true, then the element has focus. If read as false, then the element does not have focus
     * If set to true, then the element will be focused. If set to false, the element will be blurred.
     */
    focused: Ref<boolean>;
}
/**
 * Track or set the focus state of a DOM element.
 *
 * @see https://vueuse.org/useFocus
 * @param target The target element for the focus and blur events.
 * @param options
 */
declare function useFocus(target: MaybeElementRef, options?: UseFocusOptions): UseFocusReturn;

interface FocusWithinReturn {
    /**
     * True if the element or any of its descendants are focused
     */
    focused: Ref<boolean>;
}
/**
 * Track if focus is contained within the target element
 *
 * @see https://vueuse.org/useFocusWithin
 * @param target The target element to track
 * @param options Focus within options
 */
declare function useFocusWithin(target: MaybeElementRef, options?: ConfigurableWindow): FocusWithinReturn;

interface UseFpsOptions {
    /**
     * Calculate the FPS on every x frames.
     * @default 10
     */
    every?: number;
}
declare function useFps(options?: UseFpsOptions): Ref<number>;

interface UseFullscreenOptions extends ConfigurableDocument {
    /**
     * Automatically exit fullscreen when component is unmounted
     *
     * @default false
     */
    autoExit?: boolean;
}
/**
 * Reactive Fullscreen API.
 *
 * @see https://vueuse.org/useFullscreen
 * @param target
 * @param options
 */
declare function useFullscreen(target?: MaybeElementRef, options?: UseFullscreenOptions): {
    isSupported: boolean;
    isFullscreen: vue_demi.Ref<boolean>;
    enter: () => Promise<void>;
    exit: () => Promise<void>;
    toggle: () => Promise<void>;
};
declare type UseFullscreenReturn = ReturnType<typeof useFullscreen>;

interface UseGamepadOptions extends ConfigurableWindow, ConfigurableNavigator {
}
/**
 * Maps a standard standard gamepad to an Xbox 360 Controller.
 */
declare function mapGamepadToXbox360Controller(gamepad: Ref<Gamepad | undefined>): vue_demi.ComputedRef<{
    buttons: {
        a: GamepadButton;
        b: GamepadButton;
        x: GamepadButton;
        y: GamepadButton;
    };
    bumper: {
        left: GamepadButton;
        right: GamepadButton;
    };
    triggers: {
        left: GamepadButton;
        right: GamepadButton;
    };
    stick: {
        left: {
            horizontal: number;
            vertical: number;
            button: GamepadButton;
        };
        right: {
            horizontal: number;
            vertical: number;
            button: GamepadButton;
        };
    };
    dpad: {
        up: GamepadButton;
        down: GamepadButton;
        left: GamepadButton;
        right: GamepadButton;
    };
    back: GamepadButton;
    start: GamepadButton;
} | null>;
declare function useGamepad(options?: UseGamepadOptions): {
    isSupported: boolean | undefined;
    onConnected: _vueuse_shared.EventHookOn<number>;
    onDisconnected: _vueuse_shared.EventHookOn<number>;
    gamepads: Ref<{
        readonly axes: readonly number[];
        readonly buttons: readonly {
            readonly pressed: boolean;
            readonly touched: boolean;
            readonly value: number;
        }[];
        readonly connected: boolean;
        readonly hapticActuators: readonly {
            readonly type: "vibration";
        }[];
        readonly id: string;
        readonly index: number;
        readonly mapping: GamepadMappingType;
        readonly timestamp: number;
    }[]>;
    pause: _vueuse_shared.Fn;
    resume: _vueuse_shared.Fn;
    isActive: Ref<boolean>;
};

interface GeolocationOptions extends Partial<PositionOptions>, ConfigurableNavigator {
}
/**
 * Reactive Geolocation API.
 *
 * @see https://vueuse.org/useGeolocation
 * @param options
 */
declare function useGeolocation(options?: GeolocationOptions): {
    isSupported: boolean | undefined;
    coords: Ref<GeolocationCoordinates>;
    locatedAt: Ref<number | null>;
    error: Ref<{
        readonly code: number;
        readonly message: string;
        readonly PERMISSION_DENIED: number;
        readonly POSITION_UNAVAILABLE: number;
        readonly TIMEOUT: number;
    } | null>;
};
declare type UseGeolocationReturn = ReturnType<typeof useGeolocation>;

interface IdleOptions extends ConfigurableWindow, ConfigurableEventFilter {
    /**
     * Event names that listen to for detected user activity
     *
     * @default ['mousemove', 'mousedown', 'resize', 'keydown', 'touchstart', 'wheel']
     */
    events?: WindowEventName[];
    /**
     * Listen for document visibility change
     *
     * @default true
     */
    listenForVisibilityChange?: boolean;
    /**
     * Initial state of the ref idle
     *
     * @default false
     */
    initialState?: boolean;
}
interface UseIdleReturn {
    idle: Ref<boolean>;
    lastActive: Ref<number>;
}
/**
 * Tracks whether the user is being inactive.
 *
 * @see https://vueuse.org/useIdle
 * @param timeout default to 1 minute
 * @param options IdleOptions
 */
declare function useIdle(timeout?: number, options?: IdleOptions): UseIdleReturn;

interface UseScrollOptions {
    /**
     * Throttle time for scroll event, it’s disabled by default.
     *
     * @default 0
     */
    throttle?: number;
    /**
     * The check time when scrolling ends.
     * This configuration will be setting to (throttle + idle) when the `throttle` is configured.
     *
     * @default 200
     */
    idle?: number;
    /**
     * Offset arrived states by x pixels
     *
     */
    offset?: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
    /**
     * Trigger it when scrolling.
     *
     */
    onScroll?: (e: Event) => void;
    /**
     * Trigger it when scrolling ends.
     *
     */
    onStop?: (e: Event) => void;
    /**
     * Listener options for scroll event.
     *
     * @default {capture: false, passive: true}
     */
    eventListenerOptions?: boolean | AddEventListenerOptions;
}
/**
 * Reactive scroll.
 *
 * @see https://vueuse.org/useScroll
 * @param element
 * @param options
 */
declare function useScroll(element: MaybeRef<HTMLElement | SVGElement | Window | Document | null | undefined>, options?: UseScrollOptions): {
    x: vue_demi.Ref<number>;
    y: vue_demi.Ref<number>;
    isScrolling: vue_demi.Ref<boolean>;
    arrivedState: {
        left: boolean;
        right: boolean;
        top: boolean;
        bottom: boolean;
    };
    directions: {
        left: boolean;
        right: boolean;
        top: boolean;
        bottom: boolean;
    };
};
declare type UseScrollReturn = ReturnType<typeof useScroll>;

interface UseInfiniteScrollOptions extends UseScrollOptions {
    /**
     * The minimum distance between the bottom of the element and the bottom of the viewport
     *
     * @default 0
     */
    distance?: number;
}
/**
 * Reactive infinite scroll.
 *
 * @see https://vueuse.org/useInfiniteScroll
 */
declare function useInfiniteScroll(element: MaybeRef<HTMLElement | SVGElement | Window | Document | null | undefined>, onLoadMore: (state: UnwrapNestedRefs<ReturnType<typeof useScroll>>) => void, options?: UseInfiniteScrollOptions): void;

interface IntersectionObserverOptions extends ConfigurableWindow {
    /**
     * The Element or Document whose bounds are used as the bounding box when testing for intersection.
     */
    root?: MaybeElementRef;
    /**
     * A string which specifies a set of offsets to add to the root's bounding_box when calculating intersections.
     */
    rootMargin?: string;
    /**
     * Either a single number or an array of numbers between 0.0 and 1.
     */
    threshold?: number | number[];
}
/**
 * Detects that a target element's visibility.
 *
 * @see https://vueuse.org/useIntersectionObserver
 * @param target
 * @param callback
 * @param options
 */
declare function useIntersectionObserver(target: MaybeElementRef, callback: IntersectionObserverCallback, options?: IntersectionObserverOptions): {
    isSupported: boolean | undefined;
    stop: () => void;
};
declare type UseIntersectionObserverReturn = ReturnType<typeof useIntersectionObserver>;

declare type KeyModifier = 'Alt' | 'AltGraph' | 'CapsLock' | 'Control' | 'Fn' | 'FnLock' | 'Meta' | 'NumLock' | 'ScrollLock' | 'Shift' | 'Symbol' | 'SymbolLock';
interface ModifierOptions<Initial> extends ConfigurableDocument {
    /**
     * Event names that will prompt update to modifier states
     *
     * @default ['mousedown', 'mouseup', 'keydown', 'keyup']
     */
    events?: WindowEventName[];
    /**
     * Initial value of the returned ref
     *
     * @default null
     */
    initial?: Initial;
}
declare function useKeyModifier<Initial extends boolean | null>(modifier: KeyModifier, options?: ModifierOptions<Initial>): Ref<Initial extends boolean ? boolean : boolean | null>;

declare function useLocalStorage(key: string, initialValue: MaybeRef<string>, options?: StorageOptions<string>): RemovableRef<string>;
declare function useLocalStorage(key: string, initialValue: MaybeRef<boolean>, options?: StorageOptions<boolean>): RemovableRef<boolean>;
declare function useLocalStorage(key: string, initialValue: MaybeRef<number>, options?: StorageOptions<number>): RemovableRef<number>;
declare function useLocalStorage<T>(key: string, initialValue: MaybeRef<T>, options?: StorageOptions<T>): RemovableRef<T>;
declare function useLocalStorage<T = unknown>(key: string, initialValue: MaybeRef<null>, options?: StorageOptions<T>): RemovableRef<T>;

declare const DefaultMagicKeysAliasMap: Readonly<Record<string, string>>;

interface UseMagicKeysOptions<Reactive extends Boolean> {
    /**
     * Returns a reactive object instead of an object of refs
     *
     * @default false
     */
    reactive?: Reactive;
    /**
     * Target for listening events
     *
     * @default window
     */
    target?: MaybeRef<EventTarget>;
    /**
     * Alias map for keys, all the keys should be lowercase
     * { target: keycode }
     *
     * @example { ctrl: "control" }
     * @default <predefined-map>
     */
    aliasMap?: Record<string, string>;
    /**
     * Register passive listener
     *
     * @default true
     */
    passive?: boolean;
    /**
     * Custom event handler for keydown/keyup event.
     * Useful when you want to apply custom logic.
     *
     * When using `e.preventDefault()`, you will need to pass `passive: false` to useMagicKeys().
     */
    onEventFired?: (e: KeyboardEvent) => void | boolean;
}
interface MagicKeysInternal {
    /**
     * A Set of currently pressed keys,
     * Stores raw keyCodes.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
     */
    current: Set<string>;
}
declare type MagicKeys<Reactive extends Boolean> = Readonly<Omit<Reactive extends true ? Record<string, boolean> : Record<string, ComputedRef<boolean>>, keyof MagicKeysInternal> & MagicKeysInternal>;
/**
 * Reactive keys pressed state, with magical keys combination support.
 *
 * @see https://vueuse.org/useMagicKeys
 */
declare function useMagicKeys(options?: UseMagicKeysOptions<false>): MagicKeys<false>;
declare function useMagicKeys(options: UseMagicKeysOptions<true>): MagicKeys<true>;

/**
 * Many of the jsdoc definitions here are modified version of the
 * documentation from MDN(https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
 */
interface UseMediaSource {
    /**
     * The source url for the media
     */
    src: string;
    /**
     * The media codec type
     */
    type?: string;
}
interface UseMediaTextTrackSource {
    /**
     * Indicates that the track should be enabled unless the user's preferences indicate
     * that another track is more appropriate
     */
    default?: boolean;
    /**
     * How the text track is meant to be used. If omitted the default kind is subtitles.
     */
    kind: TextTrackKind;
    /**
     * A user-readable title of the text track which is used by the browser
     * when listing available text tracks.
     */
    label: string;
    /**
     * Address of the track (.vtt file). Must be a valid URL. This attribute
     * must be specified and its URL value must have the same origin as the document
     */
    src: string;
    /**
     * Language of the track text data. It must be a valid BCP 47 language tag.
     * If the kind attribute is set to subtitles, then srclang must be defined.
     */
    srcLang: string;
}
interface UseMediaControlsOptions extends ConfigurableDocument {
    /**
     * The source for the media, may either be a string, a `UseMediaSource` object, or a list
     * of `UseMediaSource` objects.
     */
    src?: MaybeRef<string | UseMediaSource | UseMediaSource[]>;
    /**
     * A list of text tracks for the media
     */
    tracks?: MaybeRef<UseMediaTextTrackSource[]>;
}
interface UseMediaTextTrack {
    /**
     * The index of the text track
     */
    id: number;
    /**
     * The text track label
     */
    label: string;
    /**
     * Language of the track text data. It must be a valid BCP 47 language tag.
     * If the kind attribute is set to subtitles, then srclang must be defined.
     */
    language: string;
    /**
     * Specifies the display mode of the text track, either `disabled`,
     * `hidden`, or `showing`
     */
    mode: TextTrackMode;
    /**
     * How the text track is meant to be used. If omitted the default kind is subtitles.
     */
    kind: TextTrackKind;
    /**
     * Indicates the track's in-band metadata track dispatch type.
     */
    inBandMetadataTrackDispatchType: string;
    /**
     * A list of text track cues
     */
    cues: TextTrackCueList | null;
    /**
     * A list of active text track cues
     */
    activeCues: TextTrackCueList | null;
}
declare function useMediaControls(target: MaybeRef<HTMLMediaElement | null | undefined>, options?: UseMediaControlsOptions): {
    currentTime: vue_demi.Ref<number>;
    duration: vue_demi.Ref<number>;
    waiting: vue_demi.Ref<boolean>;
    seeking: vue_demi.Ref<boolean>;
    ended: vue_demi.Ref<boolean>;
    stalled: vue_demi.Ref<boolean>;
    buffered: vue_demi.Ref<[number, number][]>;
    playing: vue_demi.Ref<boolean>;
    rate: vue_demi.Ref<number>;
    volume: vue_demi.Ref<number>;
    muted: vue_demi.Ref<boolean>;
    tracks: vue_demi.Ref<{
        id: number;
        label: string;
        language: string;
        mode: TextTrackMode;
        kind: TextTrackKind;
        inBandMetadataTrackDispatchType: string;
        cues: {
            [x: number]: {
                endTime: number;
                id: string;
                onenter: ((this: TextTrackCue, ev: Event) => any) | null;
                onexit: ((this: TextTrackCue, ev: Event) => any) | null;
                pauseOnExit: boolean;
                startTime: number;
                readonly track: {
                    readonly activeCues: any | null;
                    readonly cues: any | null;
                    readonly id: string;
                    readonly inBandMetadataTrackDispatchType: string;
                    readonly kind: TextTrackKind;
                    readonly label: string;
                    readonly language: string;
                    mode: TextTrackMode;
                    oncuechange: ((this: TextTrack, ev: Event) => any) | null;
                    addCue: (cue: TextTrackCue) => void;
                    removeCue: (cue: TextTrackCue) => void;
                    addEventListener: {
                        <K extends "cuechange">(type: K, listener: (this: TextTrack, ev: TextTrackEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
                    };
                    removeEventListener: {
                        <K_1 extends "cuechange">(type: K_1, listener: (this: TextTrack, ev: TextTrackEventMap[K_1]) => any, options?: boolean | EventListenerOptions | undefined): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
                    };
                    dispatchEvent: (event: Event) => boolean;
                } | null;
                addEventListener: {
                    <K_2 extends keyof TextTrackCueEventMap>(type: K_2, listener: (this: TextTrackCue, ev: TextTrackCueEventMap[K_2]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
                };
                removeEventListener: {
                    <K_3 extends keyof TextTrackCueEventMap>(type: K_3, listener: (this: TextTrackCue, ev: TextTrackCueEventMap[K_3]) => any, options?: boolean | EventListenerOptions | undefined): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
                };
                dispatchEvent: (event: Event) => boolean;
            };
            readonly length: number;
            getCueById: (id: string) => TextTrackCue | null;
            [Symbol.iterator]: () => IterableIterator<TextTrackCue>;
        } | null;
        activeCues: {
            [x: number]: {
                endTime: number;
                id: string;
                onenter: ((this: TextTrackCue, ev: Event) => any) | null;
                onexit: ((this: TextTrackCue, ev: Event) => any) | null;
                pauseOnExit: boolean;
                startTime: number;
                readonly track: {
                    readonly activeCues: any | null;
                    readonly cues: any | null;
                    readonly id: string;
                    readonly inBandMetadataTrackDispatchType: string;
                    readonly kind: TextTrackKind;
                    readonly label: string;
                    readonly language: string;
                    mode: TextTrackMode;
                    oncuechange: ((this: TextTrack, ev: Event) => any) | null;
                    addCue: (cue: TextTrackCue) => void;
                    removeCue: (cue: TextTrackCue) => void;
                    addEventListener: {
                        <K extends "cuechange">(type: K, listener: (this: TextTrack, ev: TextTrackEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
                    };
                    removeEventListener: {
                        <K_1 extends "cuechange">(type: K_1, listener: (this: TextTrack, ev: TextTrackEventMap[K_1]) => any, options?: boolean | EventListenerOptions | undefined): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
                    };
                    dispatchEvent: (event: Event) => boolean;
                } | null;
                addEventListener: {
                    <K_2 extends keyof TextTrackCueEventMap>(type: K_2, listener: (this: TextTrackCue, ev: TextTrackCueEventMap[K_2]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
                };
                removeEventListener: {
                    <K_3 extends keyof TextTrackCueEventMap>(type: K_3, listener: (this: TextTrackCue, ev: TextTrackCueEventMap[K_3]) => any, options?: boolean | EventListenerOptions | undefined): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
                };
                dispatchEvent: (event: Event) => boolean;
            };
            readonly length: number;
            getCueById: (id: string) => TextTrackCue | null;
            [Symbol.iterator]: () => IterableIterator<TextTrackCue>;
        } | null;
    }[]>;
    selectedTrack: vue_demi.Ref<number>;
    enableTrack: (track: number | UseMediaTextTrack, disableTracks?: boolean) => void;
    disableTrack: (track?: number | UseMediaTextTrack | undefined) => void;
    supportsPictureInPicture: boolean | undefined;
    togglePictureInPicture: () => Promise<unknown>;
    isPictureInPicture: vue_demi.Ref<boolean>;
    onSourceError: _vueuse_shared.EventHookOn<Event>;
};
declare type UseMediaControlsReturn = ReturnType<typeof useMediaControls>;

/**
 * Reactive Media Query.
 *
 * @see https://vueuse.org/useMediaQuery
 * @param query
 * @param options
 */
declare function useMediaQuery(query: string, options?: ConfigurableWindow): vue_demi.Ref<boolean>;

declare type CacheKey = any;
/**
 * Custom memoize cache handler
 */
interface UseMemoizeCache<Key, Value> {
    /**
     * Get value for key
     */
    get(key: Key): Value | undefined;
    /**
     * Set value for key
     */
    set(key: Key, value: Value): void;
    /**
     * Return flag if key exists
     */
    has(key: Key): boolean;
    /**
     * Delete value for key
     */
    delete(key: Key): void;
    /**
     * Clear cache
     */
    clear(): void;
}
/**
 * Memoized function
 */
interface UseMemoizedFn<Result, Args extends unknown[]> {
    /**
     * Get result from cache or call memoized function
     */
    (...args: Args): Result;
    /**
     * Call memoized function and update cache
     */
    load(...args: Args): Result;
    /**
     * Delete cache of given arguments
     */
    delete(...args: Args): void;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Generate cache key for given arguments
     */
    generateKey(...args: Args): CacheKey;
    /**
     * Cache container
     */
    cache: UseMemoizeCache<CacheKey, Result>;
}
/**
 * Reactive function result cache based on arguments
 */
declare function useMemoize<Result, Args extends unknown[]>(resolver: (...args: Args) => Result, options?: {
    getKey?: (...args: Args) => string;
    cache?: UseMemoizeCache<CacheKey, Result>;
}): UseMemoizedFn<Result, Args>;

/**
 * Performance.memory
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
 */
interface MemoryInfo {
    /**
     * The maximum size of the heap, in bytes, that is available to the context.
     */
    readonly jsHeapSizeLimit: number;
    /**
     *  The total allocated heap size, in bytes.
     */
    readonly totalJSHeapSize: number;
    /**
     * The currently active segment of JS heap, in bytes.
     */
    readonly usedJSHeapSize: number;
    [Symbol.toStringTag]: 'MemoryInfo';
}
interface MemoryOptions extends IntervalFnOptions {
    interval?: number;
}
/**
 * Reactive Memory Info.
 *
 * @see https://vueuse.org/useMemory
 * @param options
 */
declare function useMemory(options?: MemoryOptions): {
    isSupported: boolean;
    memory: vue_demi.Ref<MemoryInfo | undefined>;
};

/**
 * Mounted state in ref.
 *
 * @see https://vueuse.org/useMounted
 * @param options
 */
declare function useMounted(): vue_demi.Ref<boolean>;

interface MouseOptions extends ConfigurableWindow, ConfigurableEventFilter {
    /**
     * Mouse position based by page or client
     *
     * @default 'page'
     */
    type?: 'page' | 'client';
    /**
     * Listen to `touchmove` events
     *
     * @default true
     */
    touch?: boolean;
    /**
     * Reset to initial value when `touchend` event fired
     *
     * @default false
     */
    resetOnTouchEnds?: boolean;
    /**
     * Initial values
     */
    initialValue?: Position;
}
declare type MouseSourceType = 'mouse' | 'touch' | null;
/**
 * Reactive mouse position.
 *
 * @see https://vueuse.org/useMouse
 * @param options
 */
declare function useMouse(options?: MouseOptions): {
    x: vue_demi.Ref<number>;
    y: vue_demi.Ref<number>;
    sourceType: vue_demi.Ref<MouseSourceType>;
};
declare type UseMouseReturn = ReturnType<typeof useMouse>;

interface MouseInElementOptions extends MouseOptions {
    handleOutside?: boolean;
}
/**
 * Reactive mouse position related to an element.
 *
 * @see https://vueuse.org/useMouseInElement
 * @param target
 * @param options
 */
declare function useMouseInElement(target?: MaybeElementRef, options?: MouseInElementOptions): {
    x: vue_demi.Ref<number>;
    y: vue_demi.Ref<number>;
    sourceType: vue_demi.Ref<MouseSourceType>;
    elementX: vue_demi.Ref<number>;
    elementY: vue_demi.Ref<number>;
    elementPositionX: vue_demi.Ref<number>;
    elementPositionY: vue_demi.Ref<number>;
    elementHeight: vue_demi.Ref<number>;
    elementWidth: vue_demi.Ref<number>;
    isOutside: vue_demi.Ref<boolean>;
    stop: () => void;
};
declare type UseMouseInElementReturn = ReturnType<typeof useMouseInElement>;

interface MousePressedOptions extends ConfigurableWindow {
    /**
     * Listen to `touchstart` `touchend` events
     *
     * @default true
     */
    touch?: boolean;
    /**
     * Listen to `dragstart` `drop` and `dragend` events
     *
     * @default true
     */
    drag?: boolean;
    /**
     * Initial values
     *
     * @default false
     */
    initialValue?: boolean;
    /**
     * Element target to be capture the click
     */
    target?: MaybeElementRef;
}
/**
 * Reactive mouse position.
 *
 * @see https://vueuse.org/useMousePressed
 * @param options
 */
declare function useMousePressed(options?: MousePressedOptions): {
    pressed: vue_demi.Ref<boolean>;
    sourceType: vue_demi.Ref<MouseSourceType>;
};
declare type UseMousePressedReturn = ReturnType<typeof useMousePressed>;

interface MutationObserverOptions extends MutationObserverInit, ConfigurableWindow {
}
/**
 * Watch for changes being made to the DOM tree.
 *
 * @see https://vueuse.org/useMutationObserver
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver MutationObserver MDN
 * @param target
 * @param callback
 * @param options
 */
declare function useMutationObserver(target: MaybeElementRef, callback: MutationCallback, options?: MutationObserverOptions): {
    isSupported: boolean | undefined;
    stop: () => void;
};
declare type UseMutationObserverReturn = ReturnType<typeof useMutationObserver>;

interface NavigatorLanguageState {
    isSupported: boolean;
    /**
     *
     * ISO 639-1 standard Language Code
     *
     * @info The detected user agent language preference as a language tag
     * (which is sometimes referred to as a "locale identifier").
     * This consists of a 2-3 letter base language tag that indicates a
     * language, optionally followed by additional subtags separated by
     * '-'. The most common extra information is the country or region
     * variant (like 'en-US' or 'fr-CA').
     *
     *
     * @see https://www.iso.org/iso-639-language-codes.html
     * @see https://www.loc.gov/standards/iso639-2/php/code_list.php
     *
     */
    language: Ref<string | undefined>;
}
/**
 *
 * Reactive useNavigatorLanguage
 *
 * Detects the currently selected user language and returns a reactive language
 * @see https://vueuse.org/useNavigatorLanguage
 *
 */
declare const useNavigatorLanguage: (options?: ConfigurableWindow) => Readonly<NavigatorLanguageState>;
declare type UseNavigatorLanguageReturn = ReturnType<typeof useNavigatorLanguage>;

declare type NetworkType = 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
declare type NetworkEffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | undefined;
interface NetworkState {
    isSupported: boolean;
    /**
     * If the user is currently connected.
     */
    isOnline: Ref<boolean>;
    /**
     * The time since the user was last connected.
     */
    offlineAt: Ref<number | undefined>;
    /**
     * The download speed in Mbps.
     */
    downlink: Ref<number | undefined>;
    /**
     * The max reachable download speed in Mbps.
     */
    downlinkMax: Ref<number | undefined>;
    /**
     * The detected effective speed type.
     */
    effectiveType: Ref<NetworkEffectiveType | undefined>;
    /**
     * The estimated effective round-trip time of the current connection.
     */
    rtt: Ref<number | undefined>;
    /**
     * If the user activated data saver mode.
     */
    saveData: Ref<boolean | undefined>;
    /**
     * The detected connection/network type.
     */
    type: Ref<NetworkType>;
}
/**
 * Reactive Network status.
 *
 * @see https://vueuse.org/useNetwork
 * @param options
 */
declare function useNetwork(options?: ConfigurableWindow): Readonly<NetworkState>;

interface UseNowOptions<Controls extends boolean> {
    /**
     * Expose more controls
     *
     * @default false
     */
    controls?: Controls;
    /**
     * Update interval, or use requestAnimationFrame
     *
     * @default requestAnimationFrame
     */
    interval?: 'requestAnimationFrame' | number;
}
/**
 * Reactive current Date instance.
 *
 * @see https://vueuse.org/useNow
 * @param options
 */
declare function useNow(options?: UseNowOptions<false>): Ref<Date>;
declare function useNow(options: UseNowOptions<true>): {
    now: Ref<Date>;
} & Pausable;
declare type UseNowReturn = ReturnType<typeof useNow>;

interface UseOffsetPaginationOptions {
    /**
     * Total number of items.
     */
    total?: MaybeRef$1<number>;
    /**
     * The number of items to display per page.
     * @default 10
     */
    pageSize?: MaybeRef$1<number>;
    /**
     * The current page number.
     * @default 1
     */
    page?: MaybeRef$1<number>;
    /**
     * Callback when the `page` change.
     */
    onPageChange?: (returnValue: UnwrapNestedRefs<UseOffsetPaginationReturn>) => unknown;
    /**
     * Callback when the `pageSize` change.
     */
    onPageSizeChange?: (returnValue: UnwrapNestedRefs<UseOffsetPaginationReturn>) => unknown;
    /**
     * Callback when the `pageCount` change.
     */
    onPageCountChange?: (returnValue: UnwrapNestedRefs<UseOffsetPaginationReturn>) => unknown;
}
interface UseOffsetPaginationReturn {
    currentPage: Ref<number>;
    currentPageSize: Ref<number>;
    pageCount: ComputedRef<number>;
    isFirstPage: ComputedRef<boolean>;
    isLastPage: ComputedRef<boolean>;
    prev: () => void;
    next: () => void;
}
declare type UseOffsetPaginationInfinityPageReturn = Omit<UseOffsetPaginationReturn, 'isLastPage'>;
declare function useOffsetPagination(options: Omit<UseOffsetPaginationOptions, 'total'>): UseOffsetPaginationInfinityPageReturn;
declare function useOffsetPagination(options: UseOffsetPaginationOptions): UseOffsetPaginationReturn;

/**
 * Reactive online state.
 *
 * @see https://vueuse.org/useOnline
 * @param options
 */
declare function useOnline(options?: ConfigurableWindow): vue.Ref<boolean>;

/**
 * Reactive state to show whether mouse leaves the page.
 *
 * @see https://vueuse.org/usePageLeave
 * @param options
 */
declare function usePageLeave(options?: ConfigurableWindow): vue_demi.Ref<boolean>;

interface ParallaxOptions extends ConfigurableWindow {
    deviceOrientationTiltAdjust?: (i: number) => number;
    deviceOrientationRollAdjust?: (i: number) => number;
    mouseTiltAdjust?: (i: number) => number;
    mouseRollAdjust?: (i: number) => number;
}
interface ParallaxReturn {
    /**
     * Roll value. Scaled to `-0.5 ~ 0.5`
     */
    roll: ComputedRef<number>;
    /**
     * Tilt value. Scaled to `-0.5 ~ 0.5`
     */
    tilt: ComputedRef<number>;
    /**
     * Sensor source, can be `mouse` or `deviceOrientation`
     */
    source: ComputedRef<'deviceOrientation' | 'mouse'>;
}
/**
 * Create parallax effect easily. It uses `useDeviceOrientation` and fallback to `useMouse`
 * if orientation is not supported.
 *
 * @param target
 * @param options
 */
declare function useParallax(target: MaybeElementRef, options?: ParallaxOptions): ParallaxReturn;

declare type DescriptorNamePolyfill = 'accelerometer' | 'accessibility-events' | 'ambient-light-sensor' | 'background-sync' | 'camera' | 'clipboard-read' | 'clipboard-write' | 'gyroscope' | 'magnetometer' | 'microphone' | 'notifications' | 'payment-handler' | 'persistent-storage' | 'push' | 'speaker';
declare type GeneralPermissionDescriptor = PermissionDescriptor | {
    name: DescriptorNamePolyfill;
};
interface UsePermissionOptions<Controls extends boolean> extends ConfigurableNavigator {
    /**
     * Expose more controls
     *
     * @default false
     */
    controls?: Controls;
}
declare type UsePermissionReturn = Readonly<Ref<PermissionState | undefined>>;
interface UsePermissionReturnWithControls {
    state: UsePermissionReturn;
    isSupported: boolean;
    query: () => Promise<PermissionStatus | undefined>;
}
/**
 * Reactive Permissions API.
 *
 * @see https://vueuse.org/usePermission
 */
declare function usePermission(permissionDesc: GeneralPermissionDescriptor | GeneralPermissionDescriptor['name'], options?: UsePermissionOptions<false>): UsePermissionReturn;
declare function usePermission(permissionDesc: GeneralPermissionDescriptor | GeneralPermissionDescriptor['name'], options: UsePermissionOptions<true>): UsePermissionReturnWithControls;

interface UsePointerState extends Position {
    pressure: number;
    pointerId: number;
    tiltX: number;
    tiltY: number;
    width: number;
    height: number;
    twist: number;
    pointerType: PointerType | null;
}
interface UsePointerOptions extends ConfigurableWindow {
    /**
     * Pointer types that listen to.
     *
     * @default ['mouse', 'touch', 'pen']
     */
    pointerTypes?: PointerType[];
    /**
     * Initial values
     */
    initialValue?: MaybeRef<Partial<UsePointerState>>;
    /**
     * @default window
     */
    target?: MaybeRef<EventTarget | null | undefined> | Document | Window;
}
/**
 * Reactive pointer state.
 *
 * @see https://vueuse.org/usePointer
 * @param options
 */
declare function usePointer(options?: UsePointerOptions): {
    isInside: Ref<boolean>;
    pressure: Ref<number>;
    pointerId: Ref<number>;
    tiltX: Ref<number>;
    tiltY: Ref<number>;
    width: Ref<number>;
    height: Ref<number>;
    twist: Ref<number>;
    pointerType: Ref<PointerType | null>;
    x: Ref<number>;
    y: Ref<number>;
};

declare enum SwipeDirection {
    UP = "UP",
    RIGHT = "RIGHT",
    DOWN = "DOWN",
    LEFT = "LEFT",
    NONE = "NONE"
}
interface SwipeOptions extends ConfigurableWindow {
    /**
     * Register events as passive
     *
     * @default true
     */
    passive?: boolean;
    /**
     * @default 50
     */
    threshold?: number;
    /**
     * Callback on swipe start
     */
    onSwipeStart?: (e: TouchEvent) => void;
    /**
     * Callback on swipe moves
     */
    onSwipe?: (e: TouchEvent) => void;
    /**
     * Callback on swipe ends
     */
    onSwipeEnd?: (e: TouchEvent, direction: SwipeDirection) => void;
}
interface SwipeReturn {
    isPassiveEventSupported: boolean;
    isSwiping: Ref<boolean>;
    direction: ComputedRef<SwipeDirection | null>;
    coordsStart: Readonly<Position>;
    coordsEnd: Readonly<Position>;
    lengthX: ComputedRef<number>;
    lengthY: ComputedRef<number>;
    stop: () => void;
}
/**
 * Reactive swipe detection.
 *
 * @see https://vueuse.org/useSwipe
 * @param target
 * @param options
 */
declare function useSwipe(target: MaybeRef<EventTarget | null | undefined>, options?: SwipeOptions): SwipeReturn;

interface PointerSwipeOptions {
    /**
     * @default 50
     */
    threshold?: number;
    /**
     * Callback on swipe start
     */
    onSwipeStart?: (e: PointerEvent) => void;
    /**
     * Callback on swipe move
     */
    onSwipe?: (e: PointerEvent) => void;
    /**
     * Callback on swipe end
     */
    onSwipeEnd?: (e: PointerEvent, direction: SwipeDirection) => void;
    /**
     * Pointer types that listen to.
     *
     * @default ['mouse', 'touch', 'pen']
     */
    pointerTypes?: PointerType[];
}
interface PointerSwipeReturn {
    readonly isSwiping: Ref<boolean>;
    direction: Readonly<Ref<SwipeDirection | null>>;
    readonly posStart: Position;
    readonly posEnd: Position;
    distanceX: Readonly<Ref<number>>;
    distanceY: Readonly<Ref<number>>;
    stop: () => void;
}
/**
 * Reactive swipe detection based on PointerEvents.
 *
 * @see https://vueuse.org/usePointerSwipe
 * @param target
 * @param options
 */
declare function usePointerSwipe(target: MaybeRef<HTMLElement | null | undefined>, options?: PointerSwipeOptions): PointerSwipeReturn;

declare type ColorSchemeType = 'dark' | 'light' | 'no-preference';
/**
 * Reactive prefers-color-scheme media query.
 *
 * @see https://vueuse.org/usePreferredColorScheme
 * @param [options]
 */
declare function usePreferredColorScheme(options?: ConfigurableWindow): vue_demi.ComputedRef<ColorSchemeType>;

/**
 * Reactive dark theme preference.
 *
 * @see https://vueuse.org/usePreferredDark
 * @param [options]
 */
declare function usePreferredDark(options?: ConfigurableWindow): vue.Ref<boolean>;

/**
 * Reactive Navigator Languages.
 *
 * @see https://vueuse.org/usePreferredLanguages
 * @param options
 */
declare function usePreferredLanguages(options?: ConfigurableWindow): Ref<readonly string[]>;

interface RafFnOptions extends ConfigurableWindow {
    /**
     * Start the requestAnimationFrame loop immediately on creation
     *
     * @default true
     */
    immediate?: boolean;
}
/**
 * Call function on every `requestAnimationFrame`. With controls of pausing and resuming.
 *
 * @see https://vueuse.org/useRafFn
 * @param fn
 * @param options
 */
declare function useRafFn(fn: Fn, options?: RafFnOptions): Pausable;

/**
 * Reactive `env(safe-area-inset-*)`
 *
 * @see https://vueuse.org/useScreenSafeArea
 */
declare function useScreenSafeArea(): {
    top: vue_demi.Ref<string>;
    right: vue_demi.Ref<string>;
    bottom: vue_demi.Ref<string>;
    left: vue_demi.Ref<string>;
    update: () => void;
};

interface UseScriptTagOptions extends ConfigurableDocument {
    /**
     * Load the script immediately
     *
     * @default true
     */
    immediate?: boolean;
    /**
     * Add `async` attribute to the script tag
     *
     * @default true
     */
    async?: boolean;
    /**
     * Script type
     *
     * @default 'text/javascript'
     */
    type?: string;
    /**
     * Manual controls the timing of loading and unloading
     *
     * @default false
     */
    manual?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    noModule?: boolean;
    defer?: boolean;
    /**
     * Add custom attribute to the script tag
     *
     */
    attrs?: Record<string, string>;
}
/**
 * Async script tag loading.
 *
 * @see https://vueuse.org/useScriptTag
 * @param src
 * @param onLoaded
 * @param options
 */
declare function useScriptTag(src: MaybeRef<string>, onLoaded?: (el: HTMLScriptElement) => void, options?: UseScriptTagOptions): {
    scriptTag: vue_demi.Ref<HTMLScriptElement | null>;
    load: (waitForScriptLoad?: boolean) => Promise<HTMLScriptElement | boolean>;
    unload: () => void;
};
declare type UseScriptTagReturn = ReturnType<typeof useScriptTag>;

/**
 * Lock scrolling of the element.
 *
 * @see https://vueuse.org/useScrollLock
 * @param element
 */
declare function useScrollLock(element: MaybeRef<HTMLElement | SVGElement | Window | Document | null | undefined>, initialState?: boolean): vue_demi.WritableComputedRef<boolean>;

declare function useSessionStorage(key: string, initialValue: MaybeRef<string>, options?: StorageOptions<string>): RemovableRef<string>;
declare function useSessionStorage(key: string, initialValue: MaybeRef<boolean>, options?: StorageOptions<boolean>): RemovableRef<boolean>;
declare function useSessionStorage(key: string, initialValue: MaybeRef<number>, options?: StorageOptions<number>): RemovableRef<number>;
declare function useSessionStorage<T>(key: string, initialValue: MaybeRef<T>, options?: StorageOptions<T>): RemovableRef<T>;
declare function useSessionStorage<T = unknown>(key: string, initialValue: MaybeRef<null>, options?: StorageOptions<T>): RemovableRef<T>;

interface ShareOptions {
    title?: string;
    files?: File[];
    text?: string;
    url?: string;
}
/**
 * Reactive Web Share API.
 *
 * @see https://vueuse.org/useShare
 * @param shareOptions
 * @param options
 */
declare function useShare(shareOptions?: MaybeRef<ShareOptions>, options?: ConfigurableNavigator): {
    isSupported: boolean;
    share: (overrideOptions?: MaybeRef<ShareOptions>) => Promise<void>;
};
declare type UseShareReturn = ReturnType<typeof useShare>;

declare type SpeechRecognitionErrorCode = 'aborted' | 'audio-capture' | 'bad-grammar' | 'language-not-supported' | 'network' | 'no-speech' | 'not-allowed' | 'service-not-allowed';
interface SpeechGrammar {
    src: string;
    weight: number;
}
interface SpeechGrammarList {
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
}
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionEventMap {
    'audioend': Event;
    'audiostart': Event;
    'end': Event;
    'error': SpeechRecognitionErrorEvent;
    'nomatch': SpeechRecognitionEvent;
    'result': SpeechRecognitionEvent;
    'soundend': Event;
    'soundstart': Event;
    'speechend': Event;
    'speechstart': Event;
    'start': Event;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: SpeechGrammarList;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
    addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface SpeechRecognitionOptions extends ConfigurableWindow {
    /**
     * Controls whether continuous results are returned for each recognition, or only a single result.
     *
     * @default true
     */
    continuous?: boolean;
    /**
     * Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
     *
     * @default true
     */
    interimResults?: boolean;
    /**
     * Langauge for SpeechRecognition
     *
     * @default 'en-US'
     */
    lang?: MaybeRef<string>;
}
/**
 * Reactive SpeechRecognition.
 *
 * @see https://vueuse.org/useSpeechRecognition
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition SpeechRecognition
 * @param options
 */
declare function useSpeechRecognition(options?: SpeechRecognitionOptions): {
    isSupported: boolean;
    isListening: Ref<boolean>;
    isFinal: Ref<boolean>;
    recognition: SpeechRecognition | undefined;
    result: Ref<string>;
    error: Ref<SpeechRecognitionErrorEvent | undefined>;
    toggle: (value?: boolean) => void;
    start: () => void;
    stop: () => void;
};
declare type UseSpeechRecognitionReturn = ReturnType<typeof useSpeechRecognition>;

declare type Status = 'init' | 'play' | 'pause' | 'end';
declare type VoiceInfo = Pick<SpeechSynthesisVoice, 'lang' | 'name'>;
interface SpeechSynthesisOptions extends ConfigurableWindow {
    /**
     * Language for SpeechSynthesis
     *
     * @default 'en-US'
     */
    lang?: MaybeRef<string>;
    /**
     * Gets and sets the pitch at which the utterance will be spoken at.
     *
     * @default 1
     */
    pitch?: SpeechSynthesisUtterance['pitch'];
    /**
     * Gets and sets the speed at which the utterance will be spoken at.
     *
     * @default 1
     */
    rate?: SpeechSynthesisUtterance['rate'];
    /**
     * Gets and sets the voice that will be used to speak the utterance.
     */
    voice?: SpeechSynthesisVoice;
    /**
     * Gets and sets the volume that the utterance will be spoken at.
     *
     * @default 1
     */
    volume?: SpeechSynthesisUtterance['volume'];
}
/**
 * Reactive SpeechSynthesis.
 *
 * @see https://vueuse.org/useSpeechSynthesis
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis SpeechSynthesis
 * @param options
 */
declare function useSpeechSynthesis(text: MaybeRef<string>, options?: SpeechSynthesisOptions): {
    isSupported: boolean;
    isPlaying: Ref<boolean>;
    status: Ref<Status>;
    voiceInfo: {
        lang: string;
        name: string;
    };
    utterance: vue_demi.ComputedRef<SpeechSynthesisUtterance>;
    error: Ref<SpeechSynthesisErrorEvent | undefined>;
    toggle: (value?: boolean) => void;
    speak: () => void;
};
declare type UseSpeechSynthesisReturn = ReturnType<typeof useSpeechSynthesis>;

interface StorageAsyncOptions<T> extends Omit<StorageOptions<T>, 'serializer'> {
    /**
     * Custom data serialization
     */
    serializer?: SerializerAsync<T>;
}
declare function useStorageAsync(key: string, initialValue: MaybeRef<string>, storage?: StorageLikeAsync, options?: StorageAsyncOptions<string>): RemovableRef<string>;
declare function useStorageAsync(key: string, initialValue: MaybeRef<boolean>, storage?: StorageLikeAsync, options?: StorageAsyncOptions<boolean>): RemovableRef<boolean>;
declare function useStorageAsync(key: string, initialValue: MaybeRef<number>, storage?: StorageLikeAsync, options?: StorageAsyncOptions<number>): RemovableRef<number>;
declare function useStorageAsync<T>(key: string, initialValue: MaybeRef<T>, storage?: StorageLikeAsync, options?: StorageAsyncOptions<T>): RemovableRef<T>;
declare function useStorageAsync<T = unknown>(key: string, initialValue: MaybeRef<null>, storage?: StorageLikeAsync, options?: StorageAsyncOptions<T>): RemovableRef<T>;

interface UseStyleTagOptions extends ConfigurableDocument {
    /**
     * Media query for styles to apply
     */
    media?: string;
    /**
     * Load the style immediately
     *
     * @default true
     */
    immediate?: boolean;
    /**
     * Manual controls the timing of loading and unloading
     *
     * @default false
     */
    manual?: boolean;
    /**
     * DOM id of the style tag
     *
     * @default auto-incremented
     */
    id?: string;
}
interface UseStyleTagReturn {
    id: string;
    css: Ref<string>;
    load: () => void;
    unload: () => void;
    isLoaded: Readonly<Ref<boolean>>;
}
/**
 * Inject <style> element in head.
 *
 * Overload: Omitted id
 *
 * @see https://vueuse.org/useStyleTag
 * @param css
 * @param options
 */
declare function useStyleTag(css: MaybeRef<string>, options?: UseStyleTagOptions): UseStyleTagReturn;

declare type TemplateRefsList<T> = T[] & {
    set(el: Object | null): void;
};
declare function useTemplateRefsList<T = Element>(): Readonly<Ref<Readonly<TemplateRefsList<T>>>>;

/**
 * Reactively track user text selection based on [`Window.getSelection`](https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection).
 *
 * @see https://vueuse.org/useTextSelection
 */
declare function useTextSelection(options?: ConfigurableWindow): {
    text: vue_demi.ComputedRef<string>;
    rects: vue_demi.ComputedRef<DOMRect[]>;
    ranges: vue_demi.ComputedRef<Range[]>;
    selection: vue_demi.Ref<{
        readonly anchorNode: Node | null;
        readonly anchorOffset: number;
        readonly focusNode: Node | null;
        readonly focusOffset: number;
        readonly isCollapsed: boolean;
        readonly rangeCount: number;
        readonly type: string;
        addRange: (range: Range) => void;
        collapse: (node: Node | null, offset?: number | undefined) => void;
        collapseToEnd: () => void;
        collapseToStart: () => void;
        containsNode: (node: Node, allowPartialContainment?: boolean | undefined) => boolean;
        deleteFromDocument: () => void;
        empty: () => void;
        extend: (node: Node, offset?: number | undefined) => void;
        getRangeAt: (index: number) => Range;
        removeAllRanges: () => void;
        removeRange: (range: Range) => void;
        selectAllChildren: (node: Node) => void;
        setBaseAndExtent: (anchorNode: Node, anchorOffset: number, focusNode: Node, focusOffset: number) => void;
        setPosition: (node: Node | null, offset?: number | undefined) => void;
        toString: () => string;
    } | null>;
};
declare type UseTextSelectionReturn = ReturnType<typeof useTextSelection>;

/**
 * Shorthand for [useRefHistory](https://vueuse.org/useRefHistory) with throttled filter.
 *
 * @see https://vueuse.org/useThrottledRefHistory
 * @param source
 * @param options
 */
declare function useThrottledRefHistory<Raw, Serialized = Raw>(source: Ref<Raw>, options?: Omit<UseRefHistoryOptions<Raw, Serialized>, 'eventFilter'> & {
    throttle?: MaybeRef<number>;
    trailing?: boolean;
}): UseRefHistoryReturn<Raw, Serialized>;

declare type UseTimeAgoFormatter<T = number> = (value: T, isPast: boolean) => string;
interface UseTimeAgoMessages {
    justNow: string;
    past: string | UseTimeAgoFormatter<string>;
    future: string | UseTimeAgoFormatter<string>;
    year: string | UseTimeAgoFormatter<number>;
    month: string | UseTimeAgoFormatter<number>;
    day: string | UseTimeAgoFormatter<number>;
    week: string | UseTimeAgoFormatter<number>;
    hour: string | UseTimeAgoFormatter<number>;
    minute: string | UseTimeAgoFormatter<number>;
    second: string | UseTimeAgoFormatter<number>;
}
interface UseTimeAgoOptions<Controls extends boolean> {
    /**
     * Expose more controls
     *
     * @default false
     */
    controls?: Controls;
    /**
     * Intervals to update, set 0 to disable auto update
     *
     * @default 30_000
     */
    updateInterval?: number;
    /**
     * Maximum unit (of diff in milliseconds) to display the full date instead of relative
     *
     * @default undefined
     */
    max?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | number;
    /**
     * Formatter for full date
     */
    fullDateFormatter?: (date: Date) => string;
    /**
     * Messages for formating the string
     */
    messages?: UseTimeAgoMessages;
}
/**
 * Reactive time ago formatter.
 *
 * @see https://vueuse.org/useTimeAgo
 * @param options
 */
declare function useTimeAgo(time: MaybeRef<Date | number | string>, options?: UseTimeAgoOptions<false>): ComputedRef<string>;
declare function useTimeAgo(time: MaybeRef<Date | number | string>, options: UseTimeAgoOptions<true>): {
    timeAgo: ComputedRef<string>;
} & Pausable;

declare function useTimeoutPoll(fn: () => Awaitable<void>, interval: MaybeRef<number>, timeoutPollOptions?: TimeoutFnOptions): Pausable;

interface TimestampOptions<Controls extends boolean> {
    /**
     * Expose more controls
     *
     * @default false
     */
    controls?: Controls;
    /**
     * Offset value adding to the value
     *
     * @default 0
     */
    offset?: number;
    /**
     * Update the timestamp immediately
     *
     * @default true
     */
    immediate?: boolean;
    /**
     * Update interval, or use requestAnimationFrame
     *
     * @default requestAnimationFrame
     */
    interval?: 'requestAnimationFrame' | number;
}
/**
 * Reactive current timestamp.
 *
 * @see https://vueuse.org/useTimestamp
 * @param options
 */
declare function useTimestamp(options?: TimestampOptions<false>): Ref<number>;
declare function useTimestamp(options: TimestampOptions<true>): {
    timestamp: Ref<number>;
} & Pausable;
declare type UseTimestampReturn = ReturnType<typeof useTimestamp>;

interface UseTitleOptions extends ConfigurableDocument {
    /**
     * Observe `document.title` changes using MutationObserve
     *
     * @default false
     */
    observe?: boolean;
    /**
     * The template string to parse the title (e.g., '%s | My Website')
     *
     * @default '%s'
     */
    titleTemplate?: string;
}
/**
 * Reactive document title.
 *
 * @see https://vueuse.org/useTitle
 * @param newTitle
 * @param options
 */
declare function useTitle(newTitle?: MaybeRef<string | null | undefined>, options?: UseTitleOptions): vue_demi.Ref<string | null | undefined>;
declare type UseTitleReturn = ReturnType<typeof useTitle>;

/**
 * Cubic bezier points
 */
declare type CubicBezierPoints = [number, number, number, number];
/**
 * Easing function
 */
declare type EasingFunction = (n: number) => number;
/**
 * Transition options
 */
interface TransitionOptions {
    /**
     * Milliseconds to wait before starting transition
     */
    delay?: MaybeRef<number>;
    /**
     * Disables the transition
     */
    disabled?: MaybeRef<boolean>;
    /**
     * Transition duration in milliseconds
     */
    duration?: MaybeRef<number>;
    /**
     * Callback to execute after transition finishes
     */
    onFinished?: () => void;
    /**
     * Callback to execute after transition starts
     */
    onStarted?: () => void;
    /**
     * Easing function or cubic bezier points for calculating transition values
     */
    transition?: MaybeRef<EasingFunction | CubicBezierPoints>;
}
/**
 * Common transitions
 *
 * @see https://easings.net
 */
declare const TransitionPresets: Record<string, CubicBezierPoints | EasingFunction>;
declare function useTransition(source: Ref<number>, options?: TransitionOptions): ComputedRef<number>;
declare function useTransition<T extends MaybeRef<number>[]>(source: [...T], options?: TransitionOptions): ComputedRef<{
    [K in keyof T]: number;
}>;
declare function useTransition<T extends Ref<number[]>>(source: T, options?: TransitionOptions): ComputedRef<number[]>;

declare type UrlParams = Record<string, string[] | string>;
interface UseUrlSearchParamsOptions<T> extends ConfigurableWindow {
    /**
     * @default true
     */
    removeNullishValues?: boolean;
    /**
     * @default false
     */
    removeFalsyValues?: boolean;
    /**
     * @default {}
     */
    initialValue?: T;
}
/**
 * Reactive URLSearchParams
 *
 * @see https://vueuse.org/useUrlSearchParams
 * @param mode
 * @param options
 */
declare function useUrlSearchParams<T extends Record<string, any> = UrlParams>(mode?: 'history' | 'hash' | 'hash-params', options?: UseUrlSearchParamsOptions<T>): T;

interface UseUserMediaOptions extends ConfigurableNavigator {
    /**
     * If the stream is enabled
     * @default false
     */
    enabled?: MaybeRef<boolean>;
    /**
     * Recreate stream when the input devices id changed
     *
     * @default true
     */
    autoSwitch?: MaybeRef<boolean>;
    /**
     * The device id of video input
     *
     * When passing with `undefined` the default device will be used.
     * Pass `false` or "none" to disabled video input
     *
     * @default undefined
     */
    videoDeviceId?: MaybeRef<string | undefined | false | 'none'>;
    /**
     * The device id of audi input
     *
     * When passing with `undefined` the default device will be used.
     * Pass `false` or "none" to disabled audi input
     *
     * @default undefined
     */
    audioDeviceId?: MaybeRef<string | undefined | false | 'none'>;
}
/**
 * Reactive `mediaDevices.getUserMedia` streaming
 *
 * @see https://vueuse.org/useUserMedia
 * @param options
 */
declare function useUserMedia(options?: UseUserMediaOptions): {
    isSupported: boolean;
    stream: Ref<MediaStream | undefined>;
    start: () => Promise<MediaStream | undefined>;
    stop: () => void;
    restart: () => Promise<MediaStream | undefined>;
    videoDeviceId: Ref<string | false | undefined>;
    audioDeviceId: Ref<string | false | undefined>;
    enabled: Ref<boolean>;
    autoSwitch: Ref<boolean>;
};
declare type UseUserMediaReturn = ReturnType<typeof useUserMedia>;

interface VModelOptions {
    /**
     * When passive is set to `true`, it will use `watch` to sync with props and ref.
     * Instead of relying on the `v-model` or `.sync` to work.
     *
     * @default false
     */
    passive?: boolean;
    /**
     * When eventName is set, it's value will be used to overwrite the emit event name.
     *
     * @default undefined
     */
    eventName?: string;
    /**
     * Attempting to check for changes of properties in a deeply nested object or array.
     *
     * @default false
     */
    deep?: boolean;
}
/**
 * Shorthand for v-model binding, props + emit -> ref
 *
 * @see https://vueuse.org/useVModel
 * @param props
 * @param key (default 'value' in Vue 2 and 'modelValue' in Vue 3)
 * @param emit
 */
declare function useVModel<P extends object, K extends keyof P, Name extends string>(props: P, key?: K, emit?: (name: Name, ...args: any[]) => void, options?: VModelOptions): vue_demi.Ref<UnwrapRef<P[K]>> | vue_demi.WritableComputedRef<P[K]>;

/**
 * Shorthand for props v-model binding. Think like `toRefs(props)` but changes will also emit out.
 *
 * @see https://vueuse.org/useVModels
 * @param props
 * @param emit
 */
declare function useVModels<P extends object, Name extends string>(props: P, emit?: (name: Name, ...args: any[]) => void, options?: VModelOptions): ToRefs<P>;

interface UseVibrateOptions extends ConfigurableNavigator {
    /**
     *
     * Vibration Pattern
     *
     * An array of values describes alternating periods in which the
     * device is vibrating and not vibrating. Each value in the array
     * is converted to an integer, then interpreted alternately as
     * the number of milliseconds the device should vibrate and the
     * number of milliseconds it should not be vibrating
     *
     * @default []
     *
     */
    pattern?: MaybeRef<number[] | number>;
    /**
     * Interval to run a persistent vibration, in ms
     *
     * Pass `0` to disable
     *
     * @default 0
     *
     */
    interval?: number;
}
/**
 * Reactive vibrate
 *
 * @see https://vueuse.org/useVibrate
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 * @param options
 */
declare function useVibrate(options?: UseVibrateOptions): {
    isSupported: boolean;
    pattern: MaybeRef<number | number[]>;
    intervalControls: Pausable | undefined;
    vibrate: (pattern?: number | number[]) => void;
    stop: () => void;
};
declare type UseVibrateReturn = ReturnType<typeof useVibrate>;

interface UseVirtualListOptions {
    /**
     * item height, accept a pixel value or a function that returns the height
     *
     * @default 0
     */
    itemHeight: number | ((index: number) => number);
    /**
     * the extra buffer items outside of the view area
     *
     * @default 5
     */
    overscan?: number;
}
interface UseVirtualListItem<T> {
    data: T;
    index: number;
}
declare function useVirtualList<T = any>(list: MaybeRef<T[]>, options: UseVirtualListOptions): {
    list: Ref<UseVirtualListItem<T>[]>;
    scrollTo: (index: number) => void;
    containerProps: {
        ref: Ref<any>;
        onScroll: () => void;
        style: Partial<CSSStyleDeclaration>;
    };
    wrapperProps: vue_demi.ComputedRef<{
        style: {
            width: string;
            height: string;
            marginTop: string;
        };
    }>;
};

declare type WakeLockType = 'screen';
interface WakeLockSentinel extends EventTarget {
    type: WakeLockType;
    released: boolean;
    release: () => Promise<void>;
}
/**
 * Reactive Screen Wake Lock API.
 *
 * @see https://vueuse.org/useWakeLock
 * @param options
 */
declare const useWakeLock: (options?: ConfigurableNavigator & ConfigurableDocument) => {
    isSupported: boolean | undefined;
    isActive: vue_demi.Ref<boolean>;
    request: (type: WakeLockType) => Promise<void>;
    release: () => Promise<void>;
};
declare type UseWakeLockReturn = ReturnType<typeof useWakeLock>;

interface WebNotificationOptions {
    /**
     * The title read-only property of the Notification interface indicates
     * the title of the notification
     *
     * @default ''
     */
    title?: string;
    /**
     * The body string of the notification as specified in the constructor's
     * options parameter.
     *
     * @default ''
     */
    body?: string;
    /**
     * The text direction of the notification as specified in the constructor's
     * options parameter.
     *
     * @default ''
     */
    dir?: 'auto' | 'ltr' | 'rtl';
    /**
     * The language code of the notification as specified in the constructor's
     * options parameter.
     *
     * @default DOMString
     */
    lang?: string;
    /**
     * The ID of the notification(if any) as specified in the constructor's options
     * parameter.
     *
     * @default ''
     */
    tag?: string;
    /**
     * The URL of the image used as an icon of the notification as specified
     * in the constructor's options parameter.
     *
     * @default ''
     */
    icon?: string;
    /**
     * Specifies whether the user should be notified after a new notification
     * replaces an old one.
     *
     * @default false
     */
    renotify?: boolean;
    /**
     * A boolean value indicating that a notification should remain active until the
     * user clicks or dismisses it, rather than closing automatically.
     *
     * @default false
     */
    requireInteraction?: boolean;
    /**
     * The silent read-only property of the Notification interface specifies
     * whether the notification should be silent, i.e., no sounds or vibrations
     * should be issued, regardless of the device settings.
     *
     * @default false
     */
    silent?: boolean;
    /**
     * Specifies a vibration pattern for devices with vibration hardware to emit.
     * A vibration pattern, as specified in the Vibration API spec
     *
     * @see https://w3c.github.io/vibration/
     */
    vibrate?: number[];
}
interface UseWebNotificationOptions extends WebNotificationOptions, ConfigurableWindow {
}
/**
 * Reactive useWebNotification
 *
 * @see https://vueuse.org/useWebNotification
 * @see https://developer.mozilla.org/en-US/docs/Web/API/notification
 * @param title
 * @param defaultOptions of type WebNotificationOptions
 * @param methods of type WebNotificationMethods
 */
declare const useWebNotification: (defaultOptions?: UseWebNotificationOptions) => {
    isSupported: boolean;
    notification: Ref<Notification | null>;
    show: (overrides?: WebNotificationOptions | undefined) => Promise<Notification | undefined>;
    close: () => void;
    onClick: EventHook<any>;
    onShow: EventHook<any>;
    onError: EventHook<any>;
    onClose: EventHook<any>;
};

declare type WebSocketStatus = 'OPEN' | 'CONNECTING' | 'CLOSED';
interface WebSocketOptions {
    onConnected?: (ws: WebSocket) => void;
    onDisconnected?: (ws: WebSocket, event: CloseEvent) => void;
    onError?: (ws: WebSocket, event: Event) => void;
    onMessage?: (ws: WebSocket, event: MessageEvent) => void;
    /**
     * Send heartbeat for every x milliseconds passed
     *
     * @default false
     */
    heartbeat?: boolean | {
        /**
         * Message for the heartbeat
         *
         * @default 'ping'
         */
        message?: string;
        /**
         * Interval, in milliseconds
         *
         * @default 1000
         */
        interval?: number;
    };
    /**
     * Enabled auto reconnect
     *
     * @default false
     */
    autoReconnect?: boolean | {
        /**
         * Maximum retry times.
         *
         * Or you can pass a predicate function (which returns true if you want to retry).
         *
         * @default -1
         */
        retries?: number | (() => boolean);
        /**
         * Delay for reconnect, in milliseconds
         *
         * @default 1000
         */
        delay?: number;
        /**
         * On maximum retry times reached.
         */
        onFailed?: Fn;
    };
    /**
     * Automatically open a connection
     *
     * @default true
     */
    immediate?: boolean;
    /**
     * Automatically close a connection
     *
     * @default true
     */
    autoClose?: boolean;
    /**
     * List of one or more sub-protocol strings
     *
     * @default []
     */
    protocols?: string[];
}
interface WebSocketResult<T> {
    /**
     * Reference to the latest data received via the websocket,
     * can be watched to respond to incoming messages
     */
    data: Ref<T | null>;
    /**
     * The current websocket status, can be only one of:
     * 'OPEN', 'CONNECTING', 'CLOSED'
     */
    status: Ref<WebSocketStatus>;
    /**
     * Closes the websocket connection gracefully.
     */
    close: WebSocket['close'];
    /**
     * Reopen the websocket connection.
     * If there the current one is active, will close it before opening a new one.
     */
    open: Fn;
    /**
     * Sends data through the websocket connection.
     *
     * @param data
     * @param useBuffer when the socket is not yet open, store the data into the buffer and sent them one connected. Default to true.
     */
    send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;
    /**
     * Reference to the WebSocket instance.
     */
    ws: Ref<WebSocket | undefined>;
}
/**
 * Reactive WebSocket client.
 *
 * @see https://vueuse.org/useWebSocket
 * @param url
 */
declare function useWebSocket<Data = any>(url: string, options?: WebSocketOptions): WebSocketResult<Data>;

interface UseWebWorkerReturn<Data = any> {
    data: Ref<Data>;
    post: typeof Worker.prototype['postMessage'];
    terminate: () => void;
    worker: Ref<Worker | undefined>;
}
/**
 * Simple Web Workers registration and communication.
 *
 * @see https://vueuse.org/useWebWorker
 * @param url
 * @param workerOptions
 * @param options
 */
declare function useWebWorker<Data = any>(url: string, workerOptions?: WorkerOptions, options?: ConfigurableWindow): UseWebWorkerReturn<Data>;

declare type WebWorkerStatus = 'PENDING' | 'SUCCESS' | 'RUNNING' | 'ERROR' | 'TIMEOUT_EXPIRED';
interface WebWorkerOptions extends ConfigurableWindow {
    /**
     * Number of milliseconds before killing the worker
     *
     * @default undefined
     */
    timeout?: number;
    /**
     * An array that contains the external dependencies needed to run the worker
     */
    dependencies?: string[];
}
/**
 * Run expensive function without blocking the UI, using a simple syntax that makes use of Promise.
 *
 * @see https://vueuse.org/useWebWorkerFn
 * @param fn
 * @param options
 */
declare const useWebWorkerFn: <T extends (...fnArgs: any[]) => any>(fn: T, options?: WebWorkerOptions) => {
    workerFn: (...fnArgs: Parameters<T>) => Promise<ReturnType<T>>;
    workerStatus: vue_demi.Ref<WebWorkerStatus>;
    workerTerminate: (status?: WebWorkerStatus) => void;
};
declare type UseWebWorkerFnReturn = ReturnType<typeof useWebWorkerFn>;

/**
 * Reactively track window focus with `window.onfocus` and `window.onblur`.
 *
 * @see https://vueuse.org/useWindowFocus
 * @param options
 */
declare function useWindowFocus({ window }?: ConfigurableWindow): Ref<boolean>;

/**
 * Reactive window scroll.
 *
 * @see https://vueuse.org/useWindowScroll
 * @param options
 */
declare function useWindowScroll({ window }?: ConfigurableWindow): {
    x: vue_demi.Ref<number>;
    y: vue_demi.Ref<number>;
};
declare type UseWindowScrollReturn = ReturnType<typeof useWindowScroll>;

interface WindowSizeOptions extends ConfigurableWindow {
    initialWidth?: number;
    initialHeight?: number;
}
/**
 * Reactive window size.
 *
 * @see https://vueuse.org/useWindowSize
 * @param options
 */
declare function useWindowSize({ window, initialWidth, initialHeight }?: WindowSizeOptions): {
    width: vue_demi.Ref<number>;
    height: vue_demi.Ref<number>;
};
declare type UseWindowSizeReturn = ReturnType<typeof useWindowSize>;

export { AfterFetchContext, AsyncComputedOnCancel, AsyncComputedOptions, AsyncStateOptions, BasicColorSchema, BatteryManager, BeforeFetchContext, Breakpoints, BrowserLocationState, ClipboardOptions, ClipboardReturn, CloneFn, ColorSchemeType, ComputedInjectGetter, ComputedInjectGetterWithDefault, ComputedInjectSetter, ConfigurableDocument, ConfigurableLocation, ConfigurableNavigator, ConfigurableWindow, CreateFetchOptions, DefaultMagicKeysAliasMap, DeviceMotionOptions, DocumentEventName, ElementSize, EventBusEvents, EventBusIdentifier, EventBusKey, EventBusListener, EyeDropper, EyeDropperOpenOptions, FaviconOptions, FileSystemAccessShowOpenFileOptions, FileSystemAccessShowSaveFileOptions, FileSystemAccessWindow, FileSystemFileHandle, FocusWithinReturn, GeneralEventListener, GeneralPermissionDescriptor, GeolocationOptions, IdleOptions, IntersectionObserverOptions, KeyFilter, KeyModifier, KeyPredicate, KeyStrokeEventName, KeyStrokeOptions, MagicKeys, MagicKeysInternal, MaybeElement, MaybeElementRef, MemoryInfo, MemoryOptions, ModifierOptions, MouseInElementOptions, MouseOptions, MousePressedOptions, MouseSourceType, MutationObserverOptions, NavigatorLanguageState, NetworkEffectiveType, NetworkState, NetworkType, OnClickOutsideOptions, OnFetchErrorContext, OnLongPressOptions, ParallaxOptions, ParallaxReturn, PointerSwipeOptions, PointerSwipeReturn, PointerType, Position, RafFnOptions, RenderableComponent, ResizeObserverCallback, ResizeObserverEntry, ResizeObserverOptions, ResizeObserverSize, SSRHandlersMap, Serializer, SerializerAsync, ShareOptions, SpeechRecognitionOptions, SpeechSynthesisOptions, Status, StorageAsyncOptions, StorageLike, StorageLikeAsync, StorageOptions, StorageSerializers, SwipeDirection, SwipeOptions, SwipeReturn, TemplateRefsList, TimestampOptions, ToDataURLOptions, TransitionOptions, TransitionPresets, UnRefElementReturn, UnrefFn, UrlParams, UseAsyncQueueOptions, UseAsyncQueueResult, UseAsyncQueueReturn, UseAsyncQueueTask, UseAsyncStateReturn, UseBase64Return, UseBatteryReturn, UseBreakpointsReturn, UseBroadcastChannelOptions, UseBroadcastChannelReturn, UseBrowserLocationReturn, UseColorModeOptions, UseConfirmDialogReturn, UseConfirmDialogRevealResult, UseCycleListOptions, UseDarkOptions, UseDeviceMotionReturn, UseDeviceOrientationReturn, UseDevicePixelRatioReturn, UseDevicesListOptions, UseDevicesListReturn, UseDisplayMediaOptions, UseDisplayMediaReturn, UseDraggableOptions, UseElementBoundingReturn, UseElementByPointOptions, UseElementByPointReturn, UseElementSizeReturn, UseEventBusReturn, UseEventListenerReturn, UseEventSourceOptions, UseEyeDropperOptions, UseFetchOptions, UseFetchReturn, UseFileSystemAccessCommonOptions, UseFileSystemAccessOptions, UseFileSystemAccessReturn, UseFileSystemAccessShowSaveFileOptions, UseFocusOptions, UseFocusReturn, UseFpsOptions, UseFullscreenOptions, UseFullscreenReturn, UseGamepadOptions, UseGeolocationReturn, UseIdleReturn, UseInfiniteScrollOptions, UseIntersectionObserverReturn, UseMagicKeysOptions, UseManualRefHistoryOptions, UseManualRefHistoryReturn, UseMediaControlsReturn, UseMediaSource, UseMediaTextTrack, UseMediaTextTrackSource, UseMemoizeCache, UseMemoizedFn, UseMouseInElementReturn, UseMousePressedReturn, UseMouseReturn, UseMutationObserverReturn, UseNavigatorLanguageReturn, UseNowOptions, UseNowReturn, UseOffsetPaginationInfinityPageReturn, UseOffsetPaginationOptions, UseOffsetPaginationReturn, UsePermissionOptions, UsePermissionReturn, UsePermissionReturnWithControls, UsePointerOptions, UsePointerState, UseRefHistoryOptions, UseRefHistoryRecord, UseRefHistoryReturn, UseResizeObserverReturn, UseScriptTagOptions, UseScriptTagReturn, UseScrollOptions, UseScrollReturn, UseShareReturn, UseSpeechRecognitionReturn, UseSpeechSynthesisReturn, UseStyleTagOptions, UseStyleTagReturn, UseTextSelectionReturn, UseTimeAgoFormatter, UseTimeAgoMessages, UseTimeAgoOptions, UseTimestampReturn, UseTitleOptions, UseTitleReturn, UseUrlSearchParamsOptions, UseUserMediaOptions, UseUserMediaReturn, UseVibrateOptions, UseVibrateReturn, UseVirtualListItem, UseVirtualListOptions, UseWakeLockReturn, UseWebNotificationOptions, UseWebWorkerFnReturn, UseWebWorkerReturn, UseWindowScrollReturn, UseWindowSizeReturn, VModelOptions, VisibilityScrollTargetOptions, VoiceInfo, VueInstance, WakeLockSentinel, WebNotificationOptions, WebSocketOptions, WebSocketResult, WebSocketStatus, WebWorkerOptions, WebWorkerStatus, WindowEventName, WindowSizeOptions, WritableComputedInjectOptions, WritableComputedInjectOptionsWithDefault, computedAsync as asyncComputed, breakpointsAntDesign, breakpointsBootstrapV5, breakpointsQuasar, breakpointsSematic, breakpointsTailwind, breakpointsVuetify, computedAsync, computedInject, createFetch, createUnrefFn, defaultDocument, defaultLocation, defaultNavigator, defaultWindow, getSSRHandler, mapGamepadToXbox360Controller, onClickOutside, onKeyDown, onKeyPressed, onKeyStroke, onKeyUp, onLongPress, onStartTyping, setSSRHandler, templateRef, unrefElement, useActiveElement, useAsyncQueue, useAsyncState, useBase64, useBattery, useBreakpoints, useBroadcastChannel, useBrowserLocation, useCached, useClamp, useClipboard, useColorMode, useConfirmDialog, useCssVar, useCycleList, useDark, useDebouncedRefHistory, useDeviceMotion, useDeviceOrientation, useDevicePixelRatio, useDevicesList, useDisplayMedia, useDocumentVisibility, useDraggable, useElementBounding, useElementByPoint, useElementHover, useElementSize, useElementVisibility, useEventBus, useEventListener, useEventSource, useEyeDropper, useFavicon, useFetch, useFileSystemAccess, useFocus, useFocusWithin, useFps, useFullscreen, useGamepad, useGeolocation, useIdle, useInfiniteScroll, useIntersectionObserver, useKeyModifier, useLocalStorage, useMagicKeys, useManualRefHistory, useMediaControls, useMediaQuery, useMemoize, useMemory, useMounted, useMouse, useMouseInElement, useMousePressed, useMutationObserver, useNavigatorLanguage, useNetwork, useNow, useOffsetPagination, useOnline, usePageLeave, useParallax, usePermission, usePointer, usePointerSwipe, usePreferredColorScheme, usePreferredDark, usePreferredLanguages, useRafFn, useRefHistory, useResizeObserver, useScreenSafeArea, useScriptTag, useScroll, useScrollLock, useSessionStorage, useShare, useSpeechRecognition, useSpeechSynthesis, useStorage, useStorageAsync, useStyleTag, useSwipe, useTemplateRefsList, useTextSelection, useThrottledRefHistory, useTimeAgo, useTimeoutPoll, useTimestamp, useTitle, useTransition, useUrlSearchParams, useUserMedia, useVModel, useVModels, useVibrate, useVirtualList, useWakeLock, useWebNotification, useWebSocket, useWebWorker, useWebWorkerFn, useWindowFocus, useWindowScroll, useWindowSize };
