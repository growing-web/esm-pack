import type { Stream } from 'stream'

export function bufferStream(stream: Stream): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []

    stream
      .on('error', reject)
      .on('data', (chunk: Uint8Array) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
  })
}
