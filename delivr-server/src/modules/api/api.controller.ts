import { Controller, Get, Res } from '@nestjs/common'
import type { Response } from 'express'

@Controller()
export class ApiController {
  @Get('/health')
  async ping() {
    return 'health'
  }

  @Get('/favicon.ico')
  async favicon(@Res() res: Response) {
    res.status(204).send('204')
  }
}
