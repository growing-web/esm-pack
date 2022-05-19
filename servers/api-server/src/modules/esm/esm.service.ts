import { Injectable } from '@nestjs/common'
import type { Request } from 'express'
import path from 'path'
import fs from 'fs-extra'
import {
  validatePackagePathname,
  validateNpmPackageName,
} from '@/utils/validate'
import { BUILDS_DIR } from '@/constants'
import { Error404Exception } from '@/common/exception'
import { bufferStream } from '@/utils/bufferStream'
import { getIntegrity } from '@/utils/getIntegrity'
import getContentType from '@/utils/getContentType'
import { outputErrorLog } from '@/utils/errorLog'
import { fileResolveByExtension, resolveEntryByDir } from '@/utils/fileResolver'

@Injectable()
export class EsmService {
  constructor() {}

  // ${name}@${version}
  async resolveFile(req: Request, pathname?: string) {
    const { packageName, packageVersion, filename } =
      await validatePackagePathname(pathname)

    if (packageName === 'undefined') {
      throw new Error404Exception()
    }

    await validateNpmPackageName(packageName)

    const entry = await this.findEntry(
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

  private async findEntry(
    req: Request,
    packageName: string,
    packageVersion: string,
    filename: string,
  ) {
    const acceptEncoding = req.header('Accept-Encoding')

    let _filename = filename
    const isBr = acceptEncoding?.includes('br')
    if (isBr) {
      _filename += '.br'
    }

    const brFilePath = path.join(
      BUILDS_DIR,
      `${packageName}@${packageVersion}`,
      _filename,
    )

    const filePath = path.join(
      BUILDS_DIR,
      `${packageName}@${packageVersion}`,
      filename,
    )

    const exitsBrFile = fileResolveByExtension(brFilePath)
    let exitsFile = fileResolveByExtension(filePath)
    exitsFile = exitsBrFile || exitsFile

    if (!exitsFile) {
      throw new Error404Exception('Not Found.')
    }

    if (fs.statSync(exitsFile).isDirectory()) {
      const indexFile = resolveEntryByDir(exitsFile)
      if (!indexFile) {
        throw new Error404Exception('Not Found.')
      }
      exitsFile = indexFile
    }

    try {
      const readerStream: any = fs.createReadStream(exitsFile)
      const content = await bufferStream(readerStream)

      const { mtime, size } = fs.statSync(readerStream.path)
      const entry = {
        content,
        path: readerStream.path,
        contentType: getContentType(readerStream.path),
        integrity: getIntegrity(content),
        lastModified: mtime.toUTCString(),
        size: size,
        ...(isBr ? { 'Content-Encoding': 'br' } : {}),
        type: isBr
          ? path.extname(path.basename(readerStream.path, '.br'))
          : path.extname(readerStream.path),
      }
      return entry
    } catch (error) {
      outputErrorLog(error, packageName, packageVersion)
    }
  }
}
