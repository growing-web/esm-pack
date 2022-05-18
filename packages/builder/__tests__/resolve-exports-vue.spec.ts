import { describe, test, expect } from 'vitest'
import { resolveExports } from '../src/resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve exports test. ', () => {
  test('@vueuse/core 8.2.3', async () => {
    const root = path.join(__dirname, './fixtures/packages/vueuse/core/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        import: './index.mjs',
        require: './index.cjs',
        types: './index.d.ts',
      },
      './*': './*',
      './metadata': {
        import: './metadata.mjs',
        require: './metadata.cjs',
        types: './metadata.d.ts',
      },
      './index.cjs!cjs': './index.cjs',
      './metadata.cjs!cjs': './metadata.cjs',
    })
  })

  test('@vueuse/shared 8.2.3', async () => {
    const root = path.join(__dirname, './fixtures/packages/vueuse/shared')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        import: './index.mjs',
        require: './index.cjs',
        types: './index.d.ts',
      },
      './*': './*',
      './index.cjs!cjs': './index.cjs',
    })
  })

  test('vue-demi 0.12.5', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue-demi/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        require: './lib/index.cjs',
        import: './lib/index.mjs',
        browser: './lib/index.mjs',
      },
      './*': './*',
      './lib/index.cjs!cjs': './lib/index.cjs',
    })
  })

  test('vue reactivity 3.2.31', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue3/reactivity')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        module: './dist/reactivity.esm-bundler.js',
        default: {
          development: './dev.index.js',
          default: './index.js',
        },
      },
      './index.js': {
        development: './dev.index.js',
        default: './index.js',
      },
      './dist/reactivity.esm-bundler.js': './dist/reactivity.esm-bundler.js',
      './index.js!cjs': './index.js',
      './index': './index.js',

      './dist/reactivity.esm-browser.js': './dist/reactivity.esm-browser.js',
      './dist/reactivity.esm-browser': './dist/reactivity.esm-browser.js',
      './dist/reactivity.esm-bundler': './dist/reactivity.esm-bundler.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',
    })
  })

  test('vue runtime-core 3.2', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue3/runtime-core')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        module: './dist/runtime-core.esm-bundler.js',
        default: {
          development: './dev.index.js',
          default: './index.js',
        },
      },
      './index.js': {
        development: './dev.index.js',
        default: './index.js',
      },
      './dist/runtime-core.esm-bundler.js':
        './dist/runtime-core.esm-bundler.js',
      './index.js!cjs': './index.js',
      './index': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',

      './dist/runtime-core.esm-bundler': './dist/runtime-core.esm-bundler.js',
    })
  })

  test('vue runtime-dom 3.2', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue3/runtime-dom')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        module: './dist/runtime-dom.esm-bundler.js',
        default: {
          development: './dev.index.js',
          default: './index.js',
        },
      },
      './index.js': {
        development: './dev.index.js',
        default: './index.js',
      },
      './dist/runtime-dom.esm-bundler.js': './dist/runtime-dom.esm-bundler.js',
      './index.js!cjs': './index.js',
      './index': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',

      './dist/runtime-dom.esm-browser': './dist/runtime-dom.esm-browser.js',
      './dist/runtime-dom.esm-browser.js': './dist/runtime-dom.esm-browser.js',
      './dist/runtime-dom.esm-bundler': './dist/runtime-dom.esm-bundler.js',
    })
  })

  test('vue shared 3.2', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue3/shared')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        module: './dist/shared.esm-bundler.js',
        default: {
          development: './dev.index.js',
          default: './index.js',
        },
      },
      './index.js': {
        development: './dev.index.js',
        default: './index.js',
      },
      './dist/shared.esm-bundler.js': './dist/shared.esm-bundler.js',
      './index.js!cjs': './index.js',
      './index': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',

      './dist/shared.esm-bundler': './dist/shared.esm-bundler.js',
    })
  })
  test('vue 3.2', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue3/vue')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        import: {
          //   node: {
          //     development: './index.mjs',
          //     default: './index.mjs',
          //   },
          node: './index.mjs',
          default: './dist/vue.runtime.esm-bundler.js',
        },
        require: {
          development: './dev.index.js',
          default: './index.js',
        },
        types: './dist/vue.d.ts',
      },
      './server-renderer': {
        import: './server-renderer/index.mjs',
        require: './server-renderer/index.js',
      },
      './compiler-sfc': {
        import: './compiler-sfc/index.mjs',
        require: './compiler-sfc/index.js',
      },
      './dist/*': './dist/*',
      './package.json': './package.json.js',
      './macros': './macros.d.ts',
      './macros-global': './macros-global.d.ts',
      './ref-macros': './ref-macros.d.ts',
      './dist/vue.cjs.js': './dist/vue.cjs.js',
      './dist/vue.cjs.prod.js': './dist/vue.cjs.prod.js',
      './dist/vue.d.ts': './dist/vue.d.ts',
      './dist/vue.esm-browser.js': './dist/vue.esm-browser.js',
      './dist/vue.esm-browser.prod.js': './dist/vue.esm-browser.prod.js',
      './dist/vue.esm-bundler.js': './dist/vue.esm-bundler.js',
      './dist/vue.global.js': './dist/vue.global.js',
      './dist/vue.global.prod.js': './dist/vue.global.prod.js',
      './dist/vue.runtime.esm-browser.js': './dist/vue.runtime.esm-browser.js',
      './dist/vue.runtime.esm-browser.prod.js':
        './dist/vue.runtime.esm-browser.prod.js',
      './dist/vue.runtime.esm-bundler.js': './dist/vue.runtime.esm-bundler.js',
      './dist/vue.runtime.global.js': './dist/vue.runtime.global.js',
      './dist/vue.runtime.global.js!cjs': './dist/vue.runtime.global.js',
      './dist/vue.runtime.global.prod.js': './dist/vue.runtime.global.prod.js',
      './dist/vue.runtime.global.prod.js!cjs':
        './dist/vue.runtime.global.prod.js',
      './index.js!cjs': './index.js',
      './dev.index.js!cjs': './dev.index.js',
      './server-renderer/index.js!cjs': './server-renderer/index.js',
      './compiler-sfc/index.js!cjs': './compiler-sfc/index.js',
      './package.json.js!cjs': './package.json.js',
      './dist/vue.cjs.js!cjs': './dist/vue.cjs.js',
      './dist/vue.cjs.prod.js!cjs': './dist/vue.cjs.prod.js',
      './dist/vue.global.js!cjs': './dist/vue.global.js',
      './dist/vue.global.prod.js!cjs': './dist/vue.global.prod.js',
    })
  })

  test('vue-router 4', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue-router')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        module: './dist/vue-router.esm-bundler.js',
        default: './dist/vue-router.cjs.js',
      },
      './package.json': './package.json.js',
      './dist/vue-router.esm-bundler.js': './dist/vue-router.esm-bundler.js',
      './dist/vue-router.esm-bundler': './dist/vue-router.esm-bundler.js',
      './dist/vue-router.cjs.js': './dist/vue-router.cjs.js',
      './dist/vue-router.cjs.js!cjs': './dist/vue-router.cjs.js',
      './package.json.js!cjs': './package.json.js',

      './dist/vue-router.esm-browser': './dist/vue-router.esm-browser.js',
      './dist/vue-router.esm-browser.js': './dist/vue-router.esm-browser.js',
    })
  })

  test('vue 2.6.14', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue2/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        module: './dist/vue.runtime.esm.js',
        default: {
          development: './dist/dev.vue.runtime.common.js',
          default: './dist/vue.runtime.common.js',
        },
      },
      './dist/vue.js': './dist/vue.js',
      './dist/vue': './dist/vue.js',
      './dist/vue.esm.js': './dist/vue.esm.js',
      './dist/vue.esm': './dist/vue.esm.js',
      './package.json': './package.json.js',
      './dist/vue.runtime.esm.js': './dist/vue.runtime.esm.js',
      './dist/vue.esm.browser': './dist/vue.esm.browser.js',
      './dist/vue.runtime.esm': './dist/vue.runtime.esm.js',
      './dist/vue.runtime.common.js!cjs': './dist/vue.runtime.common.js',
      './dist/vue.js!cjs': './dist/vue.js',
      './dist/vue.common.js!cjs': './dist/vue.common.js',
      './package.json.js!cjs': './package.json.js',
      './dist/vue.common': {
        default: './dist/vue.common.js',
        development: './dist/dev.vue.common.js',
      },
      './dist/vue.common.js': {
        default: './dist/vue.common.js',
        development: './dist/dev.vue.common.js',
      },
      './dist/vue.runtime.common': './dist/vue.runtime.common.js',
      // diff

      './dist/vue.esm.browser.js': './dist/vue.esm.browser.js',

      './dist/vue.runtime.js': './dist/vue.runtime.js',
      './dist/vue.runtime.js!cjs': './dist/vue.runtime.js',

      './dist/vue.runtime': './dist/vue.runtime.js',

      './dist/vue.runtime.common.js': {
        default: './dist/vue.runtime.common.js',
        development: './dist/dev.vue.runtime.common.js',
      },
    })
  })

  test('@vue/devtools-api 6.1.4', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue-devtools-api/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        browser: './lib/esm/index.js',
        module: './lib/esm/index.js',
        default: './lib/cjs/index.js',
      },
      './lib/cjs/index.js': './lib/cjs/index.js',
      './lib/esm/index.js': './lib/esm/index.js',
      './lib/cjs/index.js!cjs': './lib/cjs/index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',
    })
  })
})
