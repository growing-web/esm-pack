import { Injectable } from '@nestjs/common'
import path from 'pathe'
import fs from 'fs-extra'
import {
  validatePackagePathname,
  validateNpmPackageName,
} from '../../utils/validate'
import {
  BUILDS_DIR,
  //   POLYFILL_DIR,
  //   POLYFILL_PACKAGE_NAME,
  //   POLYFILL_VERSION,
} from '../../constants'
import { Error404Exception } from '../../common/exception'
import { bufferStream } from '../../utils/bufferStream'
import { getIntegrity } from '../../utils/getIntegrity'
import getContentType from '../../utils/getContentType'
import { outputErrorLog } from '../../utils/errorLog'

@Injectable()
export class EsmService {
  constructor() {}

  // ${name}@${version}
  async resolveEsmFile(pathname?: string) {
    const { packageName, packageVersion, filename } =
      await validatePackagePathname(pathname)

    // if (pathname?.startsWith(POLYFILL_DIR)) {
    //   const entry = await this.findEntry(
    //     POLYFILL_PACKAGE_NAME,
    //     POLYFILL_VERSION,
    //     pathname.replace(`${POLYFILL_PACKAGE_NAME}@${POLYFILL_VERSION}/`, ''),
    //   )

    //   return {
    //     packageName,
    //     packageVersion,
    //     filename,
    //     entry,
    //   }
    // }

    if (packageName === 'undefined') {
      throw new Error404Exception()
    }

    await validateNpmPackageName(packageName)

    // await Promise.all([
    //   validatePackageVersion(packageName, packageVersion),
    //   validatePackageConfig(packageName, packageVersion),
    // ])
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

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      throw new Error404Exception('Not Found.')
    }

    try {
      const readerStream: any = fs.createReadStream(filePath)
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
