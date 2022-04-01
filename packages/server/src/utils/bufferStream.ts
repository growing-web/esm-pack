export function bufferStream(stream): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = []

    stream
      .on('error', reject)
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
  })
}
