import fs from 'fs'
import { join, dirname } from 'path'
import { createBrotliCompress, constants } from 'zlib'

const COMPRESS_RE =
  /\.(js|mjs|cjs|css|html|txt|xml|json|svg|ico|ttf|otf|eot|map)$/
const MIN_SIZE = 1000

const brotliCompressOptions = {
  [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
  [constants.BROTLI_PARAM_QUALITY]: 9, // turn down the quality, resulting in a faster compression (default is 11)
}

const magicBytes = [
  [0x1f, 0x8b], // .gz
  [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00, 0x00], // .xz
  [0x04, 0x22, 0x4d, 0x18], // .lz2
  [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], // .7z
]

function isCompressed(bundle) {
  if (
    /\.(gz|zip|xz|lz2|7z|woff|woff2|jpg|jpeg|png|webp)$/.test(bundle.fileName)
  )
    return true
  for (const bytes of magicBytes) {
    let matches = true
    const sourceBytes =
      bundle.type === 'asset' ? bundle.source : Buffer.from(bundle.code)
    for (let i = 0; i < bytes.length; ++i) {
      matches = matches && bytes[i] === sourceBytes[i]
    }
    if (matches) return true
  }
  return false
}

function brotliCompressFile(file, minSize) {
  return new Promise((resolve) => {
    fs.stat(file, (err, stats) => {
      if (err) {
        console.error('rollup-plugin-brotli: Error reading file ' + file)
        resolve(true)
        return
      }

      if (minSize && minSize > stats.size) {
        resolve(true)
      } else {
        fs.createReadStream(file)
          .pipe(createBrotliCompress(brotliCompressOptions))
          .pipe(fs.createWriteStream(file + '.br'))
          .on('close', () => resolve(true))
      }
    })
  })
}

export async function brotli(bundle: any, outdir: string) {
  const compressCollection: any[] = []

  const bundlesToCompress = Object.keys(bundle)
    .filter((id) => COMPRESS_RE.test(bundle[id].fileName))
    .filter((id) => !isCompressed(bundle[id]))
    .map((id) => bundle[id].fileName)

  const files = [...bundlesToCompress.map((f) => join(outdir, f))]

  for (const file of files) {
    compressCollection.push(brotliCompressFile(file, MIN_SIZE))
  }
  await Promise.all(compressCollection)
}

export function brotliPlugin() {
  let outdir = ''
  return {
    name: 'brotli',
    generateBundle: (buildOptions) => {
      outdir =
        (buildOptions.file && dirname(buildOptions.file)) ||
        buildOptions.dir ||
        ''
    },
    async writeBundle(_, bundle) {
      await brotli(bundle, outdir)
    },
  }
}
