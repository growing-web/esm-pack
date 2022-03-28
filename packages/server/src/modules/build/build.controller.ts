import { Controller, Get, Param } from '@nestjs/common'
import { BuildService } from './build.service'

@Controller()
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  @Get('/build/*')
  async getLatestVersion(@Param() param) {
    return await this.buildService.build(param['0'])
  }
}
