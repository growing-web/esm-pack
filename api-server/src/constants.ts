import path from 'path'

export const BUCKET_NPM_DIR = 'npm' + `/${process.env.APP_VERSION}`

export const ESM_DIR = path.join(process.cwd(), '.esmd')

export const SOURCE_DIR = path.join(ESM_DIR, 'source')

export const OUTPUT_DIR = path.join(ESM_DIR, 'builds')

export const PACKAGE_JSON = 'package.json'

export const ESMPACK_ESMD_FILE = 'package.json.js'
