import { describe, test, expect } from 'vitest'
import { recursionExportsRemoveDts, recursionExportsValues } from '../recursion'

describe('removeTdsFiles()', () => {
  const pkg = {
    exports: {
      '.': {
        import: {
          node: './index.mjs',
          default: './dist/vue.runtime.esm-bundler.js',
        },
        require: './index.js',
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
      './package.json': './package.json',
      './macros': './macros.d.ts',
      './macros-global': './macros-global.d.ts',
      './ref-macros': './ref-macros.d.ts',
    },
  }

  test('recursively remove filed.', () => {
    const ret = recursionExportsRemoveDts(pkg)
    expect(ret).toEqual({
      exports: {
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
      },
    })
  })
})

describe('recursionExportsValues()', () => {
  const pkg = {
    exports: {
      ' .': './index.js',
      './ext': {
        import: {
          node: './index.mjs',
          default: './dist/vue.runtime.esm-bundler.js',
        },
        require: './index.js',
      },
    },
  }

  test('files is correct.', () => {
    const ret = recursionExportsValues(pkg)
    expect(ret).toEqual([
      './index.js',
      './index.mjs',
      './dist/vue.runtime.esm-bundler.js',
    ])
  })
})
