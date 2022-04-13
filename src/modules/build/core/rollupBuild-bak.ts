import nodePolyfills from 'rollup-plugin-node-polyfills'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
// import esbuild from 'rollup-plugin-esbuild'
import rollupJSONPlugin from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import path from 'pathe'
import fs from 'fs-extra'
import { rollup } from 'rollup'
import { rawPlugin } from './plugins/raw'
import { EXTENSIONS } from '@/constants'
// import { isDynamicEntry } from './resolvePackage'
import type { PackageJson } from 'pkg-types'
import { rollupPluginWrapInstallTargets } from './plugins/rollup-plugin-wrap-install-targets'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
  _pkg: PackageJson,
) {
  const inputMap: Record<string, string> = {}
  //   const devInputMap: Record<string, string> = {}
  //   const { files: pkgFiles = [] } = pkg
  for (const file of buildFiles) {
    let basename = path.basename(file)
    if (basename.indexOf('.') !== -1)
      basename = basename.substring(0, basename.lastIndexOf('.'))
    let inputName = basename
    let i = 0
    while (inputName in inputMap) {
      inputName = basename + i++
    }
    inputMap[inputName] = file

    // if (pkgFiles.includes(path.relative(cachePath, file))) {
    //   const dynamicEntry = await isDynamicEntry(
    //     fs.readFileSync(file, { encoding: 'utf8' }),
    //   )
    //   if (dynamicEntry) {
    //     devInputMap[file] = file
    //   }
    // }
  }

  const emptyInput = await doBuild({
    input: inputMap,
    buildPath,
    cachePath,
    env: 'production',
    name: _pkg.name,
  })

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

  // await Promise.all(
  //   buildFiles.map((input) =>
  //     bundle(input, buildPath, cachePath, errorExternal, 'production'),
  //   ),
  // )
  if (Object.keys(emptyInput).length) {
    await doBuild({
      input: emptyInput,
      buildPath,
      cachePath,
      env: 'development',
    })
  }
}
async function doBuild({
  input,
  cachePath,
  buildPath,
  env,
  dev = false,
  name,
}: {
  input: Record<string, string>
  buildPath: string
  cachePath: string
  env: string
  dev?: boolean
  name?: string
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
      id = id.substring('esm-pack:'.length)
      if (
        inputKeys.includes(path.join(cachePath, id)) ||
        id[0] === '.' ||
        path.isAbsolute(id) ||
        path.basename(id) === 'package.json'
      ) {
        return false
      }

      //   const ext = path.extname(id)
      //   const lastIndex = id.lastIndexOf(ext)

      //   if (
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

      //   if (id.startsWith('data:')) {
      //     return true
      //   }

      return true
    },
    plugins: [
      rollupJSONPlugin({}),
      (nodePolyfills as any)(),
      resolve({
        preferBuiltins: true,
        browser: true,
      }),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': NODE_ENV,
        'globals.process.env.NODE_ENV': NODE_ENV,
      }),
      minify && terser(),
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
      commonjs({
        extensions: EXTENSIONS,
        // esmExternals: true,
      }),
      rollupPluginWrapInstallTargets(false, [name]),
      //   {
      //     renderDynamicImport() {
      //       return { left: 'import(', right: ')' }
      //     },
      //   },
      //   rawPlugin(),
    ].filter(Boolean),
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
    preferConst: true,
    externalLiveBindings: false,
    freeze: false,
    format: 'esm',
    sourcemap: true,
    interop: false,
    // entryFileNames: (chunk) => {
    //   const fileName = path.relative(cachePath, chunk.facadeModuleId!)
    //   if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
    //     return fileName
    //   }
    //   return `${path.relative(cachePath, chunk.facadeModuleId!)}.js`
    // },
    chunkFileNames: '[name].js',
  })

  await Promise.all(
    output.map((chunk) => {
      if (chunk.type === 'chunk') {
        const map = chunk.map?.toString()
        const encoding = {
          encoding: 'utf8',
        }

        const filename = `${
          dev && !chunk.fileName.startsWith('_') ? 'dev.' : ''
        }${chunk.fileName}`
        return Promise.all([
          fs.outputFile(
            path.join(buildPath, filename),
            `/* [esm-pack] bundle for ${env}. */\t${chunk.code}`,
            encoding,
          ),
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

  return emptyInput
}
