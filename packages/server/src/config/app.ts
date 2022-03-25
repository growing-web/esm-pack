import { registerAs } from '@nestjs/config'

function truthy(value?: string) {
  return value === 'true'
}

export default registerAs('app', () => {
  const {
    APP_PORT,
    APP_NAME,
    APP_LOGGER_PATH,
    SWAGGER_ENABLE,
    LOGGER_OUTPUT_ENABLE,
    API_PREFIX,
    THROTTLE_LIMIT,
    THROTTLE_TTL,
    SWAGGER_URL,
    SWAGGER_TITLE,
    SWAGGER_DESC,
    SWAGGER_VERSION,
    JWT_SECRET,
    JWT_EXPIRATION,
  } = process.env

  return {
    // 端口号
    port: parseInt(APP_PORT!, 10) || 3000,
    // 应用名
    name: APP_NAME || 'app',
    // 日志存放地址
    loggerPath: APP_LOGGER_PATH,
    // 是否输出日志
    enableLoggerOutput: truthy(LOGGER_OUTPUT_ENABLE),

    // 全局接口前缀
    apiPrefix: API_PREFIX,
    // 一分钟限流
    throttleLimit: parseInt(THROTTLE_LIMIT!, 10) || 60,
    // 一分钟限制请求60次
    throttleTtl: parseInt(THROTTLE_TTL!, 10) || 60,

    // swagger信息
    swaggerEnable: truthy(SWAGGER_ENABLE),
    swaggerUrl: SWAGGER_URL,
    swaggerTitle: SWAGGER_TITLE,
    swaggerDesc: SWAGGER_DESC,
    swaggerVersion: SWAGGER_VERSION,

    // jwt配置
    jwtSecret: JWT_SECRET,
    jwtExpiration: JWT_EXPIRATION,
  }
})
