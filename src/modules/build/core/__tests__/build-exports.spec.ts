import { describe, test, expect } from 'vitest'
import { buildExports } from '../resolvePackage'
import path from 'path'
import { readPackageJSON } from 'pkg-types'

describe('build exports test.', () => {
  test('exports filed is string.', async () => {
    const pkg: any = {
      exports: './dist/index.js',
    }
    const ret = await buildExports(pkg, '')

    expect(ret).toEqual({
      '.': './dist/index.js',
    })
  })

  test('exports field does not exist: not module and main field. ', async () => {
    const root = path.resolve(
      __dirname,
      './fixtures/non-exports/non-module-main',
    )
    const ret = await buildExports(await readPackageJSON(root), root)
    expect(ret).toEqual({
      '.': './index.js',
    })
  })

  test('exports field does not exist:  module and main field is exits. ', async () => {
    const root = path.resolve(
      __dirname,
      './fixtures/non-exports/module-main-exits',
    )
    const ret = await buildExports(await readPackageJSON(root), root)
    expect(ret).toEqual({
      '.': {
        module: './index.js',
        default: {
          development: './index.js',
          default: './index.js',
        },
      },
    })
  })

  test('exports field does not exist:  only main field . ', async () => {
    const root = path.resolve(__dirname, './fixtures/non-exports/only-main')
    const ret = await buildExports(await readPackageJSON(root), root)
    expect(ret).toEqual({
      '.': {
        development: './index.js',
        default: './index.js',
      },
    })
  })

  test('exports field does not exist:  only module field . ', async () => {
    const root = path.resolve(__dirname, './fixtures/non-exports/only-module')
    const ret = await buildExports(await readPackageJSON(root), root)
    expect(ret).toEqual({
      '.': {
        module: './index.js',
        default: {
          development: './index.js',
          default: './index.js',
        },
      },
    })
  })

  test('exports field exist: normal. ', async () => {
    const root = path.resolve(__dirname, './fixtures/exits-exports/normal')
    const ret = await buildExports(await readPackageJSON(root), root)

    expect(ret).toEqual({
      '.': {
        import: {
          node: './index.mjs',
          default: './dist/vue.runtime.esm-bundler.js',
        },
        require: './index.js',
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
      './package.json': './package.json',
    })
  })
})
