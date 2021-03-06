import type { Plugin } from 'rollup'
import inject from '@rollup/plugin-inject'
import generateProcessPolyfill from './generateProcessPolyfill'

const PROCESS_MODULE_NAME = 'process'

export function rollupPluginNodeProcessPolyfill(env = {}): Plugin {
  const injectPlugin = inject({
    process: PROCESS_MODULE_NAME,
    include: /\.(cjs|js|jsx|mjs|ts|tsx)$/, // only target JavaScript files
  })

  return {
    ...injectPlugin,
    name: 'rollup-plugin-node-process-polyfill',
    resolveId(source) {
      if (source === PROCESS_MODULE_NAME) {
        return PROCESS_MODULE_NAME
      }
      return null
    },
    load(id) {
      if (id === PROCESS_MODULE_NAME) {
        return { code: generateProcessPolyfill(env), moduleSideEffects: false }
      }
      return null
    },
  }
}
