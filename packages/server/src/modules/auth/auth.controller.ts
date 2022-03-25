import type { Request } from 'express'
import { Controller, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  async ldapLogin(@Req() req: Request) {
    return await this.authService.ldapLogin(req)
  }
}
