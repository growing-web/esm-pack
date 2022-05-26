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
}
