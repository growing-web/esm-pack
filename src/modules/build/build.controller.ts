import { Controller, Get, Param, Res } from '@nestjs/common'
import { BuildService } from './build.service'
import type { Response } from 'express'

@Controller()
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  /**
   * build the specified package
   * @param param packageName@packageVersion
   * @example /rebuild/vue@3.0.0
   * @param res ok
   */
  @Get('/build/*')
  async build(@Param() param, @Res() res: Response) {
    await this.buildService.build(param['0'], false)
    res.status(200).send('ok')
  }

  /**
   * rebuild the specified package
   * @param param packageName@packageVersion
   * @example /rebuild/vue@3.0.0
   * @param res ok
   */
  @Get('/rebuild/*')
  async rebuild(@Param() param, @Res() res: Response) {
    await this.buildService.build(param['0'], true)
    res.status(200).send('ok')
  }
}
