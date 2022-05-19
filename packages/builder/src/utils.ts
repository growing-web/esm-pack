import fs from 'fs-extra'
import { EXTENSIONS } from './constants'

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

export function fileReader(path: string) {
  return fs.readFileSync(path, {
    encoding: 'utf-8',
  })
}
