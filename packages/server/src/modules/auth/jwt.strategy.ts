import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '../../config/config.service'
import { JWT_STRATEGY } from '../../constants/strategy'
import { HttpResultCodeEnum } from '../../constants/http'
import { AppException } from '../../common/exception'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    })
  }

  async validate(payload: CurrentUser & { exp: number; iat: number }) {
    if (!payload) {
      throw new AppException('非法操作！', HttpResultCodeEnum.FORBIDDEN)
    }
    const { cn, displayName, mail } = payload

    const { exp, iat } = payload
    const timeDiff = exp - iat
    if (timeDiff <= 0) {
      throw new AppException(
        '登陆超时,请重新登陆！',
        HttpResultCodeEnum.SESSION_TIME_OUT,
      )
    }

    if (!cn) {
      throw new AppException('非法操作！', HttpResultCodeEnum.FORBIDDEN)
    }

    return { cn, displayName, mail }
  }
}
