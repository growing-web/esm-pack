import type { PackageJson } from 'pkg-types'
import path from 'node:path'
import fg from 'fast-glob'
import fs from 'fs-extra'
import _ from 'lodash'
import { parse as cjsParse } from 'cjs-esm-exports'
import { init as esInit, parse as esParse } from 'es-module-lexer'
import { readPackageJSON } from 'pkg-types'
import { fileResolveByExtension, fileReader } from './utils'
import { enableSourceMap } from './config'
import { FILE_EXCLUDES, FILE_EXTENSIONS, FILES_IGNORE } from './constants'
import { recursionExportsValues } from './recursion'

type Recordable = Record<string, any>

const DEFAULT_ENTRY = 'index.js'

const IGNORE_KEYS = ['default', 'types', 'typings', 'development', 'browser']

const JS_RE = /\.[m]?js$/

export async function resolvePackage(cachePath: string) {
  const pkg = await readPackageJSON(cachePath)
  // @ts-ignore

  if (pkg?.files?.includes('package.json.js')) {
    return pkg
  }

  const pkgExports = await resolveExports(pkg, cachePath)

  const files = await resolveFiles(pkg, cachePath, pkgExports)
  pkg.exports = pkgExports
  pkg.files = files

  // pkg.imports
  Object.assign(pkg, await resolveImports(pkg))

  return pkg
}

export async function resolveImports(pkg: Recordable) {
  const { browser } = pkg
  if (!browser || !_.isObject(browser)) {
    return {}
  }

  const pkgBrowser: any = browser

  const resultImport = pkgBrowser?.import ?? {}

  for (const [key, value] of Object.entries(pkgBrowser)) {
    const importKey = `#${key.replace(/^((\.+)?\/?)/, '')}`
    if (resultImport[importKey]) {
      continue
    }
    Object.assign(resultImport, {
      [importKey]: {
        browser: normalizeExport(value as string),
        default: normalizeExport(key),
      },
    })
  }
  return { imports: resultImport }
}

export async function resolveExports(pkg: PackageJson, root: string) {
  const {
    module: pkgModule,
    main: pkgMain,
    browser: pkgBrowser,
    files: pkgFiles = [],
  } = pkg as any

  let { exports: pkgExports } = pkg as any
  const cjsMainFiles: string[] = []

  const unStandard = !pkgExports && !pkgMain && !pkgModule

  // exports exits
  if (pkgExports !== undefined && pkgExports !== null) {
    // export include {"./*":"./*"}
    if (_.isObject(pkgExports)) {
      if (pkgExports['./*'] === './*') {
        const result = await addCjsFiledToExports({
          root,
          pkgExports,
          cjsMainFiles,
        })
        return await transformResultExports(result, root)
      }
      pkgExports['./package.json'] = './package.json.js'
    }
    if (_.isString(pkgExports)) {
      pkgExports = { '.': pkgExports }
    }

    for (const [key, pattern] of Object.entries(pkgExports)) {
      if (
        (key.includes('*') &&
          _.isString(pattern) &&
          (pattern as string).includes('*')) ||
        (key.endsWith('/') &&
          _.isString(pattern) &&
          (pattern as string).endsWith('/'))
      ) {
        await addMatchFileToExports(pattern as string, pkgExports, root)
        continue
      }
      if (_.isObject(pattern)) {
        await handleObjectPattern({
          root,
          pkgExports,
          key,
          pattern: pattern as Recordable,
        })
      }
    }

    const result = await addCjsFiledToExports({
      root,
      pkgExports,
      cjsMainFiles,
    })
    return await transformResultExports(result, root)
  } else if (!pkgExports) {
    // const cjsManiFiles: string = []

    // no exports exist
    const resultExports: Recordable = {}

    // module and main do not exist
    if (!pkgModule && !pkgMain) {
      const normalizePkgMain = normalizeExport(guessEntryFile(root, pkgFiles))
      const addonCjsMainFiles = await createCjsMainFiles(root, normalizePkgMain)
      cjsMainFiles.push(...addonCjsMainFiles)

      Object.assign(resultExports, {
        '.': normalizePkgMain,
      })
    }
    // module and main is exits
    else if (pkgModule && pkgMain) {
      const normalizePkgMain = normalizeExport(pkgMain)
      const normalizepkgModule = normalizeExport(pkgModule)
      const addonCjsMainFiles = await createCjsMainFiles(root, normalizePkgMain)
      cjsMainFiles.push(...addonCjsMainFiles)

      Object.assign(resultExports, {
        '.': await resolveMainAndModule(
          root,
          normalizePkgMain,
          normalizepkgModule,
          pkgBrowser,
        ),
      })

      if (!pkgBrowser) {
        Object.assign(resultExports, await joinFilesToExports(root, pkgFiles))
      }

      resultExports['./package.json'] = './package.json.js'

      Object.assign(resultExports, {
        [normalizePkgMain]: await resolveMain(root, normalizePkgMain),
        [normalizepkgModule]: normalizepkgModule,
      })
    } else if (!pkgModule && pkgMain) {
      const normalizePkgMain = normalizeExport(pkgMain)
      const addonCjsMainFiles = await createCjsMainFiles(root, normalizePkgMain)
      cjsMainFiles.push(...addonCjsMainFiles)

      Object.assign(resultExports, {
        '.': await resolveMain(root, normalizePkgMain),
        [normalizePkgMain]: await resolveMain(root, normalizePkgMain),
      })

      resultExports['./package.json'] = './package.json.js'

      Object.assign(resultExports, await joinFilesToExports(root, pkgFiles))
    }

    pkgExports = resultExports
  }

  if (unStandard) {
    pkgExports['./package.json'] = './package.json.js'
  }

  let result = await addCjsFiledToExports({ root, pkgExports, cjsMainFiles })

  result = await handlerPkgBrowser(pkgBrowser as any, result)

  return await transformResultExports(result, root)
}

export async function resolveFiles(
  pkg: PackageJson,
  root: string,
  pkgExports: Record<string, any>,
) {
  let { files = [] } = pkg
  files = []

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
  if (enableSourceMap) {
    files.forEach((item) => {
      if (/\.[m|c]?js$/.test(item) && !item.includes('*')) {
        files.push(`${item}.map`)
      }
    })
  }

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
  files = files.filter((item) => !['*', '.', './', './*'].includes(item))

  return Array.from(new Set(files)).sort()
}

async function transformResultExports(resultExports: Recordable, root: string) {
  const pkgExports = await developmentifyExports(resultExports, root)

  const ret: Recordable = {}

  for (const [key, value] of Object.entries(pkgExports)) {
    const basename = path.basename(key)
    // TODO lodash、ramda、underscore 等多入口包，_开头为私有包，应该跳过，该方法不是很优雅，但能适合大多数的包，如果有特殊的包，可以优化逻辑
    if (basename.startsWith('_')) {
      continue
    }
    ret[key] = value
  }

  return ret
}

async function developmentifyExports(pkgExports: Recordable, root: string) {
  for (const [key, value] of Object.entries(pkgExports)) {
    const ext = path.extname(key)

    if (
      !ext ||
      key.endsWith('.prod.cjs') ||
      !['.js', '.cjs'].includes(ext) ||
      !_.isString(value) ||
      key === './index.js'
    ) {
      continue
    }

    const filepath = path.join(root, key)
    if (!fs.existsSync(filepath)) {
      continue
    }

    const { isEsm } = await getFileType(root, key)
    if (isEsm) {
      continue
    }

    const content = fileReader(filepath)
    const dynamicEntry = await isDynamicEntry(content)
    if (dynamicEntry) {
      const devKeys = await resolveDevFilename(key)
      const itemExports = {
        default: key,
        development: devKeys,
      }
      pkgExports[key] = itemExports
      const unExtKey = key.substring(0, key.length - ext.length)
      if (pkgExports[unExtKey]) {
        pkgExports[unExtKey] = itemExports
      }
    }
  }

  return pkgExports
}

async function joinFilesToExports(root: string, pkgFiles: string[]) {
  const resultExports: Recordable = {}
  const getFiles = await findPkgFiles(root, pkgFiles)
  getFiles.forEach((file) => {
    const fileKey = normalizeExport(file)
    if (!fileKey.endsWith('.cjs.js')) {
      resultExports[fileKey] = fileKey
      if (JS_RE.test(fileKey)) {
        resultExports[removeFileExt(fileKey)] = fileKey
      }
    }
  })
  return resultExports
}

async function handlerPkgBrowser(
  pkgBrowser: Recordable | undefined,
  pkgExports: Recordable,
) {
  if (!pkgBrowser || _.isString(pkgBrowser)) {
    return pkgExports
  }

  const resultExports = pkgExports
  for (const [key, value] of Object.entries(pkgBrowser)) {
    if (!resultExports[key] || _.isString(resultExports[key])) {
      resultExports[removeFileExt(key)] = resultExports[key] = {
        default: normalizeExport(key),
        browser: normalizeExport(value),
      }
    }
  }
  return resultExports
}

async function createCjsMainFiles(root: string, pkgMain: string) {
  const { isCjs } = await getFileType(root, pkgMain)
  //   const isDynamic = await getIsDynamic(root, pkgMain)
  const cjsMainFiles: string[] = []
  if (isCjs) {
    cjsMainFiles.push(...[pkgMain])
  }
  return cjsMainFiles
}

async function findPkgFiles(root: string, pkgFiles: string[] = []) {
  const pattern =
    pkgFiles.length === 0
      ? '**/**'
      : pkgFiles.map((item) => {
          if (item.includes('*') || path.extname(item)) {
            return item
          } else {
            const filepath = path.join(root, item)
            if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
              return item
            }
            return `${item}${item.endsWith('/') ? '' : '/'}**/**.js`
          }
        })
  const files = await fg(pattern, { cwd: root, ignore: FILES_IGNORE })
  const pkg = await readPackageJSON(root)
  return files.filter((item) => {
    const ext = path.extname(item)
    if (!ext || ext === '.ts' || excludeFiles(pkg, item)) {
      return false
    }
    return FILE_EXTENSIONS.includes(ext)
  })
}

function excludeFiles(pkg: Recordable, file: string) {
  return (
    // test files
    FILE_EXCLUDES.some((item) => file.includes(item)) ||
    // min files
    file.endsWith('.min.js') ||
    file.endsWith('.prod.js') ||
    // dev files
    file.endsWith('.development.js') ||
    file.endsWith('.dev.js') ||
    // global files
    file.endsWith('.global.js')
  )
}

// function filterFiles() {}

async function handleObjectPattern({
  root,
  pkgExports,
  key,
  pattern,
}: {
  root: string
  pkgExports: Recordable
  key: string
  pattern: Recordable
}) {
  for (const [pkey, pval] of Object.entries(pattern)) {
    if (IGNORE_KEYS.includes(pkey)) {
      continue
    }
    if (_.isString(pval)) {
      if (
        pattern.import &&
        pattern.require &&
        _.isString(pattern.import) &&
        _.isString(pattern.require) &&
        pattern.require !== pattern.import
      ) {
        continue
      }

      pkgExports[key][pkey] = await resolveMain(root, pval)
    } else if (_.isObject(pval)) {
      for (const [ik, iv] of Object.entries(pval)) {
        if (IGNORE_KEYS.includes(ik)) {
          continue
        }
        if (_.isString(iv)) {
          pkgExports[key][pkey][ik] = await resolveMain(root, iv as string)
        }
      }
    }
  }
}

async function addMatchFileToExports(
  pattern: string,
  pkgExports: Recordable,
  cwd: string,
) {
  const files = fg.sync(pattern.endsWith('/') ? `${pattern}*` : pattern, {
    cwd,
  })

  for (const key of files) {
    pkgExports[key] = normalizeExport(key)
  }
}

async function addCjsFiledToExports({
  root,
  pkgExports,
  cjsMainFiles,
}: {
  root: string
  pkgExports: Recordable
  cjsMainFiles: string[]
}) {
  for (const [key, value] of Object.entries(pkgExports)) {
    // {require:'./index'}
    if (_.isObject(value)) {
      const requireFile = (value as any).require
      if (requireFile) {
        if (_.isString(requireFile)) {
          pkgExports[`${requireFile}!cjs`] = requireFile
        } else if (_.isObject(requireFile)) {
          for (const rval of Object.values(requireFile)) {
            pkgExports[`${rval}!cjs`] = rval
          }
        }
      }
    } else {
      try {
        if (!key.includes('*') && !key.startsWith('.ts')) {
          if (JS_RE.test(key)) {
            const { isCjs } = await getFileType(root, key)
            if (isCjs) {
              pkgExports[`${key}!cjs`] = key
            }
          } else if (key.endsWith('package.json')) {
            pkgExports[`${value}!cjs`] = value
          }
        }
      } catch (error) {
        // No error will be reported for files that cannot be obtained
      }
    }
  }

  for (const cjsMainFile of cjsMainFiles) {
    pkgExports[`${cjsMainFile}!cjs`] = cjsMainFile
  }
  return pkgExports
}

// For packages that do not specify any identity, you need to try to guess his entry
function guessEntryFile(root: string, pkgFiles: string[]) {
  let indexFile = pkgFiles.find((file) => path.basename(file) === 'index')

  if (indexFile) {
    indexFile = path.basename(indexFile)
  } else {
    indexFile = 'index'
  }

  const entryFile = fileResolveByExtension(path.join(root || '', indexFile))

  if (entryFile) {
    return path.relative(root, entryFile)
  }
  return DEFAULT_ENTRY
}

async function resolveMainAndModule(
  root: string,
  pkgMain: string,
  pkgModule: string,
  pkgBrowser: any,
) {
  const result = {
    module: normalizeExport(pkgModule),
    default: await resolveMain(root, pkgMain),
  }

  if (_.isString(pkgBrowser)) {
    Object.assign(result, {
      browser: normalizeExport(pkgBrowser),
    })
  }

  return result
}

async function resolveMain(root: string, pkgMain: string) {
  const normalizeMain = normalizeExport(pkgMain)
  const isDynamicEntry = await getIsDynamic(root, pkgMain)
  const { isUmd } = await getFileType(root, pkgMain)

  if (isUmd || pkgMain.endsWith('.mjs') || !isDynamicEntry) {
    return normalizeMain
  }

  return {
    // TODO dev file
    // development: normalizeMain,
    development: !isDynamicEntry
      ? normalizeMain
      : // "./index.js" => "./dev.index.js"
        await resolveDevFilename(normalizeMain),
    default: normalizeMain,
  }
}

export async function resolveDevFilename(filename: string) {
  // "./index.js" => "./dev.index.js"
  const basename = path.basename(filename)
  const newBaseName = basename.replace(
    /^(\.?\/?)*/,
    (m, $1) => `${$1 || ''}dev.`,
  )
  return filename.replace(basename, newBaseName)
}

async function getIsDynamic(root: string, filepath: string) {
  const mainContent = fileReader(path.join(root, filepath))
  let isDynamic = false
  if (JS_RE.test(filepath)) {
    isDynamic = await isDynamicEntry(mainContent)
  }
  return isDynamic
}

export async function isDynamicEntry(source: string) {
  try {
    // const { exports: devExports, reexports: devReexports } = cjsParse(
    //   filename,
    //   source,
    //   'development',
    // )
    // const { exports: prodExports, reexports: prodReexports } = cjsParse(
    //   filename,
    //   source,
    //   'production',
    // )
    // return devReexports?.length !== 0 && prodReexports?.length !== 0
    // process.env.NODE_ENV === 'production'
    return (
      source.replace(/\s*/g, '').includes(`process.env.NODE_ENV==`) ||
      source.replace(/\s*/g, '').includes(`process.env.NODE_ENV!=`)
    )
  } catch (error) {
    return false
  }
}

export async function getFileType(root: string, filepath = '') {
  if (!JS_RE.test(path.join(root, filepath))) {
    return { isCjs: false, isEsm: false, isUmd: false }
  }
  const pkg = await readPackageJSON(root)
  await esInit

  const source = fileReader(path.join(root, filepath))
  const [importer, exporter] = esParse(source)

  const { reexports } = cjsParse(filepath, source, 'production')

  const isCjs =
    pkg.type !== 'module' &&
    importer.length === 0 &&
    exporter.length === 0 &&
    !filepath.endsWith('.mjs')

  if (isCjs) {
    const isUmd = !exporter.length && !importer.length && reexports.length === 0
    return {
      isCjs: true,
      isEsm: false,
      isUmd,
    }
  }

  const isEsm =
    importer.length !== 0 ||
    exporter.length !== 0 ||
    pkg.type === 'module' ||
    filepath.endsWith('.mjs')

  return {
    isCjs,
    isEsm,
    isUmd: isCjs && exporter.length === 0,
  }
}

export function normalizeExport(str: string) {
  if (str?.startsWith('./')) {
    return str
  }

  if (str?.startsWith('/')) {
    return `.${str}`
  }
  return `./${str}`
}

export function removeFileExt(file: string) {
  const lastIndex = file.lastIndexOf(path.extname(file))
  return file.substring(0, lastIndex)
}
