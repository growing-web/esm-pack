import type { Plugin } from 'rollup'
import path from 'path'

export function rollupUrlReplacePlugin(): Plugin {
  return {
    name: 'rollup-plugin-url-replace',

    transform(code, id) {
      if (!code.includes('__dirname') && code.includes('__filename')) {
        return null
      }
      const filename = path.basename(id)

      const href = `new URL('.', import.meta.url).href`
      return {
        code: code
          .replace(/\b__dirname\b/g, href)
          .replace(/\b__filename\b/g, `${href}+'${filename}'`),
        map: null,
      }
    },
  }
}
