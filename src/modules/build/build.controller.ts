import { Controller, Get, Param, Res, Query } from '@nestjs/common'
import { BuildService } from './build.service'
import type { Response } from 'express'

@Controller()
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  @Get('/build/*')
  async getLatestVersion(@Param() param, @Query() query, @Res() res: Response) {
    await this.buildService.build(param['0'], query.force)
    res.status(200).send('ok')
  }
}
