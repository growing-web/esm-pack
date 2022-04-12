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
  } = process.env

  return {
    port: parseInt(APP_PORT!, 10) || 3000,
    name: APP_NAME || 'app',
    loggerPath: APP_LOGGER_PATH,
    enableLoggerOutput: truthy(LOGGER_OUTPUT_ENABLE),

    apiPrefix: API_PREFIX,
    throttleLimit: parseInt(THROTTLE_LIMIT!, 10) || 60,
    throttleTtl: parseInt(THROTTLE_TTL!, 10) || 60,
  }
})
