import { Injectable } from '@nestjs/common'
import { Error404Exception } from '@/common/exception'
import { getVersionsAndTags } from '@/utils/npm'
import { SemverRange } from 'sver'

import {
  validatePackagePathname,
  validateNpmPackageName,
} from '@/utils/validate'

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
        throw new Error404Exception(`Cannot find package ${packageName}. `)
      }

      const range = new SemverRange(`${packageVersion}`)
      const bestVersion = range.bestMatch(versions)?.toString()
      return versions.includes(range) ? range : bestVersion
    }

    return null
  }
}
