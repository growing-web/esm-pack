import { Injectable } from '@nestjs/common'
import path from 'pathe'
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
  async resolveEsmFile(pathname?: string) {
    const { packageName, packageVersion, filename } =
      await validatePackagePathname(pathname)

    if (packageName === 'undefined') {
      throw new Error404Exception()
    }

    await validateNpmPackageName(packageName)

    const entry = await this.findEntry(packageName, packageVersion, filename)

    return {
      packageName,
      packageVersion,
      filename,
      entry,
    }
  }

  private async findEntry(
    packageName: string,
    packageVersion: string,
    filename: string,
  ) {
    const filePath = path.join(
      BUILDS_DIR,
      `${packageName}@${packageVersion}`,
      filename,
    )

    let exitsFile = fileResolveByExtension(filePath)

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
      }
      return entry
    } catch (error) {
      outputErrorLog(error, packageName, packageVersion)
    }
  }
}
