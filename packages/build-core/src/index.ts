import nodePolyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
import path from 'pathe'
import fs from 'fs-extra'
import { rollup } from 'rollup'
import _ from 'lodash'
import { APP_NAME } from './constants'
import { rollupPluginWrapTargets } from './plugins/rollup-plugin-wrap-exports'
import { rollupPluginNodeProcessPolyfill } from './plugins/rollup-plugin-node-process-polyfill'
import { isDynamicEntry } from './resolvePackage'
import { readPackageJSON } from 'pkg-types'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export * from './resolvePackage'

export async function build({
  buildFiles,
  outputPath,
  sourcePath,
}: {
  buildFiles: string[]
  outputPath: string
  sourcePath: string
}) {
  const inputMap: Record<string, string> = {}
  const pkg = await readPackageJSON(sourcePath)

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

  await Promise.all([
    doBuildMultipleEntry({
      input: inputMap,
      outputPath,
      sourcePath,
      env: 'production',
      name: pkg.name,
    }),
    Promise.all(
      devBuildFiles.map((input) =>
        doBuildSingleEntry({
          input,
          outputPath,
          sourcePath,
          env: 'development',
          name: pkg.name,
        }),
      ),
    ),
  ])
}

async function doBuildMultipleEntry({
  input,
  sourcePath,
  outputPath,
  env,
  name,
}: {
  input: Record<string, string>
  outputPath: string
  sourcePath: string
  env: string
  name?: string
}) {
  const inputKeys = Object.keys(input)
  const bundle = await rollup({
    input: input,
    treeshake: { moduleSideEffects: true },
    onwarn: onWarning,
    external: (id) =>
      !inputKeys.includes(path.join(sourcePath, id)) && !needExternal(id),
    plugins: createRollupPlugins(name, env),
  })

  fs.ensureDirSync(outputPath)

  const { output } = await bundle.generate({
    dir: outputPath,
    format: 'esm',
    exports: 'named',
    sourcemap: true,
    entryFileNames: (chunk) => {
      let id = chunk.facadeModuleId

      if (id?.startsWith(`${APP_NAME}:`)) {
        id = id.replace(`${APP_NAME}:`, '')
      }
      id = id?.replace(sourcePath, '') ?? ''
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
          fs.outputFile(path.join(outputPath, filename), chunk.code, encoding),
          map &&
            fs.outputFile(
              path.join(outputPath, `${filename}.map`),
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
  sourcePath,
  outputPath,
  env,
  name,
}: {
  input: string
  outputPath: string
  sourcePath: string
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

    fs.ensureDirSync(outputPath)

    let file = path.join(outputPath, path.relative(sourcePath, input))
    const basename = path.basename(input)
    if (basename === 'package.json') {
      file = path.join(outputPath, 'package.json.js')
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
    id.startsWith(`node:`) ||
    id[0] === '.' ||
    path.isAbsolute(id) ||
    ['process', 'Buffer', 'module'].includes(id) ||
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
