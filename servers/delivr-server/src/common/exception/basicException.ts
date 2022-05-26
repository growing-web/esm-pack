import { HttpException, HttpStatus } from '@nestjs/common'

export class BasicException extends HttpException {
  protected errorMessage: string
  protected errorCode: number
  constructor(
    errorMessage: string,
    errorCode = -1,
    statusCode: HttpStatus = HttpStatus.OK,
  ) {
    super(errorMessage, statusCode)

    this.errorMessage = errorMessage
    this.errorCode = errorCode
  }

  getErrorCode(): number {
    return this.errorCode
  }

  getErrorMessage(): string {
    return this.errorMessage
  }
}
