import type { PackageJson } from 'pkg-types'
import { readPackageJSON } from 'pkg-types'
import { recursionExportsValues, recursionExportsRemoveDts } from './recursion'
import fg from 'fast-glob'
import _ from 'lodash'
import { normalizeExport, fileExits } from '../../../utils'
import path from 'path'
import fs from 'fs-extra'

export async function resolvePackage(cachePath: string) {
  let pkg = await readPackageJSON(cachePath)
  // @ts-ignore
  if (pkg.__ESMD__) {
    return pkg
  }

  pkg = fixNpmPackage(pkg)

  const pkgExports = await resolveExports(pkg, cachePath)
  const files = await resolveFiles(pkg, cachePath, pkgExports)
  pkg.exports = pkgExports
  pkg.files = files

  // @ts-ignore
  pkg.__ESMD__ = true
  return pkg
}

function fixNpmPackage(pkg: PackageJson) {
  const { exports: Exports, type } = pkg

  if (_.isString(Exports)) {
    if (type === 'module') {
      pkg.module ||= Exports
    } else {
      pkg.main ||= Exports
    }
  } else {
    const names = ['es2015', 'module', 'import', 'browser', 'worker']
    if (type === 'module') {
      names.push(...['production', 'default'])
    }
    for (const name of names) {
      const value = Exports?.[name]
      if (value && _.isString(value)) {
        pkg.module ||= value
      }
    }

    for (const name of ['require', 'node', 'default']) {
      const value = Exports?.[name]
      if (value && _.isString(value)) {
        pkg.main ||= value
      }
    }
    for (const [key, value] of Object.entries(Exports || {})) {
      if (value && _.isString(value)) {
        switch (key) {
          case 'types':
            pkg.types ||= value
            break
          case 'typings':
            pkg.typings ||= value
        }
      }
    }
  }

  if (!pkg.module) {
    if (pkg['jsnext:main']) {
      pkg = pkg['jsnext:main']
    } else if ((pkg as any).es2015) {
      pkg = (pkg as any).es2015
    } else if (
      pkg.main &&
      (pkg.type !== 'module' ||
        pkg.main?.includes('/esm/') ||
        pkg.main?.includes('/es/') ||
        pkg.main?.endsWith('.mjs'))
    ) {
      pkg.module = pkg.main
    }
  }

  if (pkg.types === '' && pkg.typings !== '') {
    pkg.types = pkg.typings
  }
  return pkg
}

export async function resolveExports(pkg: PackageJson, root: string) {
  const { files: originFiles = [] } = pkg

  let resultExports = await buildExports(pkg, root)

  for (const file of originFiles) {
    if (/(\.m?js)$/.test(file) && !file.includes('*')) {
      const lastIndex = file.lastIndexOf(path.extname(file))
      const excludeExtFile = file.substring(0, lastIndex)
      if (!file.startsWith('.') && !file.startsWith('/')) {
        resultExports[`./${file}`] = `./${file}`
        resultExports[`./${excludeExtFile}`] = `./${file}`
      } else if (file.startsWith('/')) {
        resultExports[`/${file}`] = `/${file}`
        resultExports[`/${excludeExtFile}`] = `/${file}`
      } else if (file.startsWith('.')) {
        resultExports[file] = file
        resultExports[excludeExtFile] = file
      }
    }
  }

  resultExports = await resolveExportsDirectory(resultExports, root)

  resultExports = await handleWildcardExports(resultExports, root)

  //   const mergedCjsExports = await createCjsField(resultExports, root)
  Object.assign(
    resultExports,
    //  mergedCjsExports,
    {
      './package.json': './package.json.js',
      // './package.json.js!cjs': './package.json.js',
    },
  )

  return resultExports
}

async function resolveExportsDirectory(
  resultExports: Record<string, any>,
  root: string,
) {
  let values = recursionExportsValues(resultExports)
  values = values.filter((item) => !item.includes('package.json'))

  let dirs = values
    .map((value) => {
      return path.dirname(value).replace(/^(\.\/)/, '')
    })
    .filter((item) => item !== '.')
  dirs = Array.from(new Set(dirs))

  // Try to count the folders with high probability
  const libDirs: string[] = ['dist', 'lib', 'umd', 'cjs', 'es', 'esm']

  libDirs.forEach((libDir) => {
    if (fs.existsSync(path.join(root, libDir)) && !dirs.includes(libDir)) {
      dirs.push(libDir)
    }
  })

  dirs.forEach((dir) => {
    resultExports[`./${dir}/*`] = `./${dir}/*`
  })

  return resultExports
}

async function handleWildcardExports(exp: Record<string, any>, root: string) {
  const keys = Object.keys(exp)

  if (keys.every((key) => !key.includes('*'))) {
    return exp
  }

  const resultExports = exp
  keys.forEach((key) => {
    if (key.includes('*')) {
      Reflect.deleteProperty(resultExports, key)
      const files = fg.sync(key, { cwd: root })
      files.forEach((file) => {
        if (/\.([c|m]?js)$/.test(file)) {
          resultExports[file] = file
          resultExports[file.replace(/\.([c|m]?js)$/, '')] = file
        }
      })
    }
  })
  return resultExports
}

export async function buildExports(pkg: PackageJson, root: string) {
  const { exports: _exports, module: _module, type } = pkg

  let resultExports: Record<string, any> = {}

  // When the export field is string
  if (typeof _exports === 'string') {
    if (type === 'module') {
      pkg.module = _exports
    }
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

async function resolveFiles(
  pkg: PackageJson,
  root: string,
  pkgExports: Record<string, any>,
) {
  let { files = [] } = pkg

  files = files.filter((item) => {
    return !(
      //   item.includes('.d.ts') ||
      (item.includes('*') || !item.endsWith('js'))
    )
  })

  // add package.json、package.json.js to files
  files.push(...['', '.js'].map((item) => `package.json${item}`))

  // exports file
  const values = recursionExportsValues(pkgExports)

  files.push(
    ...values.map((item) => {
      return item.replace(/^\.?\//, '')
    }),
  )

  // Add .map to js file
  files.forEach((item) => {
    if (/\.js$/.test(item) && !item.includes('*')) {
      files.push(`${item}.map`)
    }
  })

  // add license and readme.md to files
  const matchFiles = await fg(['license', 'readme.md', 'changelog.md'], {
    cwd: root,
    caseSensitiveMatch: false,
  })

  const matchTsFiles = await fg('./*.d.ts', {
    cwd: root,
    caseSensitiveMatch: false,
  })

  files.push(...matchFiles, ...matchTsFiles)
  return Array.from(new Set(files)).sort()
}

// export async function createCjsField(
//   resultExports: Record<string, any>,
//   root: string,
// ) {
//   await init
//   const values = recursionExportsValues(resultExports)
//   const result: Record<string, any> = {}

//   await Promise.all(
//     values.map((item) => {
//       const filePath = path.resolve(root, item)
//       if (fs.existsSync(filePath)) {
//         // const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
//         const [, _exports] = parse(
//           fs.readFileSync(filePath, { encoding: 'utf-8' }),
//         )

//         const isCjs = _exports.length === 0
//         if (isCjs) {
//           result[`${item}!cjs`] = item
//         }
//       }
//       return true
//     }),
//   )
//   return result
// }
