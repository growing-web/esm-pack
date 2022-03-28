import fetch from 'npm-registry-fetch'
import fs from 'fs-extra'
import path from 'pathe'
import tar from 'tar'
import request from 'request-promise'
import progress from 'request-progress'
import LRUCache from 'lru-cache'

const oneMegabyte = 1024 * 1024
const oneSecond = 1000
const oneMinute = oneSecond * 60

const notFound = ''

const cache = new LRUCache({
  max: oneMegabyte * 40,
  length: Buffer.byteLength,
  maxAge: oneSecond,
})

/**
 * Detect the latest version of NPM
 * @param  {string} pkgName  package name
 * @param  {String} version  pacage version
 * @return {array} [code, resute]
 */
export async function getNpmPackageInfo(pkgName: string): Promise<any> {
  const ret = await fetch.json(`${pkgName}`)
  return ret
}

async function fetchVersionsAndTags(packageName) {
  const info = await getNpmPackageInfo(packageName)
  return info && info.versions
    ? { versions: Object.keys(info.versions), tags: info['dist-tags'] }
    : null
}

/**
 * Get a tarball of the specified npm package version
 */
export function getNpmTarball(
  pkgInfo: Record<string, string>,
  version: string,
) {
  const versions = pkgInfo?.versions
  if (!version) {
    return null
  }

  return versions?.[version]?.dist?.tarball ?? ''
}

/**
 * Get the tar and extract it to the specified folder
 */
export async function getAndExtractTarball(
  destDir: string,
  tarball: string,
  // eslint-disable-next-line
  progressFunc = (state) => {},
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const allFiles: string[] = []
    const allWriteStream: any[] = []
    const dirCollector: string[] = []

    progress(
      request({
        url: tarball,
        timeout: 10000,
      }),
    )
      .on('progress', progressFunc)
      //   .on('error', reject)
      .pipe(new tar.Parse())
      .on('entry', (entry) => {
        if (entry.type === 'Directory') {
          entry.resume()
          return
        }

        const realPath = entry.path.replace(/^package\//, '')

        const filename = path.basename(realPath)

        const destPath = path.join(destDir, path.dirname(realPath), filename)
        const dirToBeCreate = path.dirname(destPath)
        if (!dirCollector.includes(dirToBeCreate)) {
          dirCollector.push(dirToBeCreate)
          fs.ensureDirSync(dirToBeCreate)
        }

        allFiles.push(destPath)
        allWriteStream.push(
          new Promise((resolve) => {
            entry
              .pipe(fs.createWriteStream(destPath))
              .on('finish', () => resolve(true))
              .on('close', () => resolve(true))
          }),
        )
      })
      .on('end', () => {
        if (progressFunc) {
          progressFunc({
            percent: 1,
          })
        }
        Promise.all(allWriteStream)
          .then(() => resolve(allFiles))
          .catch(reject)
      })
  })
}

export async function getVersionsAndTags(packageName: string) {
  const cacheKey = `versions-${packageName}` as 'utf8'
  const cacheValue = cache.get(cacheKey)

  if (cacheValue !== null && cacheValue !== undefined) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue)
  }

  const value = await fetchVersionsAndTags(packageName)

  if (value === null) {
    cache.set(cacheKey, notFound, 5 * oneMinute)
    return null
  }

  cache.set(cacheKey, JSON.stringify(value), oneMinute)
  return value
}
