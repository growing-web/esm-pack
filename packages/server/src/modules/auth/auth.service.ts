import type { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async ldapLogin(req: Request) {
    const payload = req.user || {}

    return {
      ...payload,
      accessToken: this.jwtService.sign(payload),
    }
  }
}
