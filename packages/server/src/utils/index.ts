import fs from 'fs-extra'

export function fileExits(file: string) {
  return fs.existsSync(file)
}

export function normalizeExport(str: string) {
  if (str.startsWith('./')) {
    return str
  }

  if (str.startsWith('/')) {
    return `.${str}`
  }
  return `./${str}`
}
