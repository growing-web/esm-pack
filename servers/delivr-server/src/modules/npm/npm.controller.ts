import type { Response, Request } from 'express'
import path from 'path'
import etag from 'etag'
import { Controller, Get, Param, Res, Req } from '@nestjs/common'
import { NpmService } from './npm.service'
import { ForbiddenException } from '@/common/exception'
import { parsePackagePathname } from '@growing-web/esmpack-shared'
import { FULL_VERSION_RE } from '@/constants'

@Controller()
export class NpmController {
  constructor(private readonly npmService: NpmService) {}

  @Get('npm:*')
  async maxSatisfying(
    @Param() param,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const pathname = param['0']

    const parsed = parsePackagePathname(pathname)

    if (!parsed) {
      throw new ForbiddenException(`Invalid URL: ${pathname}`)
    }

    const { packageName, packageVersion, filename } = parsed
    //   解析URL请求，获取包名，
    if (!packageVersion || !FULL_VERSION_RE.test(packageVersion)) {
      const result = await this.npmService.maxSatisfyingVersion(pathname)
      return res
        .status(200)
        .set({
          'Cache-Control': `public, max-age=5, s-maxage=5`, // 5s
        })
        .type('text')
        .send(result)
    }

    const acceptEncoding = req.header('Accept-Encoding')
    const acceptBrotli = acceptEncoding?.includes('br') ?? false
    const entry = await this.npmService.resolveFile(
      packageName,
      packageVersion,
      filename,
      acceptBrotli,
    )

    if (!entry) {
      return res
        .status(404)
        .set({
          'Cache-Control': 'public, max-age=31536000', // 1 year
          'Cache-Tag': 'missing, missing-entry',
        })
        .type('text')
        .send(`Cannot Found "${filename}" in ${packageName}`)
    }

    const tags = ['file']
    const ext = path.extname(entry.filepath).replace(/^\./, '')

    if (ext) {
      tags.push(`${ext}-file`)
    }

    const includeContentEncoding = Reflect.has(entry, 'Content-Encoding')

    res
      .set({
        ...entry.header,
        ETag: etag(entry.content),
        'Cache-Tag': tags.join(', '),
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control':
          path.basename(entry.filepath) === '_error.log'
            ? 'no-store'
            : 'public, max-age=31536000, s-maxage=31536000, immutable', // 1 year
        ...(includeContentEncoding
          ? { 'Content-Encoding': entry['Content-Encoding'] }
          : {}),
      })
      .send(entry.content)
  }
}
