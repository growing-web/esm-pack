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

  // swagger
  get swaggerEnable(): string {
    return this.appConfig.swaggerEnable
  }

  get swaggerUrl(): string {
    return this.appConfig.swaggerUrl
  }

  get swaggerTitle(): string {
    return this.appConfig.swaggerTitle
  }

  get swaggerDesc(): string {
    return this.appConfig.swaggerDesc
  }

  get swaggerVersion(): string {
    return this.appConfig.swaggerVersion
  }

  get jwtSecret(): string {
    return this.appConfig.jwtSecret
  }

  get jwtExpiration(): string {
    return this.appConfig.jwtExpiration
  }

  // database

  get databaseHost(): string {
    return this.appConfig.databaseHost
  }

  get databasePort(): number {
    return this.appConfig.databasePort
  }

  get databaseUsername(): string {
    return this.appConfig.databaseUsername
  }

  get databasePassword(): string {
    return this.appConfig.databasePassword
  }

  get databaseName(): string {
    return this.appConfig.databaseName
  }

  get databaseLogging(): boolean {
    return this.appConfig.databaseLogging
  }

  get databaseSynchronize(): boolean {
    return this.appConfig.databaseSynchronize
  }

  get databaseKeep(): boolean {
    return this.appConfig.databaseKeep
  }
}
