import { describe, test, expect } from 'vitest'
import { resolveExports } from '../resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve exports test. ', () => {
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

  test('nprogress 0.2.0', async () => {
    const root = path.join(__dirname, './fixtures/packages/nprogress/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': './nprogress.js',
      './nprogress.css': './nprogress.css',
      './nprogress.js': './nprogress.js',
      './nprogress': './nprogress.js',
      './nprogress.js!cjs': './nprogress.js',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',
    })
  })

  test('normalize.css 8.x', async () => {
    const root = path.join(__dirname, './fixtures/packages/normalize.css/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': './normalize.css',
      './normalize.css': './normalize.css',
      './package.json': './package.json.js',
      './package.json.js!cjs': './package.json.js',
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
})
