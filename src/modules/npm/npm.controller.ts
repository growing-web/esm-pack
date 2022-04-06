import { Controller, Get, Param, Res } from '@nestjs/common'
import { NpmService } from './npm.service'
import type { Response } from 'express'
import { Error403Exception } from '@/common/exception'
import { parsePackagePathname } from '@/utils/parsePackagePathname'
import { EsmService } from '@/modules/esm/esm.service'
import path from 'path'
import etag from 'etag'
import { getContentTypeHeader } from '../../utils/getContentTypeHeader'

@Controller()
export class NpmController {
  constructor(
    private readonly npmService: NpmService,
    private readonly esmService: EsmService,
  ) {}

  @Get('npm:*')
  async maxSatisfying(@Param() param, @Res() res: Response) {
    const pathname = param['0']
    if (!pathname) {
      throw new Error403Exception(`Invalid URL: ${pathname}`)
    }

    const parsed = parsePackagePathname(pathname)
    if (!parsed) {
      throw new Error403Exception(`Invalid URL: ${pathname}`)
    }

    const fullVersionReg = /^\d+\.\d+\.\d+[a-zA-Z0-9\.\+\-_]*$/

    const { packageVersion } = parsed

    if (!packageVersion || !fullVersionReg.test(packageVersion)) {
      const ret = await this.npmService.maxSatisfyingVersion(param['0'])
      res
        .status(200)
        //   .set({
        //     'Cache-Control': 'no-store',
        //   })
        .type('text')
        .send(ret)
    } else {
      const { entry, filename, packageName } =
        await this.esmService.resolveEsmFile(param['0'])
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

        res
          .set({
            'Content-Type': getContentTypeHeader(entry.contentType),
            'Content-Length': entry.size,
            'Cache-Control':
              path.basename(entry.path) === '_error.log'
                ? 'no-store'
                : 'public, max-age=31536000', // 1 year
            'Last-Modified': entry.lastModified,
            ETag: etag(entry.content),
            'Cache-Tag': tags.join(', '),
            'Cross-Origin-Resource-Policy': 'cross-origin',
          })
          .send(entry.content)
      }
    }
  }
}
