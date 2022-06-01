import { BasicException } from './basicException'

export class ForbiddenException extends BasicException {
  getErrorMessage(): string {
    return this.errorMessage
  }
}

export class NotFoundException extends BasicException {
  constructor(msg = 'Not Found!') {
    super(msg)
  }

  getErrorMessage(): string {
    return this.errorMessage
  }
}

export class UnauthorizedException extends BasicException {
  getErrorMessage(): string {
    return this.errorMessage
  }
}

export class InternalServerErrorException extends BasicException {
  constructor(msg = 'Error!') {
    super(msg)
  }

  getErrorMessage(): string {
    return this.errorMessage
  }
}
