import {
  ArgumentsHost,
  Catch,
  HttpException,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common'
import { Request } from 'express'
import { Logger } from '../../plugins'
import { ResponseWrapper } from '../../utils/response'
import { BasicException } from '../exception/basic-exception'
import {
  Error403Exception,
  Error401Exception,
  Error404Exception,
} from '../exception/error-state-exception'

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest() as Request

    let logMsg = ''

    if (exception instanceof Error403Exception) {
      logMsg = exception.getErrorMessage()
      response.status(HttpStatus.FORBIDDEN).type('text').send({ error: logMsg })
    } else if (exception instanceof Error401Exception) {
      logMsg = exception.getErrorMessage()
      response
        .status(HttpStatus.UNAUTHORIZED)
        .type('text')
        .send({ error: logMsg })
    } else if (exception instanceof Error404Exception) {
      logMsg = exception.getErrorMessage()
      response.status(HttpStatus.NOT_FOUND).type('text').send({ error: logMsg })
    } else if (exception instanceof BasicException) {
      logMsg = exception.getErrorMessage()
      response
        .status(HttpStatus.OK)
        .json(ResponseWrapper.error(`${logMsg}`, exception.getErrorCode()))
      // http异常
    } else {
      logMsg = '[Error]:' + exception
      response
        .status(HttpStatus.OK)
        .json(
          ResponseWrapper.error(
            '[Error]: Please contact the administrator to deal with it!',
          ),
        )
    }

    const { url, method } = request
    Logger.error(`[URL]=${url} - ${method}=> ` + logMsg)
  }
}
