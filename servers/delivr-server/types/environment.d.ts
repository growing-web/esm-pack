declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    APP_LOGGER_LEVEL: 'debug' | 'info' | 'error'
    APP_LOGGER_PATH: string
    APP_NAME: string
    APP_PORT: string
    LOGGER_OUTPUT_ENABLE: 'true' | 'false'
    API_PREFIX: string
    THROTTLE_TTL: string
    THROTTLE_LIMIT: string
    OSS_REGION: string
    OSS_ACCESS_KEY_ID: string
    OSS_ACCESS_KEY_SECRET: string
    OSS_BUCKET: string
    CDN_URL: string
  }
}
