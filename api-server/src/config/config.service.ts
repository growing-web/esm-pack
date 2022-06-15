import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get appConfig() {
    return this.configService.get('app')
  }

  get appPort(): number {
    return this.appConfig.port
  }

  get appName(): string {
    return this.appConfig.name
  }

  get loggerPath(): string {
    return this.appConfig.loggerPath
  }

  get enableLoggerOutput(): string {
    return this.appConfig.enableLoggerOutput
  }

  get apiPrefix(): string {
    return this.appConfig.apiPrefix
  }

  get throttleLimit(): number {
    return this.appConfig.throttleLimit
  }

  get throttleTtl(): number {
    return this.appConfig.throttleTtl
  }

  get redisHost(): string {
    return this.appConfig.REDIS_HOST
  }
  get redisPort(): number {
    return this.appConfig.REDIS_PORT
  }
  get redisDb(): string {
    return this.appConfig.REDIS_DB
  }
  get redisPassword(): string {
    return this.appConfig.REDIS_PASSWORD
  }
  get redisKeyPrefix(): string {
    return this.appConfig.REDIS_KEY_PREFIX
  }
}
