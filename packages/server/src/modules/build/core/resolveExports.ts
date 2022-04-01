import type { PackageJson } from 'pkg-types'
import _ from 'lodash'
import { buildExports } from './buildExports'
// import { recursionExportsValues } from './recursion'
// import fs from 'fs-extra'
// import path from 'path'
import fg from 'fast-glob'
// import { init, parse } from 'es-module-lexer'

export async function resolveExports(pkg: PackageJson, root: string) {
  let resultExports = await buildExports(pkg, root)
  resultExports = await handleWildcardExports(resultExports, root)

  //   const mergedCjsExports = await createCjsField(resultExports, root)
  Object.assign(
    resultExports,
    // mergedCjsExports,
    {
      './package.json': './package.json.js',
      //   './package.json.js!cjs': './package.json.js',
    },
  )
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
