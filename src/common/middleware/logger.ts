import colors from 'picocolors'
import { Request, Response } from 'express'
import { isProductionFn } from '../../utils/env'
import { Logger } from '../../plugins'

// 函数式中间件

export function loggerMiddleware(req: Request, res: Response, next: () => any) {
  const code = res.statusCode
  next()
  const { originalUrl, method, ip, params, query, body } = req

  const prodFormat = `URL=${originalUrl}  Method=${method} IP=${ip} Status=${code} Param=${JSON.stringify(
    params,
  )} Query=${JSON.stringify(query)} Body=${JSON.stringify(body)}`

  const devFormat = `${colors.cyan('>>>>>>>>>>>>>>>>>>>>>>>>>')}${colors.yellow(
    ' HTTP REQUEST START',
  )} ${colors.cyan('>>>>>>>>>>>>>>>>>>>>>>>>>')}
  ${colors.blue('Request URL:')} ${colors.green(originalUrl)}
  ${colors.blue('Method:')} ${colors.green(method)}
  ${colors.blue('IP:')} ${colors.green(ip)}
  ${colors.blue('Status:')} ${colors.green(code)}
  ${colors.blue('Param:')} ${JSON.stringify(params)}
  ${colors.blue('Query:')} ${JSON.stringify(query)}
  ${colors.blue('Body:')} ${JSON.stringify(body)} \n ${colors.cyan(
    '>>>>>>>>>>>>>>>>>>>>>>>>>',
  )} ${colors.yellow('HTTP REQUEST END')} ${colors.cyan(
    '>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
  )}
  `

  const logFormat = isProductionFn() ? prodFormat : devFormat
  if (code >= 500) {
    Logger.error(logFormat)
  } else if (code >= 400) {
    Logger.warn(logFormat)
  } else {
    Logger.access(logFormat)
    // Logger.log(logFormat);
  }
}
