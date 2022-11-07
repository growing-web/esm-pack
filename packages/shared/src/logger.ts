import { debug as debugLib } from 'debug'
import { Logger } from '@nestjs/common'

export function createLogger(name: string) {
  const logger = new Logger(name)
  return {
    log: (message: string, params: any = {}) => {
      logger.log(transform(message, params))
    },
    error: (message: string, params: Record<string, any> = {}) => {
      logger.error(transform(message, params))
    },
    warn: (message: string, params: any = {}) => {
      logger.warn(transform(message, params))
    },
    debug: (message: string, params: any = {}) => {
      if (process.env.DEBUG) {
        const _debug = debugLib(`esmpack:${name}`)
        _debug(message, params)
      } else {
        logger.debug(transform(message, params))
      }
    },
  }
}

function transform(message: string, params: any = {}) {
  try {
    return `${message}: ${JSON.stringify(params.stack || params)}`
  } catch (error) {
    return message
  }
}
