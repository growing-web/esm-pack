import nodePolyfills from 'rollup-plugin-polyfill-node'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
// import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import path from 'pathe'
import fs from 'fs-extra'
import { rollup } from 'rollup'
// import { rawPlugin } from './plugins/raw'
import { EXTENSIONS, MAIN_FIELDS } from '@/constants'
// import { isDynamicEntry } from './resolvePackage'
import type { PackageJson } from 'pkg-types'
import { rollupPluginWrapInstallTargets } from './plugins/rollup-plugin-wrap-install-targets'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
  pkg: PackageJson,
) {
  //   const inputMap: Record<string, string> = {}
  //   const devInputMap: Record<string, string> = {}
  //   const { files: pkgFiles = [] } = pkg
  //   for (const file of buildFiles) {
  //     let basename = path.basename(file)
  //     if (basename.indexOf('.') !== -1)
  //       basename = basename.substring(0, basename.lastIndexOf('.'))
  //     let inputName = basename
  //     let i = 0
  //     while (inputName in inputMap) {
  //       inputName = basename + i++
  //     }
  //     inputMap[file] = file

  //     // if (pkgFiles.includes(path.relative(cachePath, file))) {
  //     //   const dynamicEntry = await isDynamicEntry(
  //     //     fs.readFileSync(file, { encoding: 'utf8' }),
  //     //   )
  //     //   if (dynamicEntry) {
  //     //     devInputMap[file] = file
  //     //   }
  //     // }
  //   }

  await Promise.all(
    buildFiles.map((input) =>
      doBuild({
        input,
        buildPath,
        cachePath,
        env: 'production',
        name: pkg.name,
      }),
    ),
  )

  //   const emptyInput = await doBuild({
  //     input: inputMap,
  //     buildPath,
  //     cachePath,
  //     env: 'production',
  //   })

  // TODO DEV CDN

  //   if (Object.keys(devInputMap).length) {
  //     await doBuild({
  //       input: devInputMap,
  //       buildPath,
  //       cachePath,
  //       env: 'development',
  //       dev: true,
  //     })
  //   }

  //   if (Object.keys(emptyInput).length) {
  //     await doBuild({
  //       input: emptyInput,
  //       buildPath,
  //       cachePath,
  //       env: 'development',
  //     })
  //   }
}
async function doBuild({
  input,
  cachePath,
  buildPath,
  env,
  dev = false,
  name,
}: {
  input: string
  buildPath: string
  cachePath: string
  env: string
  name?: string
  dev?: boolean
}) {
  const emptyInput: Record<string, string> = {}
  const NODE_ENV = JSON.stringify(env)

  const inputKeys = Object.keys(input)
  const minify = !dev
  const bundle = await rollup({
    input: input,
    onwarn: (warning, handler) => {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        return
      }
      if (warning.code === 'EMPTY_BUNDLE' && env === 'production') {
        const match = warning.message.match(/Generated an empty chunk: "(.*)+"/)
        if (match) {
          const key = match?.[1]
          if (key) {
            emptyInput[key] = key
          }
        }
        return
      }

      handler(warning)
    },
    external: (id) => {
      //   const ext = path.extname(id)
      //   const lastIndex = id.lastIndexOf(ext)
      //   if (id[0] === '.' || path.isAbsolute(id)) {
      return false
      //   }

      //   if (
      //     input !== id &&
      //     input !== id.substring(0, lastIndex) &&
      //     input !== path.join(cachePath, id.substring(0, lastIndex)) &&
      //     input !== path.join(cachePath, id)
      //   ) {
      //     return true
      //   }

      //   if (id.startsWith('data:')) {
      //     return true
      //   }

      return true
    },
    treeshake: { moduleSideEffects: true },
    plugins: [
      peerDepsExternal(),
      resolve({
        preferBuiltins: false,
        browser: true,
        mainFields: [...MAIN_FIELDS],
        extensions: ['.mjs', '.cjs', '.js', '.json'], // Default: [ '.mjs', '.js', '.json', '.node' ]
      }),
      rollupJSONPlugin({
        preferConst: true,
        indent: '  ',
        compact: false,
        namedExports: true,
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': NODE_ENV,
          'globals.process.env.NODE_ENV': NODE_ENV,
        },
      }),
      commonjs({
        extensions: ['.js', '.cjs'],
        // esmExternals: true,
        requireReturnsDefault: 'auto',
      }),
      (nodePolyfills as any)(),

      rollupPluginWrapInstallTargets(false, [name]),

      //   minify && terser(),
      //   esbuild({
      //     target: 'es2021',
      //     // sourceMap: true,
      //     minify: minify,
      //     minifyWhitespace: minify,
      //     minifyIdentifiers: minify,
      //     minifySyntax: minify,
      //     define: {
      //       'process.env.NODE_ENV': NODE_ENV,
      //       'globals.process.env.NODE_ENV': NODE_ENV,
      //     },
      //   }),

      //   rollupPluginNodeProcessPolyfill(env),
      //   rawPlugin(),
    ].filter(Boolean),
  })

  fs.ensureDirSync(buildPath)

  await bundle.write({
    file: path.join(buildPath, path.relative(cachePath, input)),
    indent: true,
    esModule: true,
    exports: 'named',
    preferConst: true,
    externalLiveBindings: false,
    freeze: false,
    format: 'esm',
    sourcemap: true,
    banner: `/* rollup bundle: ${env}. */`,
  })

  //   const { output } = await bundle.generate({
  //     dir: buildPath,
  //     indent: true,
  //     esModule: true,
  //     preferConst: true,
  //     externalLiveBindings: false,
  //     freeze: false,
  //     format: 'esm',
  //     sourcemap: true,
  //     interop: false,
  //     entryFileNames: (chunk) => {
  //       const fileName = path.relative(cachePath, chunk.facadeModuleId!)
  //       if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
  //         return fileName
  //       }
  //       return `${path.relative(cachePath, chunk.facadeModuleId!)}.js`
  //     },
  //     chunkFileNames: '[name].js',
  //   })

  //   await Promise.all(
  //     output.map((chunk) => {
  //       if (chunk.type === 'chunk') {
  //         const map = chunk.map?.toString()
  //         const encoding = {
  //           encoding: 'utf8',
  //         }

  //         const filename = chunk.fileName
  //         // const filename = `${
  //         //   dev && !chunk.fileName.startsWith('_') ? 'dev.' : ''
  //         // }${chunk.fileName}`
  //         return Promise.all([
  //           fs.outputFile(
  //             path.join(buildPath, filename),
  //             chunk.code,
  //             // `/* [esm-pack] bundle for ${env}. */\t${chunk.code}`,
  //             encoding,
  //           ),
  //           map &&
  //             fs.outputFile(
  //               path.join(buildPath, `${filename}.map`),
  //               map,
  //               encoding,
  //             ),
  //         ])
  //       }
  //       return () => {}
  //     }),
  //   )

  return emptyInput
}
