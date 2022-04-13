import nodePolyfills from 'rollup-plugin-polyfill-node'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
// import replace from '@rollup/plugin-replace'
// import { terser } from 'rollup-plugin-terser'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import path from 'pathe'
import fs from 'fs-extra'
import { rollup } from 'rollup'
// import { rawPlugin } from './plugins/raw'
import {
  // EXTENSIONS,
  MAIN_FIELDS,
} from '@/constants'
// import { isDynamicEntry } from './resolvePackage'
import type { PackageJson } from 'pkg-types'
import { rollupPluginWrapInstallTargets } from './plugins/rollup-plugin-wrap-install-targets'
import { rollupPluginNodeProcessPolyfill } from './plugins/rollup-plugin-node-process-polyfill'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
  pkg: PackageJson,
) {
  const result = await Promise.all(
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

  const removeFiles: string[] = []
  for (const { unExportDefaultInput } of result) {
    removeFiles.push(
      ...unExportDefaultInput.map((item) => path.relative(cachePath, item)),
    )
  }

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
  return removeFiles
}
async function doBuild({
  input,
  cachePath,
  buildPath,
  env,
  name,
}: {
  input: string
  buildPath: string
  cachePath: string
  env: string
  name?: string
  dev?: boolean
}) {
  const emptyInput: string[] = []
  const unExportDefaultInput: string[] = []
  const NODE_ENV = JSON.stringify(env)

  const minify = true

  try {
    const bundle = await rollup({
      input: input,
      onwarn: (warning, handler) => {
        if (warning.code === 'UNRESOLVED_IMPORT') {
          return
        }
        if (warning.code === 'EMPTY_BUNDLE' && env === 'production') {
          const match = warning.message.match(
            /Generated an empty chunk: "(.*)+"/,
          )
          if (match) {
            const key = match?.[1]
            if (key) {
              emptyInput.push(key)
            }
          }
          return
        }

        handler(warning)
      },
      external: (id) => {
        // const ext = path.extname(id)
        // const lastIndex = id.lastIndexOf(ext)

        if (
          // inputKeys.includes(path.join(cachePath, id)) ||
          id.startsWith('esm-pack:') ||
          id[0] === '.' ||
          path.isAbsolute(id) ||
          path.basename(id) === 'package.json'
        ) {
          return false
        }

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
          extensions: ['.mjs', '.cjs', '.js', '.json', '.node'],
        }),
        rollupJSONPlugin({
          preferConst: true,
          indent: '  ',
          compact: false,
          namedExports: true,
        }),

        commonjs({
          extensions: ['.js', '.cjs'],
          esmExternals: true,
          requireReturnsDefault: 'auto',
        }),
        (nodePolyfills as any)(),

        rollupPluginWrapInstallTargets(false, [name]),
        esbuild({
          target: 'es2021',
          minify: minify,
          minifyWhitespace: minify,
          minifyIdentifiers: minify,
          minifySyntax: minify,
          define: {
            'process.env.NODE_ENV': NODE_ENV,
            'globals.process.env.NODE_ENV': NODE_ENV,
          },
        }),
        rollupPluginNodeProcessPolyfill({
          NODE_ENV: env,
        }),
      ].filter(Boolean),
    })

    fs.ensureDirSync(buildPath)

    let file = path.join(buildPath, path.relative(cachePath, input))

    if (path.basename(input) === 'package.json') {
      file = path.join(buildPath, 'package.json.js')
    }

    await bundle.write({
      file,
      exports: 'named',
      format: 'esm',
      sourcemap: true,
    })

    return { emptyInput, unExportDefaultInput: [] }
  } catch (error: any) {
    const message: string = error?.toString()
    if (message) {
      const unExportDefault = message.startsWith(
        `Error: 'default' is not exported by`,
      )

      if (unExportDefault) {
        unExportDefaultInput.push(input)
        return { unExportDefaultInput, emptyInput }
      }
    }
    throw new Error(error)
  }
}
