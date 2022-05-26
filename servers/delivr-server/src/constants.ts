import path from 'path'

export const APP_VERSION = 1

export const BUCKET_NPM_DIR = 'npm' + `/v${APP_VERSION}`

export const ETC_DIR = path.join(process.cwd(), '.esmd')

export const CACHE_DIR = path.join(ETC_DIR, 'cache')

export const BUILDS_DIR = path.join(ETC_DIR, 'builds', `v${APP_VERSION}`)

export const EXTENSIONS = [
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
]

export const PACKAGE_JSON = 'package.json'

export const FULL_VERSION_RE = /^\d+\.\d+\.\d+[a-zA-Z0-9.+\-_]*$/
