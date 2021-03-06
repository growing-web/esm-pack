import nodePolyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
import path from 'node:path'
import fs from 'fs-extra'
import { readPackageJSON } from 'pkg-types'
import { rollup } from 'rollup'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import { rollupPluginWrapTargets } from './plugins/rollupPluginWrapExports'
import { rollupPluginNodeProcessPolyfill } from './plugins/rollupPluginNodeProcessPolyfill'
import { isDynamicEntry } from './resolvePackage'
import { rollupBrotliPlugin, brotli } from './brotlify'
import { BORTLFY, enableSourceMap } from './config'
import { APP_NAME } from './constants'
export * from './resolvePackage'
export * from './recursion'

export interface BuildOptions {
  buildFiles: string[]
  outputPath: string
  sourcePath: string
  sourcemap?: boolean
  entryFiles?: string[]
}

export interface BuildMultipleEntryOptions {
  inputMap: Record<string, string>
  outputPath: string
  sourcePath: string
  env: string
  name?: string
  sourcemap: boolean
  minify?: boolean
  bortlfy?: boolean
}

export interface BuildSingleEntryOptions {
  input: string
  outputPath: string
  sourcePath: string
  env: string
  name?: string
  sourcemap: boolean
  devPrefix?: string
  minify?: boolean
  bortlfy?: boolean
}

export async function build({
  buildFiles,
  outputPath,
  sourcePath,
  sourcemap = enableSourceMap,
  entryFiles = [],
}: BuildOptions) {
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
    if (entryFiles.includes(file)) {
      continue
    }
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
    Promise.all(
      entryFiles.map((input) =>
        doBuildSingleEntry({
          input,
          outputPath,
          sourcePath,
          env: 'production',
          name: pkg.name,
          sourcemap,
          bortlfy: BORTLFY,
        }),
      ),
    ),
    doBuildMultipleEntry({
      inputMap: inputMap,
      outputPath,
      sourcePath,
      env: 'production',
      name: pkg.name,
      sourcemap,
      bortlfy: BORTLFY,
    }),
    Promise.all(
      devBuildFiles.map((input) =>
        doBuildSingleEntry({
          input,
          outputPath,
          sourcePath,
          env: 'development',
          name: pkg.name,
          sourcemap,
          bortlfy: BORTLFY,
        }),
      ),
    ),
  ])
}

export async function doBuildMultipleEntry({
  inputMap,
  sourcePath,
  outputPath,
  env,
  name,
  sourcemap,
  minify = true,
  bortlfy = false,
}: BuildMultipleEntryOptions) {
  const inputKeys = Object.keys(inputMap)
  const bundle = await rollup({
    // preserveEntrySignatures: 'allow-extension',
    input: inputMap,
    treeshake: { moduleSideEffects: true },
    onwarn: onWarning,
    external: (id) =>
      !inputKeys.includes(path.join(sourcePath, id)) && !needExternal(id),
    plugins: [...createRollupPlugins(name, minify, env)],
  })

  fs.ensureDirSync(outputPath)

  const { output } = await bundle.generate({
    dir: outputPath,
    format: 'esm',
    exports: 'named',
    sourcemap,
    compact: minify,
    entryFileNames: (chunk) => {
      let id = chunk.facadeModuleId
      id = id?.replace(/(\?commonjs-entry)$/, '') ?? id

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

  const chunks: any[] = []
  await Promise.all(
    output.map((chunk) => {
      const promises: any[] = []
      if (chunk.type === 'chunk') {
        const map = chunk.map?.toString()
        const encoding = {
          encoding: 'utf8',
        }

        const filename = chunk.fileName

        promises.push(
          ...[
            fs.outputFile(
              path.join(outputPath, filename),
              chunk.code,
              encoding,
            ),
            enableSourceMap &&
              map &&
              fs.outputFile(
                path.join(outputPath, `${filename}.map`),
                map,
                encoding,
              ),
          ],
        )
      }
      chunks.push({ [chunk.fileName]: chunk })

      if (enableSourceMap) {
        const map = (chunk as any).map?.toString()
        if (map) {
          chunks.push({
            [`${chunk.fileName}.map`]: {
              ...chunk,
              fileName: `${chunk.fileName}.map`,
            },
          })
        }
      }

      return Promise.all(promises)
    }),
  )
  if (bortlfy) {
    await Promise.all(chunks.map((chunk) => brotli(chunk, outputPath)))
  }
}

export async function doBuildSingleEntry({
  input,
  sourcePath,
  outputPath,
  env,
  name,
  sourcemap,
  minify = true,
  devPrefix = 'dev.',
  bortlfy = false,
}: BuildSingleEntryOptions) {
  try {
    const bundle = await rollup({
      input: input,
      treeshake: { moduleSideEffects: true },
      onwarn: onWarning,
      external: (id) => path.join(id) !== path.join(input) && !needExternal(id),
      plugins: [
        ...createRollupPlugins(name, minify, env),
        bortlfy && rollupBrotliPlugin(),
      ].filter(Boolean),
    })

    fs.ensureDirSync(outputPath)

    let file = path.join(outputPath, path.relative(sourcePath, input))
    const basename = path.basename(input)
    if (basename === 'package.json') {
      file = path.join(outputPath, 'package.json.js')
    }

    if (env === 'development') {
      file = file.replace(basename, `${devPrefix}${basename}`)
    }

    await bundle.write({
      file,
      exports: 'named',
      sourcemap: sourcemap === true || enableSourceMap,
    })
  } catch (error: any) {
    throw new Error(error)
  }
}

function createRollupPlugins(name: string | undefined, minify, env: string) {
  return [
    peerDepsExternal(),
    resolve({
      preferBuiltins: false,
      browser: true,
      extensions: ['.mjs', '.cjs', '.js', '.json'],
    }),
    rollupJSONPlugin({
      preferConst: true,
      indent: '',
      compact: false,
      namedExports: true,
    }),
    commonjs({
      extensions: ['.js', '.cjs'],
      //   esmExternals: true,
      requireReturnsDefault: 'auto',
    }),
    rollupPluginWrapTargets(false, name),
    esbuild({
      minify: minify,
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
