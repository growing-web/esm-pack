/**
 * @description: 参数异常
 */
import { HttpResultCodeEnum } from '../../constants/http'
import { BasicException } from './basic-exception'

export class BadRequestException extends BasicException {
  getErrorMessage(): string {
    return '[BadRequestException]: ' + this.errorMessage
  }

  getErrorCode(): HttpResultCodeEnum {
    return HttpResultCodeEnum.BAD_REQUEST
  }
}
