import path from 'path'

export const APP_VERSION = 1

export const BUCKET_NPM_DIR = 'npm' + `/v${APP_VERSION}`

export const ESM_DIR = path.join(process.cwd(), '.esmd')

export const SOURCE_DIR = path.join(ESM_DIR, 'source')

export const OUTPUT_DIR = path.join(ESM_DIR, 'builds')

export const PACKAGE_JSON = 'package.json'
