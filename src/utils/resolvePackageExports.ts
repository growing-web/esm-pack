import type { PackageJson } from 'pkg-types'
import _ from 'lodash'
import { normalizeExport } from './index'
import { recursionExportsRemoveDts } from './recursion'

export async function resolvePackageExports(
  npmFiles: string[],
  pkg: PackageJson,
) {
  let resultExports = await buildExports(npmFiles, pkg)
  resultExports = await handleWildcardExports(resultExports, npmFiles)
  return resultExports
}

async function handleWildcardExports(
  exp: Record<string, any>,
  npmFiles: string[],
) {
  const keys = Object.keys(exp)

  if (keys.every((key) => !key.includes('*'))) {
    return exp
  }
  const resultExports = exp
  keys.forEach((key) => {
    if (key.includes('*')) {
      Reflect.deleteProperty(resultExports, key)
      npmFiles.forEach((file) => {
        if (/\.([c|m]?js)$/.test(file)) {
          resultExports[file] = file
          resultExports[file.replace(/\.([c|m]?js)$/, '')] = file
        }
      })
    }
  })
  return resultExports
}

export async function buildExports(npmFiles: string[], pkg: PackageJson) {
  const { exports: _exports, module: _module } = pkg

  let resultExports: Record<string, any> = {}

  // When the export field is string
  if (typeof _exports === 'string') {
    resultExports['.'] = _exports
    return resultExports
  }

  Object.assign(resultExports, _exports)

  // When the export field does not exist
  if (!_exports) {
    resultExports = await createExportsNotExits(npmFiles, pkg)
    return resultExports
  }

  resultExports = recursionExportsRemoveDts(resultExports)

  // export field exists
  resultExports = await transformExports(resultExports, pkg, npmFiles)

  return resultExports
}

async function transformExports(
  exp: Record<string, any>,
  pkg: PackageJson,
  npmFiles: string[],
) {
  const resultExports: Record<string, any> = {}
  Object.assign(resultExports, exp)

  if (!resultExports['.']) {
    resultExports['.'] = (await createExportsNotExits(npmFiles, pkg))['.']
  }
  return resultExports
}

async function createExportsNotExits(npmFiles: string[], pkg: PackageJson) {
  const { module: _module, main, files } = pkg
  const resultExports: Record<string, any> = {}

  // Does not contain module and main fields
  if (!_module && !main) {
    for (const ext of ['js', 'mjs', 'cjs', 'json']) {
      const file = `index.${ext}`

      if (files && Array.isArray(files)) {
        if (files.includes(file) && npmFiles.includes(file)) {
          resultExports['.'] = normalizeExport(file)
        }
      } else {
        if (npmFiles.includes(file)) {
          resultExports['.'] = normalizeExport(file)
        }
      }
    }
  } else if (main && _module) {
    resultExports['.'] = resolveExportValue(main, _module)
  } else if (main && !_module) {
    resultExports['.'] = resolveMainValue(main)
  } else if (!main && _module) {
    resultExports['.'] = resolveExportValue(_module, _module)
  }

  return resultExports
}

function resolveExportValue(main: string, mod: string) {
  return {
    module: normalizeExport(mod),
    default: resolveMainValue(main),
  }
}

function resolveMainValue(main) {
  const normalizeMain = normalizeExport(main)
  return {
    development: normalizeMain,
    default: normalizeMain,
  }
}
