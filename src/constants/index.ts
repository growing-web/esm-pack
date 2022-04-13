import path from 'path'

export const POLYFILL_VERSION = '1.0.0'

export const POLYFILL_PACKAGE_NAME = '__internal__/polyfills'

export const POLYFILL_DIR = `${POLYFILL_PACKAGE_NAME}/${POLYFILL_VERSION}`

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

export const EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.js',
  '.jsx',
  '.json',
]

export const FILE_EXTENSIONS = [
  ...EXTENSIONS,
  '.less',
  '.scss',
  '.css',
  '.sass',
  '.postcss',
]

export const FILE_EXCLUDES = [
  'tsconfig.json',
  'eslint',
  'tslint',
  'prettier',
  'stylelint',
  'commitlint',
  'turbo',
  'main.package',
  'vetur',
  '.vscode',
  'build-info.json',
  'build.json',
  '.env',
  '.gitignore',
  '.npmrc',
  '.yarnrc',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'nginx.conf',
]

export const FILES_IGNORE = [
  '**/src/**',
  '**/bin/**',
  '**/node_modules/**',
  '**/vetur/**',
  '**/.vscode/**',
  '**/.idea/**',
  '**/.changeset/**',
  '**/.husky/**',
  '**/.esmd/**',
  '**/pnpm-lock.yaml/**',
  '**/yarn.lock/**',
  '**/package-lock.json/**',
  '**/.prettierrc.json/**',
  '**/.commitlintrc.json/**',
  '**/ecosystem.config.js/**',
  '**/scripts/**',
  '**/.dockerignore/**',
  '**/Dockerfile/**',
  '**/.eslintrc.json/**',
  '**/nest-cli.json/**',
  '**/nodemon.json/**',
  '**/nginx.conf/**',
  '**/yarnrc/**',
  '**/.gitignore/**',
  '**/.markdownlint.yml/**',
]

export const PACKAGE_JSON = 'package.json'

export const MAIN_FIELDS = [
  'browser:module',
  'module',
  'browser',
  'main:esnext',
  'jsnext:main',
  'main',
]
