import { Injectable } from '@nestjs/common'
import { Error403Exception, Error404Exception } from '../../common/exception'
import validateNpmPackageName from 'validate-npm-package-name'
import { getVersionsAndTags } from '../../utils/npm'
import { SemverRange } from 'sver'
import { parsePackagePathname } from '../../utils/parse-package-pathname'

@Injectable()
export class NpmService {
  constructor() {}

  // ${name}@${version}
  async maxSatisfyingVersion(pathname?: string) {
    if (!pathname) {
      throw new Error403Exception(`Invalid URL: ${pathname}`)
    }

    const parsed = parsePackagePathname(pathname)

    if (parsed == null) {
      throw new Error403Exception(`Invalid URL: ${pathname}`)
    }

    const { packageName, packageVersion } = parsed

    const errors = validateNpmPackageName(packageName).errors

    if (errors) {
      const reason = errors.join(', ')

      throw new Error403Exception(
        `Invalid package name "${packageName}" (${reason})`,
      )
    }

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
        throw new Error404Exception(`Cannot find package ${packageName} `)
      }

      const range = new SemverRange(`${packageVersion}`)
      const bestVersion = range.bestMatch(versions)?.toString()
      return versions.includes(range) ? range : bestVersion
    }

    return null
  }
}
