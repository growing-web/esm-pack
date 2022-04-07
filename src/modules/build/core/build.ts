import esbuild, { BuildOptions } from 'esbuild'
import fs from 'fs-extra'
import MagicString from 'magic-string'
import path from 'pathe'
import NodeModulesPolyfills from '@esbuild-plugins/node-modules-polyfill'

// ! Unfinished, packaged by esbuild
export async function build(
  buildFiles: string[],
  buildsPath: string,
  cachePath: string,
) {
  await Promise.all(
    buildFiles.map((input) => doBuild(input, buildsPath, cachePath)),
  )
}

export async function doBuild(
  input: string,
  buildsPath: string,
  cachePath: string,
) {
  const external: string[] = []

  const minify = false

  const options: BuildOptions = {
    entryPoints: [input],
    outfile: path.join(buildsPath, path.relative(cachePath, input)),
    bundle: true,
    write: false,
    sourcemap: true,
    target: 'es2021',
    format: 'esm',
    minifySyntax: minify,
    minifyIdentifiers: minify,
    minifyWhitespace: minify,
    minify: minify,
    define: resolveDefine(),
    plugins: [
      NodeModulesPolyfills(),
      {
        name: 'esm-resolver',
        setup(api) {
          api.onResolve({ filter: /.*/ }, (args) => {
            const ext = path.extname(args.path)
            const lastIndex = args.path.lastIndexOf(ext)
            if (
              args.path.includes(
                path.join(args.path.substring(0, lastIndex)),
              ) &&
              input !== args.path
            ) {
              return { path: args.path, external: true }
            }

            if (args.path[0] === '.' || path.isAbsolute(args.path)) {
              // Fallback to default
              return
            }

            if (args.path.startsWith('data:')) {
              return { external: true }
            }

            const specifier = args.path
              .replace(/\/$/, '')
              .replace(/^(node:)/, '')

            if (!args.path.startsWith('.') && !args.path.startsWith('/')) {
              external.push(specifier)
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

  await Promise.all(
    (result.outputFiles || []).map((file) => {
      const outputContent = file.contents
      let content = Buffer.from(outputContent).toString()
      const s = new MagicString(content)

      if (path.basename(file.path).includes('package.js')) {
        file.path = file.path.replace('package.js', 'package.json.js')
      }

      if (file.path.endsWith('.js')) {
        //   if (content.includes('__Process$')) {
        //     s.prependLeft(
        //       0,
        //       `import __Process$ from "${POLYFILL_PREFIX}/node-process.js";`,
        //     )
        //   }

        //   if (content.includes('__Buffer$')) {
        //     s.prependLeft(
        //       0,
        //       `import __Buffer$ from "${POLYFILL_PREFIX}/node-buffer.js";`,
        //     )
        //   }

        //   if (content.includes('__global$')) {
        //     s.prependLeft(
        //       0,
        //       `var __global$ = globalThis || (typeof window !== "undefined" ? window : self);`,
        //     )
        //   }

        if (content.includes('__setImmediate$')) {
          s.prependLeft(
            0,
            `var __setImmediate$ = (cb, ...args) => setTimeout(cb, 0, ...args);`,
          )
        }

        if (content.includes('__rResolve$')) {
          s.prependLeft(0, `var __rResolve$ = p => p;`)
        }
        s.prependLeft(0, `/* esbuild bundle. */\n`)
        content = s.toString()
        content = content.replace(`typeof window<"u"`, `typeof document<"u"`)
      }
      return fs.outputFile(file.path, content)
    }),
  )
}

function resolveDefine() {
  const NODE_ENV = JSON.stringify('production')

  const define: Record<string, string> = {
    // process: '__Process$',
    // Buffer: '__Buffer$',
    // setImmediate: '__setImmediate$',
    clearImmediate: 'clearTimeout',
    'require.resolve': '__rResolve$',
    'process.env.NODE_ENV': NODE_ENV,
    // global: '__global$',
    'global.clearImmediate': 'clearTimeout',
    // 'global.process': '__Process$',
    'global.process.env.NODE_ENV': NODE_ENV,
    // 'global.require.resolve': '__rResolve$',
    // 'global.Buffer': '__Buffer$',
    'global.setImmediate': '__setImmediate$',
  }

  return define
}

// function inferLoader(ext: string): Loader {
//   if (ext === '.mjs' || ext === '.cjs') return 'js'
//   return ext.slice(1) as Loader
// }
