import { describe, test, expect } from 'vitest'
import { resolveFiles, resolveExports } from '../resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve files test. ', () => {
  test('@vueuse/core 8.x', async () => {
    const root = path.join(__dirname, './fixtures/packages/vueuse/core/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const pkgExports = await resolveExports(pkg, root)
    const files = await resolveFiles(pkg, root, pkgExports)

    expect(files).toEqual([
      'LICENSE',
      'README.md',
      'index.cjs',
      'index.cjs.map',
      'index.d.ts',
      'index.mjs',
      'index.mjs.map',
      'metadata.cjs',
      'metadata.cjs.map',
      'metadata.d.ts',
      'metadata.mjs',
      'metadata.mjs.map',
      'package.json',
      'package.json.js',
      'package.json.js.map',
    ])
  })
  test('@vueuse/core 8.x', async () => {
    const root = path.join(__dirname, './fixtures/packages/vueuse/shared/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const pkgExports = await resolveExports(pkg, root)
    const files = await resolveFiles(pkg, root, pkgExports)

    expect(files).toEqual([
      'LICENSE',
      'index.cjs',
      'index.cjs.map',
      'index.d.ts',
      'index.mjs',
      'index.mjs.map',
      'package.json',
      'package.json.js',
      'package.json.js.map',
    ])
  })

  test('@vueuse/shared 8.x', async () => {
    const root = path.join(__dirname, './fixtures/packages/vueuse/shared/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const pkgExports = await resolveExports(pkg, root)
    const files = await resolveFiles(pkg, root, pkgExports)

    expect(files).toEqual([
      'LICENSE',
      'index.cjs',
      'index.cjs.map',
      'index.d.ts',
      'index.mjs',
      'index.mjs.map',
      'package.json',
      'package.json.js',
      'package.json.js.map',
    ])
  })

  test('vue-demi 0.12.x', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue-demi/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const pkgExports = await resolveExports(pkg, root)
    const files = await resolveFiles(pkg, root, pkgExports)

    expect(files).toEqual([
      'LICENSE',
      'README.md',
      'lib/index.cjs',
      'lib/index.cjs.map',
      'lib/index.mjs',
      'lib/index.mjs.map',
      'package.json',
      'package.json.js',
      'package.json.js.map',
    ])
  })

  test('object-assign 4', async () => {
    const root = path.join(__dirname, './fixtures/packages/object-assign/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const pkgExports = await resolveExports(pkg, root)
    const files = await resolveFiles(pkg, root, pkgExports)

    expect(files).toEqual([
      'index.js',
      'index.js.map',
      'license',
      'package.json',
      'package.json.js',
      'package.json.js.map',
      'readme.md',
    ])
  })

  test('vue reactivity 3.2', async () => {
    const root = path.join(__dirname, './fixtures/packages/vue3/reactivity/')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const pkgExports = await resolveExports(pkg, root)
    const files = await resolveFiles(pkg, root, pkgExports)

    expect(files).toEqual([
      'LICENSE',
      'README.md',
      //   'dev.index.js',
      //   'dev.index.js.map',
      'dist/reactivity.esm-browser.js',
      'dist/reactivity.esm-browser.js.map',
      'dist/reactivity.esm-bundler.js',
      'dist/reactivity.esm-bundler.js.map',
      'dist/reactivity.global.js',
      'dist/reactivity.global.js.map',
      'index.js',
      'index.js.map',
      'package.json',
      'package.json.js',
      'package.json.js.map',
    ])
  })
})
