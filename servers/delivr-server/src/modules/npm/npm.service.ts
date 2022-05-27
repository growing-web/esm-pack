import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@/common/exception'
import path from 'node:path'
import { originAdapter } from '@/originAdapter'
import { BUCKET_NPM_DIR } from '@/constants'
import {
  bufferStream,
  parsePackagePathname,
  getNpmMaxSatisfyingVersion,
  validateNpmPackageName,
} from '@growing-web/esmpack-shared'
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@/common/exception'

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
      throw new NotFoundException(`Cannot find package ${packageName}. `)
    }
    return version
  }

  // ${name}@${version}
  async resolveFile(
    packageName: string,
    packageVersion: string,
    filename: string,
    acceptBrotli: boolean,
  ) {
    // 极端情况，未能复现
    if (packageName === 'undefined') {
      throw new NotFoundException()
    }

    await this.validateNpmPackageName(packageName)

    const entry = await this.resolveEntry(
      packageName,
      packageVersion,
      filename,
      acceptBrotli,
    )

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
}
