export interface UploadOptions {
  cwd: string
  /**
   * fast-glob ignore
   */
  ignore?: string[]

  /**
   * upload dir
   */
  uploadDir?: string
}

export interface PutOptions {
  cwd: string

  file: string

  /**
   * upload dir
   */
  uploadDir?: string
}
