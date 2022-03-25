import { describe, test, expect } from 'vitest'
import { resolveExports } from '../resolve-exports'
import path from 'path'
import { readPackageJSON } from 'pkg-types'

describe('resolve exports test.', () => {
  test('exports field does not exist.', async () => {
    const root = path.resolve(
      __dirname,
      './fixtures/non-exports/non-module-main',
    )
    const ret = await resolveExports(await readPackageJSON(root), root)

    expect(ret).toEqual({
      '.': './index.js',
      './package.json': './package.json.js',
      './index.js!cjs': './index.js',
      './package.json.js!cjs': './package.json.js',
    })
  })

  test('exports field exist.', async () => {
    const root = path.resolve(__dirname, './fixtures/exits-exports/normal')
    const ret = await resolveExports(await readPackageJSON(root), root)
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
      './package.json': './package.json.js',
      './dist/a.js': './dist/a.js',
      './dist/a': './dist/a.js',
      './dist/a.js!cjs': './dist/a.js',
      './package.json.js!cjs': './package.json.js',
    })
  })
})

describe('resolve libs test.', () => {
  test('object-assign lib test.', async () => {
    const root = path.resolve(__dirname, './fixtures/libs/object-assign')
    const ret = await resolveExports(await readPackageJSON(root), root)

    expect(ret).toEqual({
      '.': './index.js',
      './package.json': './package.json.js',
      './index.js!cjs': './index.js',
      './package.json.js!cjs': './package.json.js',
    })
  })
})
