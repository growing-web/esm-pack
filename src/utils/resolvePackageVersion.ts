import semver from 'semver'
import { getVersionsAndTags } from './npm'

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
