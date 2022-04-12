import { describe, test, expect } from 'vitest'
import { resolveExports } from '../resolvePackage'
import path from 'path'
import fs from 'fs-extra'

describe('resolve exports test. ', () => {
  test('react 16', async () => {
    const root = path.join(__dirname, './fixtures/packages/react/16')
    const pkg = fs.readJSONSync(path.join(root, 'main.package.json'))
    const exp = await resolveExports(pkg, root)

    expect(exp).toEqual({
      '.': {
        development: './index.js',
        // development: './dev.index.js',
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
      //   './dev.index.js!cjs': './dev.index.js',
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
        // development: './dev.index.js',
        development: './index.js',
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
      //   './dev.index.js!cjs': './dev.index.js',
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
