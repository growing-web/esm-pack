/**
 * @description: app异常
 */
import { BasicException } from './basicException'

export class AppException extends BasicException {
  getErrorMessage(): string {
    return this.errorMessage
  }
}
