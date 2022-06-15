import { registerAs } from '@nestjs/config'

function truthy(value?: string) {
  return value === 'true'
}

export default registerAs('app', () => {
  const {
    APP_PORT,
    APP_NAME,
    APP_LOGGER_PATH,
    LOGGER_OUTPUT_ENABLE,
    API_PREFIX,
    THROTTLE_LIMIT,
    THROTTLE_TTL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_DB,
    REDIS_KEY_PREFIX,
  } = process.env

  return {
    port: parseInt(APP_PORT!, 10) || 3000,
    name: APP_NAME || 'app',
    loggerPath: APP_LOGGER_PATH,
    enableLoggerOutput: truthy(LOGGER_OUTPUT_ENABLE),

    apiPrefix: API_PREFIX,
    throttleLimit: parseInt(THROTTLE_LIMIT!, 10) || 60,
    throttleTtl: parseInt(THROTTLE_TTL!, 10) || 60,

    REDIS_HOST: REDIS_HOST,
    REDIS_PORT: parseInt(REDIS_PORT!, 10) || 6379,
    REDIS_PASSWORD: REDIS_PASSWORD,
    REDIS_DB: REDIS_DB,
    REDIS_KEY_PREFIX: REDIS_KEY_PREFIX,
  }
})
