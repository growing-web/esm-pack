/**
 * @description: 业务异常
 */
import { BasicException } from './basic-exception'

export class BizException extends BasicException {
  getErrorMessage(): string {
    return '[BizException]: ' + this.errorMessage
  }
}
