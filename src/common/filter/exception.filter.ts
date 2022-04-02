import {
  ArgumentsHost,
  Catch,
  HttpException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import { Request } from 'express'
import { Logger } from '../../plugins'
import {
  Error403Exception,
  Error401Exception,
  Error404Exception,
  Error500Exception,
} from '../exception/errorStateException'

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest() as Request

    let logMsg = ''

    const exceptions = [
      {
        instance: Error401Exception,
        code: HttpStatus.UNAUTHORIZED,
      },
      {
        instance: Error403Exception,
        code: HttpStatus.FORBIDDEN,
      },
      {
        instance: Error404Exception,
        code: HttpStatus.NOT_FOUND,
      },
      {
        instance: Error500Exception,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      {
        instance: NotFoundException,
        code: HttpStatus.NOT_FOUND,
      },
    ]

    let isMatch = false

    for (const { instance, code } of exceptions) {
      if (exception instanceof instance) {
        // @ts-ignore
        if (exception instanceof NotFoundException) {
          logMsg = 'NOT FOUND!'
        } else {
          logMsg = exception.getErrorMessage()
        }
        isMatch = true
        response.status(code).type('text').send({ error: logMsg })
      }
    }

    if (!isMatch) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .type('text')
        .send({ error: exception.message })
    }

    const { url, method } = request
    Logger.error(`[URL]=${url} - ${method}=> ` + logMsg)
  }
}
