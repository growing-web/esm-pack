import OSS from 'ali-oss'
import fg from 'fast-glob'

function createClient() {
  return new OSS({
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  })
}

export async function ossUpload({
  prefix = '',
  cwd,
  ignore = [],
}: {
  prefix: string
  cwd: string
  ignore?: string[]
}) {
  const files = fg.sync('**/**', { ignore, cwd })
  const abFiles = fg.sync('**/**', { ignore, cwd, absolute: true })

  const client = createClient()

  try {
    await Promise.allSettled(
      abFiles.map((file, i) => {
        return client.put(prefix + files[i], file, {
          // 不要覆盖已有的文件
          headers: { 'x-oss-forbid-overwrite': true },
        })
      }),
    )
  } catch (error: any) {
    if (error.toString().includes('FileAlreadyExistsError')) {
      return
    }
    throw new Error(error)
  }
}

export async function isExistObject(objectName: string) {
  try {
    const client = createClient()

    await client.head(objectName)
    return true
  } catch (error: any) {
    if (
      error.code === 'NoSuchKey' ||
      error.toString().includes('Object not exists')
    ) {
      return false
    }
  }
  return false
}

export async function getOssStream(objectName: string) {
  try {
    const client = createClient()
    // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
    const result = await client.getStream(objectName)
    return result
  } catch (e) {
    console.log(e)
  }
}
