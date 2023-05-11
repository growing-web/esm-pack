import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@/common/exception'
import path from 'node:path'
// import { Buffer } from 'node:buffer'
import { createOriginAdapter } from '@/originAdapter'
import { BUCKET_NPM_DIR } from '@/constants'
import {
  bufferStream,
  parsePackagePathname,
  getNpmMaxSatisfyingVersion,
  validateNpmPackageName,
  getPackage,
  getPackageByUrl,
  getContentType,
  isEsmFile,
  brotliCompress,
  LRUCache,
} from '@growing-web/esmpack-shared'
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@/common/exception'
import tar from 'tar-stream'

import { Logger } from '@/plugins/index'
// import { RedisUtil } from '@/plugins/redis'

const cache = new LRUCache({
  // 10分钟
  ttl: 1000 * 60 * 10,
  max: 500,
})

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

    // const pkg = `${packageName}@${packageVersion}`
    // const useCache = process.env.REDIS_CACHE === 'on'
    // const npmKey = `npm:${pkg}:${filename}`

    // if (useCache) {
    //   try {
    //     const redisUtil = new RedisUtil()

    //     const cacheEntry = await redisUtil.get(npmKey)

    //     if (cacheEntry) {
    //       cacheEntry.content = Buffer.from(cacheEntry.content)
    //       Logger.info(`Get from Redis cache：${pkg}`)
    //       return cacheEntry
    //     }
    //   } catch (error) {
    //     Logger.info(`Redis storage is error.`)
    //   }
    // }

    // 1hour
    // const ossExpire =
    //   Number.parseInt(process.env.REDIS_OSS_EXPIRE, 10) || 60 * 60

    // 1day
    // const min =
    //   Number.parseInt(process.env.REDIS_NPM_EXPIRE, 10) || 24 * 60 * 60

    // const randomExpire = Math.round(Math.random() * (min + 5 * 60 - min)) + min

    // 对一些特殊的依赖直接回退到jspm，jspm有比较成熟的构建机制
    let whiteList: string[] = ['@jspm/core', 'es-module-shims']
    try {
      const configWhiteList =
        process.env.BACK_SOURCE_WHITE_LIST?.split(',') ?? []
      whiteList.push(...configWhiteList)

      if (whiteList.includes(packageName)) {
        Logger.info(`whiteList ${packageName} for Jspm.`)
        return await this.resolveEntryForJspm(
          packageName,
          packageVersion,
          filename,
          false,
        )
      }
    } catch (error) {
      //
    }

    let entry = await this.resolveEntry(
      packageName,
      packageVersion,
      filename,
      acceptBrotli,
    )

    // 通过 jspm generate 进行build时候，不需要进行 npm 回源处理，只访问OSS内的文件即可
    // 环境变量未开，也直接访问OSS即可

    if (
      !isBrowser ||
      // 关闭后不依次从 Jsdelivr,Jspm,Npm回源
      (process.env.OPEN_BACK_SOURCE !== 'on' &&
        !whiteList.includes(packageName))
    ) {
      return entry
    }

    if (!entry) {
      if (
        !filename.endsWith('.js') &&
        !filename.endsWith('.mjs') &&
        !filename.endsWith('.json')
      ) {
        return null
      }

      // 依次从 Jsdelivr,Jspm,Npm回源
      entry = await this.resolveEntries(
        packageName,
        packageVersion,
        filename,
        acceptBrotli,
      )

      //   if (useCache) {
      //     try {
      //       // 只缓存 npm 源获取的
      //       const redisUtil = new RedisUtil()
      //       await redisUtil.set(npmKey, entry, randomExpire)
      //       Logger.info(`Cached by Npm to Redis：${pkg}`)
      //     } catch (error) {
      //       Logger.info(`Redis storage is error.`)
      //     }
      //   }
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

  private async resolveEntries(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli: boolean,
  ) {
    const cdns = process.env.EXTERNAL_CDNS?.split(',') || []
    let entry: any = {}

    for (const cdn of cdns) {
      try {
        entry = await this[`resolveEntryFor${cdn}`](
          packageName,
          packageVersion,
          filename,
          acceptBrotli,
        )
        Logger.info(`resolveEntryFor${cdn} done.`)
        if (entry) {
          return entry
        }
      } catch (error: any) {
        Logger.error(`resolveEntryFor${cdn} error：${error}`)
      }
    }
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
      console.error(error)
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
              content = await brotliCompress(filename, content)
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

  async resolveEntryForJspm(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli: Boolean,
  ) {
    const url = path.join(`${packageName}@${packageVersion}`, filename)
    if (cache.get(url)) {
      Logger.info(`load for lru-cache:${url}`)
      return cache.get(url) as any
    }
    const result = await this.resolveEntryForExternal(
      `${process.env.JSPM_URL}/npm:${url}`,
      filename,
      acceptBrotli,
    )

    cache.set(url, result)
    return result
  }

  async resolveEntryForJsdelivr(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli: Boolean,
  ) {
    const url = path.join(`${packageName}@${packageVersion}`, filename)
    let pathname = `${process.env.JSDELIVR_URL}/npm/${url}`
    if (!pathname.endsWith('.min.js')) {
      pathname = pathname.replace(/\.js$/, '.min.js')
    }
    return await this.resolveEntryForExternal(pathname, filename, acceptBrotli)
  }

  async resolveEntryForExternal(
    url: string,
    filename: string,
    acceptBrotli: Boolean,
  ) {
    const res = await getPackageByUrl(url)

    const { stream, headers } = res || {}

    let content = await bufferStream(stream)

    if (acceptBrotli) {
      content = await brotliCompress(filename, content)
    }
    return {
      content,
      filepath: filename,
      header: {
        ...headers,
        ...(acceptBrotli
          ? { 'Content-Encoding': 'br' }
          : { 'Content-Length': content.length }),
      },
    }
  }
}
