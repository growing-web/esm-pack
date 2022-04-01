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
import { ResponseWrapper } from '../../utils/response'
import { BasicException } from '../exception/basicException'
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
    } else if (exception instanceof Error500Exception) {
      logMsg = exception.getErrorMessage()
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .type('text')
        .send({ error: logMsg })
    } else if (exception instanceof BasicException) {
      logMsg = exception.getErrorMessage()
      response
        .status(HttpStatus.OK)
        .json(ResponseWrapper.error(`${logMsg}`, exception.getErrorCode()))
    } else if (exception instanceof NotFoundException) {
      response.status(HttpStatus.NOT_FOUND).type('text').send('NOT FOUND!')
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
