import type { Options } from 'ali-oss'
import type { UploadOptions } from './types'
import OSS from 'ali-oss'
import fg from 'fast-glob'
import path from 'path'
// import stackTrace from 'stacktrace-js'
import { BasicAdapter } from './AbstractAdapter'

export class AliOssOriginAdapter<
  T extends Options = Options,
> extends BasicAdapter {
  options: T
  constructor(options: T) {
    super()
    this.options = options
  }

  async upload({ cwd, ignore, uploadDir = '' }: UploadOptions) {
    const files = fg.sync('**/**', { ignore, cwd, absolute: true })
    const client = this.createClient()

    try {
      // eslint-disable-next-line
      await Promise.allSettled(
        files.map((file) => {
          return client.put(
            path.join(uploadDir, path.relative(cwd, file)),
            file,
            {
              // 不要覆盖已有的文件
              headers: { 'x-oss-forbid-overwrite': true },
            },
          )
        }),
      )
    } catch (error: any) {
      if (error.toString().includes('FileAlreadyExistsError')) {
        return
      }
      throw new Error(error)
    }
  }

  async isExistObject(objectName: string) {
    try {
      const client = this.createClient()

      await client.head(objectName)
      return true
    } catch (error: any) {
      if (
        error.code === 'NoSuchKey' ||
        error.toString().includes('Object not exists')
      ) {
        return false
      }
    }
    return false
  }

  async getObjectStream(objectName: string) {
    try {
      const client = this.createClient()
      // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
      const result = await client.getStream(objectName)
      return result
    } catch (e) {
      console.log(e)
    }
  }

  //   async createErrorLog(err: any, packageName: string, packageVersion: string) {
  //     const libDir = `${packageName}@${packageVersion}`
  //     const outputPath = path.join(OUTPUT_DIR, libDir)
  //     stackTrace.fromError(err).then((result) => {
  //       let errText = '\n'
  //       result.forEach((item) => {
  //         // @ts-ignore
  //         item.setFileName(item.getFileName().replace(process.cwd(), ''))
  //         console.log(item.toString())
  //         errText += `${item.toString()}\n`
  //       })
  //       fs.outputFile(
  //         path.join(outputPath, '_error.log'),
  //         `${new Date().toLocaleString()} packageName: ${packageName} packageVersion:${packageVersion} \n${`\n${err.toString()}\n${errText}`}\n`,
  //       )
  //     })
  //   }

  private createClient() {
    return new OSS(this.options)
  }
}
