import { applyDecorators, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../guard'
import { ApiBearerAuth } from '@nestjs/swagger'

export function JwtAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth())
}
