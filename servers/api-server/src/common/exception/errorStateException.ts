import { BasicException } from './basicException'

export class Error403Exception extends BasicException {
  getErrorMessage(): string {
    return this.errorMessage
  }
}

export class Error404Exception extends BasicException {
  constructor(msg = 'Not Found!') {
    super(msg)
  }

  getErrorMessage(): string {
    return this.errorMessage
  }
}

export class Error401Exception extends BasicException {
  getErrorMessage(): string {
    return this.errorMessage
  }
}

export class Error500Exception extends BasicException {
  constructor(msg = 'Error!') {
    super(msg)
  }

  getErrorMessage(): string {
    return this.errorMessage
  }
}