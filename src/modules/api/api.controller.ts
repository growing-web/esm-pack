import { Controller, Get } from '@nestjs/common'
// import { ApiService } from './api.service'

@Controller()
export class ApiController {
  @Get('/health')
  async heart() {
    return 'health'
  }
}
