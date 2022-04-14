import type { Plugin } from 'rollup'
import fs from 'fs'
import path from 'path'
import execa from 'execa'
import isValidIdentifier from 'is-valid-identifier'
import resolve from 'resolve'
import { APP_NAME } from '@/constants'

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

/**
 * rollup-plugin-wrap-install-targets
 *
 * How it works:
 * 1. An array of "install targets" are passed in, describing all known imports + metadata.
 * 2. If isTreeshake: Known imports are marked for tree-shaking by appending 'snowpack-wrap:' to the input value.
 * 3. If autoDetectPackageExports match: Also mark for wrapping, and use automatic export detection.
 * 4. On load, we return a false virtual file for all "snowpack-wrap:" inputs.
 *    a. That virtual file contains only `export ... from 'ACTUAL_FILE_PATH';` exports
 *    b. Rollup uses those exports to drive its tree-shaking algorithm.
 *    c. Rollup uses those exports to inform its "namedExports" for Common.js entrypoints.
 */
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

  /**
   * Attempt #1: Static analysis: Lower Fidelity, but faster.
   * Do our best job to statically scan a file for named exports. This uses "cjs-module-lexer", the
   * same CJS export scanner that Node.js uses internally. Very fast, but only works on some modules,
   * depending on how they were build/written/compiled.
   */
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

  /**
   * Attempt #2a - Runtime analysis: More powerful, but slower. (trusted code)
   * This function spins off a Node.js process to analyze the most accurate set of named imports that this
   * module supports. If this fails, there's not much else possible that we could do.
   *
   * We consider this "trusted" because it will actually run the package code in Node.js on your machine.
   * Since this is code that you are intentionally bundling into your application, we consider this fine
   * for most users and equivilent to the current security story of Node.js/npm. But, if you are operating
   * a service that runs esinstall on arbitrary code, you should set `process.env.ESINSTALL_UNTRUSTED_ENVIRONMENT`
   * so that this is skipped.
   */
  function cjsAutoDetectExportsRuntimeTrusted(
    normalizedFileName: string,
  ): string[] | undefined {
    try {
      const { stdout } = execa.sync(
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

  /**
   * Attempt #2b - Sandboxed runtime analysis: More powerful, but slower.
   * This will only work on UMD and very simple CJS files (require not supported).
   * Uses VM2 to run safely sandbox untrusted code (no access no Node.js primitives, just JS).
   * If nothing was detected, return undefined.
   */
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
