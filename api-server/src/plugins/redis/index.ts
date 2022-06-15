import type { Redis as RedisType } from 'ioredis'
import Redis from 'ioredis'

export function createRedisClient(): RedisType {
  const client = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB!, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX,
  })

  return client
}

export class RedisUtil {
  private client: RedisType
  constructor() {
    this.client = createRedisClient()
  }

  public async set(key: string, value: any, seconds?: number) {
    const _value = JSON.stringify(value)
    if (!seconds) {
      await this.client.set(key, _value)
    } else {
      await this.client.set(key, _value, 'EX', seconds)
    }
  }

  public async get(key: string) {
    const data = await this.client.get(key)

    return data || null
  }

  public async del(key: string) {
    await this.client.del(key)
  }

  public async flushall() {
    await this.client.flushall()
  }
}

export * from './redisLock'
