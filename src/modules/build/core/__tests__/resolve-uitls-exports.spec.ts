import { describe, test, expect } from 'vitest'
import { resolveExports } from '../resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve utils lib exports test.', () => {
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
