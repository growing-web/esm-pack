import { format, transports, loggers } from 'winston'
import { join } from 'path'
import { devConsoleFormat } from './format'
import { loadEnv } from '../../utils/env'
import 'winston-daily-rotate-file'

loadEnv()

const { combine, colorize, label, timestamp, prettyPrint, simple, ms } = format

const enableOutFile = process.env.LOGGER_OUTPUT_ENABLE === 'true'

function getLogDir(dir: string) {
  return process.env.APP_LOGGER_PATH
    ? process.env.APP_LOGGER_PATH + dir
    : join(process.cwd(), '.logs' + dir)
}

function createConsoleTransport() {
  return new transports.Console({
    handleExceptions: true,
    format: combine(
      colorize(),
      ms(),
      label(),
      timestamp(),
      prettyPrint(),
      simple(),
      devConsoleFormat,
    ),
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  })
}

function createTransport(name = 'app', handleExceptions = false) {
  return new transports.DailyRotateFile({
    filename: getLogDir(`/${name}/${name}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: 1024 * 1024 * 10, // 10m
    maxFiles: '30d',
    json: false,
    handleExceptions,
  })
}

const basicOption = {
  level: 'debug',
  format: format.json(),
  exitOnError: false,
  silent: false,
}

loggers.add('app', {
  ...basicOption,
  transports: [
    createConsoleTransport(),
    ...(enableOutFile
      ? [createTransport(), createTransport('exception', true)]
      : []),
  ],
})
loggers.add('access', {
  ...basicOption,
  transports: [
    createConsoleTransport(),
    ...(enableOutFile
      ? [createTransport('access'), createTransport('exception', true)]
      : []),
  ],
})
loggers.add('error', {
  ...basicOption,
  transports: [
    createConsoleTransport(),
    ...(enableOutFile
      ? [createTransport('error'), createTransport('exception', true)]
      : []),
  ],
})

const appLogger = loggers.get('app')
const accessLogger = loggers.get('access')
const errorLogger = loggers.get('error')

export class Logger {
  static error(args) {
    errorLogger.error(args)
  }

  static debug(args) {
    appLogger.debug(args)
  }

  static warn(args) {
    appLogger.warn(args)
  }

  static info(args) {
    appLogger.info(args)
  }

  static access(args) {
    accessLogger.info(args)
  }
}
