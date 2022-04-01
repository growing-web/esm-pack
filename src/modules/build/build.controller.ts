import { Controller, Get, Param, Res } from '@nestjs/common'
import { BuildService } from './build.service'
import type { Response } from 'express'

@Controller()
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  @Get('/build/*')
  async getLatestVersion(@Param() param, @Res() res: Response) {
    await this.buildService.lockBuild(param['0'])
    res.status(200).send('ok')
  }
}
