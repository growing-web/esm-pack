import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get appConfig() {
    return this.configService.get('app')
  }

  // 获取端口号
  get appPort(): number {
    return this.appConfig.port
  }

  // 获取应用名
  get appName(): string {
    return this.appConfig.name
  }

  // 获取日志输出地址
  get loggerPath(): string {
    return this.appConfig.loggerPath
  }

  // 是否输出日志
  get enableLoggerOutput(): string {
    return this.appConfig.enableLoggerOutput
  }

  // 全局接口前缀
  get apiPrefix(): string {
    return this.appConfig.apiPrefix
  }

  // 一分钟限流
  get throttleLimit(): number {
    return this.appConfig.throttleLimit
  }

  // 一分钟限制请求60次
  get throttleTtl(): number {
    return this.appConfig.throttleTtl
  }
}
