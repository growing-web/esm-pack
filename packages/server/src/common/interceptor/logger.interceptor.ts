/**
 * 响应日志记录
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request } from 'express'
import { Logger } from '../../plugins'
// import chalk from 'chalk';
import requestIp from 'request-ip'
import { isProductionFn } from '../../utils/env'

function transformLogger(context: ExecutionContext, data: any, now: number) {
  const request = context.switchToHttp().getRequest() as Request
  const cls = context.getClass().name
  const resNow = Date.now()

  const resTime = `${resNow - now}ms`
  const { url, method } = request

  const ip = request.clientIp || requestIp.getClientIp(request)

  //     const devFormat = `${chalk.cyan('>>>>>>>>>>>>>>>>>>>>>>>>>')}${chalk.yellow(
  //         ' HTTP RESPONSE START',
  //     )} ${chalk.cyan('>>>>>>>>>>>>>>>>>>>>>>>>>')}
  //   ${chalk.blue('Request URL:')} ${chalk.green(url)}
  //   ${chalk.blue('Method:')} ${chalk.green(method)}
  //   ${chalk.blue('IP:')} ${chalk.green(ip)}
  //   ${chalk.blue('Time:')} ${chalk.green(resTime)}
  //   ${chalk.blue('Class:')} ${cls}
  //   ${chalk.blue('Data:')} ${JSON.stringify(data)} \n ${chalk.cyan(
  //         '>>>>>>>>>>>>>>>>>>>>>>>>>',
  //     )} ${chalk.yellow('HTTP RESPONSE END')} ${chalk.cyan('>>>>>>>>>>>>>>>>>>>>>>>>>>>>')}`;

  const prodFormat = `URL=${url}  Method=${method} IP=${ip} Class=${cls}  Data=${JSON.stringify(
    data,
  )} ${resTime}`

  const logFormat = isProductionFn() ? prodFormat : prodFormat

  Logger.info(logFormat)
}

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  // eslint-disable-next-line
  constructor() {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now()
    return next.handle().pipe(
      tap((data) => {
        transformLogger(context, data, now)
      }),
    )
  }
}
