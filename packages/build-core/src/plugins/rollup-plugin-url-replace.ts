import type { Plugin } from 'rollup'
import path from 'path'

export function rollupUrlReplacePlugin(): Plugin {
  return {
    name: 'rollup-plugin-url-replace',

    transform(code, id) {
      if (!/\b__dirname\b/.test(code) || !/\b__filename\b/.test(code)) {
        return null
      }
      const filename = path.basename(id)

      const href = `globalThis.window==globalThis?new URL('.', import.meta.url).href:globalThis.__dirname||''`
      return {
        code: code
          .replace(/\b__dirname\b/g, href)
          .replace(/\b__filename\b/g, `${href}+'${filename}'`),
        map: null,
      }
    },
  }
}
