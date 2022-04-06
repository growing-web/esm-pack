import { describe, test, expect } from 'vitest'
import { resolveExports } from '../resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve exports test.', () => {
  test('@vueuse/core 8.x', async () => {
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

  test('@vueuse/shared 8.x', async () => {
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

  test('vue-demi 0.12.x', async () => {
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

  test('object-assign 4', async () => {
    const root = path.join(__dirname, './fixtures/packages/object-assign/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': './index.js',
      './index.js!cjs': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',
    })
  })

  test('vue reactivity 3.2', async () => {
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
      './dev.index.js!cjs': './dev.index.js',
      './index.js!cjs': './index.js',

      './dist/reactivity.cjs.prod.js': './dist/reactivity.cjs.prod.js',
      './dist/reactivity.cjs.prod.js!cjs': './dist/reactivity.cjs.prod.js',
      './dist/reactivity.esm-browser.js': './dist/reactivity.esm-browser.js',
      './dist/reactivity.esm-browser.prod.js':
        './dist/reactivity.esm-browser.prod.js',
      './dist/reactivity.global.js': './dist/reactivity.global.js',
      './dist/reactivity.global.js!cjs': './dist/reactivity.global.js',
      './dist/reactivity.global.prod.js': './dist/reactivity.global.prod.js',
      './dist/reactivity.global.prod.js!cjs':
        './dist/reactivity.global.prod.js',
      './index': './index.js',
      './dist/reactivity.cjs.prod': './dist/reactivity.cjs.prod.js',
      './dist/reactivity.esm-browser': './dist/reactivity.esm-browser.js',
      './dist/reactivity.esm-bundler': './dist/reactivity.esm-bundler.js',
      './dist/reactivity.global': './dist/reactivity.global.js',
      './dist/reactivity.global.prod': './dist/reactivity.global.prod.js',
      './dist/reactivity.esm-browser.prod':
        './dist/reactivity.esm-browser.prod.js',
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
      './dev.index.js!cjs': './dev.index.js',
      './index.js!cjs': './index.js',
      './index': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',

      './dist/runtime-core.cjs.prod': './dist/runtime-core.cjs.prod.js',
      './dist/runtime-core.cjs.prod.js': './dist/runtime-core.cjs.prod.js',
      './dist/runtime-core.cjs.prod.js!cjs': './dist/runtime-core.cjs.prod.js',
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
      './dev.index.js!cjs': './dev.index.js',
      './index.js!cjs': './index.js',
      './index': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',

      './dist/runtime-dom.cjs.prod': './dist/runtime-dom.cjs.prod.js',
      './dist/runtime-dom.cjs.prod.js': './dist/runtime-dom.cjs.prod.js',
      './dist/runtime-dom.cjs.prod.js!cjs': './dist/runtime-dom.cjs.prod.js',
      './dist/runtime-dom.esm-browser': './dist/runtime-dom.esm-browser.js',
      './dist/runtime-dom.esm-browser.js': './dist/runtime-dom.esm-browser.js',
      './dist/runtime-dom.esm-browser.prod':
        './dist/runtime-dom.esm-browser.prod.js',
      './dist/runtime-dom.esm-browser.prod.js':
        './dist/runtime-dom.esm-browser.prod.js',
      './dist/runtime-dom.esm-bundler': './dist/runtime-dom.esm-bundler.js',
      './dist/runtime-dom.global': './dist/runtime-dom.global.js',
      './dist/runtime-dom.global.js': './dist/runtime-dom.global.js',
      './dist/runtime-dom.global.js!cjs': './dist/runtime-dom.global.js',
      './dist/runtime-dom.global.prod': './dist/runtime-dom.global.prod.js',
      './dist/runtime-dom.global.prod.js': './dist/runtime-dom.global.prod.js',
      './dist/runtime-dom.global.prod.js!cjs':
        './dist/runtime-dom.global.prod.js',
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
      './dev.index.js!cjs': './dev.index.js',
      './index.js!cjs': './index.js',
      './index': './index.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',

      './dist/shared.cjs.prod': './dist/shared.cjs.prod.js',
      './dist/shared.cjs.prod.js': './dist/shared.cjs.prod.js',
      './dist/shared.cjs.prod.js!cjs': './dist/shared.cjs.prod.js',
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

      './dist/vue-router.cjs.prod': './dist/vue-router.cjs.prod.js',
      './dist/vue-router.cjs.prod.js': './dist/vue-router.cjs.prod.js',
      './dist/vue-router.cjs.prod.js!cjs': './dist/vue-router.cjs.prod.js',
      './dist/vue-router.esm-browser': './dist/vue-router.esm-browser.js',
      './dist/vue-router.esm-browser.js': './dist/vue-router.esm-browser.js',
      './dist/vue-router.global': './dist/vue-router.global.js',
      './dist/vue-router.global.js': './dist/vue-router.global.js',
      './dist/vue-router.global.js!cjs': './dist/vue-router.global.js',
      './dist/vue-router.global.prod': './dist/vue-router.global.prod.js',
      './dist/vue-router.global.prod.js': './dist/vue-router.global.prod.js',
      './dist/vue-router.global.prod.js!cjs':
        './dist/vue-router.global.prod.js',
    })
  })

  test('pinia 2.0.13', async () => {
    const root = path.join(__dirname, './fixtures/packages/pinia')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        browser: './dist/pinia.esm-browser.js',
        node: {
          import: {
            production: './dist/pinia.prod.cjs',
            development: './dist/pinia.mjs',
            default: './dist/pinia.mjs',
          },
          require: {
            production: './dist/pinia.prod.cjs',
            development: './dist/pinia.cjs',
            default: './index.js',
          },
        },
        import: './dist/pinia.mjs',
      },
      './package.json': './package.json.js',
      './dist/*': './dist/*',
      './dist/pinia.cjs': './dist/pinia.cjs',
      './dist/pinia.prod.cjs': './dist/pinia.prod.cjs',
      './dist/pinia.esm-browser.js': './dist/pinia.esm-browser.js',
      './dist/pinia.iife.js': './dist/pinia.iife.js',
      './dist/pinia.iife.prod.js': './dist/pinia.iife.prod.js',
      './dist/pinia.mjs': './dist/pinia.mjs',
      './dist/pinia.d.ts': './dist/pinia.d.ts',
      //   './dist/pinia.prod.cjs!cjs': './dist/pinia.prod.cjs',
      //   './dist/pinia.cjs!cjs': './dist/pinia.cjs',
      './package.json.js!cjs': './package.json.js',
      './dist/pinia.iife.js!cjs': './dist/pinia.iife.js',
      './dist/pinia.iife.prod.js!cjs': './dist/pinia.iife.prod.js',
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
      './dist/vue.common.js': './dist/vue.common.js',
      './dist/vue.common': './dist/vue.common.js',
      './package.json': './package.json.js',
      './dist/vue.min.js': './dist/vue.min.js',
      './dist/vue.min': './dist/vue.min.js',
      './dist/vue.runtime.esm.js': './dist/vue.runtime.esm.js',
      './dist/vue.esm.browser': './dist/vue.esm.browser.js',
      './dist/vue.runtime.esm': './dist/vue.runtime.esm.js',
      './dist/vue.runtime.common.js!cjs': './dist/vue.runtime.common.js',
      './dist/dev.vue.runtime.common.js!cjs':
        './dist/dev.vue.runtime.common.js',
      './dist/vue.js!cjs': './dist/vue.js',
      './dist/vue.common.js!cjs': './dist/vue.common.js',
      './package.json.js!cjs': './package.json.js',
      './dist/vue.min.js!cjs': './dist/vue.min.js',

      // diff
      './dist/vue.common.dev': './dist/vue.common.dev.js',
      './dist/vue.common.dev.js': './dist/vue.common.dev.js',
      './dist/vue.common.dev.js!cjs': './dist/vue.common.dev.js',

      './dist/vue.common.prod': './dist/vue.common.prod.js',
      './dist/vue.common.prod.js': './dist/vue.common.prod.js',
      './dist/vue.common.prod.js!cjs': './dist/vue.common.prod.js',

      './dist/vue.esm.browser.js': './dist/vue.esm.browser.js',
      './dist/vue.esm.browser.min': './dist/vue.esm.browser.min.js',
      './dist/vue.esm.browser.min.js': './dist/vue.esm.browser.min.js',

      './dist/vue.runtime.common.prod': './dist/vue.runtime.common.prod.js',
      './dist/vue.runtime.common.prod.js': './dist/vue.runtime.common.prod.js',
      './dist/vue.runtime.common.prod.js!cjs':
        './dist/vue.runtime.common.prod.js',
      './dist/vue.runtime.js': './dist/vue.runtime.js',
      './dist/vue.runtime.js!cjs': './dist/vue.runtime.js',

      './dist/vue.runtime': './dist/vue.runtime.js',
      './dist/vue.runtime.common': './dist/vue.runtime.common.js',
      './dist/vue.runtime.common.dev': './dist/vue.runtime.common.dev.js',
      './dist/vue.runtime.common.dev.js': './dist/vue.runtime.common.dev.js',
      './dist/vue.runtime.common.dev.js!cjs':
        './dist/vue.runtime.common.dev.js',
      './dist/vue.runtime.common.js': {
        default: './dist/vue.runtime.common.js',
        development: './dist/dev.vue.runtime.common.js',
      },
      './dist/vue.runtime.min': './dist/vue.runtime.min.js',
      './dist/vue.runtime.min.js': './dist/vue.runtime.min.js',
      './dist/vue.runtime.min.js!cjs': './dist/vue.runtime.min.js',
    })
  })

  test('axios 0.26.1', async () => {
    const root = path.join(__dirname, './fixtures/packages/axios')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': './index.js',
      './lib/adapters/http': {
        browser: './lib/adapters/xhr.js',
        default: './lib/adapters/http.js',
      },
      './lib/helpers/buildURL': './lib/helpers/buildURL.js',
      './index': './index.js',
      './lib/core/settle': './lib/core/settle.js',
      './lib/utils': './lib/utils.js',
      './lib/core/createError': './lib/core/createError.js',
      './dist/axios': './dist/axios.js',
      './lib/core/buildFullPath': './lib/core/buildFullPath.js',
      //   './lib/defaults': './lib/defaults/index.js',
      './lib/core/mergeConfig': './lib/core/mergeConfig.js',
      './lib/helpers/isAbsoluteURL': './lib/helpers/isAbsoluteURL.js',
      './lib/helpers/combineURLs': './lib/helpers/combineURLs.js',
      './lib/adapters/xhr': './lib/adapters/xhr.js',
      './lib/helpers/isURLSameOrigin': './lib/helpers/isURLSameOrigin.js',
      './lib/helpers/cookies': './lib/helpers/cookies.js',
      './dist/axios.min': './dist/axios.min.js',
      './lib/core/enhanceError': './lib/core/enhanceError.js',
      './lib/core/dispatchRequest': './lib/core/dispatchRequest.js',
      './lib/adapters/http.js': {
        browser: './lib/adapters/xhr.js',
        default: './lib/adapters/http.js',
      },
      './dist/axios.min.js': './dist/axios.min.js',
      './package.json': './package.json.js',
      './lib/utils.js': './lib/utils.js',
      './dist/axios.js': './dist/axios.js',
      './lib/core/mergeConfig.js': './lib/core/mergeConfig.js',
      './lib/helpers/buildURL.js': './lib/helpers/buildURL.js',
      './index.js': './index.js',
      './lib/core/settle.js': './lib/core/settle.js',
      './lib/adapters/xhr.js': './lib/adapters/xhr.js',
      './lib/core/createError.js': './lib/core/createError.js',
      './lib/core/buildFullPath.js': './lib/core/buildFullPath.js',
      './lib/defaults/index.js': './lib/defaults/index.js',
      './lib/helpers/isAbsoluteURL.js': './lib/helpers/isAbsoluteURL.js',
      './lib/helpers/combineURLs.js': './lib/helpers/combineURLs.js',
      './lib/helpers/isURLSameOrigin.js': './lib/helpers/isURLSameOrigin.js',
      './lib/helpers/cookies.js': './lib/helpers/cookies.js',
      './lib/core/enhanceError.js': './lib/core/enhanceError.js',
      './lib/core/dispatchRequest.js': './lib/core/dispatchRequest.js',
      './lib/adapters/xhr.js!cjs': './lib/adapters/xhr.js',
      './lib/adapters/http.js!cjs': './lib/adapters/http.js',
      './index.js!cjs': './index.js',
      './lib/helpers/buildURL.js!cjs': './lib/helpers/buildURL.js',
      './lib/core/settle.js!cjs': './lib/core/settle.js',
      './lib/utils.js!cjs': './lib/utils.js',
      './lib/core/createError.js!cjs': './lib/core/createError.js',
      './dist/axios.js!cjs': './dist/axios.js',
      './lib/core/buildFullPath.js!cjs': './lib/core/buildFullPath.js',
      './lib/defaults/index.js!cjs': './lib/defaults/index.js',
      './lib/core/mergeConfig.js!cjs': './lib/core/mergeConfig.js',
      './lib/helpers/isAbsoluteURL.js!cjs': './lib/helpers/isAbsoluteURL.js',
      './lib/helpers/combineURLs.js!cjs': './lib/helpers/combineURLs.js',
      './lib/helpers/isURLSameOrigin.js!cjs':
        './lib/helpers/isURLSameOrigin.js',
      './lib/helpers/cookies.js!cjs': './lib/helpers/cookies.js',
      './dist/axios.min.js!cjs': './dist/axios.min.js',
      './lib/core/enhanceError.js!cjs': './lib/core/enhanceError.js',
      './lib/core/dispatchRequest.js!cjs': './lib/core/dispatchRequest.js',
      './package.json.js!cjs': './package.json.js',
      // diff
      './lib/axios': './lib/axios.js',
      './lib/axios.js': './lib/axios.js',
      './lib/axios.js!cjs': './lib/axios.js',
      './lib/cancel/Cancel': './lib/cancel/Cancel.js',
      './lib/cancel/Cancel.js': './lib/cancel/Cancel.js',
      './lib/cancel/Cancel.js!cjs': './lib/cancel/Cancel.js',
      './lib/cancel/CancelToken': './lib/cancel/CancelToken.js',
      './lib/cancel/CancelToken.js': './lib/cancel/CancelToken.js',
      './lib/cancel/CancelToken.js!cjs': './lib/cancel/CancelToken.js',
      './lib/cancel/isCancel': './lib/cancel/isCancel.js',
      './lib/cancel/isCancel.js': './lib/cancel/isCancel.js',
      './lib/cancel/isCancel.js!cjs': './lib/cancel/isCancel.js',
      './lib/core/Axios': './lib/core/Axios.js',
      './lib/core/Axios.js': './lib/core/Axios.js',
      './lib/core/Axios.js!cjs': './lib/core/Axios.js',
      './lib/core/InterceptorManager': './lib/core/InterceptorManager.js',
      './lib/core/InterceptorManager.js': './lib/core/InterceptorManager.js',
      './lib/core/InterceptorManager.js!cjs':
        './lib/core/InterceptorManager.js',
      './lib/core/transformData': './lib/core/transformData.js',
      './lib/core/transformData.js': './lib/core/transformData.js',
      './lib/core/transformData.js!cjs': './lib/core/transformData.js',
      './lib/defaults/index': './lib/defaults/index.js',
      './lib/defaults/transitional': './lib/defaults/transitional.js',
      './lib/defaults/transitional.js': './lib/defaults/transitional.js',
      './lib/defaults/transitional.js!cjs': './lib/defaults/transitional.js',
      './lib/env/data': './lib/env/data.js',
      './lib/env/data.js': './lib/env/data.js',
      './lib/env/data.js!cjs': './lib/env/data.js',
      './lib/helpers/bind': './lib/helpers/bind.js',
      './lib/helpers/bind.js': './lib/helpers/bind.js',
      './lib/helpers/bind.js!cjs': './lib/helpers/bind.js',
      './lib/helpers/deprecatedMethod': './lib/helpers/deprecatedMethod.js',
      './lib/helpers/deprecatedMethod.js': './lib/helpers/deprecatedMethod.js',
      './lib/helpers/deprecatedMethod.js!cjs':
        './lib/helpers/deprecatedMethod.js',
      './lib/helpers/isAxiosError': './lib/helpers/isAxiosError.js',
      './lib/helpers/isAxiosError.js': './lib/helpers/isAxiosError.js',
      './lib/helpers/isAxiosError.js!cjs': './lib/helpers/isAxiosError.js',
      './lib/helpers/normalizeHeaderName':
        './lib/helpers/normalizeHeaderName.js',
      './lib/helpers/normalizeHeaderName.js':
        './lib/helpers/normalizeHeaderName.js',
      './lib/helpers/normalizeHeaderName.js!cjs':
        './lib/helpers/normalizeHeaderName.js',
      './lib/helpers/parseHeaders': './lib/helpers/parseHeaders.js',
      './lib/helpers/parseHeaders.js': './lib/helpers/parseHeaders.js',
      './lib/helpers/parseHeaders.js!cjs': './lib/helpers/parseHeaders.js',
      './lib/helpers/spread': './lib/helpers/spread.js',
      './lib/helpers/spread.js': './lib/helpers/spread.js',
      './lib/helpers/spread.js!cjs': './lib/helpers/spread.js',
      './lib/helpers/toFormData': './lib/helpers/toFormData.js',
      './lib/helpers/toFormData.js': './lib/helpers/toFormData.js',
      './lib/helpers/toFormData.js!cjs': './lib/helpers/toFormData.js',
      './lib/helpers/validator.js!cjs': './lib/helpers/validator.js',
      './lib/helpers/validator': './lib/helpers/validator.js',
      './lib/helpers/validator.js': './lib/helpers/validator.js',
    })
  })

  test('react 16', async () => {
    const root = path.join(__dirname, './fixtures/packages/react/16')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        development: './dev.index.js',
        default: './index.js',
      },
      './package.json': './package.json.js',
      //   './package': './package.json.js',
      './umd/react.production.min.js': './umd/react.production.min.js',
      './cjs/react.production.min.js': './cjs/react.production.min.js',
      './umd/react.development.js': './umd/react.development.js',
      './cjs/react.development.js': './cjs/react.development.js',
      './cjs/react.production.min': './cjs/react.production.min.js',
      './index.js!cjs': './index.js',
      './dev.index.js!cjs': './dev.index.js',
      './package.json.js!cjs': './package.json.js',
      './umd/react.production.min.js!cjs': './umd/react.production.min.js',
      './cjs/react.production.min.js!cjs': './cjs/react.production.min.js',
      './umd/react.development.js!cjs': './umd/react.development.js',
      './cjs/react.development.js!cjs': './cjs/react.development.js',
      //   './cjs/dev.react.development.js!cjs': './cjs/dev.react.development.js',

      // diff
      './umd/react.profiling.min': './umd/react.profiling.min.js',
      './umd/react.profiling.min.js': './umd/react.profiling.min.js',
      './umd/react.profiling.min.js!cjs': './umd/react.profiling.min.js',
      './umd/react.development': './umd/react.development.js',
      './umd/react.production.min': './umd/react.production.min.js',
      './jsx-dev-runtime': './jsx-dev-runtime.js',
      './jsx-dev-runtime.js': './jsx-dev-runtime.js',
      './jsx-dev-runtime.js!cjs': './jsx-dev-runtime.js',
      './jsx-runtime': './jsx-runtime.js',
      './jsx-runtime.js': './jsx-runtime.js',
      './jsx-runtime.js!cjs': './jsx-runtime.js',
      './index': './index.js',
      './index.js': './index.js',
      './cjs/react-jsx-dev-runtime.development':
        './cjs/react-jsx-dev-runtime.development.js',
      './cjs/react-jsx-dev-runtime.development.js':
        './cjs/react-jsx-dev-runtime.development.js',
      './cjs/react-jsx-dev-runtime.development.js!cjs':
        './cjs/react-jsx-dev-runtime.development.js',
      './cjs/react-jsx-dev-runtime.production.min':
        './cjs/react-jsx-dev-runtime.production.min.js',
      './cjs/react-jsx-dev-runtime.production.min.js':
        './cjs/react-jsx-dev-runtime.production.min.js',
      './cjs/react-jsx-dev-runtime.production.min.js!cjs':
        './cjs/react-jsx-dev-runtime.production.min.js',
      './cjs/react-jsx-runtime.development':
        './cjs/react-jsx-runtime.development.js',
      './cjs/react-jsx-runtime.development.js':
        './cjs/react-jsx-runtime.development.js',
      './cjs/react-jsx-runtime.development.js!cjs':
        './cjs/react-jsx-runtime.development.js',
      './cjs/react-jsx-runtime.production.min':
        './cjs/react-jsx-runtime.production.min.js',
      './cjs/react-jsx-runtime.production.min.js':
        './cjs/react-jsx-runtime.production.min.js',
      './cjs/react-jsx-runtime.production.min.js!cjs':
        './cjs/react-jsx-runtime.production.min.js',
      './cjs/react.development': './cjs/react.development.js',
    })
  })
  test('react 17', async () => {
    const root = path.join(__dirname, './fixtures/packages/react/17')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        development: './dev.index.js',
        default: './index.js',
      },
      './package.json': './package.json.js',
      //   './package': './package.json.js',
      './umd/react.production.min.js': './umd/react.production.min.js',
      './cjs/react.production.min.js': './cjs/react.production.min.js',
      './umd/react.development.js': './umd/react.development.js',
      './cjs/react.development.js': './cjs/react.development.js',
      './cjs/react.production.min': './cjs/react.production.min.js',
      './index.js!cjs': './index.js',
      './dev.index.js!cjs': './dev.index.js',
      './package.json.js!cjs': './package.json.js',
      './umd/react.production.min.js!cjs': './umd/react.production.min.js',
      './cjs/react.production.min.js!cjs': './cjs/react.production.min.js',
      './umd/react.development.js!cjs': './umd/react.development.js',
      './cjs/react.development.js!cjs': './cjs/react.development.js',
      //   './cjs/dev.react.development.js!cjs': './cjs/dev.react.development.js',

      // diff
      './umd/react.profiling.min': './umd/react.profiling.min.js',
      './umd/react.profiling.min.js': './umd/react.profiling.min.js',
      './umd/react.profiling.min.js!cjs': './umd/react.profiling.min.js',
      './umd/react.development': './umd/react.development.js',
      './umd/react.production.min': './umd/react.production.min.js',
      './jsx-dev-runtime': './jsx-dev-runtime.js',
      './jsx-dev-runtime.js': './jsx-dev-runtime.js',
      './jsx-dev-runtime.js!cjs': './jsx-dev-runtime.js',
      './jsx-runtime': './jsx-runtime.js',
      './jsx-runtime.js': './jsx-runtime.js',
      './jsx-runtime.js!cjs': './jsx-runtime.js',
      './index': './index.js',
      './index.js': './index.js',
      './cjs/react-jsx-dev-runtime.development':
        './cjs/react-jsx-dev-runtime.development.js',
      './cjs/react-jsx-dev-runtime.development.js':
        './cjs/react-jsx-dev-runtime.development.js',
      './cjs/react-jsx-dev-runtime.development.js!cjs':
        './cjs/react-jsx-dev-runtime.development.js',
      './cjs/react-jsx-dev-runtime.production.min':
        './cjs/react-jsx-dev-runtime.production.min.js',
      './cjs/react-jsx-dev-runtime.production.min.js':
        './cjs/react-jsx-dev-runtime.production.min.js',
      './cjs/react-jsx-dev-runtime.production.min.js!cjs':
        './cjs/react-jsx-dev-runtime.production.min.js',
      './cjs/react-jsx-runtime.development':
        './cjs/react-jsx-runtime.development.js',
      './cjs/react-jsx-runtime.development.js':
        './cjs/react-jsx-runtime.development.js',
      './cjs/react-jsx-runtime.development.js!cjs':
        './cjs/react-jsx-runtime.development.js',
      './cjs/react-jsx-runtime.production.min':
        './cjs/react-jsx-runtime.production.min.js',
      './cjs/react-jsx-runtime.production.min.js':
        './cjs/react-jsx-runtime.production.min.js',
      './cjs/react-jsx-runtime.production.min.js!cjs':
        './cjs/react-jsx-runtime.production.min.js',
      './cjs/react.development': './cjs/react.development.js',

      './cjs/react-jsx-runtime.profiling.min':
        './cjs/react-jsx-runtime.profiling.min.js',
      './cjs/react-jsx-runtime.profiling.min.js':
        './cjs/react-jsx-runtime.profiling.min.js',
      './cjs/react-jsx-runtime.profiling.min.js!cjs':
        './cjs/react-jsx-runtime.profiling.min.js',

      './cjs/react-jsx-dev-runtime.profiling.min':
        './cjs/react-jsx-dev-runtime.profiling.min.js',
      './cjs/react-jsx-dev-runtime.profiling.min.js':
        './cjs/react-jsx-dev-runtime.profiling.min.js',
      './cjs/react-jsx-dev-runtime.profiling.min.js!cjs':
        './cjs/react-jsx-dev-runtime.profiling.min.js',
    })
  })
})
