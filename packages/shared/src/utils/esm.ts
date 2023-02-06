import { init, parse } from 'es-module-lexer'
import { build, BuildOptions } from 'esbuild'
import fg from 'fast-glob'

export async function isEsmFile(content: string) {
  await init
  try {
    const [imports, exp] = parse(content)
    return exp.length > 0 || imports.length > 0
  } catch (error) {
    return false
  }
}

export async function minifyEsmFiles(cwd: string) {
  const files = fg.sync('**/**.{js,mjs}', { cwd, absolute: true })

  const options: BuildOptions = {
    entryPoints: files,
    outdir: cwd,
    outbase: cwd,
    bundle: true,
    write: true,
    sourcemap: false,
    format: 'esm',
    minifySyntax: true,
    minifyIdentifiers: true,
    minifyWhitespace: true,
    minify: true,
    allowOverwrite: true,
    plugins: [
      {
        name: 'esm-resolver',
        setup(api) {
          api.onResolve({ filter: /.*/ }, (arg) => {
            return {
              external: !files.includes(arg.path),
            }
          })
        },
      },
    ],
  }

  await build(options)
}
