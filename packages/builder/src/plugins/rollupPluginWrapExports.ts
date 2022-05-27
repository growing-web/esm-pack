import type { Plugin } from 'rollup'
import fs from 'node:fs'
import path from 'node:path'
import execa from 'execa'
import isValidIdentifier from 'is-valid-identifier'
import resolve from 'resolve'
import { APP_NAME } from '../constants'

// Use CJS intentionally here! ESM interface is async but CJS is sync, and this file is sync
const { parse } = require('cjs-module-lexer')

function createTransformTarget(specifier: string, all = true) {
  return {
    specifier,
    all,
    default: false,
    namespace: false,
    named: [],
  }
}

function normalizePath(p: string) {
  return p.split(path.win32.sep).join(path.posix.sep)
}

function isJavaScript(pathname: string): boolean {
  const ext = path.extname(pathname).toLowerCase()
  return ext === '.js' || ext === '.mjs' || ext === '.cjs'
}

function isRemoteUrl(val: string): boolean {
  return /\w+:\/\//.test(val) || val.startsWith('//')
}

function isTruthy<T>(item: T | false | null | undefined): item is T {
  return Boolean(item)
}

function isValidNamedExport(name: string): boolean {
  return name !== 'default' && name !== '__esModule' && isValidIdentifier(name)
}

export function rollupPluginWrapTargets(
  isTreeshake = false,
  target?: string,
): Plugin | null {
  if (!target) {
    return null
  }
  const installTargetSummaries: { [loc: string]: any } = {}
  const cjsScannedNamedExports = new Map<string, string[]>()

  const transformTarget = createTransformTarget(target)

  function cjsAutoDetectExportsStatic(
    filename: string,
    visited = new Set(),
  ): string[] | undefined {
    const isMainEntrypoint = visited.size === 0
    // Prevent infinite loops via circular dependencies.
    if (visited.has(filename)) {
      return []
    } else {
      visited.add(filename)
    }
    const fileContents = fs.readFileSync(filename, 'utf8')
    try {
      // Attempt 1 - CJS: Run cjs-module-lexer to statically analyze exports.
      const { exports, reexports } = parse(fileContents)
      // If re-exports were detected (`exports.foo = require(...)`) then resolve them here.
      let resolvedReexports: string[] = []
      if (reexports.length > 0) {
        resolvedReexports = ([] as string[]).concat.apply(
          [],
          reexports
            .map((e) =>
              cjsAutoDetectExportsStatic(
                resolve.sync(e, { basedir: path.dirname(filename) }),
                visited,
              ),
            )
            .filter(isTruthy),
        )
      }
      // If nothing was detected, return undefined.
      // Otherwise, resolve and flatten all exports into a single array, remove invalid exports.
      const resolvedExports = Array.from(
        new Set([...exports, ...resolvedReexports]),
      ).filter(isValidNamedExport)
      return isMainEntrypoint && resolvedExports.length === 0
        ? undefined
        : resolvedExports
    } catch (err: any) {
      return undefined
    }
  }

  function cjsAutoDetectExportsRuntimeTrusted(
    normalizedFileName: string,
  ): string[] | undefined {
    try {
      const { stdout } = execa.execaSync(
        `node`,
        ['-p', `JSON.stringify(Object.keys(require('${normalizedFileName}')))`],
        {
          cwd: __dirname,
          extendEnv: false,
        },
      )
      return JSON.parse(stdout).filter(isValidNamedExport)
    } catch (err: any) {
      return undefined
    }
  }

  function cjsAutoDetectExportsRuntimeUntrusted(): string[] | undefined {
    try {
      return exports.filter((identifier) => isValidIdentifier(identifier))
    } catch (err: any) {
      return undefined
    }
  }
  return {
    name: 'rollup-plugin-wrap-exports',
    // Mark some inputs for tree-shaking.
    buildStart(inputOptions) {
      const input = inputOptions.input as { [entryAlias: string]: string }

      for (const [key, val] of Object.entries(input)) {
        if (isRemoteUrl(val)) {
          continue
        }
        if (!isJavaScript(val)) {
          continue
        }

        installTargetSummaries[val] = transformTarget
        const normalizedFileLoc = normalizePath(val)

        const cjsExports =
          // If we can trust the static analyzer, run that first.
          cjsAutoDetectExportsStatic(val) ||
          // Otherwise, run our more powerful, runtime analysis.
          // Attempted trusted first (won't run in untrusted environments).
          cjsAutoDetectExportsRuntimeTrusted(normalizedFileLoc) ||
          cjsAutoDetectExportsRuntimeUntrusted()

        if (cjsExports && cjsExports.length > 0) {
          cjsScannedNamedExports.set(normalizedFileLoc, cjsExports)
          input[key] = `${APP_NAME}:${val}`
        }
      }
    },
    resolveId(id) {
      if (id.startsWith(`${APP_NAME}:`)) {
        return id
      }
      return null
    },
    load(id) {
      if (!id.startsWith(`${APP_NAME}:`)) {
        return null
      }
      const fileLoc = id.substring(`${APP_NAME}:`.length)
      const installTargetSummary = installTargetSummaries[fileLoc]
      let uniqueNamedExports = Array.from(new Set(installTargetSummary.named))
      const normalizedFileLoc = normalizePath(fileLoc)

      const scannedNamedExports = cjsScannedNamedExports.get(normalizedFileLoc)
      if (
        scannedNamedExports &&
        (!isTreeshake || installTargetSummary.namespace)
      ) {
        uniqueNamedExports = scannedNamedExports || []
        installTargetSummary.default = true
      }
      const result = `
        ${
          installTargetSummary.namespace
            ? `export * from '${normalizedFileLoc}';`
            : ''
        }
        ${
          installTargetSummary.default
            ? `import _web_default_export_for_treeshaking__ from '${normalizedFileLoc}'; export default _web_default_export_for_treeshaking__;`
            : ''
        }
        ${`export {${uniqueNamedExports.join(
          ',',
        )}} from '${normalizedFileLoc}';`}
      `
      return result
    },
  }
}
