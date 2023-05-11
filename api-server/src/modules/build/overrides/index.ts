import overridesJSON from './v1-overrides'
import { LRUCache } from '@growing-web/esmpack-shared'
import axios from 'axios'

let cache

export async function getOverrides(packageName: string) {
  if (process.env.OVERRIDES_MODE === 'remote') {
    return await getRemoteOverrides(packageName)
  }

  return await getLocalOverrides(packageName)
}

async function getLocalOverrides(packageName: string) {
  return overridesJSON?.[packageName]?.overrides ?? []
}

async function getRemoteOverrides(packageName: string) {
  const oneMegabyte = 1024 * 1024
  const oneSecond = 1000
  const oneMinute = oneSecond * 60
  if (!cache) {
    cache = new LRUCache<BufferEncoding, any>({
      maxSize: oneMegabyte * 40,
      sizeCalculation: Buffer.byteLength,
      ttl: oneMinute * 10,
    })
  }

  const url = process.env.OVERRIDES_JSON_URL

  if (!url) {
    return {}
  }

  const cacheKey = url
  const cacheValue = cache.get(cacheKey)
  let overrides: any
  if (cacheValue !== null && cacheValue !== undefined) {
    overrides = JSON.parse(cacheValue)
  } else {
    try {
      const overridesJson = await axios(url, {
        responseType: 'json',
      })
      overrides = overridesJson.data?.[packageName]?.overrides ?? []
      if (overrides) {
        cache.set(cacheKey, JSON.stringify(overrides), { ttl: oneMinute })
      }
      return overrides
    } catch (error) {
      // read error
    }
  }

  return {}
}
