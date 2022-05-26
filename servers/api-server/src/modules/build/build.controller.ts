import type { Response } from 'express'
import { Controller, Get, Param, Res } from '@nestjs/common'
import { BuildService } from './build.service'

@Controller()
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  /**
   * build the specified package
   * @param param packageName@packageVersion
   * @example vue@3.0.0
   * @param res ok
   */
  @Get('/build/*')
  async build(@Param() param, @Res() res: Response) {
    const pathname = param['0']
    await this.buildService.build(pathname)
    res.status(200).send('ok')
  }
}
