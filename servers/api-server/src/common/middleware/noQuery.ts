import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response } from 'express'

@Injectable()
export class NoQueryMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    const keys = Object.keys(req.query)

    if (keys.length) {
      return res.redirect(302, req.baseUrl)
    }

    next()
  }
}
