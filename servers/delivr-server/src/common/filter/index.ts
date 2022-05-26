import {
  ArgumentsHost,
  Catch,
  HttpException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException as NestNotFoundException,
} from '@nestjs/common'
import { Request } from 'express'
import { Logger } from '@/plugins'
import {
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
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
        instance: UnauthorizedException,
        code: HttpStatus.UNAUTHORIZED,
      },
      {
        instance: ForbiddenException,
        code: HttpStatus.FORBIDDEN,
      },
      {
        instance: NotFoundException,
        code: HttpStatus.NOT_FOUND,
      },
      {
        instance: InternalServerErrorException,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      {
        instance: NestNotFoundException,
        code: HttpStatus.NOT_FOUND,
      },
    ]

    let isMatch = false

    for (const { instance, code } of exceptions) {
      if (exception instanceof instance) {
        // @ts-ignore
        if (exception instanceof NestNotFoundException) {
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
