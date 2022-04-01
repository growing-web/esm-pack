import type { PackageJson } from 'pkg-types'
import _ from 'lodash'
import { normalizeExport, fileExits } from '../../../utils'
import path from 'path'
import { recursionExportsRemoveDts } from './recursion'

export async function buildExports(pkg: PackageJson, root: string) {
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
    resultExports = await createExportsNotExits(root, pkg)
    return resultExports
  }

  resultExports = recursionExportsRemoveDts(resultExports)

  // export field exists
  resultExports = await transformExports(resultExports, pkg, root)

  return resultExports
}

async function transformExports(
  exp: Record<string, any>,
  pkg: PackageJson,
  root: string,
) {
  const resultExports: Record<string, any> = {}
  Object.assign(resultExports, exp)

  if (!resultExports['.']) {
    resultExports['.'] = (await createExportsNotExits(root, pkg))['.']
  }
  return resultExports
}

async function createExportsNotExits(root: string, pkg: PackageJson) {
  const { module: _module, main, files } = pkg
  const resultExports: Record<string, any> = {}

  // Does not contain module and main fields
  if (!_module && !main) {
    for (const ext of ['js', 'mjs', 'cjs', 'json']) {
      const file = `index.${ext}`

      if (files && Array.isArray(files)) {
        if (files.includes(file) && fileExits(path.resolve(root, file))) {
          resultExports['.'] = normalizeExport(file)
        }
      } else {
        if (fileExits(path.resolve(root, file))) {
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
