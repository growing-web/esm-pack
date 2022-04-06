import path from 'path'
import fs from 'fs-extra'
import { BUILDS_DIR } from '../constants'
import stackTrace from 'stacktrace-js'
export function outputErrorLog(
  err: any,
  packageName: string,
  packageVersion: string,
): never {
  const libDir = `${packageName}@${packageVersion}`
  const buildsPath = path.join(BUILDS_DIR, libDir)
  stackTrace.fromError(err).then((result) => {
    let errText = '\n'
    result.forEach((item) => {
      // @ts-ignore
      item.setFileName(item.getFileName().replace(process.cwd(), ''))
      console.log(item.toString())
      errText += `${item.toString()}\n`
    })
    fs.outputFile(
      path.join(buildsPath, '_error.log'),
      `${new Date().toLocaleString()} packageName: ${packageName} packageVersion:${packageVersion} \n${`\n${err.toString()}\n${errText}`}\n`,
    )
  })

  throw new Error(err)
}
