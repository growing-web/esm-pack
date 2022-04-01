import path from 'path'

export const POLYFILL_VERSION = '1.0.0'

export const POLYFILL_PACKAGE_NAME = '__internal__/polyfills'

export const POLYFILL_DIR = `${POLYFILL_PACKAGE_NAME}@${POLYFILL_VERSION}`

export const POLYFILL_PREFIX = `/esm/${POLYFILL_DIR}`

export const APP_VERSION = 1

const etcDir = '.esmd'
const cacheDir = 'cache'
const storageDir = 'storage'

export const ETC_DIR = path.join(process.cwd(), etcDir)

export const CACHE_DIR = path.join(ETC_DIR, cacheDir)

export const BUILDS_DIR = path.join(
  ETC_DIR,
  storageDir,
  'builds',
  `v${APP_VERSION}`,
)
