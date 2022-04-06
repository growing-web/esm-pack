import { rollup } from 'rollup'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import path from 'pathe'
import fs from 'fs-extra'
import rollupJSONPlugin from '@rollup/plugin-json'
import { rawPlugin } from './plugins/raw'
import { EXTENSIONS } from '@/constants'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
) {
  const errorExternal: string[] = []

  const inputObj = {}
  for (const mod of buildFiles) {
    let basename = path.basename(mod)
    if (basename.indexOf('.') !== -1)
      basename = basename.substring(0, basename.lastIndexOf('.'))
    let inputName = basename
    let i = 0
    while (inputName in inputObj) inputName = basename + i++
    inputObj[inputName] = mod
  }

  const results = await bundle(
    inputObj,
    buildPath,
    cachePath,
    errorExternal,
    'production',
  )

  //   await Promise.all(
  //     buildFiles.map((input) =>
  //       bundle(input, buildPath, cachePath, errorExternal, 'production'),
  //     ),
  //   )
  const devFiles = results.flat()

  await Promise.all(
    devFiles.map((input) =>
      bundle(input, buildPath, cachePath, errorExternal, 'development'),
    ),
  )
}
async function bundle(
  input: any,
  buildPath: string,
  cachePath: string,
  errorExternal: string[],
  env: string,
) {
  const emptyInput: string[] = []
  const NODE_ENV = JSON.stringify(env)

  const inputKeys = Object.keys(input)
  const bundle = await rollup({
    input: input,
    onwarn: (warning, handler) => {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        return
      }
      if (warning.code === 'EMPTY_BUNDLE' && env === 'production') {
        const match = warning.message.match(/Generated an empty chunk: "(.*)+"/)
        if (match) {
          //   emptyInput.push(input)
        }
        return
      }

      handler(warning)
    },
    external: (id) => {
      if (inputKeys.includes(path.join(cachePath, id))) {
        return false
      }

      if (errorExternal.includes(id)) {
        return false
      }

      //   const ext = path.extname(id)
      //   const lastIndex = id.lastIndexOf(ext)

      //   if (
      //     id.includes(path.join(id.substring(0, lastIndex))) &&
      //     !inputKeys.includes(id) &&
      //     !inputKeys.includes(id.substring(0, lastIndex)) &&
      //     !inputKeys.includes(path.join(cachePath, id.substring(0, lastIndex))) &&
      //     !inputKeys.includes(path.join(cachePath, id))
      //     // input !== id &&
      //     // input !== id.substring(0, lastIndex) &&
      //     // input !== path.join(cachePath, id.substring(0, lastIndex)) &&
      //     // input !== path.join(cachePath, id)
      //   ) {
      //     return true
      //   }
      if (id[0] === '.' || path.isAbsolute(id)) {
        return false
      }

      if (id.startsWith('data:')) {
        return true
      }
      return true
    },
    plugins: [
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
        // legalComments: 'none',
        define: {
          'process.env.NODE_ENV': NODE_ENV,
        },
      }),
      commonjs({
        extensions: EXTENSIONS,
        // esmExternals: true,
      }),
      {
        renderDynamicImport() {
          return { left: 'import(', right: ')' }
        },
      },
      rawPlugin(),
    ],
  })

  fs.ensureDirSync(buildPath)

  //   await bundle.write({
  //     dir: buildPath,
  //     // file: path.join(buildPath, path.relative(cachePath, input)),
  //     indent: true,
  //     esModule: true,
  //     exports: 'auto',
  //     preferConst: true,
  //     externalLiveBindings: false,
  //     freeze: false,
  //     format: 'esm',
  //     sourcemap: true,
  //     banner: `/* rollup bundle: ${env}. */`,
  //   })

  const { output } = await bundle.generate({
    dir: buildPath,
    indent: true,
    esModule: true,
    exports: 'auto',
    preferConst: true,
    externalLiveBindings: false,
    freeze: false,
    format: 'esm',
    sourcemap: true,
    banner: `/* rollup bundle: ${env}. */`,
    entryFileNames: (chunk) => {
      const fileName = path.relative(cachePath, chunk.facadeModuleId!)
      if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
        return fileName
      }
      return `${path.relative(cachePath, chunk.facadeModuleId!)}.js`
    },
  })

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
