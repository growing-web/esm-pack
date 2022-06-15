import { Controller, Get, Res } from '@nestjs/common'
import type { Response } from 'express'
import { RedisUtil } from '@/plugins/redis'

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

  @Get('/flushallRedis')
  async flushAllRedis() {
    const redisUtil = new RedisUtil()
    redisUtil.flushall()
    return 'ok'
  }
}
