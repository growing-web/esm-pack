import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@/common/exception'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { createOriginAdapter } from '@/originAdapter'
import { BUCKET_NPM_DIR } from '@/constants'
import {
  bufferStream,
  parsePackagePathname,
  getNpmMaxSatisfyingVersion,
  validateNpmPackageName,
  getPackage,
  getContentType,
  isEsmFile,
} from '@growing-web/esmpack-shared'
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@/common/exception'
import tar from 'tar-stream'
import { createBrotliCompress, constants } from 'node:zlib'
import { Readable } from 'node:stream'
import { Logger } from '@/plugins/index'
import { RedisUtil } from '@/plugins/redis'

@Injectable()
export class NpmService {
  constructor() {}

  // ${name}@${version}
  async maxSatisfyingVersion(pathname?: string) {
    const { packageName, packageVersion } = await this.validatePackagePathname(
      pathname,
    )

    await this.validateNpmPackageName(packageName)

    const version = await getNpmMaxSatisfyingVersion(
      packageName,
      packageVersion,
    )

    if (!version) {
      throw new NotFoundException(`Cannot found package ${packageName}. `)
    }
    return version
  }

  // ${name}@${version}
  async resolveFile(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli: boolean,
    isBrowser: boolean,
  ) {
    // FIXME 极端情况，未能复现
    if (packageName === 'undefined') {
      throw new NotFoundException()
    }

    await this.validateNpmPackageName(packageName)

    const pkg = `${packageName}@${packageVersion}`
    const useCache = process.env.REDIS_CACHE === 'on'

    // const ossKey = `oss:${pkg}:${filename}`
    const npmKey = `npm:${pkg}:${filename}`

    if (useCache) {
      try {
        const redisUtil = new RedisUtil()

        const cacheEntry =
          // (await redisUtil.get(ossKey)) ||
          await redisUtil.get(npmKey)

        if (cacheEntry) {
          cacheEntry.content = Buffer.from(cacheEntry.content)
          Logger.info(`Get from Redis cache：${pkg}`)
          return cacheEntry
        }
      } catch (error) {
        Logger.info(`Redis storage is error.`)
      }
    }

    // 1hour
    // const ossExpire =
    //   Number.parseInt(process.env.REDIS_OSS_EXPIRE, 10) || 60 * 60

    // 1day
    const min =
      Number.parseInt(process.env.REDIS_NPM_EXPIRE, 10) || 24 * 60 * 60

    const randomExpire = Math.round(Math.random() * (min + 5 * 60 - min)) + min

    let entry = await this.resolveEntry(
      packageName,
      packageVersion,
      filename,
      acceptBrotli,
    )

    // 通过 jspm generate 进行build时候，不需要进行 npm 回源处理，只访问OSS内的文件即可
    if (!isBrowser) {
      //   if (entry) {
      //     try {
      //       await redisUtil.set(ossKey, entry, ossExpire)
      //       Logger.info(`Cached by OSS to Redis：${pkg}`)
      //     } catch (error) {
      //       Logger.info(`Redis storage is error.`)
      //     }
      //   }
      return entry
    }

    if (!entry) {
      entry = await this.resolveEntryForNpm(
        packageName,
        packageVersion,
        filename,
        acceptBrotli,
      )
      if (useCache) {
        try {
          // 只缓存 npm 源获取的
          const redisUtil = new RedisUtil()
          await redisUtil.set(npmKey, entry, randomExpire)
          Logger.info(`Cached by Npm to Redis：${pkg}`)
        } catch (error) {
          Logger.info(`Redis storage is error.`)
        }
      }
    }
    // else {
    //   try {
    //     await redisUtil.set(ossKey, entry, ossExpire)
    //     Logger.info(`Cached by OSS to Redis：${pkg}`)
    //   } catch (error) {
    //     Logger.info(`Redis storage is error.`)
    //   }
    // }

    return entry
  }

  private async resolveEntry(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli = false,
  ) {
    try {
      const originMeta = await this.getOriginMeta({
        packageName,
        packageVersion,
        filename,
        acceptBrotli,
      })

      if (!originMeta) {
        return null
      }

      const { originResult, isExitsBrotliFile } = originMeta
      if (!originResult) {
        return null
      }
      const { stream, header, filepath } = originResult

      const content = await bufferStream(stream)
      const resultIsBrotli = acceptBrotli && isExitsBrotliFile

      const entry = {
        header,
        content,
        filepath,
        ...(resultIsBrotli ? { 'Content-Encoding': 'br' } : {}),
      }
      return entry
    } catch (error) {
      Logger.info(
        'OSS Info：' +
          JSON.stringify({
            region: process.env.OSS_REGION,
            bucket: process.env.OSS_BUCKET,
            accessKeyId: process.env.OSS_ACCESS_KEY_ID,
            accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
          }),
      )
      Logger.info(JSON.stringify(process.env))
      Logger.error('InternalServerErrorException：' + error)
      throw new InternalServerErrorException()
    }
  }

  private async getOriginMeta({
    packageName,
    packageVersion,
    filename,
    acceptBrotli,
  }: {
    packageName: string
    packageVersion: string
    filename: string
    acceptBrotli: boolean
  }) {
    let objectName = path.join(
      this.getUploadDir(packageName, packageVersion),
      filename,
    )
    let isExitsBrotliFile = false

    const originAdapter = createOriginAdapter()
    if (acceptBrotli) {
      isExitsBrotliFile = await originAdapter.isExistObject(`${objectName}.br`)
      if (isExitsBrotliFile) {
        objectName = `${objectName}.br`
      }
    }

    const originResult = await originAdapter.getObjectStream(objectName)

    return {
      originResult,
      isExitsBrotliFile,
    }
  }

  async validatePackagePathname(pathname?: string) {
    const parsed = parsePackagePathname(pathname)

    if (parsed == null) {
      throw new ForbiddenException(`Invalid URL: ${pathname}`)
    }
    return parsed
  }

  async validateNpmPackageName(packageName: string) {
    const reason = await validateNpmPackageName(packageName)

    if (reason) {
      throw new ForbiddenException(
        `Invalid package name "${packageName}" (${reason})`,
      )
    }
  }

  private getUploadDir(packageName: string, packageVersion: string) {
    return `${BUCKET_NPM_DIR}/${packageName}@${packageVersion}/`
  }

  /**
   * 对于找不到入口的包，尝试从 npm 进行获取
   */
  async resolveEntryForNpm(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli: boolean,
  ) {
    const stream = await getPackage(packageName, packageVersion)

    return await this.searchEntries(stream, filename, acceptBrotli)
  }

  async searchEntries(
    stream,
    filename: string,
    acceptBrotli: boolean,
  ): Promise<any> {
    // filename = /some/file/name.js or /some/dir/name
    return new Promise((resolve, reject) => {
      let foundEntry

      stream
        .pipe(tar.extract())
        .on('error', reject)
        .on('entry', async (header, stream, next) => {
          const entry = {
            // Most packages have header names that look like `package/index.js`
            // so we shorten that to just `index.js` here. A few packages use a
            // prefix other than `package/`. e.g. the firebase package uses the
            // `firebase_npm/` prefix. So we just strip the first dir name.
            path: header.name.replace(/^[^/]+/g, ''),
            type: header.type,
          }

          // Skip non-files and files that don't match the entryName.
          if (entry.type !== 'file' || entry.path !== filename) {
            stream.resume()
            stream.on('end', next)
            return
          }

          try {
            let content = await bufferStream(stream)
            if (!(await isEsmFile(content.toString()))) {
              stream.resume()
              stream.on('end', next)
              resolve(null)
              return
            }

            if (acceptBrotli) {
              content = await this.brotliCompress(filename, content)
            }
            foundEntry = {
              content,
              filepath: entry.path,
              header: {
                'Last-Modified': header.mtime.toUTCString(),
                'Content-Type': getContentType(entry.path),
                ...(acceptBrotli
                  ? { 'Content-Encoding': 'br' }
                  : { 'Content-Length': content.length }),
              },
            }
            next()
          } catch (error) {
            next(error)
          }
        })
        .on('finish', () => {
          resolve(foundEntry)
        })
    })
  }

  async brotliCompress(filename: string, content: any): Promise<any> {
    const MIN_SIZE = 1000
    const brotliCompressOptions = {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
      [constants.BROTLI_PARAM_QUALITY]: 9, // turn down the quality, resulting in a faster compression (default is 11)
    }
    return new Promise((resolve, reject) => {
      if (MIN_SIZE && MIN_SIZE > content.size) {
        resolve(true)
      } else if (
        /\.(gz|zip|xz|lz2|7z|woff|woff2|jpg|jpeg|png|webp)$/.test(filename)
      ) {
        return true
      } else {
        const stream = new Readable()
        stream.push(content) // the string you want
        stream.push(null)
        const chunks: Uint8Array[] = []

        stream
          .pipe(createBrotliCompress(brotliCompressOptions))
          .on('data', (chunk) => {
            chunks.push(chunk)
          })
          .on('end', () => {
            resolve(Buffer.concat(chunks))
          })
          .on('error', reject)
      }
    })
  }
}
