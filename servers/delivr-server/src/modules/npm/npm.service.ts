import type { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@/common/exception'
import { getVersionsAndTags } from '@/utils/npm'
import { SemverRange } from 'sver'
import path from 'path'
import fs from 'fs-extra'
import {
  validatePackagePathname,
  validateNpmPackageName,
} from '@/utils/validate'
import { BUILDS_DIR } from '@/constants'
import { bufferStream } from '@/utils/bufferStream'
import { outputErrorLog } from '@/utils/errorLog'
import { fileResolveByExtension, resolveEntryByDir } from '@/utils/fileResolver'
import { getContentType } from '@/utils/contentType'
import { isExistObject, getOssStream } from '@/utils/ossClient'
import { getOssPrefix } from '@/utils/package'

@Injectable()
export class NpmService {
  constructor() {}

  // ${name}@${version}
  async maxSatisfyingVersion(pathname?: string) {
    const { packageName, packageVersion } = await validatePackagePathname(
      pathname,
    )

    await validateNpmPackageName(packageName)

    return await this.resolveVersion(packageName, packageVersion)
  }

  private async resolveVersion(packageName: string, packageVersion: string) {
    const versionsAndTags = await getVersionsAndTags(packageName)

    if (versionsAndTags) {
      const { versions, tags } = versionsAndTags
      if (!packageVersion) {
        return tags.latest
      }

      if (versions.includes(packageVersion)) {
        throw new NotFoundException(`Cannot find package ${packageName}. `)
      }

      const range = new SemverRange(`${packageVersion}`)
      const bestVersion = range.bestMatch(versions)?.toString()
      return versions.includes(range) ? range : bestVersion
    }

    return null
  }

  // ${name}@${version}
  async resolveFile(req: Request, pathname?: string) {
    const { packageName, packageVersion, filename } =
      await validatePackagePathname(pathname)

    // HACK
    if (packageName === 'undefined') {
      throw new NotFoundException()
    }

    await validateNpmPackageName(packageName)

    const entry = await this.resolveEntry(
      req,
      packageName,
      packageVersion,
      filename,
    )

    return {
      packageName,
      packageVersion,
      filename,
      entry,
    }
  }

  private resolveFilePath(
    packageName: string,
    packageVersion: string,
    filename: string,
  ) {
    return path.join(BUILDS_DIR, `${packageName}@${packageVersion}`, filename)
  }

  private async resolveEntry(
    req: Request,
    packageName: string,
    packageVersion: string,
    filename: string,
  ) {
    const acceptEncoding = req.header('Accept-Encoding')
    const acceptBrotli = acceptEncoding?.includes('br') ?? false

    let brotliFilename = filename
    if (acceptBrotli) {
      brotliFilename += '.br'
    }

    const brotliFilePath = this.resolveFilePath(
      packageName,
      packageVersion,
      brotliFilename,
    )

    const filePath = this.resolveFilePath(packageName, packageVersion, filename)

    try {
      const data = await this.createStream({
        packageName,
        packageVersion,
        filePath,
        brotliFilePath,
        filename,
        acceptBrotli,
      })
      if (!data) {
        return
      }
      const { readerStream, isExitsBrotliFile, isLocal, ossRes } = data

      const content = await bufferStream(readerStream)
      const resultIsBrotli = acceptBrotli && isExitsBrotliFile

      if (!isLocal) {
        const {
          headers: { 'last-modified': lastModified, 'content-length': size } = {
            'last-modified': '',
            'content-length': '',
          },
        } = ossRes || ({} as any)

        const reqPath = readerStream?.req?.path ?? ''

        const entry = {
          content,
          path: reqPath,
          contentType: getContentType(reqPath),
          lastModified: lastModified,
          size: size,
          ...(resultIsBrotli ? { 'Content-Encoding': 'br' } : {}),
          type: resultIsBrotli
            ? path.extname(path.basename(reqPath, '.br'))
            : path.extname(reqPath),
        }
        return entry
      }

      const { mtime, size } = fs.statSync(readerStream.path)

      const entry = {
        content,
        path: readerStream.path,
        contentType: getContentType(readerStream.path),
        lastModified: mtime.toUTCString(),
        size: size,
        ...(resultIsBrotli ? { 'Content-Encoding': 'br' } : {}),
        type: resultIsBrotli
          ? path.extname(path.basename(readerStream.path, '.br'))
          : path.extname(readerStream.path),
      }

      return entry
    } catch (error) {
      outputErrorLog(error, packageName, packageVersion)
    }
  }

  private async createStream({
    packageName,
    packageVersion,
    filePath,
    filename,
    brotliFilePath,
    acceptBrotli,
  }: {
    packageName: string
    packageVersion: string
    filename: string
    filePath: string
    brotliFilePath: string
    acceptBrotli: boolean
  }) {
    const localeResult = await this.resolveLocalFile(
      filePath,
      brotliFilePath,
      acceptBrotli,
    )

    if (localeResult?.file) {
      return {
        isLocal: true,
        readerStream: fs.createReadStream(localeResult?.file),
        isExitsBrotliFile: localeResult.isExitsBrotliFile,
      }
    }

    const { isExits, isExitsBrotliFile, objectName } =
      await this.resolveOssFile(
        packageName,
        packageVersion,
        filename,
        acceptBrotli,
      )

    if (isExits) {
      const ossResult = await getOssStream(objectName)

      if (ossResult?.stream) {
        return {
          isLocal: false,
          readerStream: ossResult?.stream,
          ossRes: ossResult?.res,
          isExitsBrotliFile: isExitsBrotliFile,
        }
      }
    }
    return null
  }

  // 解析本地入口
  private async resolveLocalFile(
    filePath: string,
    brotliFilePath: string,
    acceptBrotli: boolean,
  ) {
    let file = ''
    let brotliFile: string | null = ''

    if (acceptBrotli) {
      brotliFile = fileResolveByExtension(brotliFilePath)
      if (brotliFile) {
        file = brotliFile
      } else {
        file = fileResolveByExtension(filePath) ?? ''
      }
    } else {
      file = fileResolveByExtension(filePath) ?? ''
    }

    if (!file) {
      return {
        file: null,
        isExitsBrotliFile: false,
      }
    }

    if (fs.statSync(file).isDirectory()) {
      const indexFile = resolveEntryByDir(file)
      if (!indexFile) {
        return null
      }
      file = indexFile
    }

    return {
      file,
      isExitsBrotliFile: !!brotliFile,
    }
  }

  // 本地没有找到文件时，回退到OSS查询
  private async resolveOssFile(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli,
  ) {
    let isExits = false
    let objectName = path.join(
      getOssPrefix(packageName, packageVersion),
      filename,
    )
    let isExitsBrotliFile = false

    if (acceptBrotli) {
      isExitsBrotliFile = await isExistObject(`${objectName}.br`)

      if (isExitsBrotliFile) {
        isExits = true
        objectName = `${objectName}.br`
      } else {
        const isExitsNormalFile = await isExistObject(objectName)
        if (isExitsNormalFile) {
          isExits = true
        }
      }
    } else {
      const isExitsNormalFile = await isExistObject(objectName)
      if (isExitsNormalFile) {
        isExits = true
      }
    }

    return {
      isExits,
      isExitsBrotliFile,
      objectName,
    }
  }
}
