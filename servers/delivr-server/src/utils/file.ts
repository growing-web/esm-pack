import fs from 'fs-extra'

export function fileReader(path: string) {
  return fs.readFileSync(path, {
    encoding: 'utf-8',
  })
}
