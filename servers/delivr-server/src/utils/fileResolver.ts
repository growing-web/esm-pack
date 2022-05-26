import fs from 'fs-extra'
import { EXTENSIONS } from '../constants'
import path from 'path'

export function fileResolveByExtension(pathname: string) {
  if (fs.existsSync(pathname)) {
    return pathname
  }
  for (const ext of EXTENSIONS) {
    const extFile = `${pathname}${ext}`
    if (fs.existsSync(extFile)) {
      return extFile
    }
  }
  return null
}

export function resolveEntryByDir(dir: string) {
  for (const ext of EXTENSIONS) {
    const indexFile = path.join(dir, `index${ext}`)
    if (fs.existsSync(indexFile)) {
      return indexFile
    }
  }

  return null
}
