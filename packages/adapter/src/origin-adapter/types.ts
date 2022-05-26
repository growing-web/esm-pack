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
