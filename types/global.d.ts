import { HttpResultCodeEnum } from '../src/constants/http'

declare global {
  declare interface HttpResult<T = any> {
    code: HttpResultCodeEnum
    message: string
    data: T | null
    type: 'success' | 'warning' | 'error'
  }
}
