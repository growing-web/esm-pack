import { Controller, Get } from '@nestjs/common'

@Controller()
export class ApiController {
  @Get('/ping')
  async ping() {
    return 'pong'
  }
}
