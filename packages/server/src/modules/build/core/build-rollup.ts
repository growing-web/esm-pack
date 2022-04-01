import { rollup } from 'rollup'
import json from '@rollup/plugin-json'
// import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import path from 'pathe'
import fs from 'fs-extra'
import { init, parse } from 'es-module-lexer'

export async function build(
  buildFiles: string[],
  buildPath: string,
  cachePath: string,
) {
  const input: Record<string, string> = {}
  await init
  let importers: string[] = []
  buildFiles.forEach((file) => {
    const content = fs.readFileSync(file, { encoding: 'utf-8' })
    const isCjs =
      content.includes('require(') || content.includes('module.exports')
    if (!isCjs) {
      const [iimports] = parse(content)
      importers.push(...iimports.map((item) => item.n || ''))
    }

    let basename = path.basename(file)
    if (basename.indexOf('.') !== -1) {
      basename = basename.substring(0, basename.lastIndexOf('.'))
    }
    let inputName = basename
    let i = 0
    while (inputName in input) {
      inputName = basename + i++
    }
    input[inputName] = file
  })

  importers = importers.filter((item) => {
    if (!item || item.startsWith('.') || item.startsWith('/')) {
      return false
    }
    return true
  })

  const bundle = await rollup({
    input,
    preserveEntrySignatures: 'strict',
    onwarn: (warning, handler) => {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        return
      }
      handler(warning)
    },
    external: importers,
    plugins: [
      esbuild({
        target: 'es2021',
        include: /\.[m|c]?js$/,
        sourceMap: true,
        // minify: true,
        // legalComments: 'none',
        // define: {
        //   'process.env.NODE_ENV': 'production',
        // },
      }),
      json(),
      resolve({
        preferBuiltins: true,
        browser: true,
      }),
      commonjs({
        esmExternals: true,
      }),
      //   terser({ format: { comments: false } }),
    ],
  })

  const { output } = await bundle.generate({
    dir: buildPath,
    indent: true,
    // preserveModules: true,
    // interop: 'esModule',
    esModule: true,
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
      return Promise.all([
        fs.outputFile(
          path.join(buildPath, chunk.fileName),
          // @ts-ignore
          chunk.code,
          { encoding: 'utf8' },
        ),
        fs.outputFile(
          path.join(buildPath, `${chunk.fileName}.map`),
          // @ts-ignore
          chunk.map.toString(),
          { encoding: 'utf8' },
        ),
      ])
    }),
  )
}
