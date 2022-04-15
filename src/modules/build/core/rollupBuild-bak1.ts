import type { PackageJson } from 'pkg-types'
// import nodePolyfills from 'rollup-plugin-polyfill-node'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import path from 'pathe'
import fs from 'fs-extra'
import { rollup } from 'rollup'
import _ from 'lodash'
import { rollupPluginWrapTargets } from './plugins/rollup-plugin-wrap-exports'
import { rollupPluginNodeProcessPolyfill } from './plugins/rollup-plugin-node-process-polyfill'
import { APP_NAME } from '@/constants'
import { isDynamicEntry } from './resolvePackage'
import { rollupUrlReplacePlugin } from './plugins/rollup-plugin-url-replace'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
  pkg: PackageJson,
) {
  const chunkFiles = _.chunk(buildFiles, 50)

  for (const files of chunkFiles) {
    await Promise.all(
      files.map((input) =>
        doBuild({
          input,
          buildPath,
          cachePath,
          env: 'production',
          name: pkg.name,
        }),
      ),
    )
  }

  const devBuildFiles: string[] = []

  await Promise.all(
    buildFiles.map(async (file) => {
      const dynamicEntry = await isDynamicEntry(
        fs.readFileSync(file, { encoding: 'utf8' }),
      )
      if (dynamicEntry) {
        devBuildFiles.push(file)
      }
    }),
  )

  if (devBuildFiles.length) {
    await Promise.all(
      devBuildFiles.map((input) =>
        doBuild({
          input,
          buildPath,
          cachePath,
          env: 'development',
          name: pkg.name,
        }),
      ),
    )
  }
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
  const NODE_ENV = JSON.stringify(env)

  const isDevelopment = env === 'development'
  const minify = true

  try {
    const bundle = await rollup({
      input: input,
      onwarn: (warning, handler) => {
        if (warning.code === 'UNRESOLVED_IMPORT') {
          return
        }
        handler(warning)
      },
      external: (id) => {
        if (
          id.startsWith(`${APP_NAME}:`) ||
          path.join(id) === path.join(input) ||
          id[0] === '.' ||
          path.isAbsolute(id) ||
          ['process', 'Buffer'].includes(id) ||
          path.basename(id) === 'package.json'
        ) {
          return false
        }

        return true
      },
      treeshake: { moduleSideEffects: true },
      plugins: [
        peerDepsExternal(),
        resolve({
          preferBuiltins: false,
          browser: true,
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
        rollupUrlReplacePlugin(),
        rollupPluginWrapTargets(true, name),
        esbuild({
          target: 'es2021',
          format: 'esm',
          minify: minify,
          define: {
            'process.env.NODE_ENV': NODE_ENV,
            'globals.process.env.NODE_ENV': NODE_ENV,
          },
        }),
        rollupPluginNodeProcessPolyfill({
          NODE_ENV: env,
        }),
        nodePolyfills(),
      ].filter(Boolean),
    })

    fs.ensureDirSync(buildPath)

    let file = path.join(buildPath, path.relative(cachePath, input))
    const basename = path.basename(input)
    if (basename === 'package.json') {
      file = path.join(buildPath, 'package.json.js')
    }

    if (isDevelopment) {
      file = file.replace(basename, `dev.${basename}`)
    }

    await bundle.write({
      file,
      exports: 'named',
      sourcemap: true,
    })
  } catch (error: any) {
    throw new Error(error)
  }
}
