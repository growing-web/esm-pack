import type { PackageJson } from 'pkg-types'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
import path from 'pathe'
import fs from 'fs-extra'
import { rollup } from 'rollup'
import _ from 'lodash'
import { APP_NAME } from '@/constants'
import { rollupPluginWrapTargets } from './plugins/rollup-plugin-wrap-exports'
import { rollupPluginNodeProcessPolyfill } from './plugins/rollup-plugin-node-process-polyfill'
import { isDynamicEntry } from './resolvePackage'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
  pkg: PackageJson,
) {
  const inputMap: Record<string, string> = {}

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

  for (const file of buildFiles) {
    let n = file.split('/').pop()
    if (!n) {
      continue
    }
    const extIndex = n.lastIndexOf('.')
    if (extIndex !== -1) n = n.slice(0, extIndex)
    if (inputMap[n]) {
      const _n = n
      let i = 1
      while (inputMap[n]) n = _n + ++i
    }
    inputMap[n] = file
  }

  //   if (buildFiles.length <= 200) {
  //     await Promise.all(
  //       buildFiles.map((input) =>
  //         doBuildSingleEntry({
  //           input,
  //           buildPath,
  //           cachePath,
  //           env: 'production',
  //           name: pkg.name,
  //         }),
  //       ),
  //     )
  //   }

  await Promise.all([
    doBuildMultipleEntry({
      input: inputMap,
      buildPath,
      cachePath,
      env: 'production',
      name: pkg.name,
    }),
    Promise.all(
      devBuildFiles.map((input) =>
        doBuildSingleEntry({
          input,
          buildPath,
          cachePath,
          env: 'development',
          name: pkg.name,
        }),
      ),
    ),
  ])
}

async function doBuildMultipleEntry({
  input,
  cachePath,
  buildPath,
  env,
  name,
}: {
  input: Record<string, string>
  buildPath: string
  cachePath: string
  env: string
  name?: string
}) {
  const inputKeys = Object.keys(input)
  const bundle = await rollup({
    input: input,
    treeshake: { moduleSideEffects: true },
    onwarn: onWarning,
    external: (id) =>
      !inputKeys.includes(path.join(cachePath, id)) && !needExternal(id),
    plugins: createRollupPlugins(name, env),
  })

  fs.ensureDirSync(buildPath)

  const { output } = await bundle.generate({
    dir: buildPath,
    format: 'esm',
    exports: 'named',
    sourcemap: true,
    entryFileNames: (chunk) => {
      let id = chunk.facadeModuleId

      if (id?.startsWith(`${APP_NAME}:`)) {
        id = id.replace(`${APP_NAME}:`, '')
      }
      id = id?.replace(cachePath, '') ?? ''
      id = id.replace(/^\//, '')
      if (id.endsWith('.js') || id.endsWith('.mjs')) {
        return id
      }
      return `${id}.js`
    },
    chunkFileNames: '[hash].js',
  })

  await Promise.all(
    output.map((chunk) => {
      if (chunk.type === 'chunk') {
        const map = chunk.map?.toString()
        const encoding = {
          encoding: 'utf8',
        }

        const filename = chunk.fileName

        return Promise.all([
          fs.outputFile(path.join(buildPath, filename), chunk.code, encoding),
          map &&
            fs.outputFile(
              path.join(buildPath, `${filename}.map`),
              map,
              encoding,
            ),
        ])
      }
      return () => {}
    }),
  )
}

async function doBuildSingleEntry({
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
}) {
  try {
    const bundle = await rollup({
      input: input,
      treeshake: { moduleSideEffects: true },
      onwarn: onWarning,
      external: (id) => path.join(id) !== path.join(input) && !needExternal(id),
      plugins: createRollupPlugins(name, env),
    })

    fs.ensureDirSync(buildPath)

    let file = path.join(buildPath, path.relative(cachePath, input))
    const basename = path.basename(input)
    if (basename === 'package.json') {
      file = path.join(buildPath, 'package.json.js')
    }

    if (env === 'development') {
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

function createRollupPlugins(name: string | undefined, env: string) {
  return [
    peerDepsExternal(),
    resolve({
      preferBuiltins: false,
      browser: true,
      extensions: ['.mjs', '.cjs', '.js', '.json'],
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
    rollupPluginWrapTargets(false, name),
    esbuild({
      target: 'es2022',
      minify: true,
      define: {
        'process.env.NODE_ENV': JSON.stringify(env),
        'process.env.VUE_ENV': JSON.stringify('browser'),
      },
    }),
    rollupPluginNodeProcessPolyfill({
      NODE_ENV: env,
    }),
    (nodePolyfills as any)(),
    //   rollupUrlReplacePlugin(),
  ].filter(Boolean)
}

function needExternal(id: string) {
  return (
    id.startsWith(`${APP_NAME}:`) ||
    id[0] === '.' ||
    ['process', 'Buffer', 'module'].includes(id) ||
    path.isAbsolute(id) ||
    path.basename(id) === 'package.json'
  )
}

function onWarning(warning, handler) {
  if (
    ['THIS_IS_UNDEFINED', 'UNRESOLVED_IMPORT', 'SOURCEMAP_ERROR'].includes(
      warning.code,
    )
  ) {
    return
  }
  handler(warning)
}
