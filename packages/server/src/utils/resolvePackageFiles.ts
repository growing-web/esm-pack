import type { PackageJson } from 'pkg-types'
import _ from 'lodash'
import { recursionExportsValues } from './recursion'

export async function resolvePackageFiles(
  npmFiles: string[],
  pkg: PackageJson,
  pkgExports: Record<string, any>,
) {
  let { files = [] } = pkg

  files = files.filter((item) => {
    return !(
      item.includes('.d.ts') ||
      item.includes('*') ||
      !item.endsWith('js')
    )
  })

  // add package.json to files
  files.push('package.json')

  // exports file
  const values = recursionExportsValues(pkgExports)
  files.push(
    ...values.map((item) => {
      return item.replace(/^\.?\//, '')
    }),
  )

  // add license and readme.md to files

  const matchFiles = npmFiles.filter((file) => {
    return ['license', 'readme.md', 'changelog.md'].includes(file.toLowerCase())
  })
  files.push(...matchFiles)
  return Array.from(new Set(files)).sort()
}
