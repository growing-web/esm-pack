import type { Response, Request } from 'express'
import path from 'path'
import etag from 'etag'
import { Controller, Get, Param, Res, Req } from '@nestjs/common'
import { NpmService } from './npm.service'
import { ForbiddenException } from '@/common/exception'
import { parsePackagePathname } from '@/utils/package'
import { getContentTypeHeader } from '@/utils/contentType'
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

    if (!pathname) {
      throw new ForbiddenException(`Invalid URL: ${pathname}`)
    }

    const parsed = parsePackagePathname(pathname)

    if (!parsed) {
      throw new ForbiddenException(`Invalid URL: ${pathname}`)
    }

    const { packageVersion } = parsed

    if (!packageVersion || !FULL_VERSION_RE.test(packageVersion)) {
      const ret = await this.npmService.maxSatisfyingVersion(pathname)
      res
        .status(200)
        .set({
          'Cache-Control': 'no-store',
        })
        .type('text')
        .send(ret)
    } else {
      const { entry, filename, packageName } =
        await this.npmService.resolveFile(req, pathname)

      if (!entry) {
        return res
          .status(404)
          .set({
            'Cache-Control': 'public, max-age=31536000', // 1 year
            'Cache-Tag': 'missing, missing-entry',
          })
          .type('text')
          .send(`Cannot find "${filename}" in ${packageName}`)
      } else {
        const tags = ['file']
        const ext = path.extname(entry.path).replace(/^\./, '')

        if (ext) {
          tags.push(`${ext}-file`)
        }

        const includeContentEncoding = Reflect.has(entry, 'Content-Encoding')

        res
          .set({
            'Content-Type': getContentTypeHeader(entry.contentType),
            'Cache-Control':
              path.basename(entry.path) === '_error.log'
                ? 'no-store'
                : 'public, max-age=31536000, s-maxage=31536000, immutable', // 1 year
            'Last-Modified': entry.lastModified,
            ETag: etag(entry.content),
            'Cache-Tag': tags.join(', '),
            'Cross-Origin-Resource-Policy': 'cross-origin',
            type: entry.type,
            ...(includeContentEncoding
              ? {
                  'Content-Encoding': entry['Content-Encoding'],
                }
              : {
                  'Content-Length': entry.size,
                }),
          })
          .send(entry.content)
      }
    }
  }
}
