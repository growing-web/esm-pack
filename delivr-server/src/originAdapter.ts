import { OriginAdapter } from '@growing-web/esmpack-adapter'

// export const originAdapter = new OriginAdapter({
//   region: process.env.OSS_REGION,
//   bucket: process.env.OSS_BUCKET,
//   accessKeyId: process.env.OSS_ACCESS_KEY_ID,
//   accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
// })

export function createOriginAdapter() {
  return new OriginAdapter({
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  })
}
