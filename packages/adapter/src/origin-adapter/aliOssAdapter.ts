import type { Options } from 'ali-oss'
import type { UploadOptions, PutOptions } from './types'
import OSS from 'ali-oss'
import fg from 'fast-glob'
import path from 'node:path'
import { pick } from 'lodash'
import { BasicAdapter } from './AbstractAdapter'
import { getContentType } from '../utils/contentType'
import { green, cyan, white } from 'picocolors'

export class AliOssOriginAdapter<
  T extends Options = Options,
> extends BasicAdapter {
  options: T
  client: OSS
  constructor(options: T) {
    super()
    this.options = options
    this.client = this.createClient()
  }

  async uploadDir({ cwd, ignore, uploadDir = '' }: UploadOptions) {
    const files = fg.sync('**/**', { ignore, cwd, absolute: true })

    try {
      console.log('ali oss upload start')
      const startTime = new Date().getTime()
      // eslint-disable-next-line
      await Promise.allSettled(
        files.map((file) => {
          return this.client.put(
            path.join(uploadDir, path.relative(cwd, file)),
            file,
            {
              // 不要覆盖已有的文件
              headers: { 'x-oss-forbid-overwrite': true },
            },
          )
        }),
      )
      const duration = (new Date().getTime() - startTime) / 1000

      console.log(
        `${green(
          `ali oss upload ${white(`${files.length}`)} files  complete`,
        )}:  ${cyan(uploadDir)}, cost ${cyan(`${duration.toFixed(2)}s`)}`,
      )
      console.log('')
    } catch (error: any) {
      if (error.toString().includes('FileAlreadyExistsError')) {
        return
      }
      throw new Error(error)
    }
  }

  async put({ cwd, file, uploadDir = '' }: PutOptions) {
    try {
      const startTime = new Date().getTime()
      await this.client.put(
        path.join(uploadDir, path.relative(cwd, file)),
        file,
        {
          // 不要覆盖已有的文件
          headers: {
            'x-oss-forbid-overwrite': true,
            'x-oss-storage-class': 'Standard',
            'Content-Encoding': 'UTF-8',
          },
        },
      )

      const duration = (new Date().getTime() - startTime) / 1000

      console.log(
        `${green('ali oss upload complete')}:  ${cyan(uploadDir)}, cost ${cyan(
          `${duration.toFixed(2)}s`,
        )}`,
      )
      console.log('')
    } catch (error: any) {
      if (error.toString().includes('FileAlreadyExistsError')) {
        return
      }
      throw new Error(error)
    }
  }

  async isExistObject(objectName: string) {
    try {
      await this.client.head(objectName)
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
      // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
      const { stream, res } = await this.client.getStream(objectName)

      if (res.status >= 400) {
        return null
      }

      const header = pick(
        res.headers,
        'last-modified',
        'x-oss-object-type',
        'x-oss-request-id',
        'x-oss-hash-crc64ecma',
        'x-oss-storage-class',
        'x-oss-server-time',
        'server',
        'content-md5',
        'content-length',
      )
      const filepath = stream?.req?.path ?? ''

      header['Content-Type'] = getContentType(filepath)
      return {
        stream,
        header,
        filepath,
      }
    } catch (e: any) {
      if (e && e.toString().includes('NoSuchKeyError')) {
        return null
      }
      console.error(e)
      return null
    }
  }

  async deleteFile(objectName: string) {
    try {
      // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
      await this.client.delete(objectName)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  private createClient() {
    return new OSS(this.options)
  }
}
