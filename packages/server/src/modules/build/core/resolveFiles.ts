import type { PackageJson } from 'pkg-types'
import _ from 'lodash'
import fg from 'fast-glob'
import { recursionExportsValues } from './recursion'

export async function resolveFiles(
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
