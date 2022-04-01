import { rollup } from 'rollup'
import nodePolyfills from 'rollup-plugin-node-polyfills'
// import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
// import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import path from 'pathe'
import fs from 'fs-extra'
// import { init, parse } from 'es-module-lexer'
// import { parse as cjsParse } from 'cjs-module-lexer'
// import type { PackageJson } from 'pkg-types'
import rollupJSONPlugin from '@rollup/plugin-json'

import { rawPlugin } from './plugins/raw'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
) {
  const results = await Promise.all(
    buildFiles.map((input) =>
      bundle(input, buildPath, cachePath, 'production'),
    ),
  )
  const devFiles = results.flat()
  await Promise.all(
    devFiles.map((input) => bundle(input, buildPath, cachePath, 'development')),
  )
}
async function bundle(
  input: string,
  buildPath: string,
  cachePath: string,
  env: string,
) {
  const emptyInput: string[] = []
  const NODE_ENV = JSON.stringify(env)
  const bundle = await rollup({
    input: input,
    // preserveEntrySignatures: 'strict',
    onwarn: (warning, handler) => {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        return
      }
      if (warning.code === 'EMPTY_BUNDLE' && env === 'production') {
        const match = warning.message.match(/Generated an empty chunk: "(.*)+"/)
        if (match) {
          emptyInput.push(input)
        }
        return
      }

      handler(warning)
    },
    external: (id) => {
      const ext = path.extname(id)
      const lastIndex = id.lastIndexOf(ext)
      if (id.includes(path.join(id.substring(0, lastIndex))) && input !== id) {
        return true
      }
      if (id[0] === '.' || path.isAbsolute(id)) {
        return false
      }

      if (id.startsWith('data:')) {
        return true
      }
      return true
    },
    plugins: [
      //   replace({
      //     preventAssignment: true,
      //     'process.env.NODE_ENV': NODE_ENV,
      //   }),
      (nodePolyfills as any)(),
      resolve({
        preferBuiltins: true,
        browser: true,
      }),
      rollupJSONPlugin({}),
      esbuild({
        target: 'es2021',
        include: /\.[m|c]?js$/,
        sourceMap: true,
        minify: true,
        legalComments: 'none',
        define: {
          'process.env.NODE_ENV': NODE_ENV,
        },
      }),
      commonjs({
        extensions: ['.ts', '.tsx', '.mjs', '.cjs', '.js', '.jsx', '.json'],
        // esmExternals: true,
        // ignoreGlobal: true,
      }),
      {
        renderDynamicImport() {
          return { left: 'import(', right: ')' }
        },
      },
      rawPlugin(),
      //   terser({ format: { comments: false } }),
    ],
  })

  const { output } = await bundle.generate({
    dir: buildPath,
    indent: true,
    // inlineDynamicImports: true,
    esModule: true,
    exports: 'auto',
    preferConst: true,
    externalLiveBindings: false,
    freeze: false,
    format: 'esm',
    sourcemap: true,
    entryFileNames: (chunk) => {
      const fileName = path.relative(cachePath, chunk.facadeModuleId!)
      if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
        return fileName
      }
      return `${path.relative(cachePath, chunk.facadeModuleId!)}.js`
    },
  })

  fs.ensureDirSync(buildPath)

  await Promise.all(
    output.map((chunk) => {
      if (chunk.type === 'chunk') {
        return Promise.all([
          fs.outputFile(path.join(buildPath, chunk.fileName), chunk.code, {
            encoding: 'utf8',
          }),
          fs.outputFile(
            path.join(buildPath, `${chunk.fileName}.map`),
            chunk.map?.toString(),
            { encoding: 'utf8' },
          ),
        ])
      }
      return () => {}
    }),
  )

  return emptyInput.filter(Boolean)
}
