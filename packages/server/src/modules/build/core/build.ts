import esbuild, { BuildOptions } from 'esbuild'
import fs from 'fs-extra'
import MagicString from 'magic-string'
import { POLYFILL_PREFIX } from '../../../constants'
// import { parse as cjsParse } from 'cjs-esm-exports'

export async function build(
  buildFiles: string[],
  buildsPath: string,
  _cachePath: string,
) {
  //   const duplicateSet = new Set()
  //   const extList: string[][] = [
  //     ['js', 'cjs'],
  //     ['mjs', 'js'],
  //     ['mjs', 'cjs'],
  //   ]

  //   files.forEach((file) => {
  //     const ext = path.extname(file)
  //     const filename = file.replace(ext, '')
  //     extList.forEach(([a, b]) => {
  //       if (
  //         files.includes(filename + `.${a}`) &&
  //         files.includes(filename + `.${b}`)
  //       ) {
  //         duplicateSet.add(filename + `.${b}`)
  //       }
  //     })
  //   })

  //   await init

  //   let importers: string[] = []
  //   buildFiles.forEach((file) => {
  //     const content = fs.readFileSync(file, { encoding: 'utf-8' })
  //     const isCjs =
  //       content.includes('require(') || content.includes('module.exports')
  //     if (!isCjs) {
  //       const [iimports] = parse(content)
  //       importers.push(...iimports.map((item) => item.n || ''))
  //     }
  //   })

  //   importers = importers.filter((item) => {
  //     if (!item || item.startsWith('.') || item.startsWith('/')) {
  //       return false
  //     }
  //     return true
  //   })

  const minify = true
  //   const externalSet = new Set<string>()
  //   const external: string[] = []
  const options: BuildOptions = {
    entryPoints: buildFiles,
    outdir: buildsPath,
    bundle: true,
    write: false,
    sourcemap: true,
    target: 'es2021',
    format: 'esm',
    minifySyntax: minify,
    minifyIdentifiers: minify,
    minifyWhitespace: minify,
    minify: minify,
    // external: importers,
    define: {
      global: '__global$',
      'global.setImmediate': '__setImmediate$',
      'global.clearImmediate': 'clearTimeout',
      'global.process': JSON.stringify('__Process$'),
      process: JSON.stringify('__Process$'),
      'require.resolve': '__rResolve$',
      'global.require.resolve': '__rResolve$',
      'global.Buffer': JSON.stringify('__Buffer$'),
      Buffer: JSON.stringify('__Buffer$'),
      'process.env.NODE_ENV': JSON.stringify('production'),
      'global.process.env.NODE_ENV': JSON.stringify('production'),
    },
    plugins: [
      {
        name: 'esm-resolver',
        setup(api) {
          api.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.startsWith('data:')) {
              return { external: true }
            }

            // const specifier = args.path
            //   .replace(/\/$/, '')
            //   .replace(/^(node:)/, '')

            if (!args.path.startsWith('.') && !args.path.startsWith('/')) {
              return { external: true }
            }
            return {}
          })
        },
      },
    ],
  }

  const result = await esbuild.build(options)
  if (result.errors.length > 0) {
    const msg = result.errors[0].text
    console.error('esbuild: ', msg)
    return
  }

  for (const file of result.outputFiles || []) {
    const outputContent = file.contents
    let content = Buffer.from(outputContent).toString()
    const s = new MagicString(content)
    if (file.path.endsWith('.js')) {
      if (content.includes('__Process$')) {
        s.prependLeft(
          0,
          `import __Process$ from "${POLYFILL_PREFIX}/node-process.js";`,
        )
      }

      if (content.includes('__Buffer$')) {
        s.prependLeft(
          0,
          `import __Buffer$ from "${POLYFILL_PREFIX}/node-buffer.js";`,
        )
      }

      if (content.includes('__global$')) {
        s.prependLeft(
          0,
          `var __global$ = globalThis || (typeof window !== "undefined" ? window : self);`,
        )
      }

      if (content.includes('__setImmediate$')) {
        s.prependLeft(
          0,
          `var __setImmediate$ = (cb, ...args) => setTimeout(cb, 0, ...args);`,
        )
      }

      if (content.includes('__rResolve$')) {
        s.prependLeft(0, `var __rResolve$ = p => p;`)
      }
      content = s.toString()
      content = content.replace(`typeof window<"u"`, `typeof document<"u"`)
    }
    fs.outputFileSync(file.path, content)
  }
}
