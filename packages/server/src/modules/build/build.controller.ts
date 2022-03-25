import type { QueryParams } from './build.interface'
import { Controller, Get, Param } from '@nestjs/common'
import { BuildService } from './build.service'

@Controller()
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  @Get('/build/*')
  async getLatestVersion(@Param() param: QueryParams) {
    return await this.buildService.build(param['0'])
  }

  @Get('*')
  async processFullUrl(@Param() param: QueryParams) {
    return await this.buildService.getLatestVersion(param['0'])
  }
}
