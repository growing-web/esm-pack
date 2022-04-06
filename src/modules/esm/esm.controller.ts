import { Controller, Get, Param, Res } from '@nestjs/common'
import { EsmService } from './esm.service'
import type { Response } from 'express'
import path from 'path'
import etag from 'etag'
import { getContentTypeHeader } from '../../utils/getContentTypeHeader'

@Controller()
export class EsmController {
  constructor(private readonly esmService: EsmService) {}

  @Get('npm:*')
  async resolveEsmFile(@Param() param, @Res() res: Response) {
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
