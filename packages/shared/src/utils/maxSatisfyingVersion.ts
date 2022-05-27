import { getVersionsAndTags } from './npm'
import { SemverRange } from 'sver'

export async function getNpmMaxSatisfyingVersion(
  packageName: string,
  packageVersion: string,
) {
  const versionsAndTags = await getVersionsAndTags(packageName)

  if (versionsAndTags) {
    const { versions, tags } = versionsAndTags
    if (!packageVersion) {
      return tags.latest
    }

    if (versions.includes(packageVersion)) {
      return null
    }

    const range = new SemverRange(`${packageVersion}`)
    const bestVersion = range.bestMatch(versions)?.toString()
    return versions.includes(range) ? range : bestVersion
  }

  return null
}
