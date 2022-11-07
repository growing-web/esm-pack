import semver from 'semver'
import { getVersionsAndTags } from './npm'

const PACKAGE_RE =
  /^((?:@[^/\\%@]+\/)?[^./\\%@][^/\\%@]*)@?([^\\/]+)?(\/.*)?(\/.*)?$/

/**
 * 根据路径解析npm包
 * @param pathname
 * @returns
 */
export function parsePackagePathname(pathname?: string) {
  if (!pathname) {
    return null
  }
  try {
    pathname = decodeURIComponent(pathname)
  } catch (error) {
    return null
  }

  const match = pathname.match(PACKAGE_RE)
  if (match === null) {
    return null
  }

  const packageName = match[1]
  const packageVersion = match[2]
  const filename = (match[3] || '').replace(/\/\/+/g, '/')

  return {
    packageName,
    packageVersion,
    filename,
  }
}

export async function resolvePackageVersion(
  packageName: string,
  range: string,
) {
  const versionsAndTags = await getVersionsAndTags(packageName)

  if (versionsAndTags) {
    const { versions, tags } = versionsAndTags

    if (range in tags) {
      range = tags[range]
    }

    return versions.includes(range)
      ? range
      : semver.maxSatisfying(versions, range)
  }

  return null
}
