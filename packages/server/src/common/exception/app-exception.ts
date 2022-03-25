/**
 * @description: app异常
 */
import { BasicException } from './basic-exception'

export class AppException extends BasicException {
  getErrorMessage(): string {
    return this.errorMessage
  }
}
