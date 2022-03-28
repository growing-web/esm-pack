import { Controller, Get, Param, Res } from '@nestjs/common'
import { NpmService } from './npm.service'
import type { Response } from 'express'

@Controller()
export class NpmController {
  constructor(private readonly npmService: NpmService) {}

  @Get('npm/*')
  async maxSatisfying(@Param() param, @Res() res: Response) {
    const ret = await this.npmService.maxSatisfyingVersion(param['0'])
    res.status(200).type('text').send(ret)
  }
}
