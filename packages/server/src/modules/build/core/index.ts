import { rollup } from 'rollup'
import json from '@rollup/plugin-json'
// import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import path from 'pathe'
import fs from 'fs-extra'

export async function build(
  buildFiles: string[],
  outDir: string,
  tempPath: string,
) {
  const input: Record<string, string> = {}

  buildFiles.forEach((file) => {
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

  const bundle = await rollup({
    input,
    // treeshake: false,
    // context: 'globalThis',
    preserveEntrySignatures: 'strict',
    onwarn: (warning, handler) => {
      if (warning.code === 'UNRESOLVED_IMPORT') {
        return
      }
      handler(warning)
    },
    plugins: [
      esbuild({
        include: /\.[m|c]?js$/,
        sourceMap: true,
        minify: true,
        legalComments: 'none',
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
    dir: outDir,
    indent: true,
    // preserveModules: true,
    // interop: 'esModule',
    esModule: true,
    format: 'esm',
    sourcemap: true,
    entryFileNames: (chunk) => {
      const fileName = path.relative(tempPath, chunk.facadeModuleId!)
      if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
        return fileName
      }
      return `${path.relative(tempPath, chunk.facadeModuleId!)}.js`
    },
  })

  fs.ensureDirSync(outDir)

  await Promise.all(
    output.map((chunk) => {
      return Promise.all([
        fs.outputFile(
          path.join(outDir, chunk.fileName),
          // @ts-ignore
          chunk.code,
          { encoding: 'utf8' },
        ),
        fs.outputFile(
          path.join(outDir, `${chunk.fileName}.map`),
          // @ts-ignore
          chunk.map.toString(),
          { encoding: 'utf8' },
        ),
      ])
    }),
  )
}
