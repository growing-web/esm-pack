/**
 * @description: 业务异常
 */
import { BasicException } from './basic-exception'

export class ForbiddenException extends BasicException {
  getErrorMessage(): string {
    return '[ForbiddenException]: ' + this.errorMessage
  }
}
