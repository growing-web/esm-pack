export const APP_NAME = 'esmpack'

export const EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.js',
  '.jsx',
  '.json',
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

export const FILE_EXTENSIONS = [
  ...EXTENSIONS,
  '.less',
  '.scss',
  '.css',
  '.sass',
  '.postcss',
]

export const NATIVE_MODULES = [
  'process',
  'module',
  'stream',
  'stream/promises',
  'events',
  'url',
  'fs',
  'fs/promises',
  'path',
  'zlib',
  'worker_threads',
  'util',
  'os',
  'net',
  'http',
  'https',
  'buffer',
  'domain',
  'assert',
  'assert/promises',
  'dns',
  'dns/promises',
  'readline',
  'readline/promises',
  'timers',
  'timers/promises',
  'async_hooks',
  'child_process',
  'cluster',
  'console',
  'constants',
  'dgram',
  'crypto',
  'perf_hooks',
  'punycode',
  'querystring',
  'repl',
  'string_decoder',
  'tls',
  'trace_events',
  'tty',
  'v8',
  'vm',
  'wasi',
]
