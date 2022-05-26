import semver from 'semver'
import { getVersionsAndTags } from './npm'
import { BUCKET_NPM_DIR } from '@/constants'

const PACKAGE_RE =
  /^((?:@[^/\\%@]+\/)?[^./\\%@][^/\\%@]*)@?([^\\/]+)?(\/.*)?(\/.*)?$/

export function parsePackagePathname(pathname: string) {
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

export function getOssPrefix(packageName: string, packageVersion: string) {
  return `${BUCKET_NPM_DIR}/${getPackageNameAndVersion(
    packageName,
    packageVersion,
  )}/`
}

export function getPackageNameAndVersion(
  packageName: string,
  packageVersion: string,
) {
  return `${packageName}@${packageVersion}`
}
