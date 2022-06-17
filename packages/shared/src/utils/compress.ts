import { createBrotliCompress, constants } from 'node:zlib'
import { Readable } from 'node:stream'
import fs from 'node:fs'
import fg from 'fast-glob'

const MIN_SIZE = 2048
const COMPRESS_RE = /\.(js|mjs|cjs|css|html|txt|xml|json)$/

const brotliCompressOptions = {
  [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
  [constants.BROTLI_PARAM_QUALITY]: 9, // turn down the quality, resulting in a faster compression (default is 11)
}

export async function brotliCompress(
  filename: string,
  content: any,
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (MIN_SIZE && MIN_SIZE > content.size) {
      resolve(true)
    } else if (!COMPRESS_RE.test(filename)) {
      resolve(true)
    } else {
      const stream = new Readable()
      stream.push(content) // the string you want
      stream.push(null)
      const chunks: Uint8Array[] = []

      stream
        .pipe(createBrotliCompress(brotliCompressOptions))
        .on('data', (chunk) => {
          chunks.push(chunk)
        })
        .on('end', () => {
          resolve(Buffer.concat(chunks))
        })
        .on('error', reject)
    }
  })
}

export async function brotliCompressDir(cwd: string) {
  const files = fg.sync('**/**', { cwd, absolute: true })
  const promises: any[] = []

  files.forEach((file) => {
    const promise = new Promise((resolve) => {
      fs.stat(file, (err, stats) => {
        if (err) {
          console.error('Error reading file ' + file)
          resolve(true)
          return
        }
        if (MIN_SIZE && MIN_SIZE > stats.size) {
          resolve(true)
        } else if (!COMPRESS_RE.test(file)) {
          resolve(true)
        } else {
          fs.createReadStream(file)
            .pipe(createBrotliCompress(brotliCompressOptions))
            .pipe(fs.createWriteStream(file + '.br'))
            .on('close', () => resolve(true))
        }
      })
    })
    promises.push(promise)
  })
  await Promise.all(promises)
}
