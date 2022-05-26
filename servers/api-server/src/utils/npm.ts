import path from 'node:path'
import { URL } from 'node:url'
import https, { RequestOptions } from 'node:https'
import fetch from 'npm-registry-fetch'
import fs from 'fs-extra'
import tar from 'tar'
import request from 'request-promise'
import progress from 'request-progress'
import LRUCache from 'lru-cache'
import { bufferStream } from './bufferStream'
import { Logger } from '@/plugins/logger'

const NPM_REGISTRY_URL = 'https://registry.npmmirror.com'

const oneMegabyte = 1024 * 1024
const oneSecond = 1000
const oneMinute = (oneSecond * 60) as any

const notFound = ''

// All the keys that sometimes appear in package info
// docs that we don't need. There are probably more.
const packageConfigExcludeKeys = [
  'browserify',
  'bugs',
  'directories',
  'engines',
  'files',
  'homepage',
  'keywords',
  'maintainers',
  'scripts',
]

const cache = new LRUCache({
  maxSize: oneMegabyte * 40,
  sizeCalculation: Buffer.byteLength,
  ttl: oneSecond,
})

const agent = new https.Agent({
  keepAlive: true,
})

function get(options: RequestOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(options, resolve).on('error', reject)
  })
}

function isScopedPackageName(packageName: string) {
  return packageName.startsWith('@')
}

/**
 * Detect the latest version of NPM
 * @param  {string} pkgName  package name
 * @param  {String} version  pacage version
 * @return {array} [code, resute]
 */
export async function getNpmPackageInfo(packageName: string): Promise<any> {
  const ret = await fetch.json(`${packageName}`)
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
export async function extractTarball(
  destDir: string,
  tarballURL: string,
  // eslint-disable-next-line
  progressFunc = (state) => {},
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const allFiles: string[] = []
    const allWriteStream: any[] = []
    const dirCollector: string[] = []

    request({
      url: tarballURL,
      timeout: 60 * 1000,
    })
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

function encodePackageName(packageName: string) {
  return isScopedPackageName(packageName)
    ? `@${encodeURIComponent(packageName.substring(1))}`
    : encodeURIComponent(packageName)
}

async function fetchPackageInfo(packageName: string) {
  const name = encodePackageName(packageName)
  const infoURL = `${NPM_REGISTRY_URL}/${name}`

  console.debug('Fetching package info for %s from %s', packageName, infoURL)

  const { hostname, pathname } = new URL(infoURL)
  const options = {
    agent: agent,
    hostname: hostname,
    path: pathname,
    headers: {
      Accept: 'application/json',
    },
  }

  const res = await get(options)

  if (res.statusCode === 200) {
    return bufferStream(res).then(JSON.parse)
  }

  if (res.statusCode === 404) {
    return null
  }

  const content = (await bufferStream(res)).toString('utf-8')

  console.error(
    'Error fetching info for %s (status: %s)',
    packageName,
    res.statusCode,
  )
  console.error(content)

  return null
}

function cleanPackageConfig(config) {
  return Object.keys(config).reduce((memo, key) => {
    if (!key.startsWith('_') && !packageConfigExcludeKeys.includes(key)) {
      memo[key] = config[key]
    }

    return memo
  }, {})
}

async function fetchPackageConfig(packageName: string, version: string) {
  const info = await fetchPackageInfo(packageName)
  return info && info.versions && version in info.versions
    ? cleanPackageConfig(info.versions[version])
    : null
}

export async function getTarballURL(packageName: string, version: string) {
  const tarballName = isScopedPackageName(packageName)
    ? packageName.split('/')[1]
    : packageName

  return `${NPM_REGISTRY_URL}/${packageName}/-/${tarballName}-${version}.tgz`
}

/**
 * Returns metadata about a package, mostly the same as package.json.
 * Uses a cache to avoid over-fetching from the registry.
 */
export async function getPackageConfig(packageName: string, version: string) {
  const cacheKey = `config-${packageName}-${version}` as any

  const cacheValue = cache.get(cacheKey) as any

  if (cacheValue != null) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue)
  }

  const value = await fetchPackageConfig(packageName, version)

  if (value === null) {
    try {
      cache.set(cacheKey, notFound, (5 * oneMinute) as any)
    } catch (error) {
      Logger.error(error)
    }
    return null
  }

  cache.set(cacheKey, JSON.stringify(value), oneMinute)
  return value
}

export async function getVersionsAndTags(packageName: string) {
  const cacheKey = `versions-${packageName}` as any

  const cacheValue = cache.get(cacheKey) as any

  if (cacheValue !== null && cacheValue !== undefined) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue)
  }

  const value = await fetchVersionsAndTags(packageName)

  if (value === null) {
    try {
      cache.set(cacheKey, notFound, (5 * oneMinute) as any)
    } catch (error) {
      Logger.error(error)
    }
    return null
  }

  cache.set(cacheKey, JSON.stringify(value), oneMinute)
  return value
}
