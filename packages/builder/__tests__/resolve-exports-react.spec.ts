import { describe, test, expect } from 'vitest'
import { resolveExports } from '../src/resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve exports test. ', () => {
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
      './index.js!cjs': './index.js',
      './package.json.js!cjs': './package.json.js',

      './jsx-dev-runtime': {
        default: './jsx-dev-runtime.js',
        development: './dev.jsx-dev-runtime.js',
      },
      './jsx-dev-runtime.js': {
        default: './jsx-dev-runtime.js',
        development: './dev.jsx-dev-runtime.js',
      },
      './jsx-runtime': {
        default: './jsx-runtime.js',
        development: './dev.jsx-runtime.js',
      },
      './jsx-runtime.js': {
        default: './jsx-runtime.js',
        development: './dev.jsx-runtime.js',
      },
      './jsx-dev-runtime.js!cjs': './jsx-dev-runtime.js',
      './jsx-runtime.js!cjs': './jsx-runtime.js',
      './index': './index.js',
      './index.js': './index.js',
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
      './index.js!cjs': './index.js',
      './package.json.js!cjs': './package.json.js',
      './jsx-dev-runtime': {
        default: './jsx-dev-runtime.js',
        development: './dev.jsx-dev-runtime.js',
      },
      './jsx-dev-runtime.js': {
        default: './jsx-dev-runtime.js',
        development: './dev.jsx-dev-runtime.js',
      },
      './jsx-runtime': {
        default: './jsx-runtime.js',
        development: './dev.jsx-runtime.js',
      },
      './jsx-runtime.js': {
        default: './jsx-runtime.js',
        development: './dev.jsx-runtime.js',
      },
      './jsx-dev-runtime.js!cjs': './jsx-dev-runtime.js',
      './jsx-runtime.js!cjs': './jsx-runtime.js',
      './index': './index.js',
      './index.js': './index.js',
    })
  })
})
