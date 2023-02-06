import path from 'node:path'
import { URL } from 'node:url'
import https, { RequestOptions } from 'node:https'
import fetch from 'npm-registry-fetch'
import fs from 'fs-extra'
import tar from 'tar'
import request from 'request-promise'
import LRUCache from 'lru-cache'
import gunzip from 'gunzip-maybe'
import { bufferStream } from './bufferStream'

const oneMegabyte = 1024 * 1024
const oneSecond = 1000
const oneMinute = oneSecond * 60

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

const cache = new LRUCache<BufferEncoding, any>({
  maxSize: oneMegabyte * 40,
  sizeCalculation: Buffer.byteLength,
  ttl: oneMinute,
})

const agent = new https.Agent({
  keepAlive: true,
  timeout: 120000,
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
 * @param  {string} packageName  package name
 * @return {array} [code, resute]
 */
export async function getNpmPackageInfo(packageName: string): Promise<any> {
  //   const registry = await getRegistry()

  const ret = await fetch.json(`${packageName}`, {
    maxSockets: 100,
    timeout: 120000,
    registry: 'https://registry.npmmirror.com',
  })

  return ret
}

// export async function getRegistry() {
//   const defaultRegistry = process.env.NPM_REGISTRY_URL
//   const hosts = [defaultRegistry, process.env.NPMMIRROR_REGISTRY_URL].filter(
//     Boolean,
//   ) as string[]

//   for (const host of hosts) {
//     try {
//       const res = await axios.get(host)
//       if (res.status < 400) {
//         return host
//       }
//     } catch (error) {
//       return defaultRegistry
//     }
//   }
//   return defaultRegistry
// }

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
  headers: any = {},
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const allFiles: string[] = []
    const allWriteStream: any[] = []
    const dirCollector: string[] = []

    const rp = request({
      url: tarballURL,
      timeout: 60 * 1000,
      headers: headers,
    })

    rp.catch((e) => {
      reject(e)
    })

    rp.on('error', reject)
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

// async function fetchPackageInfo(packageName: string) {
//   const FALLBACK_NPM_REGISTRY_URL = process.env
//     .FALLBACK_NPM_REGISTRY_URL as string

//   const NPM_REGISTRY_URL = process.env.NPM_REGISTRY_URL as string

//   if (process.env.FALLBACK_MODE !== 'on') {
//     return await _fetchPackageInfo(packageName, NPM_REGISTRY_URL)
//   }

//   try {
//     const info = await _fetchPackageInfo(packageName, NPM_REGISTRY_URL)
//     if (info) {
//       return info
//     }
//     throw new Error()
//   } catch (error) {
//     return await _fetchPackageInfo(packageName, FALLBACK_NPM_REGISTRY_URL)
//   }
// }

async function fetchPackageInfo(packageName: string) {
  const name = encodePackageName(packageName)
  const infoURL = `${process.env.NPM_REGISTRY_URL}/${name}`

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

  console.error(
    'Error fetching info for %s (status: %s)',
    packageName,
    res.statusCode,
  )

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

// export async function getTarballURL(packageName: string, version: string) {
//   const tarballName = isScopedPackageName(packageName)
//     ? packageName.split('/')[1]
//     : packageName

//   //   https://cdn.npmmirror.com/packages/vue/2.7.13/vue-2.7.13.tgz

//   return `${process.env.NPM_REGISTRY_URL}/${packageName}/-/${tarballName}-${version}.tgz`
// }

export async function getTarballURL(packageName: string, version: string) {
  // 内网包走内网流程
  if (isInternalScope(packageName)) {
    return getGdTarballURL(packageName, version)
  }

  if (process.env.FALLBACK_MODE !== 'on') {
    return await _getTarballURL(packageName, version, true)
  }

  try {
    const ret = await _getTarballURL(packageName, version, false)

    if (ret) {
      return ret
    }
    throw new Error()
  } catch (error) {
    return await _getTarballURL(packageName, version, true)
  }
}

async function _getTarballURL(
  packageName: string,
  version: string,
  fallback: boolean,
): Promise<string | null> {
  const tarballName = isScopedPackageName(packageName)
    ? packageName.split('/')[1]
    : packageName

  if (!fallback) {
    return await getCNFallbackTarballUrl(packageName, version, tarballName)
  }

  return `${process.env.NPM_REGISTRY_URL}/${packageName}/-/${tarballName}-${version}.tgz`
}

async function getGdTarballURL(packageName: string, version: string) {
  // # http://registry-npm.gaoding.com/@gaoding/access-controller/download/@gaoding/access-controller-0.0.2.tgz

  const tarballURL = `${process.env.GD_NPM_REGISTRY_URL}/${packageName}/download/${packageName}-${version}.tgz`
  return tarballURL
}

async function getCNFallbackTarballUrl(
  packageName: string,
  version: string,
  tarballName: string,
) {
  const NPM_REGISTRY_URL = process.env.CN_NPM_REGISTRY_URL as string

  const cacheKey =
    `${NPM_REGISTRY_URL}-${packageName}-${version}-${tarballName}` as BufferEncoding

  const cacheValue = cache.get(cacheKey)

  if (cacheValue !== null && cacheValue !== undefined) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue)
  }

  // # https://cdn.npmmirror.com/packages/vue/2.7.13/vue-2.7.13.tgz

  const name = packageName?.startsWith('@')
    ? packageName.split('/')?.[1]
    : packageName

  const tarballURL = `${NPM_REGISTRY_URL}/packages/${packageName}/${version}/${name}-${version}.tgz`

  const { hostname, pathname } = new URL(tarballURL)

  const options = {
    agent: agent,
    hostname: hostname,
    path: pathname,
  }
  try {
    const res = await get(options)
    let value: string | null = null
    if (res.statusCode < 400) {
      value = tarballURL
    }

    if (value) {
      cache.set(cacheKey, JSON.stringify(value), { ttl: oneMinute })
    }

    return value
  } catch (error) {
    return null
  }
}

/**
 * Returns metadata about a package, mostly the same as package.json.
 * Uses a cache to avoid over-fetching from the registry.
 */
export async function getPackageConfig(packageName: string, version: string) {
  const cacheKey = `config-${packageName}-${version}` as BufferEncoding

  const cacheValue = cache.get(cacheKey)

  if (cacheValue !== null && cacheValue !== undefined) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue)
  }
  const value = await fetchPackageConfig(packageName, version)

  if (value === null) {
    try {
      cache.set(cacheKey, notFound, { ttl: oneMinute })
    } catch (error) {
      console.error(error)
    }
    return null
  }

  cache.set(cacheKey, JSON.stringify(value), { ttl: oneMinute })
  return value
}

export async function getVersionsAndTags(packageName: string) {
  const cacheKey = `versions-${packageName}` as BufferEncoding

  const cacheValue = cache.get(cacheKey)

  if (cacheValue !== null && cacheValue !== undefined) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue)
  }

  const value = await fetchVersionsAndTags(packageName)

  if (value === null) {
    try {
      cache.set(cacheKey, notFound, { ttl: oneMinute })
    } catch (error) {
      console.error(error)
    }
    return null
  }

  cache.set(cacheKey, JSON.stringify(value), { ttl: oneMinute })
  return value
}

/**
 * Returns a stream of the tarball'd contents of the given package.
 */
export async function getPackage(packageName: string, version: string) {
  const tarballURL = await getTarballURL(packageName, version)

  console.debug('Fetching package for %s from %s', packageName, tarballURL)
  if (!tarballURL) {
    return null
  }

  const { hostname, pathname } = new URL(tarballURL)

  const options = {
    agent: agent,
    hostname: hostname,
    path: pathname,
  }

  const res = await get(options)

  if (res.statusCode === 200) {
    const stream = res.pipe(gunzip())
    return stream
  }

  if (res.statusCode === 404) {
    return null
  }

  console.error(
    'Error fetching tarball for %s@%s (status: %s)',
    packageName,
    version,
    res.statusCode,
  )
  return null
}

/**
 * Returns a stream of the tarball'd contents of the given package.
 */
export async function getPackageByUrl(url: string) {
  console.debug('Fetching url for %s', url)

  const { hostname, pathname } = new URL(url)

  const options = {
    agent: agent,
    hostname: hostname,
    path: pathname,
  }

  const res = await get(options)

  if (res.statusCode === 200) {
    const stream = res.pipe(gunzip())
    return {
      stream,
      headers: res.headers,
    }
  }

  if (res.statusCode === 404) {
    return null
  }

  console.error(
    'Error fetching url for %s@%s (status: %s)',
    url,
    res.statusCode,
  )
  return null
}

/**
 * 内网包
 * @returns
 */
export function getInternalNpmScopes() {
  const scopeConfig = process.env.INTERNAL_SCOPES ?? ''
  const scopes = scopeConfig.split(',')
  return scopes.filter(Boolean)
}

export function isInternalScope(packageName: string) {
  const scopes = getInternalNpmScopes()
  if (!packageName?.startsWith('@')) {
    return false
  }

  const scope = packageName.split('/')?.[0]

  return scopes?.includes(scope)
}
