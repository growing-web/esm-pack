import type { Response } from 'express'
import { Controller, Get, Param, Res, Post, Body } from '@nestjs/common'
import { BuildService } from './build.service'
import path from 'node:path'

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

  /**
   * build the specified package
   * @param param packageName@packageVersion
   * @example vue@3.0.0
   * @param res ok
   */
  @Post('/build')
  async postBuild(
    @Body()
    body: { packageName: string; packageVersion: string; filename: string },
    @Res() res: Response,
  ) {
    const { packageName, packageVersion, filename } = body

    await this.buildService.build(
      path.join(`${packageName}@${packageVersion}`, filename),
    )
    res.status(200).send('ok')
  }

  /**
   * build the specified package
   * @param param packageName@packageVersion
   * @example vue@3.0.0
   * @param res ok
   */
  @Post('/build/upload')
  async upload(
    @Body()
    body: { packageName: string; packageVersion: string; filename: string },
    @Res() res: Response,
  ) {
    const { packageName, packageVersion, filename } = body

    await this.buildService.build(
      path.join(`${packageName}@${packageVersion}`, filename),
      false,
    )
    res.status(200).send('ok')
  }
}
