import { format, transports, loggers } from 'winston'
import { join } from 'path'
import { devConsoleFormat } from './format'
// import stackTrace from 'stacktrace-js'
import { loadEnv, isProd } from '../../utils/env'
import 'winston-daily-rotate-file'

loadEnv()

const { APP_LOGGER_PATH, LOGGER_OUTPUT_ENABLE } = process.env

const { combine, colorize, label, timestamp, prettyPrint, simple, ms } = format

// 是否输出到文件
const enableOutFile = LOGGER_OUTPUT_ENABLE === 'true'

function getLogDir(dir: string) {
  return APP_LOGGER_PATH
    ? APP_LOGGER_PATH + dir
    : join(process.cwd(), '.esmd/logs' + dir)
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
    level: isProd ? 'info' : 'debug',
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
  // exceptions 是否会出导致 process.exit, 设为false 不会
  exitOnError: false,
  // 为true时所有日志不输出
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

// function getStackTrace(deep = 2): string {
//   const stackList: stackTrace.StackFrame[] = stackTrace.getSync()
//   const stackInfo: stackTrace.StackFrame = stackList[deep]

//   const lineNumber = stackInfo.lineNumber
//   const columnNumber = stackInfo.columnNumber
//   const fileName = stackInfo.fileName
//   const basicName: string = fileName?.replace(process.cwd(), '') ?? ''
//   const msg = `[${basicName}(line: ${lineNumber}, column: ${columnNumber})]:\n`
//   return msg
// }

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
