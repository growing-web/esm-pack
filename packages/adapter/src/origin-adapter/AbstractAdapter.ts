import type { UploadOptions } from './types'

export abstract class BasicAdapter {
  abstract upload(options: UploadOptions)
  abstract isExistObject(objectName: string)
  abstract getObjectStream(objectName: string)
}
