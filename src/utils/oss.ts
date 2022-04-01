import OSS from 'ali-oss'

const UPLOAD_DIR = 'npm-store'

export function createOssClient() {
  return new OSS({
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    accessKeyId: process.env.OSS_ACCESS_ID,
    accessKeySecret: process.env.OSS_ACCESS_SECRET,
  })
}

export async function uploadOss(
  fileList: { file: string; fullPath: string }[],
  cdnDir: string,
) {
  const uploader = createOssClient()
  const result: string[] = []

  for (const { file, fullPath } of fileList) {
    const ret = await uploader.put(
      `${UPLOAD_DIR}/${cdnDir}/${file}`,
      fullPath,
      {
        headers: { 'x-oss-forbid-overwrite': true },
      },
    )
    console.log(ret)
    // if (ret?.res?.requestUrls) {
    //   result.push(...(ret.res.requestUrls || []))
    // }
  }
  return result
}
