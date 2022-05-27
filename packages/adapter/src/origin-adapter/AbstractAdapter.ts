import type { UploadOptions, PutOptions } from './types'

export abstract class BasicAdapter {
  abstract uploadDir(options: UploadOptions)
  abstract isExistObject(objectName: string)
  abstract getObjectStream(objectName: string)
  abstract deleteFile(objectName: string)
  abstract put(options: PutOptions)
}
