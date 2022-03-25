/**
 * @description: 参数异常
 */
import { HttpResultCodeEnum } from '../../constants/http'
import { BasicException } from './basic-exception'

export class NotFoundException extends BasicException {
  constructor() {
    super('Not Found')
  }

  getErrorMessage(): string {
    return 'Not Found!'
  }

  getErrorCode(): HttpResultCodeEnum {
    return HttpResultCodeEnum.NOT_FOUND
  }
}
